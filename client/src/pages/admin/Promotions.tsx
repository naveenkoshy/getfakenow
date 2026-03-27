import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Tag, Copy, HelpCircle, AlertTriangle,
  Search, CheckCircle2, Clock, XCircle
} from "lucide-react";

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{children}</span></p>;
}

export default function AdminPromotions() {
  const { data: promos, isLoading, refetch } = trpc.admin.promotions.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    code: "", type: "percentage" as "percentage" | "fixed" | "free_shipping", value: 0,
    minOrderAmount: 0, maxUsage: 0, active: true,
    startDate: "", endDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const createMut = trpc.admin.promotions.create.useMutation({ onSuccess: () => { toast.success("Promotion created"); refetch(); closeDialog(); }, onError: (e) => toast.error(e.message) });
  const updateMut = trpc.admin.promotions.update.useMutation({ onSuccess: () => { toast.success("Promotion updated"); refetch(); closeDialog(); }, onError: (e) => toast.error(e.message) });
  const deleteMut = trpc.admin.promotions.delete.useMutation({ onSuccess: () => { toast.success("Promotion deleted"); refetch(); setDeleteTarget(null); }, onError: (e) => { toast.error(e.message); setDeleteTarget(null); } });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setErrors({}); };
  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", type: "percentage", value: 0, minOrderAmount: 0, maxUsage: 0, active: true, startDate: "", endDate: "" });
    setErrors({});
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
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "Promo code is required";
    else if (!/^[A-Z0-9_-]+$/.test(form.code)) errs.code = "Code must be uppercase letters, numbers, hyphens, or underscores";
    if (form.type !== "free_shipping" && form.value <= 0) errs.value = "Discount value must be greater than 0";
    if (form.type === "percentage" && form.value > 100) errs.value = "Percentage cannot exceed 100%";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.endDate) errs.endDate = "End date is required";
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) errs.endDate = "End date must be after start date";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editing) { updateMut.mutate({ id: editing.id, ...form }); } else { createMut.mutate(form); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("Code copied to clipboard"); };

  const getPromoStatus = (p: any) => {
    const now = new Date();
    if (!p.active) return { label: "Inactive", color: "bg-gray-100 text-gray-700", icon: <XCircle className="h-3 w-3" /> };
    if (p.endDate && new Date(p.endDate) < now) return { label: "Expired", color: "bg-red-100 text-red-700", icon: <Clock className="h-3 w-3" /> };
    if (p.startDate && new Date(p.startDate) > now) return { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> };
    if (p.maxUsage && (p.usedCount || 0) >= p.maxUsage) return { label: "Exhausted", color: "bg-yellow-100 text-yellow-700", icon: <AlertTriangle className="h-3 w-3" /> };
    return { label: "Active", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> };
  };

  const filteredPromos = (promos || []).filter((p: any) =>
    !searchQuery || p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = (promos || []).filter((p: any) => getPromoStatus(p).label === "Active").length;
  const expiredCount = (promos || []).filter((p: any) => getPromoStatus(p).label === "Expired").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage discount codes and offers — {promos?.length || 0} total, {activeCount} active, {expiredCount} expired
            </p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Create Promotion
          </Button>
        </div>

        {/* Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> About Promotions</p>
            <p className="mt-1 text-blue-700">
              Create discount codes customers can apply at checkout. Percentage discounts reduce the order total by a percentage,
              while fixed discounts subtract a specific amount. Set usage limits and date ranges to control availability.
              Customers enter the code on the checkout page.
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by promo code..." className="pl-10 font-mono" />
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !filteredPromos.length ? (
              <div className="text-center py-12 text-gray-500">
                <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">{searchQuery ? "No promotions match your search" : "No promotions yet"}</p>
                <p className="text-sm text-gray-400 mt-1">Create discount codes to drive sales and reward customers.</p>
                {!searchQuery && <Button onClick={openCreate} variant="outline" className="mt-3">Create your first promotion</Button>}
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
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Period</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPromos.map((p: any) => {
                      const status = getPromoStatus(p);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{p.code}</span>
                              <button onClick={() => copyCode(p.code)} className="text-gray-400 hover:text-gray-600" title="Copy code"><Copy className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {p.type === "percentage" ? `${p.value}% off` : p.type === "free_shipping" ? "Free Shipping" : `RM${(p.value / 100).toFixed(2)} off`}
                            {p.minOrderAmount > 0 && <span className="text-xs text-gray-400 block">Min: RM{(p.minOrderAmount / 100).toFixed(2)}</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {p.usedCount || 0}{p.maxUsage ? ` / ${p.maxUsage}` : " / unlimited"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                              {status.icon} {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {p.startDate ? new Date(p.startDate).toLocaleDateString("en-MY") : "—"}
                            {" → "}
                            {p.endDate ? new Date(p.endDate).toLocaleDateString("en-MY") : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(p)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Promotion" : "New Promotion"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the promotion details below." : "Create a discount code customers can use at checkout."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Promo Code <span className="text-red-500">*</span></label>
              <Input value={form.code} onChange={(e) => { setForm({ ...form, code: e.target.value.toUpperCase() }); setErrors(prev => ({ ...prev, code: "" })); }} placeholder="SUMMER20" className={`mt-1 font-mono ${errors.code ? "border-red-500" : ""}`} />
              {errors.code ? <p className="text-xs text-red-500 mt-1">{errors.code}</p> : <HelpText>Uppercase letters, numbers, hyphens only. Customers enter this at checkout.</HelpText>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Type <span className="text-red-500">*</span></label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
                <HelpText>{form.type === "percentage" ? "Reduces total by %" : form.type === "fixed" ? "Subtracts fixed RM amount" : "Waives shipping fee"}</HelpText>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Value {form.type !== "free_shipping" && <span className="text-red-500">*</span>}</label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => { setForm({ ...form, value: Number(e.target.value) }); setErrors(prev => ({ ...prev, value: "" })); }}
                  className={`mt-1 ${errors.value ? "border-red-500" : ""}`}
                  placeholder={form.type === "percentage" ? "20" : "500"}
                  disabled={form.type === "free_shipping"}
                />
                {errors.value ? <p className="text-xs text-red-500 mt-1">{errors.value}</p> : <HelpText>{form.type === "percentage" ? "Enter percentage (e.g., 20 = 20% off)" : "Enter cents (e.g., 500 = RM5.00 off)"}</HelpText>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Min Order (cents)</label>
                <Input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} className="mt-1" />
                <HelpText>Minimum order total to apply. 0 = no minimum. (e.g., 5000 = RM50)</HelpText>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Max Uses</label>
                <Input type="number" value={form.maxUsage} onChange={(e) => setForm({ ...form, maxUsage: Number(e.target.value) })} className="mt-1" placeholder="0 = unlimited" />
                <HelpText>Total times this code can be used. 0 = unlimited.</HelpText>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => { setForm({ ...form, startDate: e.target.value }); setErrors(prev => ({ ...prev, startDate: "" })); }} className={`mt-1 ${errors.startDate ? "border-red-500" : ""}`} />
                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => { setForm({ ...form, endDate: e.target.value }); setErrors(prev => ({ ...prev, endDate: "" })); }} className={`mt-1 ${errors.endDate ? "border-red-500" : ""}`} />
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <div>
                <label className="text-sm font-medium text-gray-700">Active</label>
                <p className="text-xs text-gray-400">When disabled, the code cannot be used at checkout even within the valid date range.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update Promotion" : "Create Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Delete Promotion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the promo code <strong className="font-mono">{deleteTarget?.code}</strong>?
              This cannot be undone. Customers will no longer be able to use this code.
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
              Delete Promotion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
