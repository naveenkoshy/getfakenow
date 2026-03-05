import React, { useState } from 'react';
import { Link } from 'wouter';
import { ShoppingCart, User, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Footer } from '@/components/Footer';

export default function Home() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [hoveredCollection, setHoveredCollection] = useState<number | null>(null);
  const [hoveredBadge, setHoveredBadge] = useState<number | null>(null);

  const trendingProducts = [
    { id: 1, name: 'Classic Tee', price: '$89', emoji: '👕', rating: '4.8' },
    { id: 2, name: 'Luxury Hoodie', price: '$189', emoji: '🧥', rating: '4.9' },
    { id: 3, name: 'Tailored Pants', price: '$159', emoji: '👖', rating: '4.7' },
    { id: 4, name: 'Wool Jacket', price: '$249', emoji: '🧥', rating: '4.8' },
  ];

  const collections = [
    { name: 'Essentials', description: 'The basics, elevated' },
    { name: 'Bold', description: 'Make a statement' },
    { name: 'Comfort', description: 'All-day wearability' },
    { name: 'Professional', description: 'Work with edge' },
  ];

  const testimonials = [
    { text: 'Best quality I\'ve found. Worth every penny.', author: 'Sarah M.', rating: 5, verified: true },
    { text: 'The attention to detail is incredible. Highly recommend.', author: 'James T.', rating: 5, verified: true },
    { text: 'Finally found a brand that gets it. Timeless pieces.', author: 'Alex R.', rating: 5, verified: true },
  ];

  const trustBadges = [
    { icon: '📦', title: 'Fast Shipping', description: 'Free over $100' },
    { icon: '🔄', title: 'Easy Returns', description: '30-day guarantee' },
    { icon: '🛡️', title: 'Secure Checkout', description: 'SSL encrypted' },
    { icon: '💬', title: '24/7 Support', description: 'We\'re here to help' },
  ];

  return (
    <div style={{ background: '#0f0f0f', color: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #333' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>FAKE</div>
          </Link>
          
          <nav style={{ display: 'flex', gap: '32px', fontSize: '12px', fontWeight: 500, letterSpacing: '1px' }}>
            <a href="#" style={{ color: '#b3b3b3', textDecoration: 'none', textTransform: 'uppercase', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = '#00d9ff'} onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = '#b3b3b3'}>Shop</a>
            <a href="#" style={{ color: '#b3b3b3', textDecoration: 'none', textTransform: 'uppercase', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = '#00d9ff'} onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = '#b3b3b3'}>About</a>
            <a href="#" style={{ color: '#b3b3b3', textDecoration: 'none', textTransform: 'uppercase', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = '#00d9ff'} onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = '#b3b3b3'}>Contact</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '8px', fontSize: '20px' }}>🔍</button>
            <Link href="/cart" style={{ position: 'relative', textDecoration: 'none', color: '#b3b3b3', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '20px' }}>🛒</span>
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#00d9ff', color: '#0f0f0f', fontSize: '10px', fontWeight: 700, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <button style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '8px', fontSize: '20px' }}>👤</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', overflow: 'hidden', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' }}>
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(48px, 12vw, 80px)', fontWeight: 700, letterSpacing: '-2px', marginBottom: '20px', lineHeight: 1.1, fontFamily: "'Space Mono', monospace" }}>LIVE YOUR TRUTH</h1>
          <p style={{ fontSize: '28px', fontWeight: 300, marginBottom: '20px', lineHeight: 1.3, color: '#b3b3b3' }}>Curated lifestyle for the <span style={{ color: '#00d9ff' }}>modern you</span></p>
          <p style={{ fontSize: '16px', color: '#b3b3b3', marginBottom: '40px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', fontWeight: 300, lineHeight: 1.8 }}>Timeless pieces that transcend trends. Quality that speaks for itself. A lifestyle that's authentically yours.</p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
            <Link href="/shop">
              <button style={{ background: '#fff', color: '#0f0f0f', border: '2px solid #fff', fontWeight: 600, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase', padding: '14px 32px', borderRadius: '2px', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#0f0f0f'; (e.target as HTMLButtonElement).style.color = '#fff'; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#fff'; (e.target as HTMLButtonElement).style.color = '#0f0f0f'; }}>Shop Now</button>
            </Link>
            <button style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', fontWeight: 600, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase', padding: '14px 32px', borderRadius: '2px', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#fff'; (e.target as HTMLButtonElement).style.color = '#0f0f0f'; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = '#fff'; }}>Explore Collections</button>
          </div>
          <div style={{ fontSize: '14px', color: '#b3b3b3' }}>
            <div>⭐ 4.8/5 • 12K+ Reviews</div>
            <div style={{ marginTop: '8px' }}>Free shipping over $100 • 30-day returns</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s infinite', zIndex: 10, color: '#00d9ff', fontSize: '24px' }}>↓</div>
      </section>

      {/* Trending Now */}
      <section style={{ padding: '60px 20px', background: '#0f0f0f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '40px', color: '#fff', fontFamily: "'Space Mono', monospace" }}>TRENDING NOW</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {trendingProducts.map((product) => (
              <div key={product.id} style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', transition: 'all 0.3s ease', background: '#1a1a1a', border: '1px solid #333', cursor: 'pointer', borderColor: hoveredProduct === product.id ? '#00d9ff' : '#333', transform: hoveredProduct === product.id ? 'translateY(-8px)' : 'translateY(0)', boxShadow: hoveredProduct === product.id ? '0 20px 40px rgba(0, 217, 255, 0.1)' : 'none' }} onMouseEnter={() => setHoveredProduct(product.id)} onMouseLeave={() => setHoveredProduct(null)}>
                <div style={{ width: '100%', aspectRatio: '1', background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>{product.emoji}</div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', fontWeight: 400, color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>⭐ {product.rating}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#d4af37', marginBottom: '16px' }}>{product.price}</div>
                  <button style={{ width: '100%', padding: '12px', borderRadius: '2px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', background: '#00d9ff', color: '#0f0f0f', border: '2px solid #00d9ff', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = '#00d9ff'; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#00d9ff'; (e.target as HTMLButtonElement).style.color = '#0f0f0f'; }}>Quick Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section style={{ padding: '40px 20px', background: '#1a1a1a', borderTop: '1px solid #333' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="🔍 Search products, collections, guides..." style={{ flex: 1, minWidth: '200px', padding: '12px 16px', background: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontSize: '14px' }} />
          <select style={{ padding: '12px 16px', background: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
            <option>All Categories</option>
            <option>Apparel</option>
            <option>Accessories</option>
            <option>Lifestyle</option>
          </select>
          <select style={{ padding: '12px 16px', background: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
            <option>Best Sellers</option>
          </select>
        </div>
      </section>

      {/* Collections */}
      <section style={{ padding: '80px 20px', background: '#0f0f0f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '50px', textAlign: 'center', fontFamily: "'Space Mono', monospace" }}>COLLECTIONS</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '50px' }}>
            {collections.map((collection, idx) => (
              <div key={idx} style={{ position: 'relative', aspectRatio: '1', background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333', borderColor: hoveredCollection === idx ? '#00d9ff' : '#333', transform: hoveredCollection === idx ? 'scale(1.02)' : 'scale(1)' }} onMouseEnter={() => setHoveredCollection(idx)} onMouseLeave={() => setHoveredCollection(null)}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', fontFamily: "'Space Mono', monospace" }}>{collection.name}</h3>
                  <p style={{ fontSize: '14px', color: '#b3b3b3', marginTop: '10px' }}>{collection.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '40px 20px', background: '#0f0f0f', maxWidth: '1400px', margin: '0 auto' }}>
        {trustBadges.map((badge, idx) => (
          <div key={idx} style={{ textAlign: 'center', padding: '20px', border: '1px solid #333', borderRadius: '4px', transition: 'all 0.3s ease', cursor: 'pointer', borderColor: hoveredBadge === idx ? '#00d9ff' : '#333', background: hoveredBadge === idx ? 'rgba(0, 217, 255, 0.05)' : 'transparent' }} onMouseEnter={() => setHoveredBadge(idx)} onMouseLeave={() => setHoveredBadge(null)}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{badge.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: '5px', color: '#fff' }}>{badge.title}</div>
            <div style={{ fontSize: '14px', color: '#b3b3b3' }}>{badge.description}</div>
          </div>
        ))}
      </section>

      {/* Social Proof */}
      <section style={{ padding: '60px 20px', background: '#1a1a1a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '50px', fontFamily: "'Space Mono', monospace" }}>CUSTOMER LOVE</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '50px' }}>
            {testimonials.map((testimonial, idx) => (
              <div key={idx} style={{ background: '#2a2a2a', padding: '30px', borderRadius: '4px', border: '1px solid #333' }}>
                <div style={{ color: '#d4af37', marginBottom: '15px', fontSize: '14px' }}>
                  {'⭐'.repeat(testimonial.rating)}
                </div>
                <div style={{ color: '#b3b3b3', marginBottom: '15px', fontSize: '14px', lineHeight: 1.8 }}>"{testimonial.text}"</div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                  {testimonial.author}
                  {testimonial.verified && ' ✓ Verified Purchase'}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', fontWeight: 600, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase', padding: '14px 32px', borderRadius: '2px', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#fff'; (e.target as HTMLButtonElement).style.color = '#0f0f0f'; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = '#fff'; }}>Load More Reviews</button>
          </div>
        </div>
      </section>

      {/* Editorial Section */}
      <section style={{ padding: '80px 20px', background: '#1a1a1a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '50px', textAlign: 'center', fontFamily: "'Space Mono', monospace" }}>STYLE GUIDES & INSPIRATION</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            <div style={{ background: '#2a2a2a', padding: '30px', borderRadius: '4px', border: '1px solid #333' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
              <h3 style={{ marginBottom: '10px', fontWeight: 600 }}>5 Ways to Style the Classic Tee</h3>
              <p style={{ color: '#b3b3b3', marginBottom: '16px', fontSize: '14px' }}>Discover how to make our signature tee work for every occasion.</p>
              <a href="#" style={{ color: '#00d9ff', textDecoration: 'none', fontWeight: 600 }}>Read More →</a>
            </div>
            <div style={{ background: '#2a2a2a', padding: '30px', borderRadius: '4px', border: '1px solid #333' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
              <h3 style={{ marginBottom: '10px', fontWeight: 600 }}>Sustainable Fashion 101</h3>
              <p style={{ color: '#b3b3b3', marginBottom: '16px', fontSize: '14px' }}>Learn about our commitment to ethical sourcing and sustainability.</p>
              <a href="#" style={{ color: '#00d9ff', textDecoration: 'none', fontWeight: 600 }}>Read More →</a>
            </div>
            <div style={{ background: '#2a2a2a', padding: '30px', borderRadius: '4px', border: '1px solid #333' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ marginBottom: '10px', fontWeight: 600 }}>Seasonal Essentials 2026</h3>
              <p style={{ color: '#b3b3b3', marginBottom: '16px', fontSize: '14px' }}>Your curated guide to building a timeless wardrobe for the year ahead.</p>
              <a href="#" style={{ color: '#00d9ff', textDecoration: 'none', fontWeight: 600 }}>Read More →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section style={{ padding: '80px 20px', background: '#0f0f0f', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '20px', fontFamily: "'Space Mono', monospace" }}>JOIN THE COMMUNITY</h2>
          <p style={{ color: '#b3b3b3', marginBottom: '30px' }}>Get exclusive previews, early access to new collections, and curated style insights.</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input type="email" placeholder="Enter your email" style={{ flex: 1, padding: '12px 16px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontSize: '14px' }} />
            <button style={{ background: '#00d9ff', color: '#0f0f0f', border: '2px solid #00d9ff', fontWeight: 600, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase', padding: '12px 24px', borderRadius: '2px', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = '#00d9ff'; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#00d9ff'; (e.target as HTMLButtonElement).style.color = '#0f0f0f'; }}>Subscribe</button>
          </div>
          <p style={{ fontSize: '12px', color: '#808080' }}>We respect your privacy. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(10px); }
        }
      `}</style>
    </div>
  );
}
