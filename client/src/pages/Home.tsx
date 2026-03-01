import { Link } from 'wouter';
import { ShoppingCart, User, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Footer } from '@/components/Footer';

export default function Home() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-light tracking-widest text-black">
            FAKE
          </Link>
          
          <nav className="hidden md:flex gap-12 text-xs font-light tracking-wide">
            <a href="#" className="text-gray-700 hover:text-black transition duration-300">SHOP</a>
            <a href="#" className="text-gray-700 hover:text-black transition duration-300">ABOUT</a>
            <a href="#" className="text-gray-700 hover:text-black transition duration-300">CONTACT</a>
          </nav>

          <div className="flex items-center gap-6">
            <button className="p-2 hover:bg-gray-100 rounded transition duration-300">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded transition duration-300">
              <ShoppingCart className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-light">
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded transition duration-300">
              <User className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black leading-tight">
                  Elevate Your Presence
                </h1>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  Curated apparel for those who refuse to compromise on quality. Timeless pieces that speak to your refined taste.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Link href="/shop" className="group inline-flex items-center gap-3 px-8 py-3 bg-black text-white text-sm font-light tracking-wide hover:bg-gray-900 transition duration-500">
                  EXPLORE COLLECTION
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition duration-300" strokeWidth={1.5} />
                </Link>
                <button className="px-8 py-3 border border-black text-black text-sm font-light tracking-wide hover:bg-black hover:text-white transition duration-500">
                  LEARN MORE
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-gray-200 flex gap-8 text-xs text-gray-600 font-light">
                <div>
                  <p className="text-black font-medium mb-1">Premium Quality</p>
                  <p>Ethically sourced materials</p>
                </div>
                <div>
                  <p className="text-black font-medium mb-1">Global Shipping</p>
                  <p>Free on orders over $100</p>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative h-96 md:h-full min-h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20 group-hover:opacity-30 transition duration-500">
                👕
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-light tracking-widest text-gray-600 uppercase">Our Selection</p>
            <h2 className="text-4xl md:text-5xl font-light text-black">Signature Pieces</h2>
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              Each item in our collection represents a commitment to excellence and timeless style.
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Product 1 */}
            <div className="group cursor-pointer">
              <div className="relative h-80 bg-white rounded-lg overflow-hidden mb-4 border border-gray-200 hover:border-gray-400 transition duration-500">
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30 group-hover:opacity-50 transition duration-500">
                  👕
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent opacity-0 group-hover:opacity-10 transition duration-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-light text-black">Classic T-Shirt</h3>
                <p className="text-xs text-gray-600 font-light">Premium cotton blend</p>
                <p className="text-sm font-light text-black">$89</p>
              </div>
            </div>

            {/* Product 2 */}
            <div className="group cursor-pointer">
              <div className="relative h-80 bg-white rounded-lg overflow-hidden mb-4 border border-gray-200 hover:border-gray-400 transition duration-500">
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30 group-hover:opacity-50 transition duration-500">
                  🧥
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent opacity-0 group-hover:opacity-10 transition duration-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-light text-black">Luxury Hoodie</h3>
                <p className="text-xs text-gray-600 font-light">Cashmere blend comfort</p>
                <p className="text-sm font-light text-black">$189</p>
              </div>
            </div>

            {/* Product 3 */}
            <div className="group cursor-pointer">
              <div className="relative h-80 bg-white rounded-lg overflow-hidden mb-4 border border-gray-200 hover:border-gray-400 transition duration-500">
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30 group-hover:opacity-50 transition duration-500">
                  👖
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent opacity-0 group-hover:opacity-10 transition duration-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-light text-black">Tailored Pants</h3>
                <p className="text-xs text-gray-600 font-light">Italian wool fabric</p>
                <p className="text-sm font-light text-black">$159</p>
              </div>
            </div>

            {/* Product 4 */}
            <div className="group cursor-pointer">
              <div className="relative h-80 bg-white rounded-lg overflow-hidden mb-4 border border-gray-200 hover:border-gray-400 transition duration-500">
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30 group-hover:opacity-50 transition duration-500">
                  🧥
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent opacity-0 group-hover:opacity-10 transition duration-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-light text-black">Wool Jacket</h3>
                <p className="text-xs text-gray-600 font-light">Timeless elegance</p>
                <p className="text-sm font-light text-black">$249</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-light text-black hover:text-gray-600 transition duration-300 border-b border-black hover:border-gray-400">
              VIEW ALL PRODUCTS
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition duration-300">
                ✓
              </div>
              <h3 className="text-lg font-light text-black">Uncompromising Quality</h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Every piece is crafted with meticulous attention to detail using only the finest materials.
              </p>
            </div>

            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition duration-300">
                ◆
              </div>
              <h3 className="text-lg font-light text-black">Timeless Design</h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Our collection transcends trends, offering pieces that remain relevant for years to come.
              </p>
            </div>

            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition duration-300">
                ◇
              </div>
              <h3 className="text-lg font-light text-black">Ethical Sourcing</h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                We partner with suppliers who share our commitment to sustainability and fair practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-light leading-tight">
            Join the Community of Discerning Individuals
          </h2>
          <p className="text-gray-300 font-light text-lg">
            Subscribe to receive exclusive previews, early access to new collections, and curated style insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="px-6 py-3 bg-white/10 border border-white/30 text-white placeholder-gray-400 font-light text-sm focus:outline-none focus:border-white transition duration-300"
            />
            <button className="px-8 py-3 bg-white text-black font-light tracking-wide hover:bg-gray-100 transition duration-300">
              SUBSCRIBE
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
