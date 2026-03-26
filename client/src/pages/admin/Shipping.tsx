import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Truck } from "lucide-react";

export default function AdminShipping() {
  const { data: zones, isLoading, refetch } = trpc.admin.shipping.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", states: "", flatRate: 0, freeShippingThreshold: 0, estimatedDays: "" });

  const createMut = trpc.admin.shipping.create.useMutation({ onSuccess: () => { toast.success("Zone created"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = trpc.admin.shipping.update.useMutation({ onSuccess: () => { toast.success("Zone updated"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMut = trpc.admin.shipping.delete.useMutation({ onSuccess: () => { toast.success("Zone deleted"); refetch(); }, onError: (e: any) => toast.error(e.message) });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };
  const openCreate = () => { setEditing(null); setForm({ name: "", states: "", flatRate: 0, freeShippingThreshold: 0, estimatedDays: "" }); setDialogOpen(true); };
  const openEdit = (z: any) => { setEditing(z); setForm({ name: z.name, states: z.states || "", flatRate: z.flatRate, freeShippingThreshold: z.freeShippingThreshold || 0, estimatedDays: z.estimatedDays || "" }); setDialogOpen(true); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping Zones</h1>
            <p className="text-sm text-gray-500 mt-1">Configure shipping rates and delivery estimates by region</p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> Add Zone</Button>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !zones?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No shipping zones</p>
                <Button onClick={openCreate} variant="outline" className="mt-3">Create Zone</Button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">States/Regions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flat Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Free Shipping Above</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Days</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {zones.map((z: any) => (
                    <tr key={z.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{z.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{z.states || "All"}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">RM {(z.flatRate / 100).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{z.freeShippingThreshold ? `RM ${(z.freeShippingThreshold / 100).toFixed(2)}` : "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{z.estimatedDays || "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(z)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: z.id }); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Zone" : "New Zone"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Zone Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="West Malaysia" className="mt-1" /></div>
            <div><label className="text-sm font-medium">States/Regions</label><Input value={form.states} onChange={(e) => setForm({ ...form, states: e.target.value })} placeholder="Selangor, KL, Penang (comma-separated)" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Flat Rate (cents)</label><Input type="number" value={form.flatRate} onChange={(e) => setForm({ ...form, flatRate: Number(e.target.value) })} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Free Shipping Threshold (cents)</label><Input type="number" value={form.freeShippingThreshold} onChange={(e) => setForm({ ...form, freeShippingThreshold: Number(e.target.value) })} className="mt-1" /></div>
            </div>
            <div><label className="text-sm font-medium">Estimated Days</label><Input value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} placeholder="2-4 business days" className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => {
              if (!form.name) return toast.error("Zone name is required");
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
