import { useState } from 'react';
import { Link } from 'wouter';
import { ShoppingCart, Search, User, Truck, RotateCcw, Lock, MessageCircle, ChevronRight, Star } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');

  const tees = [
    {
      id: 1,
      name: 'You Fake Bro?',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-you-fake-bro-print-eet8LUrP4HA6J8dQWKbYtA.webp',
      price: 49,
      color: 'White',
      reviews: 342,
    },
    {
      id: 2,
      name: 'Life is Fake, Just Make It',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-life-is-fake-print-PpsibRwckFzqB7529S9JNs.webp',
      price: 49,
      color: 'Red',
      reviews: 289,
    },
    {
      id: 3,
      name: 'Fake Like My Office',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-fake-office-print-KVhFVyCPGuKRJjGSeQaR4t.webp',
      price: 49,
      color: 'Cream',
      reviews: 267,
    },
    {
      id: 4,
      name: 'The Real Fake',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-real-fake-print-RxkjSKEpm5isveF8ULVFZc.webp',
      price: 49,
      color: 'Black',
      reviews: 198,
    },
  ];

  const plusSizeTees = [
    {
      id: 5,
      name: 'You Fake Bro? (Plus)',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-you-fake-bro-print-eet8LUrP4HA6J8dQWKbYtA.webp',
      price: 54,
      color: 'White',
      size: 'XL-4XL',
      reviews: 156,
    },
    {
      id: 6,
      name: 'Life is Fake (Plus)',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-life-is-fake-print-PpsibRwckFzqB7529S9JNs.webp',
      price: 54,
      color: 'Red',
      size: 'XL-4XL',
      reviews: 142,
    },
    {
      id: 7,
      name: 'Fake Office (Plus)',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-fake-office-print-KVhFVyCPGuKRJjGSeQaR4t.webp',
      price: 54,
      color: 'Cream',
      size: 'XL-4XL',
      reviews: 128,
    },
    {
      id: 8,
      name: 'The Real Fake (Plus)',
      image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/tee-real-fake-print-RxkjSKEpm5isveF8ULVFZc.webp',
      price: 54,
      color: 'Black',
      size: 'XL-4XL',
      reviews: 94,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-red-600">FAKE</a>
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <Link href="/shop">
              <a className="text-gray-900 hover:text-red-600 transition">SHOP</a>
            </Link>
            <a href="#" className="text-gray-900 hover:text-red-600 transition">ABOUT</a>
            <a href="#" className="text-gray-900 hover:text-red-600 transition">CONTACT</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-red-600 transition">
              <Search size={20} />
            </button>
            <button className="text-gray-600 hover:text-red-600 transition relative">
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </button>
            <button className="text-gray-600 hover:text-red-600 transition">
              <User size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
            You Fake Bro?
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 font-light">
            Premium tees. Real attitude. No apologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <a className="bg-red-600 text-white px-8 py-3 font-semibold hover:bg-red-700 transition inline-block">
                SHOP TEES
              </a>
            </Link>
            <button className="border-2 border-red-600 text-red-600 px-8 py-3 font-semibold hover:bg-red-50 transition">
              PLUS SIZE
            </button>
          </div>
          <div className="mt-12 flex justify-center gap-8 text-sm text-gray-600">
            <div>4.8/5 • 1K+ Reviews</div>
            <div>Free shipping over $75</div>
            <div>30-day returns</div>
          </div>
        </div>
      </section>

      {/* Core Tees */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">The Collection</h2>
            <p className="text-gray-600">100% cotton. Zero BS.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tees.map((tee) => (
              <div key={tee.id} className="group">
                <div className="bg-gray-100 aspect-square mb-4 overflow-hidden">
                  <img 
                    src={tee.image} 
                    alt={tee.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{tee.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{tee.color}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900">${tee.price}</span>
                  <span className="text-xs text-gray-500">({tee.reviews})</span>
                </div>
                <button className="w-full bg-red-600 text-white py-2 font-semibold hover:bg-red-700 transition">
                  ADD TO CART
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plus Size Section */}
      <section className="py-16 px-4 bg-red-600">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-white">
            <h2 className="text-3xl font-bold mb-2">Fake For Everyone</h2>
            <p className="text-red-100">XL-4XL. Same tees. Same attitude. $5 more.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plusSizeTees.map((tee) => (
              <div key={tee.id} className="group bg-white rounded">
                <div className="bg-gray-100 aspect-square mb-4 overflow-hidden">
                  <img 
                    src={tee.image} 
                    alt={tee.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 mb-2">PLUS SIZE</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{tee.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{tee.color} • {tee.size}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900">${tee.price}</span>
                    <span className="text-xs text-gray-500">({tee.reviews})</span>
                  </div>
                  <button className="w-full bg-red-600 text-white py-2 font-semibold hover:bg-red-700 transition">
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <Truck className="text-red-600 mx-auto mb-2" size={32} />
              <div className="font-bold text-gray-900 mb-1">Fast</div>
              <p className="text-sm text-gray-600">Ships in 2-3 days</p>
            </div>
            <div>
              <RotateCcw className="text-red-600 mx-auto mb-2" size={32} />
              <div className="font-bold text-gray-900 mb-1">Easy</div>
              <p className="text-sm text-gray-600">30-day returns, no questions</p>
            </div>
            <div>
              <Lock className="text-red-600 mx-auto mb-2" size={32} />
              <div className="font-bold text-gray-900 mb-1">Secure</div>
              <p className="text-sm text-gray-600">SSL encrypted checkout</p>
            </div>
            <div>
              <MessageCircle className="text-red-600 mx-auto mb-2" size={32} />
              <div className="font-bold text-gray-900 mb-1">Real</div>
              <p className="text-sm text-gray-600">Humans answer emails</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 bg-gray-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Fake</h2>
          <p className="text-gray-300 mb-8">New drops. Exclusive deals. Real talk.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 text-gray-900 rounded"
            />
            <button className="bg-red-600 text-white px-6 py-3 font-semibold hover:bg-red-700 transition">
              SUBSCRIBE
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Shop</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/shop"><a className="hover:text-white transition">All Tees</a></Link></li>
                <li><a href="#" className="hover:text-white transition">Plus Size</a></li>
                <li><a href="#" className="hover:text-white transition">New Drops</a></li>
                <li><a href="#" className="hover:text-white transition">Sale</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Account</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">My Account</a></li>
                <li><a href="#" className="hover:text-white transition">Orders</a></li>
                <li><a href="#" className="hover:text-white transition">Wishlist</a></li>
                <li><a href="#" className="hover:text-white transition">Rewards</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Help</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white transition">Returns</a></li>
                <li><a href="#" className="hover:text-white transition">Size Guide</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
                <li><a href="#" className="hover:text-white transition">Accessibility</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm mb-4 md:mb-0">
                © 2026 Fake by Freetown. All rights reserved.
              </div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition">Instagram</a>
                <a href="#" className="hover:text-white transition">Twitter</a>
                <a href="#" className="hover:text-white transition">TikTok</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
