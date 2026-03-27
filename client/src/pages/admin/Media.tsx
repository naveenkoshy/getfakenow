import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, Image, Copy, Search, Upload, FileVideo, FileText,
  FileImage, File, HelpCircle, Eye, X, Film, Music, CheckCircle2
} from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"],
  video: ["video/mp4", "video/webm", "video/quicktime", "video/avi"],
  document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
};
const ALL_ACCEPTED = [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.video, ...ACCEPTED_TYPES.document, ...ACCEPTED_TYPES.audio];

function getFileCategory(mimeType: string): "image" | "video" | "document" | "audio" | "other" {
  if (ACCEPTED_TYPES.image.includes(mimeType)) return "image";
  if (ACCEPTED_TYPES.video.includes(mimeType)) return "video";
  if (ACCEPTED_TYPES.document.includes(mimeType)) return "document";
  if (ACCEPTED_TYPES.audio.includes(mimeType)) return "audio";
  return "other";
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const cat = getFileCategory(mimeType);
  if (cat === "image") return <FileImage className={className} />;
  if (cat === "video") return <FileVideo className={className} />;
  if (cat === "audio") return <Music className={className} />;
  if (cat === "document") return <FileText className={className} />;
  return <File className={className} />;
}

function TypeBadge({ mimeType }: { mimeType: string }) {
  const cat = getFileCategory(mimeType);
  const colors: Record<string, string> = {
    image: "bg-blue-100 text-blue-700",
    video: "bg-purple-100 text-purple-700",
    audio: "bg-amber-100 text-amber-700",
    document: "bg-green-100 text-green-700",
    other: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase ${colors[cat]}`}>
      {cat}
    </span>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{children}</span></p>;
}

export default function AdminMedia() {
  const { data: media, isLoading, refetch } = trpc.admin.media.list.useQuery();
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [altText, setAltText] = useState("");
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMut = trpc.admin.media.upload.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.admin.media.delete.useMutation({
    onSuccess: () => { toast.success("File deleted"); refetch(); setDeleteTarget(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return `${file.name} exceeds 50MB limit`;
    if (!ALL_ACCEPTED.includes(file.type)) return `${file.name}: unsupported file type (${file.type || 'unknown'})`;
    return null;
  };

  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const errors: string[] = [];
    const valid: File[] = [];
    fileArray.forEach(f => {
      const err = validateFile(f);
      if (err) errors.push(err);
      else valid.push(f);
    });
    if (errors.length) errors.forEach(e => toast.error(e));
    if (valid.length) {
      setSelectedFiles(prev => [...prev, ...valid]);
      if (!uploadDialog) setUploadDialog(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return toast.error("Select at least one file");
    setUploading(true);
    let successCount = 0;
    try {
      for (const file of selectedFiles) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await uploadMut.mutateAsync({
          fileName: file.name,
          mimeType: file.type,
          imageData: base64,
          altText: altText || undefined,
        });
        successCount++;
      }
      toast.success(`${successCount} file(s) uploaded successfully`);
      setUploadDialog(false);
      setSelectedFiles([]);
      setAltText("");
    } catch {
      if (successCount > 0) toast.success(`${successCount} file(s) uploaded before error`);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFilesSelected(e.dataTransfer.files);
  }, []);

  const mediaList = (media as any)?.media || media || [];
  const filteredMedia = mediaList.filter((m: any) => {
    const matchesSearch = !search || m.fileName?.toLowerCase().includes(search.toLowerCase()) || m.filename?.toLowerCase().includes(search.toLowerCase()) || (m.altText || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || getFileCategory(m.mimeType) === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: mediaList.length,
    images: mediaList.filter((m: any) => getFileCategory(m.mimeType) === "image").length,
    videos: mediaList.filter((m: any) => getFileCategory(m.mimeType) === "video").length,
    documents: mediaList.filter((m: any) => getFileCategory(m.mimeType) === "document").length,
  };

  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); toast.success("URL copied to clipboard"); };

  return (
    <AdminLayout>
      <div className="space-y-6" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload and manage images, videos, documents, and audio files. {stats.total} file(s) total.
            </p>
          </div>
          <Button onClick={() => setUploadDialog(true)} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Upload Files
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Files", value: stats.total, icon: File, color: "text-gray-900" },
            { label: "Images", value: stats.images, icon: FileImage, color: "text-blue-600" },
            { label: "Videos", value: stats.videos, icon: FileVideo, color: "text-purple-600" },
            { label: "Documents", value: stats.documents, icon: FileText, color: "text-green-600" },
          ].map(s => (
            <Card key={s.label} className="bg-white border-gray-200">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-white border-gray-200">
          <CardContent className="py-3 px-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by filename or alt text..." className="pl-10" />
              </div>
              <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="image">Images</TabsTrigger>
                  <TabsTrigger value="video">Videos</TabsTrigger>
                  <TabsTrigger value="document">Docs</TabsTrigger>
                  <TabsTrigger value="audio">Audio</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Drag overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-red-600/10 border-4 border-dashed border-red-400 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-xl p-8 shadow-xl text-center">
              <Upload className="h-12 w-12 text-red-600 mx-auto mb-3" />
              <p className="text-lg font-bold text-gray-900">Drop files to upload</p>
              <p className="text-sm text-gray-500">Images, videos, documents, and audio</p>
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : !filteredMedia.length ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="text-center py-16 text-gray-500">
              <Image className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium text-lg">{search || typeFilter !== "all" ? "No files match your filters" : "Your media library is empty"}</p>
              <p className="text-sm text-gray-400 mt-1">Drag and drop files here, or click Upload to get started.</p>
              <HelpText>Supported formats: JPEG, PNG, GIF, WebP, SVG, MP4, WebM, PDF, DOC, MP3, WAV. Max 50MB per file.</HelpText>
              <Button onClick={() => setUploadDialog(true)} variant="outline" className="mt-4">
                <Upload className="h-4 w-4 mr-2" /> Upload First File
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia.map((m: any) => {
              const cat = getFileCategory(m.mimeType);
              const name = m.fileName || m.filename || "Unknown";
              return (
                <Card key={m.id} className="bg-white border-gray-200 overflow-hidden group">
                  <div className="aspect-square bg-gray-100 relative">
                    {cat === "image" ? (
                      <img src={m.url} alt={m.altText || name} className="w-full h-full object-cover" loading="lazy" />
                    ) : cat === "video" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
                        <Film className="h-10 w-10 text-purple-400 mb-1" />
                        <span className="text-[10px] text-purple-500 font-medium">VIDEO</span>
                      </div>
                    ) : cat === "audio" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
                        <Music className="h-10 w-10 text-amber-400 mb-1" />
                        <span className="text-[10px] text-amber-500 font-medium">AUDIO</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                        <FileText className="h-10 w-10 text-green-400 mb-1" />
                        <span className="text-[10px] text-green-500 font-medium">DOCUMENT</span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setPreviewItem(m)} title="Preview">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => copyUrl(m.url)} title="Copy URL">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(m)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      <TypeBadge mimeType={m.mimeType} />
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-gray-900 truncate" title={name}>{name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[10px] text-gray-400">{m.mimeType?.split('/')[1]?.toUpperCase()}</p>
                      <p className="text-[10px] text-gray-400">{m.fileSize ? formatFileSize(m.fileSize) : ""}</p>
                    </div>
                    {m.altText && <p className="text-[10px] text-gray-400 truncate mt-0.5" title={m.altText}>{m.altText}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Upload Dialog ===== */}
      <Dialog open={uploadDialog} onOpenChange={(o) => { if (!o && !uploading) { setUploadDialog(false); setSelectedFiles([]); setAltText(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Files</DialogTitle>
            <DialogDescription>Upload images, videos, documents, or audio files to your media library.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Click to browse or drag files here</p>
              <p className="text-xs text-gray-400 mt-1">Images, videos, documents, audio — up to 50MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALL_ACCEPTED.join(",")}
                className="hidden"
                onChange={(e) => { if (e.target.files?.length) handleFilesSelected(e.target.files); e.target.value = ""; }}
              />
            </div>

            {/* Selected files list */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                    <FileIcon mimeType={f.type} className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                      <p className="text-[10px] text-gray-400">{formatFileSize(f.size)} — {f.type || 'unknown'}</p>
                    </div>
                    <TypeBadge mimeType={f.type} />
                    {!uploading && (
                      <button onClick={() => setSelectedFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Alt text */}
            <div>
              <label className="text-sm font-medium text-gray-700">Alt Text <span className="text-gray-400 font-normal">(optional)</span></label>
              <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the content for accessibility" className="mt-1" />
              <HelpText>Alt text improves accessibility and SEO. Applied to all files in this batch.</HelpText>
            </div>

            {/* Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <p className="font-medium mb-1">Supported file types:</p>
              <ul className="space-y-0.5 text-blue-700">
                <li><strong>Images:</strong> JPEG, PNG, GIF, WebP, SVG, AVIF</li>
                <li><strong>Videos:</strong> MP4, WebM, QuickTime, AVI</li>
                <li><strong>Documents:</strong> PDF, DOC, DOCX</li>
                <li><strong>Audio:</strong> MP3, WAV, OGG, M4A</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialog(false); setSelectedFiles([]); setAltText(""); }} disabled={uploading}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFiles.length} className="bg-red-600 hover:bg-red-700 text-white">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? `Uploading (${selectedFiles.length})...` : `Upload ${selectedFiles.length} File(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Preview Dialog ===== */}
      <Dialog open={!!previewItem} onOpenChange={(o) => { if (!o) setPreviewItem(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileIcon mimeType={previewItem?.mimeType || ""} className="h-5 w-5" />
              {previewItem?.fileName || previewItem?.filename || "File Preview"}
            </DialogTitle>
            <DialogDescription>
              <TypeBadge mimeType={previewItem?.mimeType || ""} /> {" "}
              {previewItem?.fileSize ? formatFileSize(previewItem.fileSize) : ""} — Uploaded {previewItem?.createdAt ? new Date(previewItem.createdAt).toLocaleDateString("en-MY", { month: "short", day: "numeric", year: "numeric" }) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview content */}
            <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center min-h-[200px]">
              {previewItem && getFileCategory(previewItem.mimeType) === "image" ? (
                <img src={previewItem.url} alt={previewItem.altText || ""} className="max-w-full max-h-[60vh] object-contain" />
              ) : previewItem && getFileCategory(previewItem.mimeType) === "video" ? (
                <video src={previewItem.url} controls className="max-w-full max-h-[60vh]" />
              ) : previewItem && getFileCategory(previewItem.mimeType) === "audio" ? (
                <div className="p-8 text-center">
                  <Music className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                  <audio src={previewItem.url} controls className="w-full max-w-md" />
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Preview not available for this file type.</p>
                  <a href={previewItem?.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                    Open in new tab
                  </a>
                </div>
              )}
            </div>

            {/* File details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Filename</span>
                <p className="font-medium">{previewItem?.fileName || previewItem?.filename}</p>
              </div>
              <div>
                <span className="text-gray-500">MIME Type</span>
                <p className="font-medium">{previewItem?.mimeType}</p>
              </div>
              {previewItem?.altText && (
                <div className="col-span-2">
                  <span className="text-gray-500">Alt Text</span>
                  <p className="font-medium">{previewItem.altText}</p>
                </div>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="text-sm text-gray-500">File URL</label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={previewItem?.url || ""} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="sm" onClick={() => previewItem && copyUrl(previewItem.url)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <HelpText>Use this URL to embed this file in pages, products, or email templates.</HelpText>
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => { setDeleteTarget(previewItem); setPreviewItem(null); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
            <Button variant="outline" onClick={() => setPreviewItem(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.fileName || deleteTarget?.filename}</strong>?
              This action cannot be undone. Any pages or products referencing this file will show a broken link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMut.isPending}
              onClick={(e) => { e.preventDefault(); if (deleteTarget) deleteMut.mutate({ id: deleteTarget.id }); }}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
