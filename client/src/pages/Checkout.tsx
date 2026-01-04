import { useAuth } from "@/_core/hooks/useAuth";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [shippingName, setShippingName] = useState("");
  const [shippingEmail, setShippingEmail] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");

  const { data: cart, isLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const checkoutMutation = trpc.checkout.createSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to payment...");
        window.open(data.url, "_blank");
        setTimeout(() => {
          setLocation(`/order-confirmation?session_id=pending&order_number=${data.orderNumber}`);
        }, 1000);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatPrice = (cents: number) => `RM${(cents / 100).toFixed(2)}`;

  const handleCheckout = () => {
    if (!shippingName.trim() || !shippingEmail.trim() || !shippingPhone.trim() || !shippingAddress.trim() || !shippingCity.trim() || !shippingState.trim() || !shippingPostalCode.trim()) {
      toast.error("Please fill in all shipping fields");
      return;
    }
    checkoutMutation.mutate({
      shippingName,
      shippingEmail,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry: "Malaysia",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to checkout</h2>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="brand-cursive text-4xl text-primary">Fake</span>
                <span className="text-sm text-muted-foreground font-light">by Freetown</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={shippingEmail}
                        onChange={(e) => setShippingEmail(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+60 12-345 6789"
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="123 Main Street, Apt 4B"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      rows={2}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Kuala Lumpur"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="Selangor"
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal">Postal Code *</Label>
                      <Input
                        id="postal"
                        placeholder="50000"
                        value={shippingPostalCode}
                        onChange={(e) => setShippingPostalCode(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value="Malaysia"
                        disabled
                        className="mt-2 bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Payment</h2>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to Stripe to complete your payment securely.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.product?.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-sm">
                        {formatPrice((item.product?.price || 0) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6 pt-6 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(cart.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">Calculated by Stripe</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-xl">{formatPrice(cart.total)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? "Processing..." : "Pay with Stripe"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Secure payment powered by Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
