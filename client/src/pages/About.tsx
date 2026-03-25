import { Link } from "wouter";
import { ShoppingCart, Search, User, ArrowRight, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { useState } from "react";

export default function About() {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link href="/about" className="text-xs font-semibold tracking-widest text-red-600">ABOUT</Link>
          </nav>
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
            <Link href="/about" className="block text-sm font-medium text-red-600" onClick={() => setMobileMenuOpen(false)}>About</Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="bg-gray-900 py-24 md:py-32 px-6 text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-red-500 mb-4">OUR STORY</p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight max-w-3xl mx-auto">
          We Started Faking It.<br />Now We're Making It.
        </h1>
        <p className="mt-6 text-lg text-gray-400 font-light max-w-xl mx-auto leading-relaxed">
          Born in Freetown. Built for everyone who's ever been told they can't.
        </p>
      </section>

      {/* ── The Story ── */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.3em] text-red-600 mb-4">THE BEGINNING</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-8">
            It started as a joke.
          </h2>
          <div className="space-y-6 text-gray-600 leading-relaxed text-base">
            <p>
              Fake by Freetown started with a simple question: "You Fake Bro?" It was a phrase tossed around between friends, a way of calling out the gap between who we pretend to be and who we actually are. We thought it was funny. Turns out, so did everyone else.
            </p>
            <p>
              We printed the first batch of tees in a garage in Freetown. No business plan. No investors. Just a screen printer, some blank tees, and a slogan that hit different. The first run sold out in a week. The second run sold out in three days.
            </p>
            <p>
              That's when we realized this wasn't just a joke. It was a movement. People connected with the honesty of it. In a world full of curated perfection, there was something refreshing about a brand that said: "Yeah, we're all faking it. And that's okay."
            </p>
          </div>
        </div>
      </section>

      {/* ── Red Banner ── */}
      <section className="bg-red-600 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            "Fake it till you make it" isn't a lie. It's a strategy.
          </h2>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.3em] text-red-600 mb-4 text-center">WHAT WE STAND FOR</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-14 text-center">
            Our Values
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-black text-red-600">01</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Radical Honesty</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                We don't pretend to be something we're not. Our brand name says it all. We embrace the hustle, the struggle, and the journey of becoming.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-black text-red-600">02</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Size Equality</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                We put 'Fake' on the label so you'd never have to question what's real. Every product. Every size. One price. One quality. Zero fine print.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-black text-red-600">03</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Quality Over Hype</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                We use premium fabrics, reinforced stitching, and pre-shrunk cotton. Our clothes are built to last, not built to trend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Size Promise ── */}
      <section className="bg-gray-50 py-20 md:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-red-600 mb-4">THE PROMISE</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-6">
            Zero Fine Print.
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-xl mx-auto">
            We put 'Fake' on the label so you'd never have to question what's real. Every product. Every size. S to 10XL. One price. One quality. Zero fine print.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-24 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-4">
          Ready to Get Fake?
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Check out the latest drops. Tees, casual wear, and a full business line.
        </p>
        <Link href="/shop" className="inline-flex items-center justify-center bg-red-600 text-white px-10 py-3.5 text-sm font-semibold tracking-wider hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/30 gap-2">
          SHOP NOW <ArrowRight size={16} />
        </Link>
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
