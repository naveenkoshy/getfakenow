import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Image, GripVertical } from "lucide-react";

export default function AdminBanners() {
  const { data: banners, isLoading, refetch } = trpc.admin.banners.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", subtitle: "", imageUrl: "", mobileImageUrl: "",
    ctaText: "", ctaLink: "", textColor: "#FFFFFF", overlayOpacity: 40,
    sortOrder: 0, startDate: "", endDate: "",
  });

  const createMut = trpc.admin.banners.create.useMutation({ onSuccess: () => { toast.success("Banner created"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = trpc.admin.banners.update.useMutation({ onSuccess: () => { toast.success("Banner updated"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMut = trpc.admin.banners.delete.useMutation({ onSuccess: () => { toast.success("Banner deleted"); refetch(); }, onError: (e: any) => toast.error(e.message) });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };
  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", subtitle: "", imageUrl: "", mobileImageUrl: "", ctaText: "", ctaLink: "", textColor: "#FFFFFF", overlayOpacity: 40, sortOrder: 0, startDate: "", endDate: "" });
    setDialogOpen(true);
  };
  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      title: b.title, subtitle: b.subtitle || "", imageUrl: b.imageUrl, mobileImageUrl: b.mobileImageUrl || "",
      ctaText: b.ctaText || "", ctaLink: b.ctaLink || "", textColor: b.textColor || "#FFFFFF",
      overlayOpacity: b.overlayOpacity || 40, sortOrder: b.sortOrder || 0,
      startDate: b.startDate ? new Date(b.startDate).toISOString().slice(0, 16) : "",
      endDate: b.endDate ? new Date(b.endDate).toISOString().slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.imageUrl) return toast.error("Title and image URL are required");
    const payload: any = { ...form };
    if (!payload.startDate) delete payload.startDate;
    if (!payload.endDate) delete payload.endDate;
    if (!payload.mobileImageUrl) delete payload.mobileImageUrl;
    if (editing) { updateMut.mutate({ id: editing.id, ...payload }); } else { createMut.mutate(payload); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Banner Slides</h1>
            <p className="text-sm text-gray-500 mt-1">Manage homepage hero banners and promotional slides</p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> Add Banner</Button>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !banners?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Image className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No banners yet</p>
                <Button onClick={openCreate} variant="outline" className="mt-3">Create Banner</Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {banners.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                    <div className="h-16 w-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{b.title}</p>
                      {b.subtitle && <p className="text-xs text-gray-500">{b.subtitle}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Order: {b.sortOrder} &middot; {b.active ? "Active" : "Inactive"}
                        {b.ctaText && ` · CTA: ${b.ctaText}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: b.id }); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Banner" : "New Banner"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
            <div><label className="text-sm font-medium">Subtitle</label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="mt-1" /></div>
            <div><label className="text-sm font-medium">Image URL</label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="mt-1" /></div>
            <div><label className="text-sm font-medium">Mobile Image URL (optional)</label><Input value={form.mobileImageUrl} onChange={(e) => setForm({ ...form, mobileImageUrl: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">CTA Text</label><Input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop Now" className="mt-1" /></div>
              <div><label className="text-sm font-medium">CTA Link</label><Input value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="/shop" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm font-medium">Text Color</label><Input type="color" value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })} className="mt-1 h-10" /></div>
              <div><label className="text-sm font-medium">Overlay %</label><Input type="number" min={0} max={100} value={form.overlayOpacity} onChange={(e) => setForm({ ...form, overlayOpacity: Number(e.target.value) })} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Sort Order</label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Start Date</label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1" /></div>
              <div><label className="text-sm font-medium">End Date</label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
