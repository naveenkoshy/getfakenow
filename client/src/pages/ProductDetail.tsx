import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import {
  ShoppingCart, Search, User, Minus, Plus, Star, ArrowLeft,
  Truck, RotateCcw, Shield, ChevronDown, ChevronUp, Menu, X, Heart
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { updateMetaTags, injectStructuredData, generateProductSchema, generateBreadcrumbSchema, removeStructuredData } from "@/lib/seo";

const ALL_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL'];

const COLOR_MAP: Record<string, string> = {
  white: '#ffffff',
  black: '#111111',
  red: '#dc2626',
  cream: '#f5f0e8',
  navy: '#1e3a5f',
  gray: '#6b7280',
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { itemCount, addItem, isLoading: cartLoading } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showCareInfo, setShowCareInfo] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: product, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );
  const { data: relatedProducts } = trpc.products.getRelated.useQuery(
    { productId: product?.id!, limit: 4 },
    { enabled: !!product?.id }
  );

  // Set default color when product loads
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      setSelectedColor(product.images[0].color?.toLowerCase() || 'black');
    }
  }, [product]);

  // SEO
  useEffect(() => {
    if (!product) return;
    const seoDesc = `${product.name} - ${product.description?.split('.')[0] || 'Premium tee from Fake by Freetown'}`;
    updateMetaTags({
      title: `${product.name} | Fake by Freetown`,
      description: seoDesc,
      image: product.imageUrl || undefined,
      url: `https://getfakenow.com/product/${product.slug}`,
      type: 'product',
      price: product.price,
      currency: 'MYR',
      availability: product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      brand: 'Fake by Freetown',
      sku: product.id.toString(),
    });
    const productSchema = generateProductSchema({
      name: product.name,
      description: product.description || 'Premium tee from Fake by Freetown',
      image: product.imageUrl || '',
      price: product.price / 100,
      currency: 'MYR',
      availability: product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      brand: 'Fake by Freetown',
      sku: product.id.toString(),
      url: `https://getfakenow.com/product/${product.slug}`,
    });
    injectStructuredData(productSchema, 'product-schema');
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://getfakenow.com' },
      { name: 'Shop', url: 'https://getfakenow.com/shop' },
      { name: product.name, url: `https://getfakenow.com/product/${product.slug}` },
    ]);
    injectStructuredData(breadcrumbSchema, 'breadcrumb-schema');
    return () => {
      removeStructuredData('product-schema');
      removeStructuredData('breadcrumb-schema');
    };
  }, [product]);

  const getDisplayImage = () => {
    if (!product) return '';
    if (!selectedColor) return product.imageUrl || '';
    const variantImage = product.images?.find(
      (img: any) => img.color?.toLowerCase() === selectedColor.toLowerCase()
    );
    return variantImage?.imageUrl || product.imageUrl || '';
  };

  const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      toast.error('Pick a size first');
      return;
    }
    if (!selectedColor) {
      toast.error('Pick a color first');
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: getDisplayImage(),
      slug: product.slug,
      quantity,
      size: selectedSize,
      color: selectedColor,
    });
    toast.success(`${product.name} added to cart`);
  };

  const availableSizes = ALL_SIZES;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-3 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not found
  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <p className="text-gray-500">This item may have been removed or doesn't exist.</p>
        <Link href="/shop" className="bg-red-600 text-white px-8 py-3 text-sm font-semibold tracking-wider hover:bg-red-700 transition-colors">
          BACK TO SHOP
        </Link>
      </div>
    );
  }

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
            <Link href="/shop?category=business" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">BUSINESS</Link>
            <a href="/#about" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">ABOUT</a>
          </nav>
          <div className="flex items-center gap-5">
            <button className="text-gray-500 hover:text-red-600 transition-colors" aria-label="Search">
              <Search size={18} strokeWidth={2} />
            </button>
            <Link href="/cart" className="relative text-gray-500 hover:text-red-600 transition-colors">
              <ShoppingCart size={18} strokeWidth={2} />
              <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{itemCount}</span>
            </Link>
            <Link href="/account" className="text-gray-500 hover:text-red-600 transition-colors hidden sm:block">
              <User size={18} strokeWidth={2} />
            </Link>
            <button className="md:hidden text-gray-500" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
            <Link href="/shop" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link href="/shop?category=casual" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Casual</Link>
            <Link href="/shop?category=business" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Business</Link>
            <Link href="/account" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Account</Link>
          </div>
        )}
      </header>

      {/* ── Breadcrumb ── */}
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          <li><Link href="/" className="hover:text-red-600 transition-colors">Home</Link></li>
          <li>/</li>
          <li><Link href="/shop" className="hover:text-red-600 transition-colors">Shop</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      {/* ── Product Section ── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Left: Product Image */}
          <div className="relative">
            <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden">
              {getDisplayImage() ? (
                <img
                  src={getDisplayImage()}
                  alt={`${product.name} in ${selectedColor}`}
                  className={`w-full h-full object-cover object-top transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  key={selectedColor}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  No image available
                </div>
              )}
            </div>
            {/* Wishlist button */}
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600 transition-all" aria-label="Add to wishlist">
              <Heart size={18} />
            </button>
            {/* Badge */}
            {product.featured && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded">
                FEATURED
              </span>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">

            {/* Category */}
            {product.category && (
              <span className="text-xs font-semibold tracking-widest text-red-600 uppercase mb-2">
                {product.category.name}
              </span>
            )}

            {/* Name */}
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-sm text-gray-400">4.8 (342 reviews)</span>
            </div>

            {/* Description */}
            <p className="mt-6 text-gray-500 leading-relaxed">
              {product.description || `Premium heavyweight cotton tee with "${product.name}" print. Pre-shrunk fabric, relaxed fit, ribbed crew neck. Designed in Freetown. Made to last.`}
            </p>

            {/* Divider */}
            <div className="border-t border-gray-100 my-6" />

            {/* Color Selection */}
            {product.images && product.images.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    Color: <span className="font-normal text-gray-500 capitalize">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex gap-3">
                  {product.images.map((img: any) => {
                    const colorName = img.color?.toLowerCase() || 'black';
                    const hex = COLOR_MAP[colorName] || colorName;
                    const isSelected = selectedColor === colorName;
                    return (
                      <button
                        key={img.id}
                        onClick={() => {
                          setSelectedColor(colorName);
                          setImageLoaded(false);
                        }}
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-red-600 ring-2 ring-red-600/30 ring-offset-2'
                            : 'border-gray-200 hover:border-gray-400'
                        } ${colorName === 'white' ? 'shadow-inner' : ''}`}
                        style={{ backgroundColor: hex }}
                        title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                        aria-label={`Select ${colorName} color`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.stockQuantity > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    Size: <span className="font-normal text-gray-500">{selectedSize || 'Select'}</span>
                  </span>
                  <button
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 underline underline-offset-2 transition-colors"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-12 px-4 border-2 text-sm font-semibold tracking-wide transition-all duration-200 rounded ${
                        selectedSize === size
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-900'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Size Guide Dropdown */}
                {showSizeGuide && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Size Guide (inches)</h4>
                    <table className="w-full text-xs text-gray-600">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-semibold text-gray-900">Size</th>
                          <th className="text-center py-2 font-semibold text-gray-900">Chest</th>
                          <th className="text-center py-2 font-semibold text-gray-900">Length</th>
                          <th className="text-center py-2 font-semibold text-gray-900">Shoulder</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { size: 'S', chest: '36-38', length: '27', shoulder: '17' },
                          { size: 'M', chest: '38-40', length: '28', shoulder: '18' },
                          { size: 'L', chest: '40-42', length: '29', shoulder: '19' },
                          { size: 'XL', chest: '42-44', length: '30', shoulder: '20' },
                          { size: '2XL', chest: '44-48', length: '31', shoulder: '21' },
                          { size: '3XL', chest: '48-52', length: '32', shoulder: '22' },
                          { size: '4XL', chest: '52-56', length: '33', shoulder: '23' },
                          { size: '5XL', chest: '56-60', length: '34', shoulder: '24' },
                          { size: '6XL', chest: '60-64', length: '35', shoulder: '25' },
                          { size: '7XL', chest: '64-68', length: '36', shoulder: '26' },
                          { size: '8XL', chest: '68-72', length: '37', shoulder: '27' },
                          { size: '9XL', chest: '72-76', length: '38', shoulder: '28' },
                          { size: '10XL', chest: '76-80', length: '39', shoulder: '29' },
                        ].map((row) => (
                          <tr key={row.size} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-medium">{row.size}</td>
                            <td className="py-2 text-center">{row.chest}</td>
                            <td className="py-2 text-center">{row.length}</td>
                            <td className="py-2 text-center">{row.shoulder}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Quantity + Add to Cart */}
            {product.stockQuantity > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-900">Qty:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-semibold text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      disabled={quantity >= product.stockQuantity}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">{product.stockQuantity} in stock</span>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="w-full bg-red-600 text-white py-4 text-sm font-bold tracking-widest hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-600/30 flex items-center justify-center gap-3 rounded disabled:opacity-50"
                >
                  <ShoppingCart size={18} />
                  {cartLoading ? 'ADDING...' : 'ADD TO CART'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Sold Out</p>
                <p className="text-sm text-gray-500 mt-1">This item is currently unavailable. Check back soon.</p>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="flex flex-col items-center text-center gap-1.5">
                <Truck size={18} className="text-red-600" />
                <span className="text-xs text-gray-500">Free shipping<br />over RM75</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <RotateCcw size={18} className="text-red-600" />
                <span className="text-xs text-gray-500">30-day<br />returns</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <Shield size={18} className="text-red-600" />
                <span className="text-xs text-gray-500">Secure<br />checkout</span>
              </div>
            </div>

            {/* Care Instructions Accordion */}
            <div className="mt-6 border-t border-gray-100">
              <button
                onClick={() => setShowCareInfo(!showCareInfo)}
                className="w-full flex items-center justify-between py-4 text-sm font-semibold text-gray-900 hover:text-red-600 transition-colors"
              >
                Product Details & Care
                {showCareInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showCareInfo && (
                <div className="pb-4 text-sm text-gray-500 space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Material</h4>
                    <p>100% premium combed cotton, 220 GSM heavyweight</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Fit</h4>
                    <p>Relaxed fit, pre-shrunk, ribbed crew neck, double-stitched hems</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Care</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Machine wash cold, inside out</li>
                      <li>Tumble dry low or hang dry</li>
                      <li>Do not bleach</li>
                      <li>Iron on reverse side only</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Print</h4>
                    <p>DTG (Direct to Garment) printing. Won't crack, peel, or fade.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── You Might Also Like ── */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 mb-10">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((rp: any) => (
                <Link key={rp.id} href={`/product/${rp.slug}`} className="group">
                  <div className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                    <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                      {rp.imageUrl ? (
                        <img
                          src={rp.imageUrl}
                          alt={rp.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-red-600 transition-colors">
                        {rp.name}
                      </h3>
                      <p className="mt-2 text-base font-bold text-gray-900">
                        RM {(rp.price / 100).toFixed(2)}
                      </p>
                      {rp.stockQuantity > 0 ? (
                        <span className="text-xs text-green-600 font-medium mt-1 block">In Stock</span>
                      ) : (
                        <span className="text-xs text-red-500 font-medium mt-1 block">Sold Out</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-14 pb-14 border-b border-gray-800">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-white tracking-wider">FAKE</span>
                <span className="text-sm text-gray-400" style={{ fontFamily: "'Dancing Script', cursive" }}>by Freetown</span>
              </div>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                Premium lifestyle apparel.<br />S to 10XL. No exceptions.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Shop</h3>
              <ul className="space-y-2.5">
                <li><Link href="/shop" className="text-sm text-gray-400 hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/shop?category=casual" className="text-sm text-gray-400 hover:text-white transition-colors">Casual</Link></li>
                <li><Link href="/shop?category=business" className="text-sm text-gray-400 hover:text-white transition-colors">Business</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Account</h3>
              <ul className="space-y-2.5">
                <li><Link href="/account" className="text-sm text-gray-400 hover:text-white transition-colors">My Account</Link></li>
                <li><Link href="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">Orders</Link></li>
                <li><Link href="/cart" className="text-sm text-gray-400 hover:text-white transition-colors">Cart</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Help</h3>
              <ul className="space-y-2.5">
                <li><Link href="/shipping-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Shipping</Link></li>
                <li><Link href="/returns-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Returns</Link></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Legal</h3>
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
    </div>
  );
}
