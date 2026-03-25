import { useState } from 'react';
import { Link } from 'wouter';
import { ShoppingCart, Search, User, Truck, RotateCcw, Lock, MessageCircle, Star, ArrowRight, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/_core/hooks/useAuth';

export default function Home() {
  const [email, setEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();

  // Printed Tees — slugs match database exactly
  const tees = [
    {
      slug: 'you-fake-bro',
      name: 'You Fake Bro?',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-you-fake-bro-print-eet8LUrP4HA6J8dQWKbYtA.webp',
      price: 49,
      color: 'White',
    },
    {
      slug: 'life-is-fake-just-make-it',
      name: 'Life is Fake, Just Make It',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-life-is-fake-print-PpsibRwckFzqB7529S9JNs.webp',
      price: 49,
      color: 'Red',
    },
    {
      slug: 'fake-like-my-office',
      name: 'Fake Like My Office',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-fake-office-print-KVhFVyCPGuKRJjGSeQaR4t.webp',
      price: 49,
      color: 'Cream',
    },
    {
      slug: 'the-real-fake',
      name: 'The Real Fake',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-real-fake-print-RxkjSKEpm5isveF8ULVFZc.webp',
      price: 49,
      color: 'Black',
    },
  ];

  // Casual — slugs match database exactly
  const casual = [
    {
      slug: 'sweat-pants',
      name: 'Sweat Pants',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-sweatpants-BKwVLCCHpjtJdQ4k7w9krA.webp',
      price: 79,
      color: 'Black',
    },
    {
      slug: 'windbreaker',
      name: 'Windbreaker',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-windbreaker-m4Lh7anfuG2BbQ7Wua76t9.webp',
      price: 129,
      color: 'Red / White',
    },
    {
      slug: 'polo-tee',
      name: 'Polo Tee',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-collared-tee-nfioGCghjpLuNa99gKSjfc.webp',
      price: 59,
      color: 'White',
    },
    {
      slug: 'mandarin-collar',
      name: 'Mandarin Collar',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-mandarin-collar-dR6kSFzJDoeAKruoGjhCdc.webp',
      price: 59,
      color: 'Black',
    },
    {
      slug: 'v-neck-tee',
      name: 'V-Neck Tee',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-vneck-tee-jTZNeGxGkLX8DQiEexZdfS.webp',
      price: 45,
      color: 'Heather Gray',
    },
  ];

  // Business — slugs match database exactly
  const business = [
    {
      slug: 'dress-shirt',
      name: 'Dress Shirt',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-white-shirt-aAkYcZjkuvfTTHZCJXgErS.webp',
      price: 89,
      color: 'White',
    },
    {
      slug: 'dress-slacks',
      name: 'Dress Slacks',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-slacks-bq3ML2eydRFW8h6xi74Gq6.webp',
      price: 99,
      color: 'Charcoal',
    },
    {
      slug: 'dress-socks',
      name: 'Dress Socks',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-socks-GDBq8PLm3qqYaRBTG56s52.webp',
      price: 19,
      color: 'Black',
    },
    {
      slug: 'pocket-square',
      name: 'Pocket Square',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-handkerchief-maoJuxXkXuFU3qScpDuTHX.webp',
      price: 29,
      color: 'White / Red',
    },
    {
      slug: 'silk-tie',
      name: 'Silk Tie',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/product-tie-UncfmcyoRnRLJEcTgXTbnC.webp',
      price: 59,
      color: 'Red',
    },
  ];

  const ProductCard = ({ product, badge }: { product: typeof tees[0]; badge?: string }) => (
    <Link href={`/product/${product.slug}`} className="group block bg-white border border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-300">
      <div className="aspect-[3/4] bg-gray-50 overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {badge && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold tracking-wider px-2.5 py-1">{badge}</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-red-600 transition-colors">{product.name}</h3>
        <p className="text-xs text-gray-400 mt-1">{product.color}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-base font-bold text-gray-900">RM {product.price}</span>
          <span className="text-[10px] text-gray-400">S — 10XL</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-1 hover:opacity-80 transition-opacity">
            <span className="text-xl font-black tracking-wider text-red-600">FAKE</span>
            <span className="text-sm text-gray-500" style={{ fontFamily: "'Dancing Script', cursive" }}>by Freetown</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            <Link href="/shop" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">
              SHOP
            </Link>
            <a href="#casual" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">
              CASUAL
            </a>
            <a href="#business" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">
              BUSINESS
            </a>
            <Link href="/about" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">
              ABOUT
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-5">
            <Link href="/shop" className="text-gray-500 hover:text-red-600 transition-colors" aria-label="Search">
              <Search size={18} strokeWidth={2} />
            </Link>
            <Link href="/cart" className="relative text-gray-500 hover:text-red-600 transition-colors">
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
            <button
              className="md:hidden text-gray-500 hover:text-red-600 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
            <Link href="/shop" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Shop All</Link>
            <a href="#casual" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Casual</a>
            <a href="#business" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Business</a>
            <Link href="/about" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/account" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Account</Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-gray-900 py-28 md:py-40 px-6 overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-you-fake-bro-print-eet8LUrP4HA6J8dQWKbYtA.webp"
            alt=""
            className="w-full h-full object-cover object-top opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/90" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-red-500 mb-4">FAKE BY FREETOWN</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.05]">
            You Fake Bro?
          </h1>
          <p className="mt-6 text-lg text-gray-300 font-light leading-relaxed max-w-xl mx-auto">
            Premium apparel for people who get the joke. Tees, casual, business. Zero fine print.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="inline-flex items-center justify-center bg-red-600 text-white px-10 py-3.5 text-sm font-semibold tracking-wider hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/30">
              SHOP NOW
            </Link>
            <a href="#business" className="inline-flex items-center justify-center border-2 border-white text-white px-10 py-3.5 text-sm font-semibold tracking-wider hover:bg-white hover:text-gray-900 transition-all duration-200">
              BUSINESS LINE
            </a>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-400">
            <span>Free shipping over RM75</span>
            <span>S — 10XL on everything</span>
            <span>30-day returns</span>
          </div>
        </div>
      </section>

      {/* ── Printed Tees ── */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] text-red-600 mb-2">THE ORIGINALS</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                Printed Tees
              </h2>
              <p className="mt-2 text-gray-500 text-sm">100% cotton. The prints that started it all.</p>
            </div>
            <Link href="/shop" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {tees.map((tee) => (
              <ProductCard key={tee.slug} product={tee} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Casual Line ── */}
      <section id="casual" className="py-20 md:py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] text-red-600 mb-2">EVERYDAY WEAR</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                Casual
              </h2>
              <p className="mt-2 text-gray-500 text-sm">Off-duty staples. Built to move, made to last.</p>
            </div>
            <Link href="/shop?category=casual" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {casual.map((item) => (
              <ProductCard key={item.slug} product={item} badge="NEW" />
            ))}
          </div>
        </div>
      </section>

      {/* ── Business Line ── */}
      <section id="business" className="py-20 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] text-red-600 mb-2">9 TO 5</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                Business
              </h2>
              <p className="mt-2 text-gray-500 text-sm">Look the part. Even if you're faking it.</p>
            </div>
            <Link href="/shop?category=professional" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {business.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Size Promise Banner ── */}
      <section className="bg-red-600 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Zero Fine Print.</h2>
          <p className="mt-4 text-red-100 text-lg font-light">We put 'Fake' on the label so you'd never have to question what's real. Every product. Every size. One price. One quality.</p>
          <Link href="/shop" className="inline-flex items-center justify-center mt-8 bg-white text-red-600 px-10 py-3.5 text-sm font-semibold tracking-wider hover:bg-gray-100 transition-all duration-200">
            SHOP ALL SIZES
          </Link>
        </div>
      </section>

      {/* ── Trust Section ── */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <Truck size={24} className="mx-auto text-red-600 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">Free Shipping</h3>
            <p className="text-xs text-gray-400 mt-1">Orders over RM75</p>
          </div>
          <div>
            <RotateCcw size={24} className="mx-auto text-red-600 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">30-Day Returns</h3>
            <p className="text-xs text-gray-400 mt-1">No questions asked</p>
          </div>
          <div>
            <Lock size={24} className="mx-auto text-red-600 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">Secure Checkout</h3>
            <p className="text-xs text-gray-400 mt-1">SSL encrypted</p>
          </div>
          <div>
            <MessageCircle size={24} className="mx-auto text-red-600 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">24/7 Support</h3>
            <p className="text-xs text-gray-400 mt-1">We got you</p>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-gray-900 py-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white tracking-tight">Stay Fake</h2>
          <p className="mt-2 text-gray-400 text-sm">New drops, restocks, and stuff you won't find anywhere else.</p>
          <form onSubmit={(e: React.FormEvent) => e.preventDefault()} className="mt-6 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
            />
            <button type="submit" className="bg-red-600 text-white px-6 py-3 text-sm font-semibold tracking-wider hover:bg-red-700 transition-colors">
              JOIN
            </button>
          </form>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-14 pb-14 border-b border-gray-800">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-lg font-black text-red-500">FAKE</span>
                <span className="text-sm text-gray-500" style={{ fontFamily: "'Dancing Script', cursive" }}>by Freetown</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Apparel for people who don't take themselves too seriously.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest text-white mb-4">SHOP</h4>
              <ul className="space-y-2.5">
                <li><Link href="/shop" className="text-sm text-gray-400 hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/shop?category=casual" className="text-sm text-gray-400 hover:text-white transition-colors">Casual</Link></li>
                <li><Link href="/shop?category=professional" className="text-sm text-gray-400 hover:text-white transition-colors">Business</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest text-white mb-4">ACCOUNT</h4>
              <ul className="space-y-2.5">
                <li><Link href="/account" className="text-sm text-gray-400 hover:text-white transition-colors">My Account</Link></li>
                <li><Link href="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">Orders</Link></li>
                <li><Link href="/cart" className="text-sm text-gray-400 hover:text-white transition-colors">Cart</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest text-white mb-4">HELP</h4>
              <ul className="space-y-2.5">
                <li><Link href="/shipping-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Shipping</Link></li>
                <li><Link href="/returns-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Returns</Link></li>
                <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest text-white mb-4">LEGAL</h4>
              <ul className="space-y-2.5">
                <li><Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Fake by Freetown. All rights reserved.</p>
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
