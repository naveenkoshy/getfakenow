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
import { Plus, Pencil, Trash2, Loader2, FolderOpen, HelpCircle, AlertTriangle, Search } from "lucide-react";

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{children}</span></p>;
}

export default function AdminCategories() {
  const { data: categories, isLoading, refetch } = trpc.admin.categories.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const createMut = trpc.admin.categories.create.useMutation({ onSuccess: () => { toast.success("Category created"); refetch(); closeDialog(); }, onError: (e) => toast.error(e.message) });
  const updateMut = trpc.admin.categories.update.useMutation({ onSuccess: () => { toast.success("Category updated"); refetch(); closeDialog(); }, onError: (e) => toast.error(e.message) });
  const deleteMut = trpc.admin.categories.delete.useMutation({ onSuccess: () => { toast.success("Category deleted"); refetch(); setDeleteTarget(null); }, onError: (e) => toast.error(e.message) });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm({ name: "", slug: "", description: "" }); setErrors({}); };
  const openCreate = () => { setEditing(null); setForm({ name: "", slug: "", description: "" }); setErrors({}); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description || "" }); setErrors({}); setDialogOpen(true); };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Category name is required";
    if (!form.slug.trim()) errs.slug = "URL slug is required";
    else if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = "Slug must be lowercase letters, numbers, and hyphens only";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editing) { updateMut.mutate({ id: editing.id, ...form }); } else { createMut.mutate(form); }
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const filteredCategories = (categories || []).filter((c: any) =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500 mt-1">Organize your product catalog into categories — {categories?.length || 0} total</p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </div>

        {/* Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> About Categories</p>
            <p className="mt-1 text-blue-700">
              Categories help customers browse your store by grouping related products. Each product can belong to one category.
              The URL slug determines the category page URL (e.g., /category/casual-wear).
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search categories..." className="pl-10" />
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !filteredCategories.length ? (
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">{searchQuery ? "No categories match your search" : "No categories yet"}</p>
                <p className="text-sm text-gray-400 mt-1">Categories help customers find products in your store.</p>
                {!searchQuery && <Button onClick={openCreate} variant="outline" className="mt-3">Create your first category</Button>}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCategories.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">/{c.slug}</p>
                      {c.description && <p className="text-xs text-gray-400 mt-1 truncate">{c.description}</p>}
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)} title="Edit category"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(c)} title="Delete category"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the category details below." : "Create a new category to organize your products."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
              <Input
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value, slug: editing ? form.slug : autoSlug(e.target.value) }); setErrors(prev => ({ ...prev, name: "" })); }}
                className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
                placeholder="e.g., Casual Wear"
              />
              {errors.name ? <p className="text-xs text-red-500 mt-1">{errors.name}</p> : <HelpText>The display name shown to customers in navigation and filters.</HelpText>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">URL Slug <span className="text-red-500">*</span></label>
              <Input
                value={form.slug}
                onChange={(e) => { setForm({ ...form, slug: e.target.value }); setErrors(prev => ({ ...prev, slug: "" })); }}
                className={`mt-1 font-mono ${errors.slug ? "border-red-500" : ""}`}
                placeholder="casual-wear"
              />
              {errors.slug ? <p className="text-xs text-red-500 mt-1">{errors.slug}</p> : <HelpText>URL-friendly identifier. Auto-generated from name. Lowercase, hyphens only.</HelpText>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1"
                placeholder="Brief description of this category"
              />
              <HelpText>Optional description used for SEO and category page headers.</HelpText>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
              Products in this category will become uncategorized. This action cannot be undone.
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
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
