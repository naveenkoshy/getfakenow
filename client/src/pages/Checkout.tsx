import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { AuthModal } from "@/components/AuthModal";
import { trpc } from "@/lib/trpc";
import {
  ShoppingCart, Search, User, Shield, Truck, RotateCcw, ArrowLeft, Lock, Menu, X
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { items, itemCount, total } = useCart();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [shippingName, setShippingName] = useState("");
  const [shippingEmail, setShippingEmail] = useState(user?.email || "");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");

  const { data: cart, isLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const checkoutMutation = trpc.checkout.createSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to payment...");
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

  const handleCheckout = () => {
    if (!shippingName.trim() || !shippingEmail.trim() || !shippingPhone.trim() || !shippingAddress.trim() || !shippingCity.trim() || !shippingState.trim() || !shippingPostalCode.trim()) {
      toast.error("Please fill in all shipping fields");
      return;
    }
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
        <Lock size={48} className="text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-900">Sign in to checkout</h2>
        <p className="text-gray-500 text-sm">Create an account or sign in to complete your purchase.</p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="bg-red-600 text-white px-10 py-3.5 text-sm font-semibold tracking-wider hover:bg-red-700 transition-all"
        >
          SIGN IN
        </button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-3 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6">
        <ShoppingCart size={48} className="text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <Link href="/shop" className="bg-red-600 text-white px-10 py-3.5 text-sm font-semibold tracking-wider hover:bg-red-700 transition-all">
          SHOP NOW
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-1 hover:opacity-80 transition-opacity">
            <span className="text-xl font-black tracking-wider text-red-600">FAKE</span>
            <span className="text-sm text-gray-500" style={{ fontFamily: "'Dancing Script', cursive" }}>by Freetown</span>
          </Link>
          <div className="flex items-center gap-3">
            <Lock size={14} className="text-green-600" />
            <span className="text-xs font-medium text-gray-500">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          <li><Link href="/" className="hover:text-red-600 transition-colors">Home</Link></li>
          <li>/</li>
          <li><Link href="/cart" className="hover:text-red-600 transition-colors">Cart</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Checkout</li>
        </ol>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Shipping Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded focus:outline-none focus:border-red-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={shippingEmail}
                      onChange={(e) => setShippingEmail(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded focus:outline-none focus:border-red-600 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+60 12-345 6789"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1.5">Street Address *</label>
                  <textarea
                    id="address"
                    placeholder="123 Main Street, Apt 4B"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded focus:outline-none focus:border-red-600 transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1.5">City *</label>
                    <input
                      id="city"
                      type="text"
                      placeholder="Kuala Lumpur"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded focus:outline-none focus:border-red-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1.5">State *</label>
                    <input
                      id="state"
                      type="text"
                      placeholder="Selangor"
                      value={shippingState}
                      onChange={(e) => setShippingState(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded focus:outline-none focus:border-red-600 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postal" className="block text-sm font-semibold text-gray-700 mb-1.5">Postal Code *</label>
                    <input
                      id="postal"
                      type="text"
                      placeholder="50000"
                      value={shippingPostalCode}
                      onChange={(e) => setShippingPostalCode(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 text-sm rounded focus:outline-none focus:border-red-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                    <input
                      id="country"
                      type="text"
                      value="Malaysia"
                      disabled
                      className="w-full bg-gray-100 border-2 border-gray-200 text-gray-500 px-4 py-3 text-sm rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Payment</h2>
              <p className="text-sm text-gray-500">
                You will be redirected to Stripe's secure payment page to complete your purchase.
                All major credit and debit cards are accepted.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Shield size={14} className="text-green-600" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Lock size={14} className="text-green-600" />
                  <span>PCI Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-24 bg-gray-50 rounded-lg p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-20 bg-white rounded overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && ' / '}
                        {item.color && `Color: ${item.color}`}
                      </p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm flex-shrink-0">
                      {formatPrice((item.product?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium text-gray-900">
                    {qualifiesForFreeShipping ? 'FREE' : 'Calculated by Stripe'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-black text-xl text-gray-900">{formatPrice(cart.total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
                className="w-full bg-red-600 text-white py-4 text-sm font-bold tracking-widest hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 rounded disabled:opacity-50"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    PAY WITH STRIPE
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center mt-3">
                Secure payment powered by Stripe. All prices in MYR.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-baseline gap-1 justify-center mb-3">
            <span className="text-lg font-black text-red-500">FAKE</span>
            <span className="text-sm text-gray-500" style={{ fontFamily: "'Dancing Script', cursive" }}>by Freetown</span>
          </div>
          <p className="text-xs text-gray-600">&copy; 2026 Fake by Freetown. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
