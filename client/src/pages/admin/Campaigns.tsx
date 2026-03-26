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
import { Plus, Pencil, Loader2, Megaphone, Send, Calendar } from "lucide-react";

export default function AdminCampaigns() {
  const { data: campaigns, isLoading, refetch } = trpc.admin.campaigns.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", channels: "email", audienceSegment: "all",
    emailTemplateId: undefined as number | undefined,
    whatsappTemplateKey: "", messengerContent: "", scheduledAt: "",
  });

  const createMut = trpc.admin.campaigns.create.useMutation({ onSuccess: () => { toast.success("Campaign created"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = trpc.admin.campaigns.update.useMutation({ onSuccess: () => { toast.success("Campaign updated"); refetch(); closeDialog(); }, onError: (e: any) => toast.error(e.message) });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };
  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", channels: "email", audienceSegment: "all", emailTemplateId: undefined, whatsappTemplateKey: "", messengerContent: "", scheduledAt: "" });
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
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.channels) return toast.error("Name and channel are required");
    const payload: any = { ...form, scheduledAt: form.scheduledAt || undefined };
    if (!payload.emailTemplateId) delete payload.emailTemplateId;
    if (!payload.whatsappTemplateKey) delete payload.whatsappTemplateKey;
    if (!payload.messengerContent) delete payload.messengerContent;
    if (editing) { updateMut.mutate({ id: editing.id, ...payload }); } else { createMut.mutate(payload); }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { draft: "bg-gray-100 text-gray-800", scheduled: "bg-blue-100 text-blue-800", sending: "bg-yellow-100 text-yellow-800", sent: "bg-green-100 text-green-800", failed: "bg-red-100 text-red-800" };
    return map[s] || "bg-gray-100 text-gray-800";
  };

  const channelIcon = (ch: string) => {
    if (ch.includes("whatsapp")) return "📱";
    if (ch.includes("messenger")) return "💬";
    return "📧";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-sm text-gray-500 mt-1">Broadcast messages via Email, WhatsApp, and Messenger</p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !campaigns?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Megaphone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No campaigns yet</p>
                <p className="text-sm mt-1">Create campaigns to reach your customers across channels</p>
                <Button onClick={openCreate} variant="outline" className="mt-3">Create Campaign</Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {campaigns.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{channelIcon(c.channels)}</span>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(c.status)}`}>{c.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Channels: {c.channels} &middot; Audience: {c.audienceSegment}
                        {c.scheduledAt && ` · Scheduled: ${new Date(c.scheduledAt).toLocaleString("en-MY")}`}
                        {c.sentCount > 0 && ` · Sent: ${c.sentCount}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Campaign Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Spring Sale Announcement" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Channel</label>
                <Select value={form.channels} onValueChange={(v) => setForm({ ...form, channels: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="messenger">Messenger</SelectItem>
                    <SelectItem value="email,whatsapp">Email + WhatsApp</SelectItem>
                    <SelectItem value="email,whatsapp,messenger">All Channels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Audience</label>
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
              </div>
            </div>
            {form.channels.includes("whatsapp") && (
              <div><label className="text-sm font-medium">WhatsApp Template Key</label><Input value={form.whatsappTemplateKey} onChange={(e) => setForm({ ...form, whatsappTemplateKey: e.target.value })} placeholder="e.g. spring_sale_2026" className="mt-1" /></div>
            )}
            {form.channels.includes("messenger") && (
              <div><label className="text-sm font-medium">Messenger Content</label><Textarea value={form.messengerContent} onChange={(e) => setForm({ ...form, messengerContent: e.target.value })} rows={3} className="mt-1" placeholder="Message content for Messenger..." /></div>
            )}
            <div><label className="text-sm font-medium">Schedule (optional)</label><Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="mt-1" /><p className="text-xs text-gray-400 mt-1">Leave empty to save as draft</p></div>
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
