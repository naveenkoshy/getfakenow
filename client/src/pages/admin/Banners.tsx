import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Image, GripVertical, HelpCircle, AlertTriangle,
  Eye, CheckCircle2, Clock, XCircle
} from "lucide-react";
import { PageHeader, HelpText } from "@/components/admin/CmsUI";

export default function AdminBanners() {
  const { data: banners, isLoading, refetch } = trpc.admin.banners.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", subtitle: "", imageUrl: "", mobileImageUrl: "",
    ctaText: "", ctaLink: "", textColor: "#FFFFFF", overlayOpacity: 40,
    sortOrder: 0, startDate: "", endDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [previewBanner, setPreviewBanner] = useState<any>(null);

  const createMut = trpc.admin.banners.create.useMutation({ onSuccess: () => { toast.success("Banner created"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = trpc.admin.banners.update.useMutation({ onSuccess: () => { toast.success("Banner updated"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMut = trpc.admin.banners.delete.useMutation({ onSuccess: () => { toast.success("Banner deleted"); refetch(); setDeleteTarget(null); }, onError: (e: any) => { toast.error(e.message); setDeleteTarget(null); } });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setErrors({}); };
  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", subtitle: "", imageUrl: "", mobileImageUrl: "", ctaText: "", ctaLink: "", textColor: "#FFFFFF", overlayOpacity: 40, sortOrder: (banners?.length || 0) + 1, startDate: "", endDate: "" });
    setErrors({});
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
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Banner title is required";
    if (!form.imageUrl.trim()) errs.imageUrl = "Image URL is required";
    else if (!form.imageUrl.startsWith("http")) errs.imageUrl = "Must be a valid URL starting with http";
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) errs.endDate = "End date must be after start date";
    if (form.overlayOpacity < 0 || form.overlayOpacity > 100) errs.overlayOpacity = "Must be between 0 and 100";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: any = { ...form };
    if (!payload.startDate) delete payload.startDate;
    if (!payload.endDate) delete payload.endDate;
    if (!payload.mobileImageUrl) delete payload.mobileImageUrl;
    if (editing) { updateMut.mutate({ id: editing.id, ...payload }); } else { createMut.mutate(payload); }
  };

  const getBannerStatus = (b: any) => {
    const now = new Date();
    if (b.endDate && new Date(b.endDate) < now) return { label: "Expired", color: "bg-red-100 text-red-700", icon: <Clock className="h-3 w-3" /> };
    if (b.startDate && new Date(b.startDate) > now) return { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> };
    if (b.active === false) return { label: "Inactive", color: "bg-gray-100 text-gray-700", icon: <XCircle className="h-3 w-3" /> };
    return { label: "Active", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Banner Slides"
          description={`Manage homepage hero banners and promotional slides — ${banners?.length || 0} total`}
        >
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> Add Banner</Button>
        </PageHeader>

        {/* Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> About Banners</p>
            <p className="mt-1 text-blue-700">
              Banners appear on the homepage hero carousel. Set the sort order to control display sequence (lower numbers appear first).
              Use the overlay opacity to ensure text is readable over the image. Recommended image size: 1920x800px for desktop, 768x600px for mobile.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !banners?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Image className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No banners yet</p>
                <p className="text-sm text-gray-400 mt-1">Add hero banners to showcase promotions and featured content on the homepage.</p>
                <Button onClick={openCreate} variant="outline" className="mt-3">Create Banner</Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {banners.map((b: any) => {
                  const status = getBannerStatus(b);
                  return (
                    <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                      <GripVertical className="h-5 w-5 text-gray-300 cursor-grab flex-shrink-0" />
                      <div className="h-16 w-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{b.title}</p>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                        {b.subtitle && <p className="text-xs text-gray-500 truncate">{b.subtitle}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          Order: {b.sortOrder}
                          {b.ctaText && ` · CTA: "${b.ctaText}" → ${b.ctaLink || "/"}`}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewBanner(b)} title="Preview"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(b)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(b)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewBanner} onOpenChange={(o) => { if (!o) setPreviewBanner(null); }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {previewBanner && (
            <div className="relative">
              <img src={previewBanner.imageUrl} alt={previewBanner.title} className="w-full aspect-[2.4/1] object-cover" />
              <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(previewBanner.overlayOpacity || 40) / 100})` }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8" style={{ color: previewBanner.textColor || "#FFFFFF" }}>
                <h2 className="text-3xl font-bold mb-2">{previewBanner.title}</h2>
                {previewBanner.subtitle && <p className="text-lg opacity-90">{previewBanner.subtitle}</p>}
                {previewBanner.ctaText && (
                  <button className="mt-4 px-6 py-2 bg-white text-gray-900 rounded-full font-medium text-sm">{previewBanner.ctaText}</button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Banner" : "New Banner"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the banner details below." : "Create a new hero banner for the homepage carousel."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
              <Input value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors(prev => ({ ...prev, title: "" })); }} className={`mt-1 ${errors.title ? "border-red-500" : ""}`} placeholder="Spring Collection 2026" />
              {errors.title ? <p className="text-xs text-red-500 mt-1">{errors.title}</p> : <HelpText>The main headline displayed over the banner image.</HelpText>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Subtitle</label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="mt-1" placeholder="Discover the latest styles" />
              <HelpText>Optional secondary text below the title.</HelpText>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Desktop Image URL <span className="text-red-500">*</span></label>
              <Input value={form.imageUrl} onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); setErrors(prev => ({ ...prev, imageUrl: "" })); }} placeholder="https://..." className={`mt-1 ${errors.imageUrl ? "border-red-500" : ""}`} />
              {errors.imageUrl ? <p className="text-xs text-red-500 mt-1">{errors.imageUrl}</p> : <HelpText>Recommended: 1920x800px. Upload via Media Library first, then paste the URL here.</HelpText>}
              {form.imageUrl && form.imageUrl.startsWith("http") && (
                <div className="mt-2 h-24 w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mobile Image URL</label>
              <Input value={form.mobileImageUrl} onChange={(e) => setForm({ ...form, mobileImageUrl: e.target.value })} className="mt-1" placeholder="https://..." />
              <HelpText>Optional mobile-optimized image (768x600px). Falls back to desktop image if not set.</HelpText>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">CTA Button Text</label>
                <Input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop Now" className="mt-1" />
                <HelpText>Call-to-action button label.</HelpText>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">CTA Link</label>
                <Input value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="/shop" className="mt-1" />
                <HelpText>Where the button navigates to.</HelpText>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Text Color</label>
                <Input type="color" value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })} className="mt-1 h-10" />
                <HelpText>Title and subtitle color.</HelpText>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Overlay %</label>
                <Input type="number" min={0} max={100} value={form.overlayOpacity} onChange={(e) => { setForm({ ...form, overlayOpacity: Number(e.target.value) }); setErrors(prev => ({ ...prev, overlayOpacity: "" })); }} className={`mt-1 ${errors.overlayOpacity ? "border-red-500" : ""}`} />
                {errors.overlayOpacity ? <p className="text-xs text-red-500 mt-1">{errors.overlayOpacity}</p> : <HelpText>Dark overlay for readability (0-100).</HelpText>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Sort Order</label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="mt-1" />
                <HelpText>Lower = shown first.</HelpText>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1" />
                <HelpText>When the banner becomes visible.</HelpText>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => { setForm({ ...form, endDate: e.target.value }); setErrors(prev => ({ ...prev, endDate: "" })); }} className={`mt-1 ${errors.endDate ? "border-red-500" : ""}`} />
                {errors.endDate ? <p className="text-xs text-red-500 mt-1">{errors.endDate}</p> : <HelpText>When the banner is hidden.</HelpText>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update Banner" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Delete Banner
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the banner <strong>"{deleteTarget?.title}"</strong>?
              This will remove it from the homepage carousel immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMut.isPending}
              onClick={(e) => { e.preventDefault(); if (deleteTarget) deleteMut.mutate({ id: deleteTarget.id }); }}
            >
              {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Banner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
