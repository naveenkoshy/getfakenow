import { useState } from 'react';
import { Link } from 'wouter';
import { ShoppingCart, User, Search, Heart, Truck, RotateCcw, Lock, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Footer } from '@/components/Footer';

export default function Home() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [hoveredCollection, setHoveredCollection] = useState<number | null>(null);

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
    { icon: Truck, title: 'Fast Shipping', description: 'Free over $100' },
    { icon: RotateCcw, title: 'Easy Returns', description: '30-day guarantee' },
    { icon: Lock, title: 'Secure Checkout', description: 'SSL encrypted' },
    { icon: MessageCircle, title: '24/7 Support', description: 'We\'re here to help' },
  ];

  return (
    <div style={{ background: '#ffffff', color: '#1a1a1a', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", color: '#e63946' }}>FAKE</div>
          </Link>
          
          <nav style={{ display: 'flex', gap: '40px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            <Link href="/shop" style={{ textDecoration: 'none', color: '#1a1a1a', transition: 'color 0.3s ease' }}>Shop</Link>
            <a href="#" style={{ textDecoration: 'none', color: '#1a1a1a', transition: 'color 0.3s ease', cursor: 'pointer' }}>About</a>
            <a href="#" style={{ textDecoration: 'none', color: '#1a1a1a', transition: 'color 0.3s ease', cursor: 'pointer' }}>Contact</a>
          </nav>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a1a1a', fontSize: '18px' }}>
              <Search size={20} />
            </button>
            <Link href="/cart" style={{ textDecoration: 'none', color: '#1a1a1a', position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span style={{ fontSize: '12px', fontWeight: 700, background: '#e63946', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
            </Link>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a1a1a', fontSize: '18px' }}>
              <User size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ marginTop: '70px', padding: '80px 20px', background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(230, 57, 70, 0.05) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-30%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(230, 57, 70, 0.03) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '64px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '20px', color: '#1a1a1a', lineHeight: 1.1 }}>LIVE YOUR TRUTH</h1>
          <p style={{ fontSize: '18px', color: '#e63946', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Curated lifestyle for the modern you</p>
          <p style={{ fontSize: '16px', color: '#666666', marginBottom: '40px', lineHeight: 1.8 }}>Timeless pieces that transcend trends. Quality that speaks for itself. A lifestyle that's authentically yours.</p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '40px' }}>
            <Link href="/shop">
              <button style={{ padding: '14px 40px', background: '#e63946', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s ease' }}>Shop Now</button>
            </Link>
            <button style={{ padding: '14px 40px', background: 'transparent', color: '#1a1a1a', border: '2px solid #1a1a1a', borderRadius: '4px', fontSize: '14px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s ease' }}>Explore Collections</button>
          </div>

          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center', fontSize: '13px', color: '#666666' }}>
            <span>⭐ 4.8/5 • 12K+ Reviews</span>
            <span>Free shipping over $100 • 30-day returns</span>
          </div>
        </div>

        <div style={{ marginTop: '60px', animation: 'bounce 2s infinite', textAlign: 'center', color: '#e63946', fontSize: '24px' }}>↓</div>
      </section>

      {/* Trending Now */}
      <section style={{ padding: '80px 20px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '50px', textAlign: 'center', color: '#1a1a1a' }}>TRENDING NOW</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {trendingProducts.map((product) => (
              <div key={product.id} 
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
                style={{ background: '#f9f9f9', borderRadius: '8px', padding: '20px', transition: 'all 0.3s ease', transform: hoveredProduct === product.id ? 'translateY(-8px)' : 'translateY(0)', boxShadow: hoveredProduct === product.id ? '0 12px 24px rgba(230, 57, 70, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)', border: hoveredProduct === product.id ? '1px solid #e63946' : '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '64px', textAlign: 'center', marginBottom: '16px' }}>{product.emoji}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#1a1a1a' }}>{product.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#e63946', fontWeight: 600 }}>⭐ {product.rating}</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>{product.price}</span>
                </div>
                <button style={{ width: '100%', padding: '12px', background: hoveredProduct === product.id ? '#e63946' : '#f0f0f0', color: hoveredProduct === product.id ? '#fff' : '#1a1a1a', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                  {hoveredProduct === product.id ? 'Add to Cart' : 'Quick View'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section style={{ padding: '80px 20px', background: '#f9f9f9' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '50px', textAlign: 'center', color: '#1a1a1a' }}>COLLECTIONS</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {collections.map((collection, idx) => (
              <div key={idx}
                onMouseEnter={() => setHoveredCollection(idx)}
                onMouseLeave={() => setHoveredCollection(null)}
                style={{ background: '#ffffff', borderRadius: '8px', padding: '40px 24px', textAlign: 'center', border: hoveredCollection === idx ? '2px solid #e63946' : '1px solid #e0e0e0', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#1a1a1a' }}>{collection.name}</h3>
                <p style={{ fontSize: '13px', color: '#999999', marginBottom: '16px' }}>{collection.description}</p>
                <a href="/shop" style={{ fontSize: '12px', fontWeight: 700, color: '#e63946', textDecoration: 'none', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Explore →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ padding: '80px 20px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px', color: '#e63946' }}>
                    <Icon size={40} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#1a1a1a' }}>{badge.title}</h3>
                  <p style={{ fontSize: '13px', color: '#999999' }}>{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 20px', background: '#f9f9f9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '50px', textAlign: 'center', color: '#1a1a1a' }}>CUSTOMER LOVE</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {testimonials.map((testimonial, idx) => (
              <div key={idx} style={{ background: '#ffffff', borderRadius: '8px', padding: '32px', border: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', marginBottom: '16px', color: '#e63946' }}>
                  {[...Array(testimonial.rating)].map((_, i) => <span key={i}>⭐</span>)}
                </div>
                <p style={{ fontSize: '14px', color: '#666666', marginBottom: '16px', lineHeight: 1.8 }}>"{testimonial.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{testimonial.author}</p>
                  {testimonial.verified && <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>✓ Verified</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button style={{ padding: '12px 32px', background: 'transparent', color: '#e63946', border: '2px solid #e63946', borderRadius: '4px', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s ease' }}>Load More Reviews</button>
          </div>
        </div>
      </section>

      {/* Editorial Content */}
      <section style={{ padding: '80px 20px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '50px', textAlign: 'center', color: '#1a1a1a' }}>STYLE GUIDES & INSPIRATION</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {[
              { title: '5 Ways to Style the Classic Tee', description: 'Discover how to make our signature tee work for every occasion.' },
              { title: 'Sustainable Fashion 101', description: 'Learn about our commitment to ethical sourcing and sustainability.' },
              { title: 'Seasonal Essentials 2026', description: 'Your curated guide to building a timeless wardrobe for the year ahead.' },
            ].map((guide, idx) => (
              <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                <div style={{ background: '#f0f0f0', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📖</div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#1a1a1a' }}>{guide.title}</h3>
                  <p style={{ fontSize: '13px', color: '#999999', marginBottom: '16px', lineHeight: 1.6 }}>{guide.description}</p>
                  <a href="#" style={{ fontSize: '12px', fontWeight: 700, color: '#e63946', textDecoration: 'none', letterSpacing: '0.5px' }}>Read More →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ padding: '80px 20px', background: '#e63946', color: '#ffffff' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '16px' }}>JOIN THE COMMUNITY</h2>
          <p style={{ fontSize: '14px', marginBottom: '32px', opacity: 0.95 }}>Get exclusive previews, early access to new collections, and curated style insights.</p>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input type="email" placeholder="Enter your email" style={{ flex: 1, padding: '14px 16px', borderRadius: '4px', border: 'none', fontSize: '14px', background: 'rgba(255, 255, 255, 0.9)' }} />
            <button style={{ padding: '14px 32px', background: '#ffffff', color: '#e63946', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s ease' }}>Subscribe</button>
          </div>
          <p style={{ fontSize: '11px', opacity: 0.8 }}>We respect your privacy. Unsubscribe anytime.</p>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
