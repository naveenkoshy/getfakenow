import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Tag, Copy } from "lucide-react";

export default function AdminPromotions() {
  const { data: promos, isLoading, refetch } = trpc.admin.promotions.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    code: "", type: "percentage" as "percentage" | "fixed" | "free_shipping", value: 0,
    minOrderAmount: 0, maxUsage: 0, active: true,
    startDate: "", endDate: "",
  });

  const createMut = trpc.admin.promotions.create.useMutation({ onSuccess: () => { toast.success("Promotion created"); refetch(); closeDialog(); }, onError: (e) => toast.error(e.message) });
  const updateMut = trpc.admin.promotions.update.useMutation({ onSuccess: () => { toast.success("Promotion updated"); refetch(); closeDialog(); }, onError: (e) => toast.error(e.message) });
  const deleteMut = trpc.admin.promotions.delete.useMutation({ onSuccess: () => { toast.success("Promotion deleted"); refetch(); }, onError: (e) => toast.error(e.message) });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };
  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", type: "percentage", value: 0, minOrderAmount: 0, maxUsage: 0, active: true, startDate: "", endDate: "" });
    setDialogOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      code: p.code, type: p.type, value: p.value,
      minOrderAmount: p.minOrderAmount || 0, maxUsage: p.maxUsage || 0, active: p.active,
      startDate: p.startDate ? new Date(p.startDate).toISOString().slice(0, 16) : "",
      endDate: p.endDate ? new Date(p.endDate).toISOString().slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.code) return toast.error("Code is required");
    if (!form.startDate || !form.endDate) return toast.error("Start and end dates are required");
    if (editing) {
      updateMut.mutate({ id: editing.id, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("Code copied"); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
            <p className="text-sm text-gray-500 mt-1">Manage discount codes and offers</p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Create Promotion
          </Button>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !promos?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No promotions yet</p>
                <Button onClick={openCreate} variant="outline" className="mt-3">Create your first promotion</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Code</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Discount</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Usage</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Expires</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {promos.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{p.code}</span>
                            <button onClick={() => copyCode(p.code)} className="text-gray-400 hover:text-gray-600"><Copy className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {p.type === "percentage" ? `${p.value}%` : `RM ${(p.value / 100).toFixed(2)}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {p.usedCount || 0}{p.maxUsage ? ` / ${p.maxUsage}` : ""}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {p.endDate ? new Date(p.endDate).toLocaleDateString("en-MY") : "Never"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm("Delete this promotion?")) deleteMut.mutate({ id: p.id }); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Promotion" : "New Promotion"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Code</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className="mt-1 font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Value</label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="mt-1" placeholder={form.type === "percentage" ? "20" : "500"} />
                <p className="text-xs text-gray-400 mt-1">{form.type === "percentage" ? "%" : "cents (500 = RM5)"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Min Order (cents)</label>
                <Input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Max Uses</label>
                <Input type="number" value={form.maxUsage} onChange={(e) => setForm({ ...form, maxUsage: Number(e.target.value) })} className="mt-1" placeholder="0 = unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <label className="text-sm font-medium">Active</label>
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
