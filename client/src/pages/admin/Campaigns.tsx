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
import {
  Plus, Pencil, Trash2, Loader2, Megaphone, HelpCircle, AlertTriangle,
  Search, CheckCircle2, Clock, XCircle, Send, Mail, MessageSquare, Smartphone
} from "lucide-react";
import { PageHeader, HelpText } from "@/components/admin/CmsUI";

export default function AdminCampaigns() {
  const { data: campaigns, isLoading, refetch } = trpc.admin.campaigns.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", channels: "email", audienceSegment: "all",
    emailTemplateId: undefined as number | undefined,
    whatsappTemplateKey: "", messengerContent: "", scheduledAt: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const createMut = trpc.admin.campaigns.create.useMutation({ onSuccess: () => { toast.success("Campaign created"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = trpc.admin.campaigns.update.useMutation({ onSuccess: () => { toast.success("Campaign updated"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  // Note: Campaign delete is not available in the backend - campaigns are archived via status update
  const archiveMut = trpc.admin.campaigns.update.useMutation({ onSuccess: () => { toast.success("Campaign archived"); refetch(); setDeleteTarget(null); }, onError: (e: any) => { toast.error(e.message); setDeleteTarget(null); } });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setErrors({}); };
  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", channels: "email", audienceSegment: "all", emailTemplateId: undefined, whatsappTemplateKey: "", messengerContent: "", scheduledAt: "" });
    setErrors({});
    setDialogOpen(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name, channels: c.channels, audienceSegment: c.audienceSegment,
      emailTemplateId: c.emailTemplateId, whatsappTemplateKey: c.whatsappTemplateKey || "",
      messengerContent: c.messengerContent || "",
      scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Campaign name is required";
    if (!form.channels) errs.channels = "Select at least one channel";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: any = { ...form, scheduledAt: form.scheduledAt || undefined };
    if (!payload.emailTemplateId) delete payload.emailTemplateId;
    if (!payload.whatsappTemplateKey) delete payload.whatsappTemplateKey;
    if (!payload.messengerContent) delete payload.messengerContent;
    if (editing) { updateMut.mutate({ id: editing.id, ...payload }); } else { createMut.mutate(payload); }
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    draft: { color: "bg-gray-100 text-gray-700", icon: <Clock className="h-3 w-3" /> },
    scheduled: { color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> },
    sending: { color: "bg-yellow-100 text-yellow-700", icon: <Send className="h-3 w-3" /> },
    sent: { color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { color: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" /> },
  };

  const channelIcons: Record<string, React.ReactNode> = {
    email: <Mail className="h-4 w-4 text-blue-500" />,
    whatsapp: <Smartphone className="h-4 w-4 text-green-500" />,
    messenger: <MessageSquare className="h-4 w-4 text-purple-500" />,
  };

  const filteredCampaigns = (campaigns || []).filter((c: any) =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Campaigns"
          description={`Broadcast messages via Email, WhatsApp, and Messenger — ${campaigns?.length || 0} total`}
        >
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
        </PageHeader>

        {/* Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> About Campaigns</p>
            <p className="mt-1 text-blue-700">
              Campaigns let you send targeted messages to customer segments. Choose a channel (Email, WhatsApp, or Messenger),
              select your audience, and schedule delivery. Draft campaigns can be edited before sending.
              Sent campaigns show delivery stats.
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search campaigns..." className="pl-10" />
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !filteredCampaigns.length ? (
              <div className="text-center py-12 text-gray-500">
                <Megaphone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">{searchQuery ? "No campaigns match your search" : "No campaigns yet"}</p>
                <p className="text-sm mt-1 text-gray-400">Create campaigns to reach your customers across channels.</p>
                {!searchQuery && <Button onClick={openCreate} variant="outline" className="mt-3">Create Campaign</Button>}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCampaigns.map((c: any) => {
                  const status = statusConfig[c.status] || statusConfig.draft;
                  return (
                    <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {c.channels.split(",").map((ch: string) => (
                              <span key={ch} title={ch}>{channelIcons[ch.trim()] || channelIcons.email}</span>
                            ))}
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                            {status.icon} {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Audience: {c.audienceSegment}
                          {c.scheduledAt && ` · Scheduled: ${new Date(c.scheduledAt).toLocaleString("en-MY")}`}
                          {c.sentCount > 0 && ` · Sent: ${c.sentCount}`}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(c)} title="Archive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the campaign details." : "Set up a new campaign to reach your customers."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Campaign Name <span className="text-red-500">*</span></label>
              <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors(prev => ({ ...prev, name: "" })); }} placeholder="Spring Sale Announcement" className={`mt-1 ${errors.name ? "border-red-500" : ""}`} />
              {errors.name ? <p className="text-xs text-red-500 mt-1">{errors.name}</p> : <HelpText>A descriptive name for internal tracking. Not shown to customers.</HelpText>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Channel <span className="text-red-500">*</span></label>
                <Select value={form.channels} onValueChange={(v) => setForm({ ...form, channels: v })}>
                  <SelectTrigger className={`mt-1 ${errors.channels ? "border-red-500" : ""}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="messenger">Messenger</SelectItem>
                    <SelectItem value="email,whatsapp">Email + WhatsApp</SelectItem>
                    <SelectItem value="email,whatsapp,messenger">All Channels</SelectItem>
                  </SelectContent>
                </Select>
                <HelpText>Select the delivery channel(s) for this campaign.</HelpText>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Audience</label>
                <Select value={form.audienceSegment} onValueChange={(v) => setForm({ ...form, audienceSegment: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="active">Active Buyers</SelectItem>
                    <SelectItem value="inactive">Inactive (30+ days)</SelectItem>
                    <SelectItem value="high_value">High Value</SelectItem>
                    <SelectItem value="new">New Customers</SelectItem>
                  </SelectContent>
                </Select>
                <HelpText>Target a specific customer segment for better engagement.</HelpText>
              </div>
            </div>
            {form.channels.includes("whatsapp") && (
              <div>
                <label className="text-sm font-medium text-gray-700">WhatsApp Template Key</label>
                <Input value={form.whatsappTemplateKey} onChange={(e) => setForm({ ...form, whatsappTemplateKey: e.target.value })} placeholder="e.g. spring_sale_2026" className="mt-1" />
                <HelpText>The approved WhatsApp Business template identifier. Must be pre-approved by Meta.</HelpText>
              </div>
            )}
            {form.channels.includes("messenger") && (
              <div>
                <label className="text-sm font-medium text-gray-700">Messenger Content</label>
                <Textarea value={form.messengerContent} onChange={(e) => setForm({ ...form, messengerContent: e.target.value })} rows={3} className="mt-1" placeholder="Message content for Messenger..." />
                <HelpText>The message body sent via Facebook Messenger. Keep it concise and engaging.</HelpText>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Schedule (optional)</label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="mt-1" />
              <HelpText>Leave empty to save as draft. Set a future date/time to schedule automatic delivery.</HelpText>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update Campaign" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Archive Campaign
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>"{deleteTarget?.name}"</strong>?
              {deleteTarget?.status === "sent" ? " This campaign has already been sent — archiving it will mark it as cancelled." : " The campaign status will be set to cancelled."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={archiveMut.isPending}
              onClick={(e) => { e.preventDefault(); if (deleteTarget) archiveMut.mutate({ id: deleteTarget.id, status: "cancelled" }); }}
            >
              {archiveMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Archive Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
