import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Search, ShoppingCart, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { updateMetaTags, injectStructuredData, generateBreadcrumbSchema, removeStructuredData } from "@/lib/seo";

export default function Products() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: search || undefined,
    categoryId,
  });

  // Handle category query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam && categories) {
      const category = categories.find(c => c.name.toLowerCase() === categoryParam.toLowerCase());
      if (category) {
        setCategoryId(category.id);
      }
    }
  }, [location, categories]);
  const { data: cart } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  // SEO: Update meta tags
  useEffect(() => {
    updateMetaTags({
      title: 'Shop',
      description: "Browse the full collection. Graphic tees with attitude. Hoodies that last. Shirts that work. It's all here.",
      image: 'https://fake-store-images.s3.ap-southeast-1.amazonaws.com/fake-logo-red.png',
      url: 'https://getfakenow.com/shop',
      type: 'website',
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://getfakenow.com' },
      { name: 'Shop', url: 'https://getfakenow.com/shop' },
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-6">Shop</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={categoryId?.toString() || "all"}
              onValueChange={(value) => setCategoryId(value === "all" ? undefined : Number(value))}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <p className="text-muted-foreground text-lg">No products found</p>
            <Button onClick={() => { setSearch(""); setCategoryId(undefined); }} className="mt-4">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
