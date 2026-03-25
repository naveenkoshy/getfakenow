import { useState } from 'react';
import { Link } from 'wouter';
import { ShoppingCart, Search, User, Truck, RotateCcw, Lock, MessageCircle, ChevronRight, Star } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');

  const heroImage = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/hero-premium-tees-maapuGGpxpF5wbDcfYtczW.webp';
  const teeWhiteImage = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-classic-white-QbBtFNNtmqxHSmKfxpQ4fa.webp';
  const teeRedImage = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-classic-red-arDHGr2B5CxyqnPM7VomRh.webp';
  const teeOversizedImage = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-oversized-white-cqgVYbwujCNcMDi984hvLk.webp';
  const plusSizeImage = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/plus-size-tee-collection-ZSama35j7Nu54yy6jKe5JT.webp';

  const tees = [
    { id: 1, name: 'You Fake Bro?', color: 'White', price: 49, rating: 4.9, reviews: 342, image: teeWhiteImage },
    { id: 2, name: 'Life is Fake, Just Make It', color: 'Red', price: 49, rating: 4.8, reviews: 289, image: teeRedImage },
    { id: 3, name: 'Fake Like My Office', color: 'Cream', price: 49, rating: 4.9, reviews: 267, image: teeOversizedImage },
    { id: 4, name: 'The Real Fake', color: 'Black', price: 49, rating: 4.7, reviews: 198, image: teeWhiteImage },
  ];

  const plusSizeTees = [
    { id: 5, name: 'You Fake Bro? (Plus)', color: 'White', size: 'XL-4XL', price: 54, rating: 4.9, reviews: 156 },
    { id: 6, name: 'Life is Fake (Plus)', color: 'Red', size: 'XL-4XL', price: 54, rating: 4.8, reviews: 142 },
    { id: 7, name: 'Fake Office (Plus)', color: 'Cream', size: 'XL-4XL', price: 54, rating: 4.9, reviews: 128 },
    { id: 8, name: 'The Real Fake (Plus)', color: 'Black', size: 'XL-4XL', price: 54, rating: 4.8, reviews: 94 },
  ];

  const testimonials = [
    { name: 'Jordan M.', text: 'Finally a brand that gets the joke. Quality is legit though.', verified: true },
    { name: 'Casey L.', text: 'Wearing my "Fake Like My Office" tee to actual meetings. Love it.', verified: true },
    { name: 'Alex R.', text: 'The irony is real. The tees are realer.', verified: true },
  ];

  const guides = [
    { title: 'How to Fake It (Properly)', description: 'Style guide for wearing Fake by Freetown with confidence.' },
    { title: 'The Fake Manifesto', description: 'Why authenticity through irony is the only real thing left.' },
    { title: 'Sizing Guide: Find Your Fake', description: 'Perfect fit for every body. Because fake should fit right.' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-red-600 hover:text-red-700 transition">FAKE</a>
          </Link>
          
          <nav className="hidden md:flex gap-8">
            <Link href="/shop">
              <a className="text-sm font-medium text-gray-900 hover:text-red-600 transition">SHOP</a>
            </Link>
            <a href="#" className="text-sm font-medium text-gray-900 hover:text-red-600 transition">ABOUT</a>
            <a href="#" className="text-sm font-medium text-gray-900 hover:text-red-600 transition">CONTACT</a>
          </nav>

          <div className="flex items-center gap-6">
            <button className="text-gray-900 hover:text-red-600 transition">
              <Search size={20} />
            </button>
            <button className="relative text-gray-900 hover:text-red-600 transition">
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </button>
            <button className="text-gray-900 hover:text-red-600 transition">
              <User size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/25"></div>
        </div>
        
        <div className="relative h-full flex items-center justify-center text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              You Fake Bro?
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-4 font-light">
              Life is fake. Just make it.
            </p>
            <p className="text-lg text-white/80 mb-12 font-light max-w-2xl mx-auto">
              Premium tees for people who get the irony. Authenticity through rebellion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop">
                <a className="px-8 py-4 bg-red-600 text-white font-semibold hover:bg-red-700 transition transform hover:scale-105 inline-block">
                  SHOP TEES
                </a>
              </Link>
              <button className="px-8 py-4 border-2 border-white text-white font-semibold hover:bg-white hover:text-red-600 transition">
                PLUS SIZE COLLECTION
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-gray-50 py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium">4.8/5 • 1K+ Reviews</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <span className="text-sm font-medium">Free shipping over $75</span>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <span className="text-sm font-medium">30-day returns (no questions)</span>
          </div>
        </div>
      </section>

      {/* Core Tees Collection */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Core Collection</h2>
            <p className="text-gray-600 text-lg">Premium tees with attitude. 100% cotton. Zero BS.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tees.map((tee) => (
              <div key={tee.id} className="group cursor-pointer">
                <div className="relative bg-gray-100 aspect-square mb-4 overflow-hidden rounded-lg">
                  <img src={tee.image} alt={tee.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300"></div>
                  <button className="absolute bottom-4 left-4 right-4 py-3 bg-red-600 text-white font-semibold opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0">
                    ADD TO CART
                  </button>
                </div>
                <h3 className="text-lg font-semibold mb-1">{tee.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{tee.color}</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({tee.reviews})</span>
                </div>
                <p className="text-xl font-bold text-red-600">${tee.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plus Size Section */}
      <section className="py-20 bg-red-50 border-t-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Fake For Everyone</h2>
              <p className="text-lg text-gray-700 mb-4">
                Premium tees in XL-4XL. Same quality. Same attitude. Same price.
              </p>
              <p className="text-gray-600 mb-8">
                Because being fake should fit perfectly, no matter your size. We believe in inclusive irony.
              </p>
              <Link href="/shop?size=plus">
                <a className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold hover:bg-red-700 transition">
                  SHOP PLUS SIZE <ChevronRight size={20} />
                </a>
              </Link>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden">
              <img src={plusSizeImage} alt="Plus Size Collection" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plusSizeTees.map((tee) => (
              <div key={tee.id} className="group cursor-pointer bg-white p-6 rounded-lg hover:shadow-lg transition">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full mb-3">
                    PLUS SIZE
                  </span>
                  <h3 className="text-lg font-semibold mb-1">{tee.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{tee.color} • {tee.size}</p>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({tee.reviews})</span>
                </div>
                <p className="text-xl font-bold text-red-600 mb-4">${tee.price}</p>
                <button className="w-full py-2 bg-red-600 text-white font-semibold hover:bg-red-700 transition">
                  ADD TO CART
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Truck size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast Shipping</h3>
              <p className="text-gray-600">Free over $75</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <RotateCcw size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Returns</h3>
              <p className="text-gray-600">30 days, no questions</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Lock size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Checkout</h3>
              <p className="text-gray-600">SSL encrypted</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <MessageCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real Support</h3>
              <p className="text-gray-600">Humans, not bots</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">People Get It</h2>
            <p className="text-gray-600 text-lg">Real reviews from real fakers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{testimonial.name}</p>
                  {testimonial.verified && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Verified</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides & Manifesto */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Fake Philosophy</h2>
            <p className="text-gray-600 text-lg">Learn how to embrace the irony</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {guides.map((guide, idx) => (
              <div key={idx} className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition border border-gray-200">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                  <span className="text-2xl">💭</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{guide.title}</h3>
                <p className="text-gray-600 mb-6">{guide.description}</p>
                <button className="text-red-600 font-semibold flex items-center gap-2 hover:gap-3 transition">
                  Read More <ChevronRight size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-red-600">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Stay Fake</h2>
          <p className="text-white/90 text-lg mb-8">Get new drops, exclusive deals, and the occasional fake wisdom.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-6 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-8 py-4 bg-white text-red-600 font-semibold hover:bg-gray-100 transition rounded-lg">
              SUBSCRIBE
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div>
              <h3 className="text-white text-lg font-bold mb-4">FAKE</h3>
              <p className="text-sm text-gray-400 mb-6">Premium tees for people who get the irony. Life is fake. Just make it.</p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition text-sm">Instagram</a>
                <a href="#" className="text-gray-400 hover:text-white transition text-sm">Twitter</a>
              </div>
            </div>

            {/* Shop Column */}
            <div>
              <h4 className="text-white font-semibold mb-6">Shop</h4>
              <ul className="space-y-3">
                <li><Link href="/shop"><a className="text-gray-400 hover:text-white transition text-sm">All Tees</a></Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Plus Size</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">New Drops</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Sale</a></li>
              </ul>
            </div>

            {/* Account Column */}
            <div>
              <h4 className="text-white font-semibold mb-6">Account</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">My Account</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Orders</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Wishlist</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Rewards</a></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-white font-semibold mb-6">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Shipping Info</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Returns</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Terms</a></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">© 2026 Fake by Freetown. Life is fake. Just make it.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <span className="text-sm text-gray-400">Secure Payments</span>
                <span className="text-sm text-gray-400">SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
