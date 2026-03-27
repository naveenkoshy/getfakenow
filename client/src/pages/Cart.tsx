import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { AuthModal } from "@/components/AuthModal";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  ShoppingCart, Minus, Plus, Trash2, ArrowRight, ArrowLeft,
  Truck, Shield, RotateCcw, Sparkles, Flame, Gift, Zap, PartyPopper,
  Search, User, Menu, X, Tag, Check, AlertCircle, Loader2
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";

// ── Cheeky milestone messages for the free shipping progress bar ──
const MILESTONES = [
  { pct: 0, msg: "Your cart's looking lonely. Let's fix that.", icon: "😶" },
  { pct: 15, msg: "Baby steps. You're barely faking it.", icon: "🐣" },
  { pct: 30, msg: "Getting warmer. Your wardrobe can feel it.", icon: "🔥" },
  { pct: 50, msg: "Halfway to free shipping! Keep going, legend.", icon: "⚡" },
  { pct: 70, msg: "So close you can almost taste the free delivery.", icon: "🏃" },
  { pct: 85, msg: "One more item and shipping's on us. Do it.", icon: "🎯" },
  { pct: 100, msg: "FREE SHIPPING UNLOCKED. You absolute unit.", icon: "🎉" },
];

function getMilestone(pct: number) {
  let best = MILESTONES[0];
  for (const m of MILESTONES) {
    if (pct >= m.pct) best = m;
  }
  return best;
}

// ── Cheeky quantity messages ──
function getQuantityQuip(count: number): string {
  if (count === 1) return "Just one? Bold minimalist move.";
  if (count === 2) return "A duo. One to wear, one to flex.";
  if (count === 3) return "Three's a vibe. We respect it.";
  if (count <= 5) return "Now we're talking. Wardrobe overhaul incoming.";
  if (count <= 10) return "You're not shopping, you're investing.";
  return "At this point, you're basically a wholesaler. Legend.";
}

export default function Cart() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { items, itemCount, total, updateQuantity, removeItem, isLoading: cartLoading } = useCart();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  // Fetch recommended products for upsell
  const firstCategoryProduct = items[0]?.productId;
  const { data: relatedProducts } = trpc.products.getRelated.useQuery(
    { productId: firstCategoryProduct || 0, limit: 4 },
    { enabled: !!firstCategoryProduct && items.length > 0 }
  );

  // Filter out products already in cart
  const cartProductIds = useMemo(() => new Set(items.map(i => i.productId)), [items]);
  const upsellProducts = useMemo(() => {
    if (!relatedProducts) return [];
    return relatedProducts.filter(p => !cartProductIds.has(p.id)).slice(0, 3);
  }, [relatedProducts, cartProductIds]);

  // ── Promo code state ──
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{
    valid: boolean;
    discount: number;
    type: string;
    code: string;
    description: string;
    promotionId: number;
    message: string;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoInputFocused, setPromoInputFocused] = useState(false);

  const utils = trpc.useUtils();

  const handleApplyPromo = useCallback(async () => {
    if (!promoCode.trim()) {
      setPromoError("Type something first, genius. 😏");
      return;
    }
    setPromoLoading(true);
    setPromoError('');
    setPromoApplied(null);
    try {
      const result = await utils.promo.validate.fetch({ code: promoCode.trim(), orderTotal: total });
      if (result.valid) {
        setPromoApplied(result as any);
        setPromoError('');
      } else {
        setPromoError(result.message || "Invalid code");
        setPromoApplied(null);
      }
    } catch (err: any) {
      setPromoError(err?.message || "Something went wrong. Try again?");
      setPromoApplied(null);
    } finally {
      setPromoLoading(false);
    }
  }, [promoCode, total, utils]);

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    setPromoError('');
  };

  const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

  const freeShippingThreshold = 7500; // RM75 in cents
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  const shippingProgress = Math.min(100, (total / freeShippingThreshold) * 100);
  const milestone = getMilestone(shippingProgress);
  const qualifiesForFreeShipping = total >= freeShippingThreshold;

  // Shipping cost display
  const shippingCost = (qualifiesForFreeShipping || promoApplied?.type === 'free_shipping') ? 0 : 800;
  const promoDiscount = promoApplied?.discount || 0;
  const estimatedTotal = Math.max(0, total + shippingCost - promoDiscount);

  // Animate removal
  const handleRemove = (productId: number) => {
    setRemovingId(productId);
    setTimeout(() => {
      removeItem(productId);
      setRemovingId(null);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Announcement Bar ── */}
      {!qualifiesForFreeShipping && items.length > 0 && (
        <div className="bg-gray-950 text-white text-center py-2 px-4">
          <p className="text-xs font-medium tracking-wide">
            <Truck size={12} className="inline mr-1.5 -mt-0.5" />
            You're <span className="text-red-400 font-bold">{formatPrice(remainingForFreeShipping)}</span> away from FREE shipping.
            {" "}Don't let delivery fees win.
          </p>
        </div>
      )}
      {qualifiesForFreeShipping && items.length > 0 && (
        <div className="bg-green-600 text-white text-center py-2 px-4">
          <p className="text-xs font-bold tracking-wide">
            🎉 FREE SHIPPING UNLOCKED — You've earned it, you beautiful human.
          </p>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" variant="dark" linkTo="/" />
          <nav className="hidden md:flex items-center gap-10">
            <Link href="/shop" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">SHOP</Link>
            <Link href="/shop?category=casual" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">CASUAL</Link>
            <Link href="/shop?category=women" className="text-xs font-semibold tracking-widest text-red-600 font-bold tracking-widest">NEW</Link>
            <Link href="/shop?category=professional" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">BUSINESS</Link>
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/shop" className="text-gray-500 hover:text-red-600 transition-colors" aria-label="Search">
              <Search size={18} strokeWidth={2} />
            </Link>
            <Link href="/cart" className="relative text-red-600 transition-colors">
              <ShoppingCart size={18} strokeWidth={2} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{itemCount}</span>
              )}
            </Link>
            {isAuthenticated ? (
              <Link href="/account" className="text-gray-500 hover:text-red-600 transition-colors hidden sm:block">
                <User size={18} strokeWidth={2} />
              </Link>
            ) : (
              <button onClick={() => setAuthModalOpen(true)} className="text-gray-500 hover:text-red-600 transition-colors hidden sm:block">
                <User size={18} strokeWidth={2} />
              </button>
            )}
            <button className="md:hidden text-gray-500" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
            <Link href="/shop" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link href="/shop?category=casual" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Casual</Link>
            <Link href="/shop?category=professional" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Business</Link>
          </div>
        )}
      </header>

      {/* ── Breadcrumb ── */}
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          <li><Link href="/" className="hover:text-red-600 transition-colors">Home</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Your Cart</li>
        </ol>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* ── Page Title with Quip ── */}
        <div className="mb-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
            Your Cart
          </h1>
          {items.length > 0 && (
            <p className="text-sm text-gray-500 mt-1 italic">
              {getQuantityQuip(itemCount)} <span className="text-gray-400">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            </p>
          )}
        </div>

        {cartLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin h-8 w-8 border-3 border-red-600 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400 italic">Loading your impeccable taste...</p>
          </div>
        ) : items.length === 0 ? (
          /* ── Cheeky Empty Cart ── */
          <div className="text-center py-20 max-w-lg mx-auto">
            <div className="relative inline-block mb-8">
              <ShoppingCart className="h-20 w-20 mx-auto text-gray-200" />
              <span className="absolute -top-2 -right-2 text-3xl">😢</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              Your cart is emptier than a promise from a fast-fashion brand
            </h2>
            <p className="text-gray-500 mb-2 text-sm leading-relaxed">
              No items, no vibes, no drip. This is a crisis.
            </p>
            <p className="text-gray-400 mb-8 text-xs">
              But hey — every legendary wardrobe started with a single click.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-red-600 text-white px-10 py-4 text-sm font-bold tracking-widest hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/20 gap-2"
            >
              <Sparkles size={16} />
              START FAKING IT
            </Link>
            <p className="text-[10px] text-gray-300 mt-4">
              (Your wardrobe will thank you. Your wallet might not. Worth it though.)
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 mt-6">
            {/* ── Cart Items ── */}
            <div className="lg:col-span-2">
              {/* Gamified Free Shipping Progress Bar */}
              <div className="mb-8 bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{milestone.icon}</span>
                    <p className="text-sm font-semibold text-gray-800">{milestone.msg}</p>
                  </div>
                  {!qualifiesForFreeShipping && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      {formatPrice(remainingForFreeShipping)} to go
                    </span>
                  )}
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      qualifiesForFreeShipping
                        ? 'bg-gradient-to-r from-green-500 to-green-400'
                        : 'bg-gradient-to-r from-red-600 to-red-400'
                    }`}
                    style={{ width: `${shippingProgress}%` }}
                  />
                  {/* Milestone markers */}
                  <div className="absolute inset-0 flex items-center">
                    {[25, 50, 75].map(mark => (
                      <div
                        key={mark}
                        className={`absolute w-1 h-1 rounded-full ${shippingProgress >= mark ? 'bg-white' : 'bg-gray-300'}`}
                        style={{ left: `${mark}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">RM 0</span>
                  <span className="text-[10px] text-gray-400 font-semibold">RM 75 = FREE SHIP 🚚</span>
                </div>
              </div>

              {/* Cart Item List */}
              <div className="space-y-0 divide-y divide-gray-100">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className={`flex gap-4 md:gap-6 py-6 first:pt-0 transition-all duration-300 ${
                      removingId === item.productId ? 'opacity-0 -translate-x-8' : 'opacity-100'
                    }`}
                  >
                    {/* Image */}
                    <Link href={`/product/${item.slug}`} className="flex-shrink-0">
                      <div className="w-24 h-32 md:w-28 md:h-36 bg-gray-50 rounded-lg overflow-hidden group">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.slug}`} className="hover:text-red-600 transition-colors">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight">{item.name}</h3>
                      </Link>

                      <div className="flex gap-4 mt-1.5">
                        {item.size && (
                          <span className="text-xs text-gray-500">
                            {['dress-slacks', 'sweat-pants'].includes(item.slug) ? 'Waist' : 'Size'}:{' '}
                            <span className="font-medium text-gray-700">
                              {['dress-slacks', 'sweat-pants'].includes(item.slug) ? `${item.size}"` : item.size}
                            </span>
                          </span>
                        )}
                        {item.color && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            Color:
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-gray-200"
                              style={{ backgroundColor: item.color === 'white' ? '#ffffff' : item.color === 'cream' ? '#f5f0e8' : item.color === 'navy' ? '#1e3a5f' : item.color }}
                            />
                            <span className="font-medium text-gray-700 capitalize">{item.color}</span>
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-base font-bold text-gray-900">{formatPrice(item.price)}</p>

                      {/* Quantity + Remove */}
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center border-2 border-gray-200 rounded hover:border-gray-300 transition-colors">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={cartLoading || item.quantity <= 1}
                            className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center font-semibold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={cartLoading}
                            className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.productId)}
                          disabled={cartLoading}
                          className="text-xs text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 group"
                        >
                          <Trash2 size={14} className="group-hover:animate-pulse" />
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatPrice(item.price)} each</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── "You Might Also Like" Upsell Section ── */}
              {upsellProducts.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-6">
                    <Flame size={18} className="text-red-500" />
                    <h3 className="text-lg font-black text-gray-900">People Also Faked These</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {upsellProducts.map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        className="group bg-gray-50 rounded-lg overflow-hidden border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="aspect-[3/4] overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs">No image</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-red-600 transition-colors">{product.name}</p>
                          <p className="text-sm font-bold text-red-600 mt-1">{formatPrice(product.price)}</p>
                          <p className="text-[10px] text-gray-400 mt-1 italic">Add to your collection →</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Order Summary Sidebar ── */}
            <div>
              <div className="sticky top-24 space-y-4">
                {/* Summary Card */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h2 className="text-lg font-black text-gray-900 mb-1">Order Summary</h2>
                  <p className="text-xs text-gray-400 mb-6 italic">Almost there. Don't chicken out now.</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                      <span className="font-medium text-gray-900">{formatPrice(total)}</span>
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
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600 italic">You saved RM 8.00 on shipping!</span>
                        <span className="text-green-600">🎉</span>
                      </div>
                    )}
                    {promoApplied && promoDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <Tag size={12} />
                          {promoApplied.description}
                        </span>
                        <span className="font-bold text-green-600">-{formatPrice(promoDiscount)}</span>
                      </div>
                    )}
                    {promoApplied?.type === 'free_shipping' && !qualifiesForFreeShipping && (
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600 italic">Promo code gave you FREE shipping!</span>
                        <span className="text-green-600">🎉</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-end">
                      <span className="font-bold text-gray-900">Estimated Total</span>
                      <div className="text-right">
                        <span className="font-black text-2xl text-gray-900">{formatPrice(estimatedTotal)}</span>
                        <p className="text-[10px] text-gray-400">incl. all the good vibes</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      if (!user) {
                        setAuthModalOpen(true);
                      } else {
                        setLocation("/checkout");
                      }
                    }}
                    className="w-full bg-red-600 text-white py-4 text-sm font-bold tracking-widest hover:bg-red-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 rounded-lg group"
                  >
                    <Zap size={16} className="group-hover:animate-pulse" />
                    {user ? "PROCEED TO CHECKOUT" : "SIGN IN TO CHECKOUT"}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  {!user && (
                    <p className="text-[10px] text-gray-400 text-center mt-2 italic">
                      Quick sign-in. No spam. We're not that kind of brand.
                    </p>
                  )}

                  <Link href="/shop" className="w-full mt-3 text-center block text-sm font-medium text-gray-500 hover:text-red-600 transition-colors py-2">
                    ← Keep Shopping
                  </Link>
                </div>

                {/* ── Promo Code Field ── */}
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={14} className="text-red-600" />
                    <p className="text-xs font-bold text-gray-700 tracking-wide">GOT A SECRET CODE?</p>
                  </div>
                  
                  {promoApplied ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-green-600" />
                          <span className="text-sm font-bold text-green-700">{promoApplied.code}</span>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{promoApplied.description}</span>
                        </div>
                        <button onClick={handleRemovePromo} className="text-gray-400 hover:text-red-600 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-2 italic">{promoApplied.message}</p>
                    </div>
                  ) : (
                    <>
                      <div className={`flex border-2 rounded-lg overflow-hidden transition-colors ${
                        promoInputFocused ? 'border-red-300' : promoError ? 'border-red-200' : 'border-gray-200'
                      }`}>
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                          onFocus={() => setPromoInputFocused(true)}
                          onBlur={() => setPromoInputFocused(false)}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                          placeholder="Enter code..."
                          className="flex-1 px-3 py-2.5 text-sm font-mono font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal outline-none bg-transparent"
                          disabled={promoLoading || !isAuthenticated}
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoCode.trim() || !isAuthenticated}
                          className="px-4 bg-gray-900 text-white text-xs font-bold tracking-wider hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                        >
                          {promoLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            'APPLY'
                          )}
                        </button>
                      </div>
                      {promoError && (
                        <div className="flex items-start gap-1.5 mt-2">
                          <AlertCircle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-500">{promoError}</p>
                        </div>
                      )}
                      {!isAuthenticated && (
                        <p className="text-[10px] text-gray-400 mt-2 italic">Sign in first to use promo codes.</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-2">
                        Hint: Follow us on socials. Codes appear when you least expect them. 👀
                      </p>
                    </>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <p className="text-xs font-bold text-gray-700 mb-4 tracking-wide">WHY SHOP WITH US</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Shield size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">Secure Checkout</p>
                        <p className="text-[10px] text-gray-400">256-bit SSL encryption. Your data's safer than your secrets.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Truck size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">Free Shipping over RM75</p>
                        <p className="text-[10px] text-gray-400">Because delivery fees are the real scam.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <RotateCcw size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">30-Day Returns</p>
                        <p className="text-[10px] text-gray-400">Changed your mind? No drama. We get it.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Proof / Urgency */}
                <div className="bg-gray-950 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-300">
                    <Flame size={12} className="inline text-red-400 mr-1 -mt-0.5" />
                    <span className="font-bold text-white">{Math.floor(Math.random() * 30) + 15} people</span> are shopping right now.
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Don't let them out-fake you.
                  </p>
                </div>
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
