import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { AuthModal } from "@/components/AuthModal";
import {
  ShoppingCart, Search, User, Minus, Plus, Trash2, ArrowLeft,
  Truck, Shield, RotateCcw, Menu, X
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { items, itemCount, total, updateQuantity, removeItem, isLoading: cartLoading } = useCart();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

  const freeShippingThreshold = 7500; // RM75 in cents
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);

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
            <Link href="/shop?category=casual" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">CASUAL</Link>
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
          <li className="text-gray-900 font-medium">Shopping Cart</li>
        </ol>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-2">
          Shopping Cart
        </h1>
        <p className="text-gray-500 text-sm mb-8">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>

        {cartLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-3 border-red-600 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 mx-auto mb-6 text-gray-200" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Looks like you haven't added anything yet. Check out our latest drops.
            </p>
            <Link href="/shop" className="inline-flex items-center justify-center bg-red-600 text-white px-10 py-3.5 text-sm font-semibold tracking-wider hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/20">
              SHOP NOW
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-0 divide-y divide-gray-100">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 md:gap-6 py-6 first:pt-0">
                  {/* Image */}
                  <Link href={`/product/${item.slug}`} className="flex-shrink-0">
                    <div className="w-24 h-32 md:w-28 md:h-36 bg-gray-50 rounded-lg overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
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
                        <span className="text-xs text-gray-500">Size: <span className="font-medium text-gray-700">{item.size}</span></span>
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
                      <div className="flex items-center border-2 border-gray-200 rounded">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={cartLoading || item.quantity <= 1}
                          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-semibold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={cartLoading}
                          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        disabled={cartLoading}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <div className="sticky top-24 bg-gray-50 rounded-lg p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

                {/* Free shipping progress */}
                {remainingForFreeShipping > 0 ? (
                  <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-xs text-red-700 font-medium">
                      Add {formatPrice(remainingForFreeShipping)} more for free shipping!
                    </p>
                    <div className="mt-2 h-1.5 bg-red-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (total / freeShippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                      <Truck size={14} /> You qualify for free shipping!
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                    <span className="font-medium text-gray-900">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-medium text-gray-900">
                      {remainingForFreeShipping <= 0 ? 'FREE' : 'Calculated at checkout'}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-black text-xl text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!user) {
                      setAuthModalOpen(true);
                    } else {
                      setLocation("/checkout");
                    }
                  }}
                  className="w-full bg-red-600 text-white py-4 text-sm font-bold tracking-widest hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 rounded"
                >
                  PROCEED TO CHECKOUT
                </button>

                <Link href="/shop" className="w-full mt-3 text-center block text-sm font-medium text-gray-500 hover:text-red-600 transition-colors py-2">
                  Continue Shopping
                </Link>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-col items-center text-center gap-1">
                    <Shield size={16} className="text-red-600" />
                    <span className="text-[10px] text-gray-400">Secure<br />Checkout</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1">
                    <Truck size={16} className="text-red-600" />
                    <span className="text-[10px] text-gray-400">Free Ship<br />over RM75</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1">
                    <RotateCcw size={16} className="text-red-600" />
                    <span className="text-[10px] text-gray-400">30-Day<br />Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-14 pb-14 border-b border-gray-800">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-red-500">FAKE</span>
                <span className="text-sm text-gray-500" style={{ fontFamily: "'Dancing Script', cursive" }}>by Freetown</span>
              </div>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                Premium lifestyle apparel.<br />S to 10XL. No exceptions.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Shop</h3>
              <ul className="space-y-2.5">
                <li><Link href="/shop" className="text-sm text-gray-400 hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/shop?category=casual" className="text-sm text-gray-400 hover:text-white transition-colors">Casual</Link></li>
                <li><Link href="/shop?category=professional" className="text-sm text-gray-400 hover:text-white transition-colors">Business</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Account</h3>
              <ul className="space-y-2.5">
                <li><Link href="/account" className="text-sm text-gray-400 hover:text-white transition-colors">My Account</Link></li>
                <li><Link href="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">Orders</Link></li>
                <li><Link href="/cart" className="text-sm text-gray-400 hover:text-white transition-colors">Cart</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Help</h3>
              <ul className="space-y-2.5">
                <li><Link href="/shipping-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Shipping</Link></li>
                <li><Link href="/returns-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Returns</Link></li>
                <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Legal</h3>
              <ul className="space-y-2.5">
                <li><Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
            <p className="text-xs text-gray-600">&copy; 2026 Fake by Freetown. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Instagram</a>
              <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">TikTok</a>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
