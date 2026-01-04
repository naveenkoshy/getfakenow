import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function OrderConfirmation() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1]);
  const orderNumber = params.get("order_number");

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

      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold tracking-tight mb-4">Order Confirmed!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>

          {orderNumber && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                <p className="text-2xl font-bold font-mono">{orderNumber}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <p className="text-muted-foreground">
              A confirmation email has been sent to your email address with order details.
            </p>
            <p className="text-muted-foreground">
              You can track your order status in your account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg">
              <Link href="/orders">View Orders</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
