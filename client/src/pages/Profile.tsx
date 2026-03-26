import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { ShoppingBag, ArrowLeft, User, MapPin, Bell, Shield, Save } from "lucide-react";

export default function Profile() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"details" | "address" | "preferences" | "security">("details");
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelWhatsapp, setChannelWhatsapp] = useState(false);
  const [channelSms, setChannelSms] = useState(false);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone((user as any).phone || "");
      setAddressStreet((user as any).addressStreet || "");
      setAddressCity((user as any).addressCity || "");
      setAddressState((user as any).addressState || "");
      setAddressZip((user as any).addressZip || "");
      setAddressCountry((user as any).addressCountry || "Malaysia");
      setMarketingConsent((user as any).marketingConsent || false);
      try {
        const channels = JSON.parse((user as any).marketingChannels || "[]");
        setChannelEmail(channels.includes("email"));
        setChannelWhatsapp(channels.includes("whatsapp"));
        setChannelSms(channels.includes("sms"));
      } catch { /* ignore */ }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const handleSaveDetails = async () => {
    setSaving(true);
    await updateProfile.mutateAsync({ name, phone: phone || undefined });
    setSaving(false);
  };

  const handleSaveAddress = async () => {
    setSaving(true);
    await updateProfile.mutateAsync({
      addressStreet: addressStreet || undefined,
      addressCity: addressCity || undefined,
      addressState: addressState || undefined,
      addressZip: addressZip || undefined,
      addressCountry: addressCountry || undefined,
    });
    setSaving(false);
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    const channels: string[] = [];
    if (channelEmail) channels.push("email");
    if (channelWhatsapp) channels.push("whatsapp");
    if (channelSms) channels.push("sms");
    await updateProfile.mutateAsync({
      marketingConsent,
      marketingChannels: JSON.stringify(channels),
    });
    setSaving(false);
  };

  const tabs = [
    { id: "details" as const, label: "Personal Details", icon: User },
    { id: "address" as const, label: "Shipping Address", icon: MapPin },
    { id: "preferences" as const, label: "Communication", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="text-2xl font-black tracking-wider text-red-600 cursor-pointer">FAKE</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="gap-2">
                <ShoppingBag className="h-4 w-4" /> My Orders
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Back to store
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="md:w-56 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Personal Details */}
            {activeTab === "details" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Personal Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input value={user.email} disabled className="h-11 bg-gray-50" />
                    <p className="text-xs text-gray-400">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60 12 345 6789" className="h-11" />
                  </div>
                </div>

                <Button onClick={handleSaveDetails} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}

            {/* Shipping Address */}
            {activeTab === "address" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                  <p className="text-sm text-gray-500 mt-1">Default address for deliveries</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Street Address</Label>
                    <Input value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} placeholder="123 Jalan Example" className="h-11" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">City</Label>
                      <Input value={addressCity} onChange={(e) => setAddressCity(e.target.value)} placeholder="Kuala Lumpur" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">State</Label>
                      <Input value={addressState} onChange={(e) => setAddressState(e.target.value)} placeholder="Selangor" className="h-11" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Postal Code</Label>
                      <Input value={addressZip} onChange={(e) => setAddressZip(e.target.value)} placeholder="50000" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Country</Label>
                      <Input value={addressCountry} onChange={(e) => setAddressCountry(e.target.value)} placeholder="Malaysia" className="h-11" />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveAddress} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Address"}
                </Button>
              </div>
            )}

            {/* Communication Preferences */}
            {activeTab === "preferences" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Communication Preferences</h2>
                  <p className="text-sm text-gray-500 mt-1">Control how we reach you</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="pref-consent"
                      checked={marketingConsent}
                      onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                      className="mt-0.5"
                    />
                    <div>
                      <Label htmlFor="pref-consent" className="text-sm font-medium cursor-pointer">
                        Receive marketing communications
                      </Label>
                      <p className="text-xs text-gray-400 mt-1">
                        New drops, exclusive deals, and size-inclusive style inspiration
                      </p>
                    </div>
                  </div>
                </div>

                {marketingConsent && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Preferred channels:</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Checkbox id="pref-email" checked={channelEmail} onCheckedChange={(c) => setChannelEmail(c as boolean)} />
                        <Label htmlFor="pref-email" className="text-sm cursor-pointer">Email</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="pref-whatsapp" checked={channelWhatsapp} onCheckedChange={(c) => setChannelWhatsapp(c as boolean)} />
                        <Label htmlFor="pref-whatsapp" className="text-sm cursor-pointer">WhatsApp</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="pref-sms" checked={channelSms} onCheckedChange={(c) => setChannelSms(c as boolean)} />
                        <Label htmlFor="pref-sms" className="text-sm cursor-pointer">SMS</Label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <p className="text-sm text-red-800 font-medium">Your data, your rules.</p>
                  <p className="text-xs text-red-600 mt-1">
                    We never share your information with third parties. You can update these preferences anytime.
                  </p>
                </div>

                <Button onClick={handleSavePreferences} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Security</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your account security</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Login Method</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(user as any).authProvider === "google" && "Signed in with Google"}
                        {(user as any).authProvider === "facebook" && "Signed in with Facebook"}
                        {(user as any).authProvider === "manus" && "Signed in with Manus"}
                        {(user as any).authProvider === "email" && "Signed in with email/password"}
                        {!(user as any).authProvider && "Signed in with Manus OAuth"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Account Created</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date((user as any).createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
