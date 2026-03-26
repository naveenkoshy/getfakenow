import { useState, useEffect, useMemo } from 'react';
import { Link, useSearch, useLocation } from 'wouter';
import { ShoppingCart, Search, User, ArrowRight, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/contexts/CartContext';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/_core/hooks/useAuth';
import { updateMetaTags, injectStructuredData, generateBreadcrumbSchema, removeStructuredData } from '@/lib/seo';

export default function Shop() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const categoryParam = params.get('category');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();

  // Fetch categories and products from API
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: allProducts = [], isLoading } = trpc.products.list.useQuery();

  // Determine active category from URL param
  const activeCategory = useMemo(() => {
    if (!categoryParam) return null;
    return categories.find(c => c.slug === categoryParam) || null;
  }, [categoryParam, categories]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let results = [...allProducts];

    // Category filter
    if (activeCategory) {
      results = results.filter(p => p.categoryId === activeCategory.id);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        results.sort((a, b) => b.id - a.id);
    }

    return results;
  }, [allProducts, activeCategory, searchQuery, sortBy]);

  const setCategory = (slug: string | null) => {
    if (slug) {
      navigate(`/shop?category=${slug}`);
    } else {
      navigate('/shop');
    }
  };

  // Page title based on category
  // SEO for shop page
  useEffect(() => {
    const title = activeCategory ? `${activeCategory.name} | Fake by Freetown` : 'Shop All | Fake by Freetown';
    const desc = activeCategory
      ? `Browse our ${activeCategory.name.toLowerCase()} collection. Premium apparel from Fake by Freetown. S to 10XL. One price. One quality.`
      : 'Shop the full Fake by Freetown collection. Streetwear, casual, women\'s, and business apparel. S to 10XL. One price. One quality. Zero fine print.';
    updateMetaTags({ title, description: desc, url: `https://getfakenow.com/shop${activeCategory ? `?category=${activeCategory.slug}` : ''}`, type: 'website' });
    const breadcrumbs = [{ name: 'Home', url: 'https://getfakenow.com' }, { name: 'Shop', url: 'https://getfakenow.com/shop' }];
    if (activeCategory) breadcrumbs.push({ name: activeCategory.name, url: `https://getfakenow.com/shop?category=${activeCategory.slug}` });
    injectStructuredData(generateBreadcrumbSchema(breadcrumbs), 'shop-breadcrumb');
    return () => { removeStructuredData('shop-breadcrumb'); };
  }, [activeCategory]);

  const pageTitle = activeCategory ? activeCategory.name : 'All Products';
  const pageSubtitle = activeCategory
    ? `Browse our ${activeCategory.name.toLowerCase()} collection`
    : 'Every piece has a name. Every name has a story.';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-black tracking-tight">
              <span className="text-red-600">FAKE</span>
              <span className="text-gray-400 text-xs font-light ml-1 italic">by Freetown</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/shop" className={`text-xs font-semibold tracking-widest ${!categoryParam ? 'text-red-600' : 'text-gray-700'} hover:text-red-600 transition-colors`}>
                ALL
              </Link>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.slug)}
                  className={`text-xs font-semibold tracking-widest ${activeCategory?.id === cat.id ? 'text-red-600' : 'text-gray-700'} hover:text-red-600 transition-colors`}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
              <Link href="/about" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">
                ABOUT
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/cart" className="relative">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <Link href="/account">
                  <User className="w-5 h-5 text-gray-700" />
                </Link>
              ) : (
                <button onClick={() => setAuthModalOpen(true)}>
                  <User className="w-5 h-5 text-gray-700" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="pt-16">
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-black tracking-tight text-gray-900">{pageTitle}</h1>
            <p className="mt-2 text-gray-500 text-sm">{pageSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Category pills - mobile scrollable */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setCategory(null)}
                className={`shrink-0 px-4 py-1.5 text-xs font-semibold tracking-wider rounded-full transition-all ${
                  !activeCategory
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ALL
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.slug)}
                  className={`shrink-0 px-4 py-1.5 text-xs font-semibold tracking-wider rounded-full transition-all ${
                    activeCategory?.id === cat.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-gray-400 w-48"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white focus:outline-none focus:border-gray-400 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <p className="text-xs text-gray-400 tracking-wider">
          {isLoading ? 'Loading...' : `${filteredProducts.length} PRODUCT${filteredProducts.length !== 1 ? 'S' : ''}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-sm" />
                <div className="mt-3 h-4 bg-gray-100 rounded w-3/4" />
                <div className="mt-2 h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredProducts.map(product => (
              <Link key={product.id} href={`/product/${product.slug}`} className="group block">
                <div className="aspect-square bg-gray-50 overflow-hidden rounded-sm">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors leading-tight">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    RM {(product.price / 100).toFixed(0)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400 tracking-wider">{categories.find(c => c.id === product.categoryId)?.name?.toLowerCase() === 'women' ? 'XXS — 4XL' : 'S — 10XL'}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">No products found.</p>
            <button
              onClick={() => { setSearchQuery(''); setCategory(null); }}
              className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Brand Banner */}
      <div className="bg-red-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white text-2xl font-black tracking-tight">Zero Fine Print</p>
          <p className="mt-2 text-red-100 text-sm max-w-lg mx-auto">
            We put 'Fake' on the label so you'd never have to question what's real. Every product. Every size. One price. One quality.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xs font-semibold tracking-widest text-gray-400 mb-4">SHOP</h4>
              <div className="space-y-2">
                <Link href="/shop" className="block text-sm text-gray-300 hover:text-white transition-colors">All Products</Link>
                <Link href="/shop?category=casual" className="block text-sm text-gray-300 hover:text-white transition-colors">Casual</Link>
                <Link href="/shop?category=women" className="block text-sm text-gray-300 hover:text-white transition-colors">Women</Link>
                <Link href="/shop?category=professional" className="block text-sm text-gray-300 hover:text-white transition-colors">Business</Link>
                <Link href="/shop?category=accessories" className="block text-sm text-gray-300 hover:text-white transition-colors">Accessories</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest text-gray-400 mb-4">COMPANY</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-gray-300 hover:text-white transition-colors">About</Link>
                <Link href="/shipping-policy" className="block text-sm text-gray-300 hover:text-white transition-colors">Shipping</Link>
                <Link href="/returns-policy" className="block text-sm text-gray-300 hover:text-white transition-colors">Returns</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest text-gray-400 mb-4">LEGAL</h4>
              <div className="space-y-2">
                <Link href="/privacy-policy" className="block text-sm text-gray-300 hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms-of-service" className="block text-sm text-gray-300 hover:text-white transition-colors">Terms</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest text-gray-400 mb-4">PROMISE</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Every product. Every size. One price. One quality. Zero fine print.
              </p>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Fake by Freetown. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
