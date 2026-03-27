import { SITE_URL } from "@/lib/seo";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Search, ShoppingCart, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { updateMetaTags, injectStructuredData, generateBreadcrumbSchema, removeStructuredData } from "@/lib/seo";
import { Logo } from "@/components/Logo";

export default function Casual() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");

  // Fetch categories and find Casual category by slug
  const { data: categories } = trpc.categories.list.useQuery();
  const casualCategory = categories?.find(cat => cat.slug === "casual");
  
  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: search || undefined,
    categoryId: casualCategory?.id,
  }, {
    enabled: !!casualCategory, // Only fetch products when category is loaded
  });
  
  const { data: cart } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  // SEO: Update meta tags
  useEffect(() => {
    updateMetaTags({
      title: 'Casual Collection',
      description: "Streetwear that doesn't try too hard. Graphic tees with one-liners. Hoodies with embroidered logos. Joggers and caps. Wear it your way.",
      image: 'https://fake-store-images.s3.ap-southeast-1.amazonaws.com/fake-logo-red.png',
      url: '${SITE_URL}/casual',
      type: 'website',
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Casual', url: '${SITE_URL}/casual' },
    ]);
    injectStructuredData(breadcrumbSchema, 'breadcrumb-schema');

    return () => {
      removeStructuredData('breadcrumb-schema');
    };
  }, []);

  const formatPrice = (cents: number) => `RM${(cents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" variant="dark" linkTo="/" />

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/shop" className="text-sm font-medium hover:text-primary transition-colors">
                Shop
              </Link>
              <Link href="/casual" className="text-sm font-medium text-primary">
                Casual
              </Link>
              <Link href="/professional" className="text-sm font-medium hover:text-primary transition-colors">
                Professional
              </Link>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-white py-16 md:py-20">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              <span className="brand-cursive text-primary">Casual</span> Collection
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Graphic tees, hoodies, joggers. Heavyweight cotton, screen-printed graphics. 
              Built for the street.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search casual wear..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
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
            <p className="text-muted-foreground text-lg">No casual wear products found</p>
            <Button onClick={() => setSearch("")} className="mt-4">
              Clear Search
            </Button>
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
