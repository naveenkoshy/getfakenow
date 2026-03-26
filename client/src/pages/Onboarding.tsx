import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { User, MapPin, Bell, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = [
  { id: 1, title: "Your Details", icon: User },
  { id: 2, title: "Shipping Address", icon: MapPin },
  { id: 3, title: "Stay Connected", icon: Bell },
];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [addressCountry, setAddressCountry] = useState("Malaysia");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelWhatsapp, setChannelWhatsapp] = useState(false);
  const [channelSms, setChannelSms] = useState(false);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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

  const handleNext = async () => {
    if (step === 1) {
      if (!name.trim()) {
        toast({ title: "Name required", description: "Please enter your name", variant: "destructive" });
        return;
      }
      setSaving(true);
      await updateProfile.mutateAsync({ name, phone: phone || undefined });
      setSaving(false);
      setStep(2);
    } else if (step === 2) {
      setSaving(true);
      await updateProfile.mutateAsync({
        addressStreet: addressStreet || undefined,
        addressCity: addressCity || undefined,
        addressState: addressState || undefined,
        addressZip: addressZip || undefined,
        addressCountry: addressCountry || undefined,
      });
      setSaving(false);
      setStep(3);
    } else if (step === 3) {
      setSaving(true);
      const channels: string[] = [];
      if (channelEmail) channels.push("email");
      if (channelWhatsapp) channels.push("whatsapp");
      if (channelSms) channels.push("sms");

      await updateProfile.mutateAsync({
        marketingConsent,
        marketingChannels: JSON.stringify(channels),
        profileCompleted: true,
      });
      setSaving(false);
      toast({ title: "Welcome to Fake by Freetown!", description: "Your profile is all set." });
      navigate("/");
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    await updateProfile.mutateAsync({ profileCompleted: true });
    setSaving(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white py-6">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold tracking-wider">FAKE</h1>
          <p className="text-red-100 text-xs tracking-widest mt-1">BY FREETOWN</p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-lg mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                step > s.id ? "bg-red-600 border-red-600 text-white" :
                step === s.id ? "border-red-600 text-red-600 bg-white" :
                "border-gray-300 text-gray-300 bg-white"
              }`}>
                {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 sm:w-24 h-0.5 mx-2 ${step > s.id ? "bg-red-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Tell us about yourself</h2>
                <p className="text-sm text-gray-500 mt-1">So we can personalize your experience</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-name" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="ob-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="ob-email"
                  value={user.email}
                  disabled
                  className="h-11 bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="ob-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+60 12 345 6789"
                  className="h-11"
                />
                <p className="text-xs text-gray-400">For order updates and delivery notifications</p>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                <p className="text-sm text-gray-500 mt-1">Where should we send your orders?</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-street" className="text-sm font-medium">Street Address</Label>
                <Input
                  id="ob-street"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  placeholder="123 Jalan Example"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ob-city" className="text-sm font-medium">City</Label>
                  <Input
                    id="ob-city"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="Kuala Lumpur"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-state" className="text-sm font-medium">State</Label>
                  <Input
                    id="ob-state"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    placeholder="Selangor"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ob-zip" className="text-sm font-medium">Postal Code</Label>
                  <Input
                    id="ob-zip"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                    placeholder="50000"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-country" className="text-sm font-medium">Country</Label>
                  <Input
                    id="ob-country"
                    value={addressCountry}
                    onChange={(e) => setAddressCountry(e.target.value)}
                    placeholder="Malaysia"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Marketing Consent */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Stay Connected</h2>
                <p className="text-sm text-gray-500 mt-1">Choose how you'd like to hear from us</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="ob-consent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="ob-consent" className="text-sm font-medium cursor-pointer">
                      I'd like to receive updates from Fake by Freetown
                    </Label>
                    <p className="text-xs text-gray-400 mt-1">
                      Get early access to new drops, exclusive deals, and size-inclusive style inspiration. Unsubscribe anytime.
                    </p>
                  </div>
                </div>
              </div>

              {marketingConsent && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Preferred channels:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="ch-email"
                        checked={channelEmail}
                        onCheckedChange={(checked) => setChannelEmail(checked as boolean)}
                      />
                      <Label htmlFor="ch-email" className="text-sm cursor-pointer">Email</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="ch-whatsapp"
                        checked={channelWhatsapp}
                        onCheckedChange={(checked) => setChannelWhatsapp(checked as boolean)}
                      />
                      <Label htmlFor="ch-whatsapp" className="text-sm cursor-pointer">WhatsApp</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="ch-sms"
                        checked={channelSms}
                        onCheckedChange={(checked) => setChannelSms(checked as boolean)}
                      />
                      <Label htmlFor="ch-sms" className="text-sm cursor-pointer">SMS</Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-sm text-red-800 font-medium">Your data, your rules.</p>
                <p className="text-xs text-red-600 mt-1">
                  We never share your information with third parties. You can update your preferences anytime from your account settings.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div>
              {step > 1 ? (
                <Button
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  disabled={saving}
                  className="gap-1 text-gray-500"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={saving}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Skip for now
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white gap-1 px-6"
            >
              {saving ? "Saving..." : step === 3 ? "Complete" : "Continue"}
              {!saving && step < 3 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Skip link */}
        {step > 1 && (
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              disabled={saving}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Skip and complete later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
