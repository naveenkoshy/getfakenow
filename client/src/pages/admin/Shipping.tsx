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
import { Plus, Pencil, Trash2, Loader2, Truck, HelpCircle, AlertTriangle, MapPin } from "lucide-react";

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{children}</span></p>;
}

export default function AdminShipping() {
  const { data: zones, isLoading, refetch } = trpc.admin.shipping.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", states: "", flatRate: 0, freeShippingThreshold: 0, estimatedDays: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const createMut = trpc.admin.shipping.create.useMutation({ onSuccess: () => { toast.success("Shipping zone created"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = trpc.admin.shipping.update.useMutation({ onSuccess: () => { toast.success("Shipping zone updated"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMut = trpc.admin.shipping.delete.useMutation({ onSuccess: () => { toast.success("Shipping zone deleted"); refetch(); setDeleteTarget(null); }, onError: (e: any) => { toast.error(e.message); setDeleteTarget(null); } });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setErrors({}); };
  const openCreate = () => { setEditing(null); setForm({ name: "", states: "", flatRate: 0, freeShippingThreshold: 0, estimatedDays: "" }); setErrors({}); setDialogOpen(true); };
  const openEdit = (z: any) => { setEditing(z); setForm({ name: z.name, states: z.states || "", flatRate: z.flatRate, freeShippingThreshold: z.freeShippingThreshold || 0, estimatedDays: z.estimatedDays || "" }); setErrors({}); setDialogOpen(true); };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Zone name is required";
    if (form.flatRate < 0) errs.flatRate = "Rate cannot be negative";
    if (form.freeShippingThreshold < 0) errs.freeShippingThreshold = "Threshold cannot be negative";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editing) { updateMut.mutate({ id: editing.id, ...form }); } else { createMut.mutate(form); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping Zones</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure shipping rates and delivery estimates by region — {zones?.length || 0} zone(s)
            </p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> Add Zone</Button>
        </div>

        {/* Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> About Shipping Zones</p>
            <p className="mt-1 text-blue-700">
              Shipping zones define delivery rates for different regions. Each zone has a flat rate (in cents) and an optional free shipping threshold.
              When a customer's address matches a zone, the corresponding rate applies. If no zone matches, the default shipping rate from Settings is used.
              All monetary values are in cents (e.g., 800 = RM8.00).
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !zones?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No shipping zones configured</p>
                <p className="text-sm text-gray-400 mt-1">Create zones to set region-specific shipping rates. Without zones, the default rate from Settings applies.</p>
                <Button onClick={openCreate} variant="outline" className="mt-3">Create your first zone</Button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">States/Regions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flat Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Free Above</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Days</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {zones.map((z: any) => (
                    <tr key={z.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{z.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{z.states || "All regions"}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">RM {(z.flatRate / 100).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{z.freeShippingThreshold ? `RM ${(z.freeShippingThreshold / 100).toFixed(2)}` : "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{z.estimatedDays || "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(z)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(z)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Shipping Zone" : "New Shipping Zone"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the shipping zone details." : "Define a new shipping zone with rates and delivery estimates."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Zone Name <span className="text-red-500">*</span></label>
              <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors(prev => ({ ...prev, name: "" })); }} placeholder="West Malaysia" className={`mt-1 ${errors.name ? "border-red-500" : ""}`} />
              {errors.name ? <p className="text-xs text-red-500 mt-1">{errors.name}</p> : <HelpText>A descriptive name for this shipping zone (e.g., "West Malaysia", "East Malaysia", "International").</HelpText>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">States/Regions</label>
              <Input value={form.states} onChange={(e) => setForm({ ...form, states: e.target.value })} placeholder="Selangor, KL, Penang (comma-separated)" className="mt-1" />
              <HelpText>Comma-separated list of states or regions in this zone. Leave empty to apply to all regions not covered by other zones.</HelpText>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Flat Rate (cents)</label>
                <Input type="number" value={form.flatRate} onChange={(e) => { setForm({ ...form, flatRate: Number(e.target.value) }); setErrors(prev => ({ ...prev, flatRate: "" })); }} className={`mt-1 ${errors.flatRate ? "border-red-500" : ""}`} />
                {errors.flatRate ? <p className="text-xs text-red-500 mt-1">{errors.flatRate}</p> : <HelpText>Shipping cost in cents. 800 = RM8.00.</HelpText>}
                {form.flatRate > 0 && <p className="text-xs text-green-600 mt-1">= RM {(form.flatRate / 100).toFixed(2)}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Free Shipping Above (cents)</label>
                <Input type="number" value={form.freeShippingThreshold} onChange={(e) => { setForm({ ...form, freeShippingThreshold: Number(e.target.value) }); setErrors(prev => ({ ...prev, freeShippingThreshold: "" })); }} className={`mt-1 ${errors.freeShippingThreshold ? "border-red-500" : ""}`} />
                {errors.freeShippingThreshold ? <p className="text-xs text-red-500 mt-1">{errors.freeShippingThreshold}</p> : <HelpText>Orders above this get free shipping. 0 = no free shipping.</HelpText>}
                {form.freeShippingThreshold > 0 && <p className="text-xs text-green-600 mt-1">= RM {(form.freeShippingThreshold / 100).toFixed(2)}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Estimated Delivery Days</label>
              <Input value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} placeholder="2-4 business days" className="mt-1" />
              <HelpText>Shown to customers at checkout and in order confirmation emails.</HelpText>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update Zone" : "Create Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Delete Shipping Zone
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
              Orders from this region will fall back to the default shipping rate.
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
              Delete Zone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
