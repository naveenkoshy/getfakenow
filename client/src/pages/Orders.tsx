import { useAuth } from "@/_core/hooks/useAuth";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, User, Package, Eye } from "lucide-react";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { CustomerOrderDetailModal } from "@/components/CustomerOrderDetailModal";
import { useState } from "react";

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { data: orders, isLoading } = trpc.orders.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: selectedOrder } = trpc.orders.getById.useQuery(
    { id: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );
  const { data: cart } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  const formatPrice = (cents: number) => `RM${(cents / 100).toFixed(2)}`;
  const formatDate = (date: Date) => new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to view your orders</h2>
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
            <Logo size="md" variant="dark" linkTo="/" />
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
              <Link href="/account">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-8">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">Order {order.orderNumber}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-bold text-xl">{formatPrice(order.totalAmount)}</p>
                      <p className="text-sm text-muted-foreground">
                        Payment: {order.paymentStatus}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CustomerOrderDetailModal
        order={selectedOrder || null}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
      <Footer />
    </div>
  );
}
