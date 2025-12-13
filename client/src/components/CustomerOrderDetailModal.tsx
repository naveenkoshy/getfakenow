import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, MapPin, Calendar, CheckCircle2, Clock, Truck, XCircle } from "lucide-react";

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
}

interface CustomerOrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerOrderDetailModal({
  order,
  open,
  onOpenChange,
}: CustomerOrderDetailModalProps) {
  if (!order) return null;

  const formatPrice = (cents: number) => {
    return `RM${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          label: "Order Pending",
          description: "We're processing your order",
        };
      case "processing":
        return {
          icon: Package,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          label: "Processing",
          description: "Your order is being prepared",
        };
      case "shipped":
        return {
          icon: Truck,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          label: "Shipped",
          description: "Your order is on the way",
        };
      case "delivered":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-100",
          label: "Delivered",
          description: "Your order has been delivered",
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          label: "Cancelled",
          description: "This order has been cancelled",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          label: status,
          description: "",
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className={`${statusInfo.bgColor} rounded-lg p-4`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
              <div>
                <h3 className={`font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Order Number</p>
              <p className="font-semibold">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Order Date</p>
              <p className="font-semibold">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-4">Items in Your Order</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border rounded-lg p-3"
                >
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && (
                        <span className="flex items-center gap-1">
                          <span
                            className="inline-block w-3 h-3 rounded-full border"
                            style={{
                              backgroundColor: item.color.toLowerCase(),
                            }}
                          />
                          {item.color}
                        </span>
                      )}
                      <span>× {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Shipping Address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5" />
              <h3 className="font-semibold">Shipping Address</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium">{order.shippingName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {order.shippingAddress}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
              </p>
              <p className="text-sm text-muted-foreground">{order.shippingCountry}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {order.shippingPhone}
              </p>
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2">
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

          {/* Help Text */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              Need help with your order? Contact us at{" "}
              <a href="mailto:support@fakebyfreetown.com" className="text-primary hover:underline">
                support@fakebyfreetown.com
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
