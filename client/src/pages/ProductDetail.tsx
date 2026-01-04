import { useAuth } from "@/_core/hooks/useAuth";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Minus, Plus, ShoppingCart, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { updateMetaTags, injectStructuredData, generateProductSchema, generateBreadcrumbSchema, removeStructuredData } from "@/lib/seo";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | ''>('');
  const [selectedColor, setSelectedColor] = useState<'black' | 'white' | 'navy' | 'red' | ''>('black');

  const { data: product, isLoading } = trpc.products.getBySlug.useQuery({ slug: slug! });

  // SEO: Update meta tags and inject structured data when product loads
  useEffect(() => {
    if (!product) return;

    // Generate cool copywriter-style description
    const seoDescription = `${product.name}. ${product.description?.split('.')[0] || 'Quality apparel from Fake by Freetown'}. Get yours now.`;

    updateMetaTags({
      title: product.name,
      description: seoDescription,
      image: product.imageUrl || undefined,
      url: `https://getfakenow.com/product/${product.slug}`,
      type: 'product',
      price: product.price,
      currency: 'MYR',
      availability: product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      brand: 'Fake by Freetown',
      sku: product.id.toString(),
    });

    // Inject product structured data
    const productSchema = generateProductSchema({
      name: product.name,
      description: product.description || 'Quality apparel from Fake by Freetown',
      image: product.imageUrl || 'https://fake-store-images.s3.ap-southeast-1.amazonaws.com/fake-logo-red.png',
      price: product.price / 100,
      currency: 'MYR',
      availability: product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      brand: 'Fake by Freetown',
      sku: product.id.toString(),
      url: `https://getfakenow.com/product/${product.slug}`,
    });
    injectStructuredData(productSchema, 'product-schema');

    // Inject breadcrumb structured data
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://getfakenow.com' },
      { name: 'Shop', url: 'https://getfakenow.com/shop' },
      { name: product.name, url: `https://getfakenow.com/product/${product.slug}` },
    ]);
    injectStructuredData(breadcrumbSchema, 'breadcrumb-schema');

    // Cleanup function to remove structured data when component unmounts
    return () => {
      removeStructuredData('product-schema');
      removeStructuredData('breadcrumb-schema');
    };
  }, [product]);
  
  // Get the image URL based on selected color
  const getDisplayImage = () => {
    if (!product) return '';
    if (!selectedColor) return product.imageUrl || '';
    
    // Find image matching selected color (case-insensitive)
    const variantImage = product.images?.find(img => 
      img.color?.toLowerCase() === selectedColor.toLowerCase()
    );
    return variantImage?.imageUrl || product.imageUrl || '';
  };
  const { itemCount, addItem, isLoading: cartLoading } = useCart();

  const formatPrice = (cents: number) => `RM${(cents / 100).toFixed(2)}`;
  
  const handleAddToCart = () => {
    if (!product) return;
    
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }
    
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: getDisplayImage(),
      slug: product.slug,
      quantity,
      size: selectedSize as any,
      color: selectedColor as any,
    });
    
    toast.success("Added to cart!");
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button asChild>
            <Link href="/products">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="brand-cursive text-4xl text-primary">Fake</span>
                <span className="text-sm text-muted-foreground font-light">by Freetown</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/cart">
                    <Button variant="ghost" size="icon" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {itemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link href="/account">
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Button asChild size="sm">
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <Button variant="ghost" onClick={() => setLocation("/products")} className="mb-6">
          ← Back to Shop
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {getDisplayImage() ? (
              <img
                src={getDisplayImage()}
                alt={`${product.name} in ${selectedColor || 'default'} color - ${product.description?.split('.')[0] || 'Fake by Freetown apparel'}`}
                className="w-full h-full object-cover transition-opacity duration-300"
                key={selectedColor} // Force re-render on color change
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.category && (
              <p className="text-sm text-muted-foreground mb-2">{product.category.name}</p>
            )}
            <h1 className="text-4xl font-bold tracking-tight mb-4">{product.name}</h1>
            <p className="text-3xl font-semibold text-primary mb-6">
              {formatPrice(product.price)}
            </p>

            <div className="prose prose-sm mb-8">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {product.stockQuantity > 0 ? (
              <div className="space-y-6">
                {/* Color Selection - Only show available colors */}
                {product.images && product.images.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Color:</label>
                    <div className="flex gap-3">
                      {product.images.map((img: any) => {
                        const colorName = img.color?.toLowerCase() || 'black';
                        const colorHex = colorName === 'navy' ? '#1e3a8a' : colorName;
                        return (
                          <button
                            key={img.id}
                            onClick={() => setSelectedColor(colorName)}
                            className={`w-12 h-12 rounded-full border-2 transition-all ${
                              selectedColor === colorName ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{
                              backgroundColor: colorHex,
                            }}
                            title={img.color?.charAt(0).toUpperCase() + img.color?.slice(1)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Size:</label>
                  <Select value={selectedSize} onValueChange={(value) => setSelectedSize(value as 'S' | 'M' | 'L' | 'XL' | 'XXL')}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      disabled={quantity >= product.stockQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.stockQuantity} available
                  </span>
                </div>

                <Button
                  size="lg"
                  className="w-full md:w-auto"
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {cartLoading ? "Adding..." : "Add to Cart"}
                </Button>
              </div>
            ) : (
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-red-600 font-medium">Out of Stock</p>
                <p className="text-sm text-red-600 mt-1">This item is currently unavailable</p>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
