import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Eye, Package, Download, Calendar, Loader2, Truck, CreditCard,
  User, MapPin, Clock, CheckCircle2, XCircle, AlertTriangle, FileText,
  ExternalLink, StickyNote, HelpCircle, ChevronRight, Printer, Copy
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; helpText: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, helpText: "Order placed, awaiting payment confirmation or processing." },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package, helpText: "Payment confirmed. Prepare items for shipment." },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Truck, helpText: "Package dispatched. Add tracking number for customer visibility." },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2, helpText: "Customer has received the package." },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle, helpText: "Order cancelled. Refund may be required." },
  return_requested: { label: "Return Requested", color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle, helpText: "Customer requested a return. Review and approve/reject." },
  returned: { label: "Returned", color: "bg-gray-100 text-gray-800 border-gray-200", icon: Package, helpText: "Items returned. Refund has been processed." },
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "return_requested"],
  delivered: ["return_requested"],
  return_requested: ["returned", "delivered"],
  returned: [],
  cancelled: [],
};

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{children}</span></p>;
}

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ orderId: number; orderNumber: string; currentStatus: string; newStatus: string } | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [trackingDialog, setTrackingDialog] = useState<{ orderId: number; orderNumber: string } | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [noteDialog, setNoteDialog] = useState<{ orderId: number; orderNumber: string } | null>(null);
  const [noteText, setNoteText] = useState("");

  const filters = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    paymentStatus: paymentFilter !== "all" ? paymentFilter : undefined,
    search: searchQuery || undefined,
    limit: 50,
    offset: 0,
  }), [statusFilter, paymentFilter, searchQuery]);

  const { data, isLoading, refetch } = trpc.admin.orders.list.useQuery(filters);
  const { data: orderDetail, isLoading: detailLoading } = trpc.admin.orders.getById.useQuery(
    { id: selectedOrderId! }, { enabled: !!selectedOrderId }
  );
  const utils = trpc.useUtils();

  const updateStatusMut = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: (result) => {
      toast.success(`Order status updated${result.refund ? ` — refund of RM${(result.refund.refundedAmount / 100).toFixed(2)} processed` : ""}`);
      setStatusChangeTarget(null);
      setStatusNote("");
      refetch();
      if (selectedOrderId) utils.admin.orders.getById.invalidate({ id: selectedOrderId });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateTrackingMut = trpc.admin.orders.updateTracking.useMutation({
    onSuccess: () => {
      toast.success("Tracking information updated");
      setTrackingDialog(null);
      setTrackingNumber("");
      setTrackingUrl("");
      refetch();
      if (selectedOrderId) utils.admin.orders.getById.invalidate({ id: selectedOrderId });
    },
    onError: (e) => toast.error(e.message),
  });

  const addNoteMut = trpc.admin.orders.addNote.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setNoteDialog(null);
      setNoteText("");
      if (selectedOrderId) utils.admin.orders.getById.invalidate({ id: selectedOrderId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const f: Record<string, string> = {};
      if (statusFilter !== "all") f.status = statusFilter;
      if (exportStartDate) f.startDate = exportStartDate;
      if (exportEndDate) f.endDate = exportEndDate;
      const result = await utils.admin.export.orders.fetch(Object.keys(f).length > 0 ? f : undefined);
      if (result?.csv) {
        const blob = new Blob(['\uFEFF' + result.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${result.count} orders`);
      }
    } catch {
      toast.error('Failed to export orders');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPackingSlip = (order: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const items = order.items?.map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.productName}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.size || '-'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.color || '-'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td></tr>`).join('') || '';
    w.document.write(`<!DOCTYPE html><html><head><title>Packing Slip #${order.orderNumber}</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#333}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin:20px 0}th{text-align:left;padding:8px;border-bottom:2px solid #333;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}td{font-size:14px}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px}.meta{font-size:13px;color:#666;line-height:1.6}.section{margin:20px 0}.section h3{font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin-bottom:8px}@media print{body{margin:20px}}</style></head><body><div class="header"><div><h1>Packing Slip</h1><p class="meta">Order #${order.orderNumber}<br>Date: ${new Date(order.createdAt).toLocaleDateString('en-MY', { year:'numeric', month:'long', day:'numeric' })}</p></div></div><div class="section"><h3>Ship To</h3><p><strong>${order.shippingName}</strong><br>${order.shippingAddress}<br>${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}<br>${order.shippingCountry}<br>Phone: ${order.shippingPhone}</p></div><table><thead><tr><th>Item</th><th style="text-align:center">Size</th><th style="text-align:center">Color</th><th style="text-align:center">Qty</th></tr></thead><tbody>${items}</tbody></table><div style="margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#999;text-align:center">Thank you for your order!</div><script>window.print();</script></body></html>`);
    w.document.close();
  };

  const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;
  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("en-MY", { month: "short", day: "numeric", year: "numeric" });
  const formatDateTime = (d: string | Date) => new Date(d).toLocaleDateString("en-MY", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const orders = data?.orders || [];

  // Stats
  const stats = useMemo(() => {
    const all = orders;
    return {
      total: all.length,
      pending: all.filter((o: any) => o.status === 'pending').length,
      processing: all.filter((o: any) => o.status === 'processing').length,
      shipped: all.filter((o: any) => o.status === 'shipped').length,
      delivered: all.filter((o: any) => o.status === 'delivered').length,
    };
  }, [orders]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage customer orders, fulfillment, and logistics. {data?.total || 0} total orders.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDateFilter(!showDateFilter)} className={showDateFilter ? "bg-gray-100" : ""}>
              <Calendar className="h-4 w-4 mr-2" /> Date Range
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={isExporting || isLoading}>
              <Download className="h-4 w-4 mr-2" /> {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Pending", value: stats.pending, color: "text-yellow-600" },
            { label: "Processing", value: stats.processing, color: "text-blue-600" },
            { label: "Shipped", value: stats.shipped, color: "text-purple-600" },
            { label: "Delivered", value: stats.delivered, color: "text-green-600" },
          ].map(s => (
            <Card key={s.label} className="bg-white border-gray-200">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Date Range Filter */}
        {showDateFilter && (
          <Card className="bg-white border-gray-200">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">Export date range:</span>
                <Input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="w-[160px]" />
                <span className="text-gray-400">to</span>
                <Input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="w-[160px]" />
                {(exportStartDate || exportEndDate) && (
                  <Button variant="ghost" size="sm" onClick={() => { setExportStartDate(""); setExportEndDate(""); }}>Clear</Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-white border-gray-200">
          <CardContent className="py-3 px-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by order number, name, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !orders.length ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No orders found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Order</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Customer</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Total</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Payment</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order: any) => {
                      const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      const StatusIcon = sc.icon;
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">#{order.orderNumber || order.id}</span>
                            {order.trackingNumber && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Truck className="h-3 w-3" /> {order.trackingNumber}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">{order.shippingName || order.user?.name || "—"}</p>
                            <p className="text-xs text-gray-400">{order.shippingEmail || order.user?.email || ""}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatPrice(order.totalAmount)}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                              order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                              order.paymentStatus === 'refunded' ? 'bg-gray-100 text-gray-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{order.paymentStatus}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${sc.color}`}>
                              <StatusIcon className="h-3 w-3" /> {sc.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View details" onClick={() => setSelectedOrderId(order.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Print packing slip" onClick={() => handlePrintPackingSlip(order)}>
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Order Detail Dialog ===== */}
      <Dialog open={!!selectedOrderId} onOpenChange={(o) => { if (!o) setSelectedOrderId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : orderDetail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Order #{orderDetail.orderNumber}</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${(STATUS_CONFIG[orderDetail.status] || STATUS_CONFIG.pending).color}`}>
                    {(STATUS_CONFIG[orderDetail.status] || STATUS_CONFIG.pending).label}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Placed {formatDateTime(orderDetail.createdAt)} — {orderDetail.items?.length || 0} item(s)
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4 mt-4">
                  {/* Customer */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3"><User className="h-4 w-4" /> Customer</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">Name</span><p className="font-medium">{orderDetail.shippingName}</p></div>
                      <div><span className="text-gray-500">Email</span><p className="font-medium">{orderDetail.shippingEmail}</p></div>
                      <div><span className="text-gray-500">Phone</span><p className="font-medium">{orderDetail.shippingPhone}</p></div>
                      <div><span className="text-gray-500">Account</span><p className="font-medium">{orderDetail.user?.email || "Guest"}</p></div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2"><MapPin className="h-4 w-4" /> Shipping Address</h3>
                    <p className="text-sm">{orderDetail.shippingAddress}</p>
                    <p className="text-sm text-gray-500">{orderDetail.shippingCity}, {orderDetail.shippingState} {orderDetail.shippingPostalCode}</p>
                    <p className="text-sm text-gray-500">{orderDetail.shippingCountry}</p>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3"><Package className="h-4 w-4" /> Items ({orderDetail.items?.length || 0})</h3>
                    <div className="space-y-2">
                      {orderDetail.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                          <div>
                            <span className="text-sm font-medium">{item.productName}</span>
                            <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <span className="font-medium">{formatPrice(item.subtotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3"><CreditCard className="h-4 w-4" /> Payment</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(orderDetail.totalAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{orderDetail.shippingCost > 0 ? formatPrice(orderDetail.shippingCost) : 'Free'}</span></div>
                      {orderDetail.refundedAmount > 0 && (
                        <div className="flex justify-between text-red-600"><span>Refunded</span><span>-{formatPrice(orderDetail.refundedAmount)}</span></div>
                      )}
                      <div className="flex justify-between font-bold text-base pt-2 border-t">
                        <span>Total</span><span>{formatPrice(orderDetail.totalAmount + (orderDetail.shippingCost || 0))}</span>
                      </div>
                    </div>
                    {orderDetail.paymentIntentId && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          Stripe Payment Intent:
                          <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">{orderDetail.paymentIntentId}</code>
                          <button onClick={() => { navigator.clipboard.writeText(orderDetail.paymentIntentId || ''); toast.success("Copied"); }} className="hover:text-gray-600"><Copy className="h-3 w-3" /></button>
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Fulfillment Tab */}
                <TabsContent value="fulfillment" className="space-y-4 mt-4">
                  {/* Status Workflow */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Status</h3>
                    <p className="text-xs text-gray-400 mb-3">{(STATUS_CONFIG[orderDetail.status] || STATUS_CONFIG.pending).helpText}</p>
                    
                    {/* Visual Pipeline */}
                    <div className="flex items-center gap-1 mb-4">
                      {["pending", "processing", "shipped", "delivered"].map((s, i) => {
                        const isActive = s === orderDetail.status;
                        const isPast = ["pending", "processing", "shipped", "delivered"].indexOf(orderDetail.status) > i;
                        const sc = STATUS_CONFIG[s];
                        return (
                          <div key={s} className="flex items-center flex-1">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${isActive ? 'bg-red-600 text-white' : isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                              {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                            </div>
                            <span className={`ml-1.5 text-xs ${isActive ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{sc.label}</span>
                            {i < 3 && <ChevronRight className="h-4 w-4 text-gray-300 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Status Actions */}
                    {VALID_TRANSITIONS[orderDetail.status]?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Available transitions:</p>
                        <div className="flex flex-wrap gap-2">
                          {VALID_TRANSITIONS[orderDetail.status].map(ns => {
                            const nsc = STATUS_CONFIG[ns] || STATUS_CONFIG.pending;
                            return (
                              <Button
                                key={ns}
                                variant="outline"
                                size="sm"
                                onClick={() => setStatusChangeTarget({
                                  orderId: orderDetail.id,
                                  orderNumber: orderDetail.orderNumber,
                                  currentStatus: orderDetail.status,
                                  newStatus: ns,
                                })}
                              >
                                <nsc.icon className="h-3.5 w-3.5 mr-1.5" /> {nsc.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {VALID_TRANSITIONS[orderDetail.status]?.length === 0 && (
                      <p className="text-xs text-gray-400 italic">This order has reached a final state. No further transitions available.</p>
                    )}
                  </div>

                  {/* Tracking */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2"><Truck className="h-4 w-4" /> Tracking Information</h3>
                    {orderDetail.trackingNumber ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-200 px-2 py-1 rounded text-sm">{orderDetail.trackingNumber}</code>
                          <button onClick={() => { navigator.clipboard.writeText(orderDetail.trackingNumber || ''); toast.success("Copied"); }} className="text-gray-400 hover:text-gray-600"><Copy className="h-3.5 w-3.5" /></button>
                          {orderDetail.trackingUrl && (
                            <a href={orderDetail.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1">
                              Track <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setTrackingDialog({ orderId: orderDetail.id, orderNumber: orderDetail.orderNumber })}>
                          Update Tracking
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">No tracking information added yet.</p>
                        <Button variant="outline" size="sm" onClick={() => setTrackingDialog({ orderId: orderDetail.id, orderNumber: orderDetail.orderNumber })}>
                          <Truck className="h-3.5 w-3.5 mr-1.5" /> Add Tracking
                        </Button>
                        <HelpText>Add a tracking number after shipping. Customers will see this in their order details.</HelpText>
                      </div>
                    )}
                  </div>

                  {/* Print */}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handlePrintPackingSlip(orderDetail)}>
                      <Printer className="h-4 w-4 mr-2" /> Print Packing Slip
                    </Button>
                  </div>
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="mt-4">
                  <div className="space-y-0">
                    {orderDetail.statusHistory?.length > 0 ? (
                      orderDetail.statusHistory.map((h: any, i: number) => {
                        const sc = STATUS_CONFIG[h.newStatus] || STATUS_CONFIG.pending;
                        const StatusIcon = sc.icon;
                        return (
                          <div key={h.id || i} className="flex gap-3 pb-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                <StatusIcon className="h-4 w-4" />
                              </div>
                              {i < orderDetail.statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                            </div>
                            <div className="flex-1 pb-2">
                              <p className="text-sm font-medium text-gray-900">
                                {STATUS_CONFIG[h.previousStatus]?.label || h.previousStatus} <ChevronRight className="h-3 w-3 inline" /> {sc.label}
                              </p>
                              {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                              <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(h.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Clock className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No status history yet</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Internal Notes</h3>
                    <Button variant="outline" size="sm" onClick={() => setNoteDialog({ orderId: orderDetail.id, orderNumber: orderDetail.orderNumber })}>
                      <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Add Note
                    </Button>
                  </div>
                  <HelpText>Notes are internal only and not visible to customers. Use them for team communication about this order.</HelpText>
                  {orderDetail.notes ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono text-gray-700">
                      {orderDetail.notes}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No notes yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ===== Status Change Confirmation ===== */}
      <AlertDialog open={!!statusChangeTarget} onOpenChange={(o) => { if (!o) { setStatusChangeTarget(null); setStatusNote(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Change order <strong>#{statusChangeTarget?.orderNumber}</strong> from{" "}
                  <strong>{STATUS_CONFIG[statusChangeTarget?.currentStatus || '']?.label}</strong> to{" "}
                  <strong>{STATUS_CONFIG[statusChangeTarget?.newStatus || '']?.label}</strong>?
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  {STATUS_CONFIG[statusChangeTarget?.newStatus || '']?.helpText}
                </div>
                {statusChangeTarget?.newStatus === 'cancelled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    <strong>Warning:</strong> Cancelling an order cannot be undone. If payment was received, a refund may need to be processed separately.
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                  <Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Add a reason or note for this status change..." className="mt-1" rows={2} />
                  <p className="text-xs text-gray-400 mt-1">This note will appear in the order timeline.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={updateStatusMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (statusChangeTarget) {
                  updateStatusMut.mutate({
                    id: statusChangeTarget.orderId,
                    status: statusChangeTarget.newStatus as any,
                    note: statusNote || undefined,
                  });
                }
              }}
            >
              {updateStatusMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Tracking Dialog ===== */}
      <Dialog open={!!trackingDialog} onOpenChange={(o) => { if (!o) { setTrackingDialog(null); setTrackingNumber(""); setTrackingUrl(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Update Tracking</DialogTitle>
            <DialogDescription>Add or update tracking information for order #{trackingDialog?.orderNumber}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tracking Number <span className="text-red-500">*</span></label>
              <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g., MY1234567890" className="mt-1" />
              <HelpText>The carrier tracking number provided by your shipping partner.</HelpText>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tracking URL</label>
              <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://tracking.example.com/..." className="mt-1" />
              <HelpText>Direct link to the carrier's tracking page. Customers can click this to track their package.</HelpText>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTrackingDialog(null); setTrackingNumber(""); setTrackingUrl(""); }}>Cancel</Button>
            <Button
              onClick={() => { if (trackingDialog && trackingNumber.trim()) updateTrackingMut.mutate({ id: trackingDialog.orderId, trackingNumber: trackingNumber.trim(), trackingUrl: trackingUrl.trim() || undefined }); }}
              disabled={!trackingNumber.trim() || updateTrackingMut.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {updateTrackingMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Add Note Dialog ===== */}
      <Dialog open={!!noteDialog} onOpenChange={(o) => { if (!o) { setNoteDialog(null); setNoteText(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5" /> Add Note</DialogTitle>
            <DialogDescription>Add an internal note to order #{noteDialog?.orderNumber}.</DialogDescription>
          </DialogHeader>
          <div>
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Type your note here..." rows={4} />
            <HelpText>Internal notes are only visible to admin users. Use them for team coordination.</HelpText>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNoteDialog(null); setNoteText(""); }}>Cancel</Button>
            <Button
              onClick={() => { if (noteDialog && noteText.trim()) addNoteMut.mutate({ id: noteDialog.orderId, note: noteText.trim() }); }}
              disabled={!noteText.trim() || addNoteMut.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {addNoteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
