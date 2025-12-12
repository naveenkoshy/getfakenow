import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, User, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Account() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: cart } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = "/";
    },
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to view your account</h2>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
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
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-8">My Account</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{user.name || "User"}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col gap-2"
                  onClick={() => setLocation("/orders")}
                >
                  <Package className="h-8 w-8" />
                  <span className="font-medium">My Orders</span>
                  <span className="text-xs text-muted-foreground">View order history</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col gap-2"
                  onClick={() => setLocation("/cart")}
                >
                  <ShoppingCart className="h-8 w-8" />
                  <span className="font-medium">Shopping Cart</span>
                  <span className="text-xs text-muted-foreground">
                    {cart?.itemCount || 0} items
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {user.role === "admin" && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Admin Access</h2>
              <p className="text-muted-foreground mb-4">
                You have administrator privileges. Access the admin panel to manage products and orders.
              </p>
              <Button asChild>
                <Link href="/admin">Go to Admin Panel</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
