import { useState } from 'react';
import { Link } from 'wouter';
import { ShoppingCart, Search, User, Truck, RotateCcw, Lock, MessageCircle, Star, ArrowRight, Menu, X } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tees = [
    {
      id: 1,
      name: 'You Fake Bro?',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-you-fake-bro-print-eet8LUrP4HA6J8dQWKbYtA.webp',
      price: 49,
      color: 'White',
      reviews: 342,
      rating: 4.8,
    },
    {
      id: 2,
      name: 'Life is Fake, Just Make It',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-life-is-fake-print-PpsibRwckFzqB7529S9JNs.webp',
      price: 49,
      color: 'Red',
      reviews: 289,
      rating: 4.9,
    },
    {
      id: 3,
      name: 'Fake Like My Office',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-fake-office-print-KVhFVyCPGuKRJjGSeQaR4t.webp',
      price: 49,
      color: 'Cream',
      reviews: 267,
      rating: 4.7,
    },
    {
      id: 4,
      name: 'The Real Fake',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-real-fake-print-RxkjSKEpm5isveF8ULVFZc.webp',
      price: 49,
      color: 'Black',
      reviews: 198,
      rating: 4.8,
    },
  ];

  const plusSizeTees = [
    {
      id: 5,
      name: 'You Fake Bro?',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-you-fake-bro-print-eet8LUrP4HA6J8dQWKbYtA.webp',
      price: 54,
      color: 'White',
      size: 'XL — 4XL',
      reviews: 156,
      rating: 4.8,
    },
    {
      id: 6,
      name: 'Life is Fake',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-life-is-fake-print-PpsibRwckFzqB7529S9JNs.webp',
      price: 54,
      color: 'Red',
      size: 'XL — 4XL',
      reviews: 142,
      rating: 4.9,
    },
    {
      id: 7,
      name: 'Fake Office',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-fake-office-print-KVhFVyCPGuKRJjGSeQaR4t.webp',
      price: 54,
      color: 'Cream',
      size: 'XL — 4XL',
      reviews: 128,
      rating: 4.7,
    },
    {
      id: 8,
      name: 'The Real Fake',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-real-fake-print-RxkjSKEpm5isveF8ULVFZc.webp',
      price: 54,
      color: 'Black',
      size: 'XL — 4XL',
      reviews: 94,
      rating: 4.8,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="text-xl font-black tracking-wider text-red-600 hover:text-red-700 transition-colors">
            FAKE
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            <Link href="/shop" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">
              SHOP
            </Link>
            <Link href="/shop" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">
              PLUS SIZE
            </Link>
            <a href="#about" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">
              ABOUT
            </a>
            <a href="#contact" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">
              CONTACT
            </a>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-5">
            <button className="text-gray-500 hover:text-red-600 transition-colors" aria-label="Search">
              <Search size={18} strokeWidth={2} />
            </button>
            <Link href="/cart" className="relative text-gray-500 hover:text-red-600 transition-colors">
              <ShoppingCart size={18} strokeWidth={2} />
              <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">0</span>
            </Link>
            <Link href="/account" className="text-gray-500 hover:text-red-600 transition-colors hidden sm:block">
              <User size={18} strokeWidth={2} />
            </Link>
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
            <Link href="/shop" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link href="/shop" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Plus Size</Link>
            <a href="#about" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>About</a>
            <a href="#contact" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <Link href="/account" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Account</Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="bg-gray-50 py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-[1.05]">
            You Fake Bro?
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-500 font-light leading-relaxed">
            Premium tees. Real attitude. No apologies.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="inline-flex items-center justify-center bg-red-600 text-white px-10 py-3.5 text-sm font-semibold tracking-wider hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-600/30">
              SHOP TEES
            </Link>
            <a href="#plus-size" className="inline-flex items-center justify-center border-2 border-gray-900 text-gray-900 px-10 py-3.5 text-sm font-semibold tracking-wider hover:bg-gray-900 hover:text-white transition-all duration-200">
              PLUS SIZE
            </a>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              4.8/5 from 1K+ reviews
            </span>
            <span>Free shipping over $75</span>
            <span>30-day returns</span>
          </div>
        </div>
      </section>

      {/* ── The Collection ── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                The Collection
              </h2>
              <p className="mt-2 text-gray-500">100% cotton. Zero BS.</p>
            </div>
            <Link href="/shop" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {tees.map((tee) => (
              <div key={tee.id} className="group bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                  <img
                    src={tee.image}
                    alt={tee.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight">{tee.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{tee.color}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} className={i < Math.floor(tee.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">({tee.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-gray-900">${tee.price}</span>
                  </div>
                  <button className="w-full mt-3 bg-gray-900 text-white py-2.5 text-xs font-semibold tracking-wider hover:bg-red-600 transition-colors duration-200 rounded">
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="sm:hidden mt-8 text-center">
            <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Plus Size Section ── */}
      <section id="plus-size" className="py-20 md:py-28 px-6 bg-red-600">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                Fake For Everyone
              </h2>
              <p className="mt-2 text-red-100">XL — 4XL. Same tees. Same attitude. $5 more.</p>
            </div>
            <Link href="/shop" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white hover:text-red-100 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {plusSizeTees.map((tee) => (
              <div key={tee.id} className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                  <img
                    src={tee.image}
                    alt={tee.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <span className="inline-block bg-red-600 text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm mb-2">PLUS SIZE</span>
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight">{tee.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{tee.color} &middot; {tee.size}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} className={i < Math.floor(tee.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">({tee.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-gray-900">${tee.price}</span>
                  </div>
                  <button className="w-full mt-3 bg-gray-900 text-white py-2.5 text-xs font-semibold tracking-wider hover:bg-red-600 transition-colors duration-200 rounded">
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { icon: Truck, title: 'Fast Shipping', desc: 'Ships in 2–3 business days' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '30-day no-questions returns' },
              { icon: Lock, title: 'Secure Checkout', desc: 'SSL encrypted payments' },
              { icon: MessageCircle, title: 'Real Support', desc: 'Humans answer your emails' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
                  <item.icon size={20} className="text-red-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-20 md:py-24 px-6 bg-gray-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Stay Fake
          </h2>
          <p className="mt-3 text-gray-400 text-sm">
            New drops. Exclusive deals. Real talk.
          </p>
          <div className="mt-8 flex gap-0 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-800 text-white text-sm placeholder-gray-500 border border-gray-700 focus:border-red-600 focus:outline-none transition-colors rounded-l"
            />
            <button className="bg-red-600 text-white px-6 py-3 text-sm font-semibold tracking-wider hover:bg-red-700 transition-colors rounded-r whitespace-nowrap">
              SUBSCRIBE
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-14 pb-14 border-b border-gray-800">

            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <span className="text-lg font-black text-white tracking-wider">FAKE</span>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Premium tees with attitude.<br />
                Fake by Freetown.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Shop</h3>
              <ul className="space-y-2.5">
                <li><Link href="/shop" className="text-sm text-gray-400 hover:text-white transition-colors">All Tees</Link></li>
                <li><a href="#plus-size" className="text-sm text-gray-400 hover:text-white transition-colors">Plus Size</a></li>
                <li><Link href="/shop" className="text-sm text-gray-400 hover:text-white transition-colors">New Drops</Link></li>
                <li><Link href="/shop" className="text-sm text-gray-400 hover:text-white transition-colors">Sale</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Account</h3>
              <ul className="space-y-2.5">
                <li><Link href="/account" className="text-sm text-gray-400 hover:text-white transition-colors">My Account</Link></li>
                <li><Link href="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">Orders</Link></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Wishlist</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Rewards</a></li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Help</h3>
              <ul className="space-y-2.5">
                <li><Link href="/shipping-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link href="/returns-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Returns</Link></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Size Guide</a></li>
                <li><a href="#contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Legal</h3>
              <ul className="space-y-2.5">
                <li><Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</Link></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Cookies</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Fake by Freetown. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Instagram</a>
              <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">TikTok</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
