import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Minus, Plus, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | ''>('');
  const [selectedColor, setSelectedColor] = useState<'black' | 'white' | 'navy' | 'red' | ''>('');

  const { data: product, isLoading } = trpc.products.getBySlug.useQuery({ slug: slug! });
  const { data: cart } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (!selectedColor) {
      toast.error('Please select a color');
      return;
    }
    if (product) {
      addToCartMutation.mutate({ productId: product.id, quantity, size: selectedSize, color: selectedColor });
    }
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
                      {cart && cart.itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cart.itemCount}
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
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
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
                {/* Color Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Color:</label>
                  <div className="flex gap-3">
                    {(['black', 'white', 'navy', 'red'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          selectedColor === color ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{
                          backgroundColor: color === 'navy' ? '#1e3a8a' : color,
                        }}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                      />
                    ))}
                  </div>
                </div>

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
                  disabled={addToCartMutation.isPending}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
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
    </div>
  );
}
