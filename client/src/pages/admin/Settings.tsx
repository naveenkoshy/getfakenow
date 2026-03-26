import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Settings as SettingsIcon, Save } from "lucide-react";

const SETTING_GROUPS = [
  {
    title: "Store Information",
    settings: [
      { key: "store_name", label: "Store Name", placeholder: "Fake by Freetown", type: "text" },
      { key: "store_tagline", label: "Tagline", placeholder: "Authentically Fake", type: "text" },
      { key: "store_email", label: "Contact Email", placeholder: "hello@fakebyfreetown.com", type: "text" },
      { key: "store_phone", label: "Phone", placeholder: "+60 12-345 6789", type: "text" },
      { key: "store_address", label: "Address", placeholder: "Kuala Lumpur, Malaysia", type: "textarea" },
    ],
  },
  {
    title: "Currency & Tax",
    settings: [
      { key: "currency", label: "Currency Code", placeholder: "MYR", type: "text" },
      { key: "currency_symbol", label: "Currency Symbol", placeholder: "RM", type: "text" },
      { key: "tax_rate", label: "Tax Rate (%)", placeholder: "0", type: "text" },
      { key: "tax_included", label: "Prices Include Tax (true/false)", placeholder: "true", type: "text" },
    ],
  },
  {
    title: "Shipping",
    settings: [
      { key: "free_shipping_threshold", label: "Free Shipping Threshold (cents)", placeholder: "15000", type: "text" },
      { key: "default_shipping_rate", label: "Default Shipping Rate (cents)", placeholder: "800", type: "text" },
    ],
  },
  {
    title: "Social Media",
    settings: [
      { key: "social_instagram", label: "Instagram URL", placeholder: "https://instagram.com/fakebyfreetown", type: "text" },
      { key: "social_tiktok", label: "TikTok URL", placeholder: "https://tiktok.com/@fakebyfreetown", type: "text" },
      { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/fakebyfreetown", type: "text" },
      { key: "social_twitter", label: "Twitter/X URL", placeholder: "https://x.com/fakebyfreetown", type: "text" },
    ],
  },
  {
    title: "Messaging Channels",
    settings: [
      { key: "whatsapp_api_token", label: "WhatsApp Business API Token", placeholder: "Bearer token", type: "text" },
      { key: "whatsapp_phone_id", label: "WhatsApp Phone Number ID", placeholder: "1234567890", type: "text" },
      { key: "messenger_page_token", label: "Facebook Messenger Page Token", placeholder: "Page access token", type: "text" },
      { key: "messenger_page_id", label: "Facebook Page ID", placeholder: "1234567890", type: "text" },
    ],
  },
];

export default function AdminSettings() {
  const { data: allSettings, isLoading, refetch } = trpc.admin.settings.list.useQuery();
  const setMut = trpc.admin.settings.set.useMutation({ onSuccess: () => { toast.success("Setting saved"); refetch(); }, onError: (e: any) => toast.error(e.message) });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const getValue = (key: string) => {
    if (edits[key] !== undefined) return edits[key];
    const found = allSettings?.find((s: any) => s.key === key);
    return found?.value || "";
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const keys = Object.keys(edits);
    for (const key of keys) {
      try {
        await setMut.mutateAsync({ key, value: edits[key] });
      } catch {}
    }
    setEdits({});
    setSaving(false);
    toast.success(`${keys.length} setting(s) saved`);
  };

  const hasChanges = Object.keys(edits).length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure store settings, social links, and messaging channels</p>
          </div>
          {hasChanges && (
            <Button onClick={handleSaveAll} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save {Object.keys(edits).length} Change(s)
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          SETTING_GROUPS.map((group) => (
            <Card key={group.title} className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-gray-400" /> {group.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.settings.map((s) => (
                  <div key={s.key} className="grid grid-cols-3 gap-4 items-start">
                    <label className="text-sm font-medium text-gray-700 pt-2">{s.label}</label>
                    <div className="col-span-2">
                      {s.type === "textarea" ? (
                        <Textarea
                          value={getValue(s.key)}
                          onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                          placeholder={s.placeholder}
                          rows={3}
                          className="text-sm"
                        />
                      ) : (
                        <Input
                          value={getValue(s.key)}
                          onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                          placeholder={s.placeholder}
                          className="text-sm"
                        />
                      )}
                      <p className="text-xs text-gray-400 mt-1 font-mono">{s.key}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
