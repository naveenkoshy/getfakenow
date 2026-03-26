import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, FolderOpen } from "lucide-react";

export default function AdminCategories() {
  const { data: categories, isLoading, refetch } = trpc.admin.categories.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const createMut = trpc.admin.categories.create.useMutation({ onSuccess: () => { toast.success("Category created"); refetch(); closeDialog(); }, onError: (e) => toast.error(e.message) });
  const updateMut = trpc.admin.categories.update.useMutation({ onSuccess: () => { toast.success("Category updated"); refetch(); closeDialog(); }, onError: (e) => toast.error(e.message) });
  const deleteMut = trpc.admin.categories.delete.useMutation({ onSuccess: () => { toast.success("Category deleted"); refetch(); }, onError: (e) => toast.error(e.message) });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm({ name: "", slug: "", description: "" }); };
  const openCreate = () => { setEditing(null); setForm({ name: "", slug: "", description: "" }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description || "" }); setDialogOpen(true); };

  const handleSubmit = () => {
    if (!form.name || !form.slug) return toast.error("Name and slug are required");
    if (editing) {
      updateMut.mutate({ id: editing.id, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500 mt-1">Organize your product catalog</p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !categories?.length ? (
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No categories yet</p>
                <Button onClick={openCreate} variant="outline" className="mt-3">Create your first category</Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {categories.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500 font-mono">/{c.slug}</p>
                      {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => { if (confirm("Delete this category?")) deleteMut.mutate({ id: c.id }); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value, slug: editing ? form.slug : autoSlug(e.target.value) }); }} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
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
