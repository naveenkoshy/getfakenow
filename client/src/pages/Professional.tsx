import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, User } from "lucide-react";
import { Link } from "wouter";

export default function Professional() {
  const { isAuthenticated } = useAuth();
  const { data: products, isLoading } = trpc.products.list.useQuery({ categoryId: 2 }); // Professional category
  const { data: cart } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  const formatPrice = (cents: number) => `RM${(cents / 100).toFixed(2)}`;

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
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/shop"><span className="text-sm hover:text-primary cursor-pointer transition-colors">Shop</span></Link>
              <Link href="/casual"><span className="text-sm hover:text-primary cursor-pointer transition-colors">Casual</span></Link>
              <Link href="/professional"><span className="text-sm font-medium text-primary cursor-pointer">Professional</span></Link>
            </nav>
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

      <div className="container py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-4">Professional</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Refined workwear. Oxford shirts and chambray pieces with minimalist Nordic design.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg">{formatPrice(product.price)}</p>
                      {product.stockQuantity > 0 ? (
                        <span className="text-xs text-green-600">In Stock</span>
                      ) : (
                        <span className="text-xs text-red-600">Out of Stock</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No professional products available</p>
          </div>
        )}
      </div>

      <footer className="border-t border-border bg-white mt-16">
        <div className="container py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2026 Fake by Freetown. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
