import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Menu, GripVertical } from "lucide-react";
import { PageHeader } from "@/components/admin/CmsUI";

export default function AdminNavigation() {
  const { data: items, isLoading, refetch } = trpc.admin.navigation.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ label: "", url: "", location: "header" as "header" | "footer" | "mobile", sortOrder: 0, parentId: undefined as number | undefined });

  const createMut = trpc.admin.navigation.create.useMutation({ onSuccess: () => { toast.success("Item created"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = trpc.admin.navigation.update.useMutation({ onSuccess: () => { toast.success("Item updated"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMut = trpc.admin.navigation.delete.useMutation({ onSuccess: () => { toast.success("Item deleted"); refetch(); }, onError: (e: any) => toast.error(e.message) });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };
  const openCreate = () => { setEditing(null); setForm({ label: "", url: "", location: "header", sortOrder: 0, parentId: undefined }); setDialogOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ label: item.label, url: item.url, location: item.location, sortOrder: item.sortOrder, parentId: item.parentId || undefined }); setDialogOpen(true); };

  const headerItems = items?.filter((i: any) => i.location === "header") || [];
  const footerItems = items?.filter((i: any) => i.location === "footer") || [];

  const renderItems = (list: any[], title: string) => (
    <div>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
      {list.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No items</p>
      ) : (
        <div className="space-y-1">
          {list.sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 group">
              <GripVertical className="h-4 w-4 text-gray-300" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 font-mono">{item.url}</p>
              </div>
              <span className="text-xs text-gray-400">#{item.sortOrder}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: item.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Navigation"
          description="Manage header and footer navigation links"
        >
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
        </PageHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">{renderItems(headerItems, "Header Navigation")}</CardContent>
            </Card>
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">{renderItems(footerItems, "Footer Navigation")}</CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Navigation Item" : "New Navigation Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Label</label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Shop" className="mt-1" /></div>
            <div><label className="text-sm font-medium">URL</label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/shop" className="mt-1 font-mono" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Location</label>
                <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v as "header" | "footer" | "mobile" })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Sort Order</label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => {
              if (!form.label || !form.url) return toast.error("Label and URL are required");
              if (editing) { updateMut.mutate({ id: editing.id, ...form }); } else { createMut.mutate(form); }
            }} disabled={createMut.isPending || updateMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
