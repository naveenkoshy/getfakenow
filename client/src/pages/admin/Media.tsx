import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Image, Copy, Search } from "lucide-react";

export default function AdminMedia() {
  const { data: media, isLoading, refetch } = trpc.admin.media.list.useQuery();
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");

  const uploadMut = trpc.admin.media.upload.useMutation({
    onSuccess: () => { toast.success("File uploaded"); refetch(); setUploadDialog(false); setSelectedFile(null); setAltText(""); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.admin.media.delete.useMutation({ onSuccess: () => { toast.success("File deleted"); refetch(); }, onError: (e: any) => toast.error(e.message) });

  const handleUpload = async () => {
    if (!selectedFile) return toast.error("Select a file");
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await uploadMut.mutateAsync({
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          imageData: base64,
          altText: altText || undefined,
        });
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      setUploading(false);
    }
  };

  const mediaList = (media as any)?.media || media || [];
  const filteredMedia = mediaList?.filter((m: any) =>
    !search || m.filename.toLowerCase().includes(search.toLowerCase()) || (m.altText || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-sm text-gray-500 mt-1">Upload and manage images, documents, and media files</p>
          </div>
          <Button onClick={() => setUploadDialog(true)} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> Upload</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="pl-10" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : !filteredMedia.length ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="text-center py-12 text-gray-500">
              <Image className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">{search ? "No files match your search" : "No files uploaded yet"}</p>
              <Button onClick={() => setUploadDialog(true)} variant="outline" className="mt-3">Upload First File</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia.map((m: any) => (
              <Card key={m.id} className="bg-white border-gray-200 overflow-hidden group">
                <div className="aspect-square bg-gray-100 relative">
                  {m.mimeType?.startsWith("image/") ? (
                    <img src={m.url} alt={m.altText || m.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => copyUrl(m.url)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: m.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs font-medium text-gray-900 truncate">{m.filename}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{m.mimeType} &middot; {m.fileSize ? `${(m.fileSize / 1024).toFixed(0)}KB` : ""}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={uploadDialog} onOpenChange={(o) => !o && setUploadDialog(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload File</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">File</label>
              <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="mt-1" accept="image/*,application/pdf,.doc,.docx" />
            </div>
            {selectedFile && (
              <div className="text-sm text-gray-500">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Alt Text (optional)</label>
              <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="bg-red-600 hover:bg-red-700 text-white">
              {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
