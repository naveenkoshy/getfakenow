import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Settings as SettingsIcon, Save, HelpCircle, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{children}</span></p>;
}

const SETTING_GROUPS = [
  {
    title: "Store Information",
    description: "Basic store details shown across the website, emails, and invoices.",
    icon: "store",
    settings: [
      { key: "store_name", label: "Store Name", placeholder: "Fake by Freetown", type: "text", help: "Your store's display name. Appears in the header, emails, and browser tab.", required: true },
      { key: "store_tagline", label: "Tagline", placeholder: "Authentically Fake", type: "text", help: "A short slogan shown below the store name on the homepage." },
      { key: "store_email", label: "Contact Email", placeholder: "hello@fakebyfreetown.com", type: "text", help: "Customers will use this email for support inquiries. Also used as the 'from' address for emails.", required: true, validate: (v: string) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email address" : "" },
      { key: "store_phone", label: "Phone", placeholder: "+60 12-345 6789", type: "text", help: "Displayed in the footer and contact page. Include country code." },
      { key: "store_address", label: "Address", placeholder: "Kuala Lumpur, Malaysia", type: "textarea", help: "Physical store or business address. Shown in the footer and on invoices." },
    ],
  },
  {
    title: "Currency & Tax",
    description: "Configure how prices and taxes are displayed to customers.",
    icon: "currency",
    settings: [
      { key: "currency", label: "Currency Code", placeholder: "MYR", type: "text", help: "ISO 4217 currency code (e.g., MYR, USD, SGD). Used for Stripe and display.", required: true, validate: (v: string) => v && !/^[A-Z]{3}$/.test(v) ? "Must be a 3-letter uppercase code (e.g., MYR)" : "" },
      { key: "currency_symbol", label: "Currency Symbol", placeholder: "RM", type: "text", help: "Symbol shown before prices (e.g., RM, $, S$).", required: true },
      { key: "tax_rate", label: "Tax Rate (%)", placeholder: "0", type: "text", help: "Sales tax percentage. Enter 6 for 6% SST. Enter 0 if no tax applies.", validate: (v: string) => v && (isNaN(Number(v)) || Number(v) < 0 || Number(v) > 100) ? "Must be a number between 0 and 100" : "" },
      { key: "tax_included", label: "Prices Include Tax", placeholder: "true", type: "text", help: "Set to 'true' if displayed prices already include tax, 'false' if tax is added at checkout.", validate: (v: string) => v && !["true", "false"].includes(v.toLowerCase()) ? "Must be 'true' or 'false'" : "" },
    ],
  },
  {
    title: "Shipping Defaults",
    description: "Default shipping rates. For zone-specific rates, use the Shipping Zones page.",
    icon: "shipping",
    settings: [
      { key: "free_shipping_threshold", label: "Free Shipping Threshold (cents)", placeholder: "15000", type: "text", help: "Orders above this amount (in cents) qualify for free shipping. 15000 = RM150.00. Set to 0 to disable.", validate: (v: string) => v && (isNaN(Number(v)) || Number(v) < 0) ? "Must be a positive number (in cents)" : "" },
      { key: "default_shipping_rate", label: "Default Shipping Rate (cents)", placeholder: "800", type: "text", help: "Flat shipping rate in cents when no zone matches. 800 = RM8.00.", validate: (v: string) => v && (isNaN(Number(v)) || Number(v) < 0) ? "Must be a positive number (in cents)" : "" },
    ],
  },
  {
    title: "Social Media",
    description: "Social media links displayed in the website footer and shared content.",
    icon: "social",
    settings: [
      { key: "social_instagram", label: "Instagram URL", placeholder: "https://instagram.com/fakebyfreetown", type: "text", help: "Full URL to your Instagram profile.", validate: (v: string) => v && !v.startsWith("http") ? "Must be a full URL starting with https://" : "" },
      { key: "social_tiktok", label: "TikTok URL", placeholder: "https://tiktok.com/@fakebyfreetown", type: "text", help: "Full URL to your TikTok profile.", validate: (v: string) => v && !v.startsWith("http") ? "Must be a full URL starting with https://" : "" },
      { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/fakebyfreetown", type: "text", help: "Full URL to your Facebook page.", validate: (v: string) => v && !v.startsWith("http") ? "Must be a full URL starting with https://" : "" },
      { key: "social_twitter", label: "Twitter/X URL", placeholder: "https://x.com/fakebyfreetown", type: "text", help: "Full URL to your X (Twitter) profile.", validate: (v: string) => v && !v.startsWith("http") ? "Must be a full URL starting with https://" : "" },
    ],
  },
  {
    title: "Messaging Channels",
    description: "API credentials for WhatsApp Business and Facebook Messenger integrations.",
    icon: "messaging",
    settings: [
      { key: "whatsapp_api_token", label: "WhatsApp Business API Token", placeholder: "Bearer token", type: "text", help: "From Meta Business Suite > WhatsApp > API Setup. Required for WhatsApp campaigns.", sensitive: true },
      { key: "whatsapp_phone_id", label: "WhatsApp Phone Number ID", placeholder: "1234567890", type: "text", help: "The phone number ID from your WhatsApp Business account." },
      { key: "messenger_page_token", label: "Facebook Messenger Page Token", placeholder: "Page access token", type: "text", help: "From Facebook Developer Console > Your App > Messenger Settings.", sensitive: true },
      { key: "messenger_page_id", label: "Facebook Page ID", placeholder: "1234567890", type: "text", help: "Your Facebook Page ID for Messenger integration." },
    ],
  },
];

export default function AdminSettings() {
  const { data: allSettings, isLoading, refetch } = trpc.admin.settings.list.useQuery();
  const setMut = trpc.admin.settings.set.useMutation({ onSuccess: () => refetch(), onError: (e: any) => toast.error(e.message) });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmSave, setConfirmSave] = useState(false);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  const getValue = (key: string) => {
    if (edits[key] !== undefined) return edits[key];
    const found = allSettings?.find((s: any) => s.key === key);
    return found?.value || "";
  };

  const handleChange = (key: string, value: string, validateFn?: (v: string) => string) => {
    setEdits({ ...edits, [key]: value });
    if (validateFn) {
      const err = validateFn(value);
      setErrors(prev => err ? { ...prev, [key]: err } : (() => { const { [key]: _, ...rest } = prev; return rest; })());
    }
  };

  const validateAll = (): boolean => {
    const errs: Record<string, string> = {};
    for (const group of SETTING_GROUPS) {
      for (const s of group.settings) {
        const val = edits[s.key];
        if (val !== undefined && (s as any).validate) {
          const err = (s as any).validate(val);
          if (err) errs[s.key] = err;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAll = async () => {
    if (!validateAll()) { toast.error("Please fix validation errors before saving"); setConfirmSave(false); return; }
    setSaving(true);
    setConfirmSave(false);
    const keys = Object.keys(edits);
    const saved: string[] = [];
    for (const key of keys) {
      try {
        await setMut.mutateAsync({ key, value: edits[key] });
        saved.push(key);
      } catch {}
    }
    setEdits({});
    setSavedKeys(saved);
    setSaving(false);
    toast.success(`${saved.length} setting(s) saved successfully`);
    setTimeout(() => setSavedKeys([]), 3000);
  };

  const handleReset = () => {
    setEdits({});
    setErrors({});
    toast.info("Changes discarded");
  };

  const hasChanges = Object.keys(edits).length > 0;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure store settings, social links, and messaging channels</p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <>
                <Button variant="outline" onClick={handleReset} disabled={saving}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Discard
                </Button>
                <Button onClick={() => setConfirmSave(true)} disabled={saving || hasErrors} className="bg-red-600 hover:bg-red-700 text-white">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save {Object.keys(edits).length} Change(s)
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Help Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> About Settings</p>
            <p className="mt-1 text-blue-700">
              These settings control your store's core configuration. Changes are saved individually per field.
              Monetary values are in cents (e.g., 15000 = RM150.00). Social media URLs must be full links including https://.
              Sensitive fields like API tokens are stored securely.
            </p>
          </CardContent>
        </Card>

        {hasChanges && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-3 px-4 text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>You have <strong>{Object.keys(edits).length} unsaved change(s)</strong>. Click "Save" to apply or "Discard" to revert.</span>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          SETTING_GROUPS.map((group) => (
            <Card key={group.title} className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4 text-gray-400" /> {group.title}
                </CardTitle>
                <p className="text-sm text-gray-500">{group.description}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                {group.settings.map((s) => {
                  const hasEdit = edits[s.key] !== undefined;
                  const wasSaved = savedKeys.includes(s.key);
                  const hasError = !!errors[s.key];
                  return (
                    <div key={s.key} className="grid grid-cols-3 gap-4 items-start">
                      <div className="pt-2">
                        <label className="text-sm font-medium text-gray-700">
                          {s.label}
                          {(s as any).required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{s.key}</p>
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          {s.type === "textarea" ? (
                            <Textarea
                              value={getValue(s.key)}
                              onChange={(e) => handleChange(s.key, e.target.value, (s as any).validate)}
                              placeholder={s.placeholder}
                              rows={3}
                              className={`text-sm ${hasError ? "border-red-500" : hasEdit ? "border-amber-400" : ""}`}
                            />
                          ) : (
                            <Input
                              value={getValue(s.key)}
                              onChange={(e) => handleChange(s.key, e.target.value, (s as any).validate)}
                              placeholder={s.placeholder}
                              type={(s as any).sensitive ? "password" : "text"}
                              className={`text-sm ${hasError ? "border-red-500" : hasEdit ? "border-amber-400" : ""}`}
                            />
                          )}
                          {wasSaved && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                          )}
                        </div>
                        {hasError ? (
                          <p className="text-xs text-red-500 mt-1">{errors[s.key]}</p>
                        ) : s.help ? (
                          <HelpText>{s.help}</HelpText>
                        ) : null}
                        {hasEdit && !hasError && (
                          <p className="text-xs text-amber-600 mt-1">Modified — save to apply</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Save Confirmation */}
      <AlertDialog open={confirmSave} onOpenChange={setConfirmSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Settings</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to save <strong>{Object.keys(edits).length} setting(s)</strong>:
              <ul className="mt-2 space-y-1 text-sm">
                {Object.keys(edits).map(key => (
                  <li key={key} className="font-mono text-xs">
                    {key}: <span className="text-gray-500">{edits[key] ? (edits[key].length > 40 ? edits[key].slice(0, 40) + "..." : edits[key]) : "(empty)"}</span>
                  </li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAll} className="bg-red-600 hover:bg-red-700 text-white">
              Save All Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
