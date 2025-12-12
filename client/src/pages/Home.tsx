import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, User, Search } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: products, isLoading } = trpc.products.list.useQuery({ featured: true });
  const { data: cart } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  const formatPrice = (cents: number) => {
    return `RM${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="brand-cursive text-4xl text-primary">Fake</span>
                <span className="text-sm text-muted-foreground font-light">by Freetown</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
                Shop
              </Link>
              <Link href="/products?category=casual" className="text-sm font-medium hover:text-primary transition-colors">
                Casual
              </Link>
              <Link href="/products?category=professional" className="text-sm font-medium hover:text-primary transition-colors">
                Professional
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link href="/products">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
              
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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 to-white py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="brand-cursive text-primary">Fake</span> it till you make it
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Quality apparel for work and weekends. 
              Made to last, designed to move.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="text-base">
                <Link href="/products">Shop Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="/products?featured=true">Featured Collection</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Featured</h2>
              <p className="text-muted-foreground">New arrivals</p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/products">View All →</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-muted animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products?.slice(0, 4).map((product) => (
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
                      <p className="font-semibold text-lg">{formatPrice(product.price)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Built Different
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              <span className="brand-cursive text-primary text-2xl">Fake</span> by Freetown. 
              Graphic tees and hoodies for the street. 
              Oxford shirts and chambray for the office. 
              Same quality, different contexts.
            </p>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="p-6 bg-primary/5 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Casual</h3>
                <p className="text-muted-foreground">
                  Heavyweight cotton. Screen-printed graphics. Built to last.
                </p>
              </div>
              <div className="p-6 bg-gray-100 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Professional</h3>
                <p className="text-muted-foreground">
                  Premium fabrics. Clean construction. Work-ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="brand-cursive text-3xl text-primary">Fake</span>
                <span className="text-xs text-muted-foreground">by Freetown</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Elevated apparel for every occasion
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/products" className="hover:text-foreground">All Products</Link></li>
                <li><Link href="/products?category=casual" className="hover:text-foreground">Casual</Link></li>
                <li><Link href="/products?category=professional" className="hover:text-foreground">Professional</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {isAuthenticated ? (
                  <>
                    <li><Link href="/account" className="hover:text-foreground">My Account</Link></li>
                    <li><Link href="/orders" className="hover:text-foreground">Orders</Link></li>
                  </>
                ) : (
                  <li><a href={getLoginUrl()} className="hover:text-foreground">Sign In</a></li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Shipping</a></li>
                <li><a href="#" className="hover:text-foreground">Returns</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 Fake by Freetown. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
