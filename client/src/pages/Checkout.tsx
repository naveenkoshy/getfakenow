import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { AuthModal } from "@/components/AuthModal";
import { Logo } from "@/components/Logo";
import { trpc } from "@/lib/trpc";
import {
  ShoppingCart, Shield, Truck, Lock, ArrowLeft, ArrowRight,
  CheckCircle, MapPin, CreditCard, Gift, Zap, Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

// ── Step indicator labels ──
const STEPS = [
  { id: 1, label: "Shipping", icon: MapPin, quip: "Where's the drip going?" },
  { id: 2, label: "Review", icon: ShoppingCart, quip: "Last look before liftoff" },
  { id: 3, label: "Payment", icon: CreditCard, quip: "Seal the deal" },
];

// ── Cheeky encouragement messages ──
const CHECKOUT_QUIPS = [
  "You're doing amazing, sweetie.",
  "Your future self is already thanking you.",
  "This is the best decision you've made today.",
  "Fashion waits for no one. Let's go.",
  "Almost there. The finish line smells like fresh cotton.",
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { items, itemCount, total } = useCart();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [shippingName, setShippingName] = useState("");
  const [shippingEmail, setShippingEmail] = useState(user?.email || "");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");

  // Pre-fill email when user loads
  useEffect(() => {
    if (user?.email && !shippingEmail) setShippingEmail(user.email);
  }, [user?.email]);

  // Random encouragement
  const [quip] = useState(() => CHECKOUT_QUIPS[Math.floor(Math.random() * CHECKOUT_QUIPS.length)]);

  const { data: cart, isLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const checkoutMutation = trpc.checkout.createSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("🚀 Redirecting to secure payment...", {
          description: "A new tab will open for Stripe checkout.",
        });
        window.open(data.url, "_blank");
        setTimeout(() => {
          setLocation(`/order-confirmation?session_id=pending&order_number=${data.orderNumber}`);
        }, 1000);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

  const freeShippingThreshold = 7500;
  const qualifiesForFreeShipping = total >= freeShippingThreshold;
  const shippingCost = qualifiesForFreeShipping ? 0 : 800;
  const estimatedTotal = (cart?.total || total) + shippingCost;

  const validateShipping = () => {
    if (!shippingName.trim()) { toast.error("We need your name. Even a fake one works. 😉"); return false; }
    if (!shippingEmail.trim()) { toast.error("Email required — we promise not to spam. Much."); return false; }
    if (!shippingPhone.trim()) { toast.error("Phone number, please. In case the courier needs directions."); return false; }
    if (!shippingAddress.trim()) { toast.error("Address? We can't teleport your order. Yet."); return false; }
    if (!shippingCity.trim()) { toast.error("Which city? We need to know where the magic happens."); return false; }
    if (!shippingState.trim()) { toast.error("State, please. We're thorough like that."); return false; }
    if (!shippingPostalCode.trim()) { toast.error("Postal code missing. The courier's GPS isn't that good."); return false; }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateShipping()) return;
      setCurrentStep(2);
      toast.success("✅ Shipping details locked in!", { description: "Looking good. Let's review." });
    } else if (currentStep === 2) {
      setCurrentStep(3);
      handleCheckout();
    }
  };

  const handleCheckout = () => {
    checkoutMutation.mutate({
      shippingName,
      shippingEmail,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry: "Malaysia",
    });
  };

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6">
        <div className="relative">
          <Lock size={56} className="text-gray-200" />
          <Sparkles size={20} className="absolute -top-2 -right-2 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Hold up — who are you?</h2>
        <p className="text-gray-500 text-sm text-center max-w-md">
          Sign in to checkout. It takes 10 seconds. Your cart isn't going anywhere.
          <br /><span className="text-gray-400 italic text-xs">(We're patient like that.)</span>
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="bg-red-600 text-white px-10 py-3.5 text-sm font-bold tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center gap-2"
        >
          <Zap size={16} />
          SIGN IN & CHECKOUT
        </button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="animate-spin h-8 w-8 border-3 border-red-600 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-400 italic">Preparing your checkout experience...</p>
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6">
        <ShoppingCart size={56} className="text-gray-200" />
        <h2 className="text-2xl font-black text-gray-900">Nothing to checkout</h2>
        <p className="text-gray-500 text-sm">Your cart's empty. Let's fix that.</p>
        <Link href="/shop" className="bg-red-600 text-white px-10 py-3.5 text-sm font-bold tracking-widest hover:bg-red-700 transition-all">
          BROWSE THE COLLECTION
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Email Verification Banner ── */}
      <EmailVerificationBanner variant="sticky" />

      {/* ── Minimal Checkout Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cart" className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-xs">
              <ArrowLeft size={14} />
              Back to cart
            </Link>
          </div>
          <Logo size="md" variant="dark" linkTo="/" />
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-green-600" />
            <span className="text-xs font-medium text-gray-500">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* ── Step Indicator ── */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                        : isActive
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-110'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={18} /> : <StepIcon size={18} />}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-semibold tracking-wide ${
                    isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-16 md:w-24 h-0.5 mx-2 mb-5 transition-all duration-500 ${
                    currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-2 italic">
          {STEPS.find(s => s.id === currentStep)?.quip}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
          {/* ── Left: Form Area ── */}
          <div className="lg:col-span-3">
            {/* Step 1: Shipping */}
            {currentStep === 1 && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin size={20} className="text-red-600" />
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Where should we send your haul?</h2>
                    <p className="text-xs text-gray-400 italic">Don't worry, we won't show up unannounced.</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide uppercase">Full Name</label>
                      <input
                        id="name" type="text" placeholder="Your name (or alias, we don't judge)"
                        value={shippingName} onChange={(e) => setShippingName(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide uppercase">Email</label>
                      <input
                        id="email" type="email" placeholder="you@example.com"
                        value={shippingEmail} onChange={(e) => setShippingEmail(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide uppercase">Phone Number</label>
                    <input
                      id="phone" type="tel" placeholder="+60 12-345 6789"
                      value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">For delivery updates only. No sales calls, pinky promise.</p>
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide uppercase">Street Address</label>
                    <textarea
                      id="address" placeholder="123 Main Street, Apt 4B"
                      value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide uppercase">City</label>
                      <input
                        id="city" type="text" placeholder="Kuala Lumpur"
                        value={shippingCity} onChange={(e) => setShippingCity(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide uppercase">State</label>
                      <input
                        id="state" type="text" placeholder="Selangor"
                        value={shippingState} onChange={(e) => setShippingState(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="postal" className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide uppercase">Postal Code</label>
                      <input
                        id="postal" type="text" placeholder="50000"
                        value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide uppercase">Country</label>
                    <input
                      type="text" value="Malaysia 🇲🇾" disabled
                      className="w-full bg-gray-100 border-2 border-gray-200 text-gray-500 px-4 py-3 text-sm rounded-lg"
                    />
                  </div>
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full mt-6 bg-red-600 text-white py-4 text-sm font-bold tracking-widest hover:bg-red-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 rounded-lg group"
                >
                  CONTINUE TO REVIEW
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* Step 2: Review */}
            {currentStep === 2 && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingCart size={20} className="text-red-600" />
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Final check. Everything look right?</h2>
                    <p className="text-xs text-gray-400 italic">{quip}</p>
                  </div>
                </div>

                {/* Shipping Summary */}
                <div className="bg-green-50 rounded-xl p-5 border border-green-100 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <h3 className="text-sm font-bold text-green-800">Shipping to</h3>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-green-600 hover:text-green-700 font-medium underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-green-900 space-y-0.5">
                    <p className="font-semibold">{shippingName}</p>
                    <p className="text-green-700">{shippingAddress}</p>
                    <p className="text-green-700">{shippingCity}, {shippingState} {shippingPostalCode}</p>
                    <p className="text-green-700">Malaysia</p>
                    <p className="text-green-600 text-xs mt-1">{shippingEmail} · {shippingPhone}</p>
                  </div>
                </div>

                {/* Items Review */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">Your Items ({itemCount})</h3>
                  <div className="space-y-4">
                    {cart.items.map((item: any) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-14 h-18 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                          {item.product?.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover object-top" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">—</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.product?.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.size && (['dress-slacks', 'sweat-pants'].includes(item.product?.slug) ? `Waist: ${item.size}"` : `Size: ${item.size}`)}
                            {item.size && item.color && ' · '}
                            {item.color && `Color: ${item.color}`}
                            {' · '}Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold text-gray-900 text-sm flex-shrink-0">
                          {formatPrice((item.product?.price || 0) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 text-sm font-bold tracking-widest hover:bg-gray-200 transition-all rounded-lg flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    BACK
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={checkoutMutation.isPending}
                    className="flex-[2] bg-red-600 text-white py-4 text-sm font-bold tracking-widest hover:bg-red-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 rounded-lg group disabled:opacity-50"
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        PAY NOW — {formatPrice(estimatedTotal)}
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment (redirect state) */}
            {currentStep === 3 && (
              <div className="animate-in fade-in duration-300 text-center py-12">
                <div className="animate-spin h-10 w-10 border-3 border-red-600 border-t-transparent rounded-full mx-auto mb-6" />
                <h2 className="text-xl font-black text-gray-900 mb-2">Opening secure payment...</h2>
                <p className="text-sm text-gray-500">
                  A new tab is opening for Stripe checkout.
                  <br /><span className="text-xs text-gray-400 italic">If it doesn't open, check your popup blocker.</span>
                </p>
              </div>
            )}
          </div>

          {/* ── Right: Order Summary Sidebar ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h2 className="text-lg font-black text-gray-900 mb-1">Order Summary</h2>
                <p className="text-[10px] text-gray-400 mb-5 italic">The moment of truth.</p>

                {/* Compact item list */}
                <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
                  {cart.items.map((item: any) => (
                    <div key={item.id} className="flex gap-2.5 items-center">
                      <div className="w-10 h-12 bg-white rounded overflow-hidden flex-shrink-0 border border-gray-100">
                        {item.product?.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full bg-gray-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.product?.name}</p>
                        <p className="text-[10px] text-gray-400">x{item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatPrice(cart.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    {qualifiesForFreeShipping ? (
                      <span className="font-bold text-green-600 flex items-center gap-1">
                        <Gift size={12} /> FREE
                      </span>
                    ) : (
                      <span className="font-medium text-gray-900">RM 8.00</span>
                    )}
                  </div>
                  {qualifiesForFreeShipping && (
                    <p className="text-[10px] text-green-600 text-right italic">You saved RM 8 — smart move 🎉</p>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-end">
                    <span className="font-bold text-gray-900">Total</span>
                    <div className="text-right">
                      <span className="font-black text-2xl text-gray-900">{formatPrice(estimatedTotal)}</span>
                      <p className="text-[10px] text-gray-400">All prices in MYR</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                  <Shield size={16} className="text-green-600 mx-auto mb-1" />
                  <p className="text-[9px] font-semibold text-gray-600">SSL Encrypted</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                  <Lock size={16} className="text-green-600 mx-auto mb-1" />
                  <p className="text-[9px] font-semibold text-gray-600">PCI Compliant</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                  <Truck size={16} className="text-green-600 mx-auto mb-1" />
                  <p className="text-[9px] font-semibold text-gray-600">Tracked Delivery</p>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
                Secure payment powered by Stripe.
                <br />We never see or store your card details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Minimal Footer ── */}
      <footer className="bg-gray-950 text-gray-400 pt-10 pb-6 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Logo size="sm" variant="light" linkTo="/" />
          <p className="text-xs text-gray-600 mt-3">&copy; 2026 Fake by Freetown. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
