import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, Loader2, Mail, Eye, HelpCircle, AlertTriangle, Copy, CheckCircle2 } from "lucide-react";
import { PageHeader, HelpText } from "@/components/admin/CmsUI";

const AVAILABLE_VARIABLES = [
  { name: "customer_name", desc: "Customer's full name" },
  { name: "customer_email", desc: "Customer's email address" },
  { name: "order_number", desc: "Order reference number" },
  { name: "total", desc: "Order total amount" },
  { name: "items", desc: "List of ordered items" },
  { name: "tracking_number", desc: "Shipping tracking number" },
  { name: "store_name", desc: "Your store name" },
  { name: "store_url", desc: "Your store URL" },
];

export default function AdminEmailTemplates() {
  const { data: templates, isLoading, refetch } = trpc.admin.emailTemplates.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ key: "", name: "", subject: "", htmlBody: "", textBody: "", category: "transactional" as "transactional" | "marketing" | "system" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [copiedVar, setCopiedVar] = useState("");

  const createMut = trpc.admin.emailTemplates.create.useMutation({ onSuccess: () => { toast.success("Template created"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = trpc.admin.emailTemplates.update.useMutation({ onSuccess: () => { toast.success("Template updated"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMut = trpc.admin.emailTemplates.delete.useMutation({ onSuccess: () => { toast.success("Template deleted"); refetch(); setDeleteTarget(null); }, onError: (e: any) => { toast.error(e.message); setDeleteTarget(null); } });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setErrors({}); };
  const openCreate = () => { setEditing(null); setForm({ key: "", name: "", subject: "", htmlBody: "", textBody: "", category: "transactional" }); setErrors({}); setDialogOpen(true); };
  const openEdit = (t: any) => { setEditing(t); setForm({ key: t.key, name: t.name, subject: t.subject, htmlBody: t.htmlBody, textBody: t.textBody || "", category: t.category }); setErrors({}); setDialogOpen(true); };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.key.trim()) errs.key = "Template key is required";
    else if (!/^[a-z0-9_]+$/.test(form.key)) errs.key = "Key must be lowercase letters, numbers, and underscores only";
    if (!form.name.trim()) errs.name = "Template name is required";
    if (!form.subject.trim()) errs.subject = "Subject line is required";
    if (!form.htmlBody.trim()) errs.htmlBody = "HTML body is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editing) { updateMut.mutate({ id: editing.id, ...form }); } else { createMut.mutate(form); }
  };

  const copyVariable = (name: string) => {
    navigator.clipboard.writeText(`{{${name}}}`);
    setCopiedVar(name);
    setTimeout(() => setCopiedVar(""), 2000);
  };

  const catColor = (c: string) => {
    if (c === "transactional") return "bg-blue-100 text-blue-800";
    if (c === "marketing") return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Email Templates"
          description={`Manage transactional and marketing email templates — ${templates?.length || 0} template(s)`}
        >
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> New Template</Button>
        </PageHeader>

        {/* Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> About Email Templates</p>
            <p className="mt-1 text-blue-700">
              Email templates define the content sent to customers for order confirmations, shipping updates, and marketing campaigns.
              Use {"{{variable_name}}"} syntax for dynamic content that gets replaced with actual values when the email is sent.
              Each template needs a unique key (used in code), a display name, and HTML content.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !templates?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No email templates yet</p>
                <p className="text-sm mt-1 text-gray-400">Create templates for order confirmations, shipping updates, and marketing campaigns.</p>
                <Button onClick={openCreate} variant="outline" className="mt-3">Create your first template</Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {templates.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900">{t.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor(t.category)}`}>{t.category}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-7">
                        Key: <span className="font-mono">{t.key}</span> &middot; Subject: {t.subject}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => { setPreviewHtml(t.htmlBody); setPreviewOpen(true); }} title="Preview"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(t)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the email template content and settings." : "Create a new email template with HTML content and dynamic variables."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Template Key <span className="text-red-500">*</span></label>
                <Input value={form.key} onChange={(e) => { setForm({ ...form, key: e.target.value }); setErrors(prev => ({ ...prev, key: "" })); }} placeholder="order_confirmation" className={`mt-1 font-mono ${errors.key ? "border-red-500" : ""}`} disabled={!!editing} />
                {errors.key ? <p className="text-xs text-red-500 mt-1">{errors.key}</p> : <HelpText>Unique identifier used in code. Lowercase, underscores only. Cannot be changed after creation.</HelpText>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Display Name <span className="text-red-500">*</span></label>
                <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors(prev => ({ ...prev, name: "" })); }} placeholder="Order Confirmation" className={`mt-1 ${errors.name ? "border-red-500" : ""}`} />
                {errors.name ? <p className="text-xs text-red-500 mt-1">{errors.name}</p> : <HelpText>Human-readable name for this template.</HelpText>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Subject Line <span className="text-red-500">*</span></label>
                <Input value={form.subject} onChange={(e) => { setForm({ ...form, subject: e.target.value }); setErrors(prev => ({ ...prev, subject: "" })); }} placeholder="Your order #{{order_number}} is confirmed" className={`mt-1 ${errors.subject ? "border-red-500" : ""}`} />
                {errors.subject ? <p className="text-xs text-red-500 mt-1">{errors.subject}</p> : <HelpText>Email subject. Supports {"{{variables}}"}.</HelpText>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">Transactional (orders, shipping)</SelectItem>
                    <SelectItem value="marketing">Marketing (promotions, newsletters)</SelectItem>
                    <SelectItem value="system">System (password reset, alerts)</SelectItem>
                  </SelectContent>
                </Select>
                <HelpText>Categorize for organization. Transactional emails are always sent; marketing respects opt-out.</HelpText>
              </div>
            </div>

            {/* Variable Reference */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">Available Variables (click to copy)</p>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map(v => (
                  <button key={v.name} onClick={() => copyVariable(v.name)} className="text-xs px-2 py-1 rounded bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors font-mono flex items-center gap-1" title={v.desc}>
                    {copiedVar === v.name ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                    {`{{${v.name}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">HTML Body <span className="text-red-500">*</span></label>
              <Textarea value={form.htmlBody} onChange={(e) => { setForm({ ...form, htmlBody: e.target.value }); setErrors(prev => ({ ...prev, htmlBody: "" })); }} rows={12} className={`mt-1 font-mono text-xs ${errors.htmlBody ? "border-red-500" : ""}`} placeholder="<html>...</html>" />
              {errors.htmlBody ? <p className="text-xs text-red-500 mt-1">{errors.htmlBody}</p> : <HelpText>The HTML content of the email. Use inline CSS for best compatibility across email clients.</HelpText>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Plain Text Body (optional)</label>
              <Textarea value={form.textBody} onChange={(e) => setForm({ ...form, textBody: e.target.value })} rows={4} className="mt-1" placeholder="Fallback plain text version..." />
              <HelpText>Shown when the email client cannot render HTML. Recommended for accessibility.</HelpText>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            {form.htmlBody && (
              <Button variant="outline" onClick={() => { setPreviewHtml(form.htmlBody); setPreviewOpen(true); }}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>This is a preview of the HTML email. Dynamic variables are shown as-is.</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-auto max-h-[60vh] bg-white" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Delete Email Template
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong> (key: <code className="font-mono text-xs">{deleteTarget?.key}</code>)?
              Any code referencing this template key will fail to send emails until a replacement is created.
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
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
