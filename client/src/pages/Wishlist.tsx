import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import {
  Heart, ShoppingCart, Trash2, ArrowRight, Search, User, Menu, X,
  Sparkles, ShoppingBag, ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const CHEEKY_EMPTY_MESSAGES = [
  "Your wishlist is emptier than a fake promise.",
  "Nothing here yet. Go window-shop and come back with regrets.",
  "Zero items. Zero commitment. Very on-brand.",
  "This wishlist is as empty as your excuses for not shopping.",
  "Commitment issues? We get it. Start adding some faves.",
];

const CHEEKY_HEADER_MESSAGES = [
  "Your curated collection of 'I'll buy it later' items.",
  "Things you're pretending you don't need.",
  "Your future wardrobe, currently in denial.",
  "Items you've been eyeing. They've been eyeing you back.",
  "Your taste is impeccable. Your willpower? Not so much.",
];

export default function Wishlist() {
  const { user, isAuthenticated } = useAuth();
  const { addItem, itemCount } = useCart();
  const [, setLocation] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const { data: wishlistItems, isLoading } = trpc.wishlist.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();

  const removeFromWishlist = trpc.wishlist.toggle.useMutation({
    onMutate: async ({ productId }) => {
      setRemovingId(productId);
    },
    onSuccess: (data) => {
      toast.success(data.message);
      utils.wishlist.list.invalidate();
      utils.wishlist.productIds.invalidate();
      utils.wishlist.count.invalidate();
      setTimeout(() => setRemovingId(null), 300);
    },
    onError: () => {
      setRemovingId(null);
    },
  });

  const handleAddToCart = (item: any) => {
    addItem({
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      imageUrl: item.product.imageUrl || '',
      color: item.product.variants?.[0]?.color || 'black',
      size: 'M',
      quantity: 1,
    });
    toast.success(`${item.product.name} added to cart! 🛒`, {
      description: "One step closer to owning it for real.",
    });
  };

  const [headerMessage] = useState(() =>
    CHEEKY_HEADER_MESSAGES[Math.floor(Math.random() * CHEEKY_HEADER_MESSAGES.length)]
  );
  const [emptyMessage] = useState(() =>
    CHEEKY_EMPTY_MESSAGES[Math.floor(Math.random() * CHEEKY_EMPTY_MESSAGES.length)]
  );

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
              <Heart size={20} className="text-red-600 fill-red-600" />
              {wishlistItems && wishlistItems.length > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
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
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors mb-8">
          <ArrowLeft size={14} />
          Back to Shop
        </Link>

        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Heart size={24} className="text-red-600 fill-red-600" />
            <h1 className="text-3xl font-black tracking-tight">YOUR WISHLIST</h1>
            {wishlistItems && wishlistItems.length > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 italic">{headerMessage}</p>
        </div>

        {!isAuthenticated ? (
          /* Not logged in */
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold mb-2">Sign in to see your wishlist</h2>
            <p className="text-sm text-gray-500 mb-6">Your faves are waiting. They miss you.</p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-red-600 text-white px-8 py-3 text-sm font-bold tracking-wider hover:bg-red-700 transition-colors rounded-lg"
            >
              SIGN IN
            </button>
          </div>
        ) : isLoading ? (
          /* Loading */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-lg" />
                <div className="mt-3 h-4 bg-gray-100 rounded w-3/4" />
                <div className="mt-2 h-4 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : !wishlistItems || wishlistItems.length === 0 ? (
          /* Empty wishlist */
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Heart size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold mb-2">Nothing saved yet</h2>
            <p className="text-sm text-gray-500 mb-2 max-w-md mx-auto">{emptyMessage}</p>
            <p className="text-xs text-gray-400 mb-8">
              Tap the <Heart size={12} className="inline text-red-400 -mt-0.5" /> on any product to save it here.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 text-sm font-bold tracking-wider hover:bg-red-700 transition-colors rounded-lg"
            >
              <ShoppingBag size={16} />
              START SHOPPING
            </Link>
          </div>
        ) : (
          /* Wishlist grid */
          <div>
            {/* Quick actions bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <p className="text-xs text-gray-400">
                <Sparkles size={12} className="inline text-yellow-500 mr-1 -mt-0.5" />
                Pro tip: Items in your wishlist won't reserve stock. If you love it, grab it.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistItems.map((item: any) => (
                <div
                  key={item.id}
                  className={`group relative transition-all duration-300 ${
                    removingId === item.productId ? 'opacity-0 scale-95' : 'opacity-100'
                  }`}
                >
                  <Link href={`/product/${item.product.slug}`} className="block">
                    <div className="aspect-square bg-gray-50 overflow-hidden rounded-lg relative">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingCart className="w-8 h-8" />
                        </div>
                      )}

                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors leading-tight">
                        {item.product.name}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        RM {(item.product.price / 100).toFixed(0)}
                      </p>
                    </div>
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWishlist.mutate({ productId: item.productId });
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-md hover:bg-red-100 transition-all z-10"
                    aria-label="Remove from wishlist"
                  >
                    <Heart size={14} className="fill-red-600" />
                  </button>

                  {/* Add to cart button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(item);
                    }}
                    className="mt-2 w-full bg-gray-900 text-white py-2 text-xs font-bold tracking-wider hover:bg-red-600 transition-colors rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ShoppingBag size={12} />
                    ADD TO CART
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 text-center bg-gray-50 rounded-2xl p-8">
              <p className="text-sm font-bold text-gray-700 mb-1">Still thinking about it?</p>
              <p className="text-xs text-gray-500 mb-4">
                These items are popular. We'd hate for you to miss out. (Okay, we'd actually love the drama.)
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
              >
                Discover More <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
