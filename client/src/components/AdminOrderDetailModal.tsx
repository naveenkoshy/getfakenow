import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, User, MapPin, CreditCard, Calendar } from "lucide-react";

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  size: string;
  color: string;
  subtotal: number;
  createdAt: Date;
}

interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  status: string;
  totalAmount: number;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  createdAt: Date;
  items: OrderItem[];
  user?: {
    id: number;
    email: string;
    name: string | null;
  };
}

interface AdminOrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminOrderDetailModal({
  order,
  open,
  onOpenChange,
}: AdminOrderDetailModalProps) {
  if (!order) return null;

  const formatPrice = (cents: number) => {
    return `RM${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order #{order.orderNumber}</span>
            <Badge className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Placed on {formatDate(order.createdAt)}</span>
          </div>

          {/* Customer Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5" />
              <h3 className="font-semibold">Customer Information</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.shippingName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.shippingEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.shippingPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User Account</p>
                  <p className="font-medium">{order.user?.email || "Guest"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5" />
              <h3 className="font-semibold">Shipping Address</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium">{order.shippingAddress}</p>
              <p className="text-sm text-muted-foreground">
                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
              </p>
              <p className="text-sm text-muted-foreground">{order.shippingCountry}</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5" />
              <h3 className="font-semibold">Order Items ({order.items.length})</h3>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-muted/50 rounded-lg p-4"
                >
                <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && (
                        <span className="flex items-center gap-1">
                          Color:{" "}
                          <span
                            className="inline-block w-4 h-4 rounded-full border"
                            style={{
                              backgroundColor: item.color.toLowerCase(),
                            }}
                          />
                          {item.color}
                        </span>
                      )}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(item.productPrice)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.subtotal)} total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5" />
              <h3 className="font-semibold">Payment Summary</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>Free</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
