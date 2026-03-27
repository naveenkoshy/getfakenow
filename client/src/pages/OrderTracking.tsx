import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import {
  Package, Truck, CheckCircle2, Clock, MapPin, ArrowLeft,
  ShoppingCart, Search, User, Menu, X, Heart, Copy, ExternalLink,
  PackageCheck, Warehouse, CircleDot, Sparkles, PartyPopper
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

// ── Status timeline config ──
const STATUS_STEPS = [
  {
    key: 'pending',
    label: 'Order Confirmed',
    icon: CircleDot,
    cheekyMessage: "We got your order! Our team is doing a little happy dance right now. 💃",
    description: "Your order has been received and confirmed.",
  },
  {
    key: 'processing',
    label: 'Packing Your Drip',
    icon: Warehouse,
    cheekyMessage: "Your items are being carefully folded by someone who actually cares. Revolutionary, we know.",
    description: "We're preparing your items with love (and bubble wrap).",
  },
  {
    key: 'shipped',
    label: 'On Its Way',
    icon: Truck,
    cheekyMessage: "Your package just left the building. It's more excited than you are. Maybe.",
    description: "Your order is en route to you.",
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: PackageCheck,
    cheekyMessage: "It's arrived! Go ahead, do the unboxing thing. We won't judge if you film it. 📦✨",
    description: "Your order has been delivered.",
  },
];

const CANCELLED_STEP = {
  key: 'cancelled',
  label: 'Cancelled',
  icon: X,
  cheekyMessage: "This order was cancelled. We're not crying, you're crying. 😢",
  description: "This order has been cancelled.",
};

const RETURN_STEPS = {
  return_requested: {
    key: 'return_requested',
    label: 'Return Requested',
    icon: Package,
    cheekyMessage: "We got your return request. No hard feelings. Okay, maybe a little. 💔",
    description: "Your return request is being reviewed.",
  },
  returned: {
    key: 'returned',
    label: 'Returned',
    icon: CheckCircle2,
    cheekyMessage: "Return processed. Your refund is on its way. See you again soon? 🥺",
    description: "Your return has been processed.",
  },
};

function getStatusIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : -1;
}

function formatDate(dateStr: string | number | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: order, isLoading, error } = trpc.tracking.getByOrderNumber.useQuery(
    { orderNumber: orderId! },
    { enabled: !!orderId && isAuthenticated }
  );

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';
  const isReturning = order?.status === 'return_requested' || order?.status === 'returned';

  // Determine which timeline steps to show
  const timelineSteps = useMemo(() => {
    if (!order) return STATUS_STEPS;
    if (isCancelled) {
      const completedSteps = STATUS_STEPS.slice(0, Math.max(currentStatusIndex, 0) + 1);
      return [...completedSteps, CANCELLED_STEP];
    }
    if (isReturning) {
      const base = [...STATUS_STEPS];
      if (order.status === 'return_requested') base.push(RETURN_STEPS.return_requested);
      if (order.status === 'returned') {
        base.push(RETURN_STEPS.return_requested);
        base.push(RETURN_STEPS.returned);
      }
      return base;
    }
    return STATUS_STEPS;
  }, [order, isCancelled, isReturning, currentStatusIndex]);

  const activeStepIndex = useMemo(() => {
    if (!order) return -1;
    if (isCancelled) return timelineSteps.length - 1;
    if (isReturning) return timelineSteps.length - 1;
    return currentStatusIndex;
  }, [order, isCancelled, isReturning, timelineSteps, currentStatusIndex]);

  const copyTrackingNumber = () => {
    if (order?.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      toast.success("Tracking number copied! Now go stalk your package. 📋");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-1 hover:opacity-80 transition-opacity">
            <span className="text-xl font-black tracking-wider text-red-600">FAKE</span>
            <span className="text-sm text-gray-500" style={{ fontFamily: "'Dancing Script', cursive" }}>by Freetown</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            <Link href="/shop" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">SHOP</Link>
            <Link href="/about" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">ABOUT</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/wishlist" className="relative">
              <Heart size={20} className="text-gray-700 hover:text-red-600 transition-colors" />
            </Link>
            <Link href="/cart" className="relative">
              <ShoppingCart size={20} className="text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <Link href="/account">
                <User size={20} className="text-gray-700 hover:text-red-600 transition-colors cursor-pointer" />
              </Link>
            ) : (
              <button onClick={() => setAuthModalOpen(true)}>
                <User size={20} className="text-gray-700 hover:text-red-600 transition-colors cursor-pointer" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors mb-8">
          <ArrowLeft size={14} />
          Back to Orders
        </Link>

        {!isAuthenticated ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold mb-2">Sign in to track your order</h2>
            <p className="text-sm text-gray-500 mb-6">We need to know who you are before we spill the tea on your package.</p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-red-600 text-white px-8 py-3 text-sm font-bold tracking-wider hover:bg-red-700 transition-colors rounded-lg"
            >
              SIGN IN
            </button>
          </div>
        ) : isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-64 bg-gray-100 rounded-xl" />
          </div>
        ) : error || !order ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold mb-2">Order not found</h2>
            <p className="text-sm text-gray-500 mb-6">
              Either this order doesn't exist, or it's not yours. We don't judge, but we also don't share.
            </p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 text-sm font-bold tracking-wider hover:bg-red-700 transition-colors rounded-lg"
            >
              View Your Orders
            </Link>
          </div>
        ) : (
          <div>
            {/* Order Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <Package size={24} className="text-red-600" />
                    ORDER #{order.id}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  isCancelled ? 'bg-red-50 text-red-600' :
                  order.status === 'delivered' ? 'bg-green-50 text-green-600' :
                  isReturning ? 'bg-orange-50 text-orange-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {isCancelled ? <X size={14} /> :
                   order.status === 'delivered' ? <CheckCircle2 size={14} /> :
                   isReturning ? <Package size={14} /> :
                   <Clock size={14} />}
                  {order.status.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>
            </div>

            {/* ── Visual Timeline ── */}
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 mb-8">
              <h2 className="text-sm font-bold text-gray-700 tracking-wide mb-8">ORDER TIMELINE</h2>

              <div className="relative">
                {timelineSteps.map((step, index) => {
                  const isActive = index <= activeStepIndex;
                  const isCurrent = index === activeStepIndex;
                  const StepIcon = step.icon;
                  const isLast = index === timelineSteps.length - 1;
                  const isCancelledStep = step.key === 'cancelled';
                  const isReturnStep = step.key === 'return_requested' || step.key === 'returned';

                  return (
                    <div key={step.key} className="flex gap-4 sm:gap-6 relative">
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-[19px] sm:left-[23px] top-10 bottom-0 w-0.5">
                          <div className={`h-full ${isActive && index < activeStepIndex ? (isCancelledStep ? 'bg-red-300' : 'bg-red-400') : 'bg-gray-200'}`} />
                        </div>
                      )}

                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                        isCurrent && isCancelledStep ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' :
                        isCurrent && isReturnStep ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' :
                        isCurrent ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse' :
                        isActive ? (isCancelledStep ? 'bg-red-100 text-red-600' : 'bg-red-100 text-red-600') :
                        'bg-gray-100 text-gray-300'
                      }`}>
                        <StepIcon size={18} />
                      </div>

                      {/* Content */}
                      <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                        <p className={`font-bold text-sm ${
                          isCurrent ? (isCancelledStep ? 'text-red-600' : isReturnStep ? 'text-orange-600' : 'text-gray-900') :
                          isActive ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <div className="mt-1">
                            <p className="text-sm text-gray-600 italic">{step.cheekyMessage}</p>
                            {isCurrent && order.status === 'delivered' && (
                              <div className="mt-2 flex items-center gap-2">
                                <PartyPopper size={14} className="text-yellow-500" />
                                <span className="text-xs font-bold text-yellow-600">Enjoy your new drip!</span>
                              </div>
                            )}
                          </div>
                        )}
                        {isActive && !isCurrent && (
                          <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Tracking Info ── */}
            {order.trackingNumber && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
                <h2 className="text-sm font-bold text-gray-700 tracking-wide mb-4 flex items-center gap-2">
                  <Truck size={16} className="text-red-600" />
                  TRACKING INFORMATION
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Tracking Number</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded">
                        {order.trackingNumber}
                      </code>
                      <button
                        onClick={copyTrackingNumber}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Copy tracking number"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-xs font-bold tracking-wider hover:bg-red-600 transition-colors rounded-lg"
                    >
                      TRACK PACKAGE
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-3 italic">
                  Obsessively refreshing the tracking page won't make it arrive faster. But we understand.
                </p>
              </div>
            )}

            {/* ── Shipping Address ── */}
            {order.shippingName && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
                <h2 className="text-sm font-bold text-gray-700 tracking-wide mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-red-600" />
                  SHIPPING TO
                </h2>
                <div className="text-sm text-gray-600 leading-relaxed">
                  <p className="font-semibold text-gray-900">{order.shippingName}</p>
                  <p>{order.shippingAddress}</p>
                  <p>{order.shippingCity}, {order.shippingState} {order.shippingPostalCode}</p>
                  <p>{order.shippingCountry}</p>
                  {order.shippingPhone && <p className="mt-1 text-gray-400">{order.shippingPhone}</p>}
                </div>
              </div>
            )}

            {/* ── Order Items ── */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <h2 className="text-sm font-bold text-gray-700 tracking-wide mb-4">ORDER ITEMS</h2>
              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={20} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-400">
                        {item.color && `${item.color}`}{item.size && ` · ${item.size}`} · Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      RM {((item.productPrice * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">RM {((order.totalAmount - (order.shippingCost || 0)) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className={`font-medium ${!order.shippingCost || order.shippingCost === 0 ? 'text-green-600' : ''}`}>
                    {!order.shippingCost || order.shippingCost === 0 ? 'FREE' : `RM ${(order.shippingCost / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
                  <span>Total</span>
                  <span>RM {(order.totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* ── Need Help? ── */}
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <Sparkles size={20} className="mx-auto text-yellow-500 mb-2" />
              <p className="text-sm font-bold text-gray-700 mb-1">Need help with this order?</p>
              <p className="text-xs text-gray-500 mb-4">
                We're here for you. Unlike that friend who said they'd help you move.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 text-xs font-bold tracking-wider hover:border-red-300 hover:text-red-600 transition-colors rounded-lg"
                >
                  VIEW ALL ORDERS
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-2.5 text-xs font-bold tracking-wider hover:bg-red-700 transition-colors rounded-lg"
                >
                  KEEP SHOPPING
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
