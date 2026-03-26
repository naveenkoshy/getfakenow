import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Mail, Eye } from "lucide-react";

export default function AdminEmailTemplates() {
  const { data: templates, isLoading, refetch } = trpc.admin.emailTemplates.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ key: "", name: "", subject: "", htmlBody: "", textBody: "", category: "transactional" as "transactional" | "marketing" | "system" });

  const createMut = trpc.admin.emailTemplates.create.useMutation({ onSuccess: () => { toast.success("Template created"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = trpc.admin.emailTemplates.update.useMutation({ onSuccess: () => { toast.success("Template updated"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMut = trpc.admin.emailTemplates.delete.useMutation({ onSuccess: () => { toast.success("Template deleted"); refetch(); }, onError: (e: any) => toast.error(e.message) });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };
  const openCreate = () => { setEditing(null); setForm({ key: "", name: "", subject: "", htmlBody: "", textBody: "", category: "transactional" }); setDialogOpen(true); };
  const openEdit = (t: any) => { setEditing(t); setForm({ key: t.key, name: t.name, subject: t.subject, htmlBody: t.htmlBody, textBody: t.textBody || "", category: t.category }); setDialogOpen(true); };

  const handleSubmit = () => {
    if (!form.key || !form.name || !form.subject || !form.htmlBody) return toast.error("All required fields must be filled");
    if (editing) { updateMut.mutate({ id: editing.id, ...form }); } else { createMut.mutate(form); }
  };

  const catColor = (c: string) => {
    if (c === "transactional") return "bg-blue-100 text-blue-800";
    if (c === "marketing") return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-sm text-gray-500 mt-1">Manage transactional and marketing email templates</p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> New Template</Button>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !templates?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No email templates yet</p>
                <p className="text-sm mt-1">Create templates for order confirmations, shipping updates, and marketing</p>
                <Button onClick={openCreate} variant="outline" className="mt-3">Create Template</Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {templates.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-900">{t.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor(t.category)}`}>{t.category}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Key: <span className="font-mono">{t.key}</span> &middot; Subject: {t.subject}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setPreviewHtml(t.htmlBody); setPreviewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: t.id }); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Template Key</label><Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="order_confirmation" className="mt-1 font-mono" disabled={!!editing} /></div>
              <div><label className="text-sm font-medium">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Order Confirmation" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Subject</label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Your order #{{order_number}} is confirmed" className="mt-1" /></div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">HTML Body</label>
              <Textarea value={form.htmlBody} onChange={(e) => setForm({ ...form, htmlBody: e.target.value })} rows={12} className="mt-1 font-mono text-xs" placeholder="<html>...</html>" />
              <p className="text-xs text-gray-400 mt-1">Use {"{{variable}}"} for dynamic content. Available: {"{{customer_name}}, {{order_number}}, {{total}}, {{items}}"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Plain Text Body (optional)</label>
              <Textarea value={form.textBody} onChange={(e) => setForm({ ...form, textBody: e.target.value })} rows={4} className="mt-1" placeholder="Fallback plain text version..." />
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

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader><DialogTitle>Template Preview</DialogTitle></DialogHeader>
          <div className="border rounded-lg overflow-auto max-h-[60vh]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
