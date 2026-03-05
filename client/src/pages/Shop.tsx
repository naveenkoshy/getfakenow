import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'wouter';
import { ChevronDown, X, Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  featured?: boolean;
  rating?: number;
}

const mockProducts: Product[] = [
  { id: 1, name: 'Classic T-Shirt', price: 8900, categoryId: 1, rating: 4.8 },
  { id: 2, name: 'Luxury Hoodie', price: 18900, categoryId: 1, rating: 4.9 },
  { id: 3, name: 'Tailored Pants', price: 15900, categoryId: 2, rating: 4.7 },
  { id: 4, name: 'Wool Jacket', price: 24900, categoryId: 2, rating: 4.8 },
  { id: 5, name: 'Premium Tee Pack', price: 19900, categoryId: 1, rating: 4.6 },
  { id: 6, name: 'Casual Shorts', price: 7900, categoryId: 1, rating: 4.5 },
  { id: 7, name: 'Formal Blazer', price: 29900, categoryId: 2, rating: 4.9 },
  { id: 8, name: 'Comfort Joggers', price: 12900, categoryId: 1, rating: 4.7 },
];

const categories = [
  { id: 1, name: 'Apparel' },
  { id: 2, name: 'Professional' },
  { id: 3, name: 'Accessories' },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const colors = ['Black', 'White', 'Navy', 'Red', 'Gray'];

interface Filters {
  search: string;
  categories: number[];
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  sortBy: 'price-low' | 'price-high' | 'rating' | 'newest';
}

export default function Shop() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categories: [],
    priceRange: [0, 30000],
    sizes: [],
    colors: [],
    sortBy: 'newest',
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let results = mockProducts.filter(product => {
      // Search filter
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.categoryId)) {
        return false;
      }

      // Price filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      return true;
    });

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        results.sort((a, b) => b.id - a.id);
    }

    return results;
  }, [filters]);

  // Search autocomplete
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));

    if (value.length > 0) {
      const suggestions = mockProducts
        .filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
        .map(p => p.name)
        .slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setFilters(prev => ({ ...prev, search: suggestion }));
    setShowSuggestions(false);
  };

  const toggleCategory = (categoryId: number) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleSize = (size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const toggleColor = (color: string) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      priceRange: [0, 30000],
      sizes: [],
      colors: [],
      sortBy: 'newest',
    });
  };

  const activeFilterCount = [
    filters.search ? 1 : 0,
    filters.categories.length,
    filters.sizes.length,
    filters.colors.length,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 30000 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div style={{ background: '#0f0f0f', color: '#fff', minHeight: '100vh', paddingTop: '80px' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #333', padding: '20px', background: '#1a1a1a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '10px', fontFamily: "'Space Mono', monospace" }}>SHOP</h1>
          <p style={{ color: '#b3b3b3', fontSize: '14px' }}>Discover our curated collection of lifestyle products</p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px' }}>
        {/* Sidebar Filters - Desktop */}
        <div style={{ display: showMobileFilters ? 'block' : 'none' }}>
          <div style={{ position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Filters</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  style={{ color: '#00d9ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '30px', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#2a2a2a', border: '1px solid #333', borderTop: 'none', borderRadius: '0 0 4px 4px', zIndex: 10 }}>
                    {searchSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: idx < searchSuggestions.length - 1 ? '1px solid #333' : 'none', fontSize: '14px' }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = '#333'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Categories */}
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', color: '#b3b3b3' }}>Category</h4>
              {categories.map(category => (
                <label key={category.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px' }}>{category.name}</span>
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', color: '#b3b3b3' }}>Price Range</h4>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <input
                  type="number"
                  min="0"
                  max="30000"
                  value={filters.priceRange[0]}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [parseInt(e.target.value), prev.priceRange[1]] }))}
                  style={{ flex: 1, padding: '8px', background: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  max="30000"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], parseInt(e.target.value)] }))}
                  style={{ flex: 1, padding: '8px', background: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                  placeholder="Max"
                />
              </div>
              <div style={{ fontSize: '12px', color: '#b3b3b3' }}>
                ${(filters.priceRange[0] / 100).toFixed(2)} - ${(filters.priceRange[1] / 100).toFixed(2)}
              </div>
            </div>

            {/* Sizes */}
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', color: '#b3b3b3' }}>Size</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    style={{
                      padding: '8px',
                      background: filters.sizes.includes(size) ? '#00d9ff' : '#2a2a2a',
                      color: filters.sizes.includes(size) ? '#0f0f0f' : '#fff',
                      border: '1px solid ' + (filters.sizes.includes(size) ? '#00d9ff' : '#333'),
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', color: '#b3b3b3' }}>Color</h4>
              {colors.map(color => (
                <label key={color} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filters.colors.includes(color)}
                    onChange={() => toggleColor(color)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px' }}>{color}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ fontSize: '14px', color: '#b3b3b3' }}>
              Showing <strong style={{ color: '#fff' }}>{filteredProducts.length}</strong> products
              {activeFilterCount > 0 && <span> ({activeFilterCount} filters active)</span>}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                style={{
                  padding: '8px 12px',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>

              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                style={{
                  padding: '8px 12px',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {filteredProducts.map(product => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <div
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#00d9ff';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0, 217, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#333';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1', background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                      📦
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>{product.name}</h3>
                      {product.rating && (
                        <div style={{ fontSize: '12px', color: '#b3b3b3', marginBottom: '8px' }}>⭐ {product.rating}</div>
                      )}
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#d4af37' }}>${(product.price / 100).toFixed(2)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b3b3b3' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button
                onClick={clearFilters}
                style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  background: '#00d9ff',
                  color: '#0f0f0f',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      {filteredProducts.length > 0 && (
        <div style={{ padding: '60px 20px', background: '#1a1a1a', borderTop: '1px solid #333' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '30px', fontFamily: "'Space Mono', monospace" }}>YOU MIGHT ALSO LIKE</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {mockProducts.slice(0, 4).map(product => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <div
                    style={{
                      background: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#d4af37';
                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#333';
                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1', background: 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                      ✨
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{product.name}</h3>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#d4af37' }}>${(product.price / 100).toFixed(2)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
