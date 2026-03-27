import { SITE_URL } from "@/lib/seo";
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

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL'];
const WOMEN_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

const COLOR_MAP: Record<string, string> = {
  white: '#ffffff',
  black: '#111111',
  red: '#dc2626',
  cream: '#f5f0e8',
  navy: '#1e3a5f',
  gray: '#6b7280',
};

// Collection label system - maps collection type to display info
const COLLECTION_LABELS: Record<string, { name: string; color: string; bg: string; border: string }> = {
  headline: { name: 'HEADLINE', color: 'text-red-600', bg: 'bg-black', border: 'border-red-600' },
  essential: { name: 'ESSENTIAL', color: 'text-gray-700', bg: 'bg-white', border: 'border-gray-300' },
  professional: { name: 'PROFESSIONAL', color: 'text-white', bg: 'bg-[#1e3a5f]', border: 'border-[#1e3a5f]' },
  women: { name: 'WOMEN', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  accessories: { name: 'ACCESSORIES', color: 'text-white', bg: 'bg-gray-900', border: 'border-gray-700' },
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

  // Wishlist
  const { data: wishlistIds } = trpc.wishlist.productIds.useQuery(undefined, { enabled: isAuthenticated });
  const toggleWishlist = trpc.wishlist.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.wishlist.productIds.invalidate();
      utils.wishlist.count.invalidate();
    },
  });
  const utils = trpc.useUtils();
  const isWishlisted = product?.id ? wishlistIds?.includes(product.id) : false;

  // Separate label images from color variant images
  const colorImages = product?.images?.filter((img: any) => img.color?.toLowerCase() !== 'label') || [];
  const labelImage = product?.images?.find((img: any) => img.color?.toLowerCase() === 'label');
  const [showingLabel, setShowingLabel] = useState(false);

  // Determine collection type from label fileKey
  const collectionType = labelImage ? (labelImage as any).fileKey?.split('-')[1] || '' : '';
  const collectionInfo = COLLECTION_LABELS[collectionType];

  // Set default color when product loads
  useEffect(() => {
    if (colorImages.length > 0) {
      setSelectedColor(colorImages[0].color?.toLowerCase() || 'black');
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
      url: `${SITE_URL}/product/${product.slug}`,
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
      url: `${SITE_URL}/product/${product.slug}`,
    });
    injectStructuredData(productSchema, 'product-schema');
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Shop', url: '${SITE_URL}/shop' },
      { name: product.name, url: `${SITE_URL}/product/${product.slug}` },
    ]);
    injectStructuredData(breadcrumbSchema, 'breadcrumb-schema');
    return () => {
      removeStructuredData('product-schema');
      removeStructuredData('breadcrumb-schema');
    };
  }, [product]);

  const getDisplayImage = () => {
    if (!product) return '';
    if (showingLabel && labelImage) return labelImage.imageUrl;
    if (!selectedColor) return product.imageUrl || '';
    const variantImage = colorImages.find(
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

  const isWomens = product?.category?.name?.toLowerCase() === 'women';
  const availableSizes = isWomens ? WOMEN_SIZES : DEFAULT_SIZES;

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
            <Link href="/shop?category=women" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">WOMEN</Link>
            <Link href="/shop?category=professional" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">BUSINESS</Link>
            <Link href="/about" className="text-xs font-semibold tracking-widest text-gray-700 hover:text-red-600 transition-colors">ABOUT</Link>
          </nav>
          <div className="flex items-center gap-5">
            <button className="text-gray-500 hover:text-red-600 transition-colors" aria-label="Search">
              <Search size={18} strokeWidth={2} />
            </button>
            <Link href="/cart" className="relative text-gray-500 hover:text-red-600 transition-colors">
              <ShoppingCart size={18} strokeWidth={2} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{itemCount}</span>
              )}
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
            <Link href="/shop?category=women" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Women</Link>
            <Link href="/shop?category=professional" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>Business</Link>
            <Link href="/about" className="block text-sm font-medium text-gray-700 hover:text-red-600" onClick={() => setMobileMenuOpen(false)}>About</Link>
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
            <button
              onClick={(e) => {
                e.preventDefault();
                if (!isAuthenticated) {
                  toast.error("Sign in first to save your faves!");
                  return;
                }
                if (product?.id) toggleWishlist.mutate({ productId: product.id });
              }}
              disabled={toggleWishlist.isPending}
              className={`absolute top-4 right-4 w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
                isWishlisted
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-600'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} className={isWishlisted ? 'fill-red-600' : ''} />
            </button>
            {/* Badge */}
            {product.featured && !collectionInfo && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded">
                FEATURED
              </span>
            )}
            {/* Collection Badge */}
            {collectionInfo && (
              <span className={`absolute top-4 left-4 ${collectionInfo.bg} ${collectionInfo.color} text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 rounded border ${collectionInfo.border}`}>
                {collectionInfo.name}
              </span>
            )}
            {/* Label image thumbnail */}
            {labelImage && (
              <button
                onClick={() => { setShowingLabel(!showingLabel); setImageLoaded(false); }}
                className={`absolute bottom-4 left-4 w-16 h-16 rounded-lg overflow-hidden border-2 shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
                  showingLabel ? 'border-red-600 ring-2 ring-red-600/30' : 'border-white/80'
                }`}
                title="View inner label"
                aria-label="View inner clothing label"
              >
                <img src={labelImage.imageUrl} alt="Inner clothing label" className="w-full h-full object-cover" />
              </button>
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

            {/* Description - parse out MATERIALS and CARE sections */}
            {(() => {
              const desc = product.description || `Premium heavyweight cotton tee with "${product.name}" print. Pre-shrunk fabric, relaxed fit, ribbed crew neck. Designed in Freetown. Made to last.`;
              const materialsIdx = desc.indexOf('MATERIALS:');
              const mainDesc = materialsIdx > -1 ? desc.substring(0, materialsIdx).trim() : desc;
              return (
                <div className="mt-6 text-gray-500 leading-relaxed space-y-3">
                  {mainDesc.split('\n').filter((l: string) => l.trim()).map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              );
            })()}

            {/* Divider */}
            <div className="border-t border-gray-100 my-6" />

            {/* Color Selection */}
            {colorImages.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    Color: <span className="font-normal text-gray-500 capitalize">{showingLabel ? 'Label View' : selectedColor}</span>
                  </span>
                  {showingLabel && (
                    <button onClick={() => { setShowingLabel(false); setImageLoaded(false); }} className="text-xs text-red-600 hover:text-red-700 font-medium underline underline-offset-2">
                      Back to product
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  {colorImages.map((img: any) => {
                    const colorName = img.color?.toLowerCase() || 'black';
                    const hex = COLOR_MAP[colorName] || colorName;
                    const isSelected = selectedColor === colorName;
                    return (
                      <button
                        key={img.id}
                        onClick={() => {
                          setSelectedColor(colorName);
                          setShowingLabel(false);
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
                    <h4 className="text-sm font-bold text-gray-900 mb-1">
                      {isWomens ? "Women's Size Guide" : "Men's / Unisex Size Guide"}
                    </h4>
                    <p className="text-[11px] text-gray-400 mb-3">All measurements in inches. Measure flat across.</p>

                    {isWomens ? (
                      <table className="w-full text-xs text-gray-600">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 font-semibold text-gray-900">Size</th>
                            <th className="text-center py-2 font-semibold text-gray-900">Bust</th>
                            <th className="text-center py-2 font-semibold text-gray-900">Waist</th>
                            <th className="text-center py-2 font-semibold text-gray-900">Hip</th>
                            <th className="text-center py-2 font-semibold text-gray-900">Length</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { size: 'XXS', bust: '30-31', waist: '23-24', hip: '33-34', length: '23' },
                            { size: 'XS', bust: '31-33', waist: '24-26', hip: '34-36', length: '24' },
                            { size: 'S', bust: '33-35', waist: '26-28', hip: '36-38', length: '25' },
                            { size: 'M', bust: '35-37', waist: '28-30', hip: '38-40', length: '26' },
                            { size: 'L', bust: '37-40', waist: '30-33', hip: '40-43', length: '27' },
                            { size: 'XL', bust: '40-43', waist: '33-36', hip: '43-46', length: '28' },
                            { size: '2XL', bust: '43-47', waist: '36-40', hip: '46-50', length: '29' },
                            { size: '3XL', bust: '47-51', waist: '40-44', hip: '50-54', length: '30' },
                            { size: '4XL', bust: '51-55', waist: '44-48', hip: '54-58', length: '31' },
                          ].map((row) => (
                            <tr key={row.size} className="border-b border-gray-100 last:border-0">
                              <td className="py-2 font-medium">{row.size}</td>
                              <td className="py-2 text-center">{row.bust}</td>
                              <td className="py-2 text-center">{row.waist}</td>
                              <td className="py-2 text-center">{row.hip}</td>
                              <td className="py-2 text-center">{row.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
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
                    )}

                    <p className="mt-3 text-[11px] text-gray-400">
                      {isWomens
                        ? 'Relaxed fit. If between sizes, we recommend sizing down for a closer fit or up for an oversized look.'
                        : 'Regular fit. If between sizes, we recommend sizing up for a comfortable fit.'}
                    </p>
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

            {/* Materials & Care Accordion - parsed from description */}
            {(() => {
              const desc = product.description || '';
              const materialsIdx = desc.indexOf('MATERIALS:');
              const careIdx = desc.indexOf('CARE:');
              const hasParsedSections = materialsIdx > -1;

              if (hasParsedSections) {
                const materialsText = careIdx > -1
                  ? desc.substring(materialsIdx + 'MATERIALS:'.length, careIdx).trim()
                  : desc.substring(materialsIdx + 'MATERIALS:'.length).trim();
                const careText = careIdx > -1
                  ? desc.substring(careIdx + 'CARE:'.length).trim()
                  : '';
                const materialLines = materialsText.split('\n').map((l: string) => l.replace(/^[\u2022\-\*]\s*/, '').trim()).filter(Boolean);
                const careLines = careText.split('\n').map((l: string) => l.replace(/^[\u2022\-\*]\s*/, '').trim()).filter(Boolean);

                return (
                  <div className="mt-6 border-t border-gray-100">
                    <button
                      onClick={() => setShowCareInfo(!showCareInfo)}
                      className="w-full flex items-center justify-between py-4 text-sm font-semibold text-gray-900 hover:text-red-600 transition-colors"
                    >
                      Materials & Care
                      {showCareInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showCareInfo && (
                      <div className="pb-4 text-sm text-gray-500 space-y-4">
                        {materialLines.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Materials</h4>
                            <ul className="space-y-1.5">
                              {materialLines.map((line: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-red-600 mt-0.5">\u2022</span>
                                  <span>{line}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {careLines.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Care Instructions</h4>
                            <ul className="space-y-1.5">
                              {careLines.map((line: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-red-600 mt-0.5">\u2022</span>
                                  <span>{line}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // Fallback for products without parsed sections
              return (
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
              );
            })()}
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
                <li><Link href="/shop?category=women" className="text-sm text-gray-400 hover:text-white transition-colors">Women</Link></li>
                <li><Link href="/shop?category=professional" className="text-sm text-gray-400 hover:text-white transition-colors">Business</Link></li>
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
