import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2, RotateCcw, Package, Clock, CheckCircle2,
  ChevronDown, ChevronUp, MessageSquare, DollarSign,
  CreditCard, AlertCircle, Percent, Receipt
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusFilter = "return_requested" | "returned" | "all";
type RefundType = "full" | "partial" | "none";

const REFUND_REASONS = [
  { value: "requested_by_customer", label: "Customer Request" },
  { value: "defective_item", label: "Defective / Damaged Item" },
  { value: "wrong_item", label: "Wrong Item Sent" },
  { value: "not_as_described", label: "Not As Described" },
  { value: "size_issue", label: "Size / Fit Issue" },
  { value: "late_delivery", label: "Late Delivery" },
  { value: "duplicate_order", label: "Duplicate Order" },
  { value: "other", label: "Other" },
];

export default function AdminReturns() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("return_requested");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [processId, setProcessId] = useState<number | null>(null);
  const [processNote, setProcessNote] = useState("");
  const [refundType, setRefundType] = useState<RefundType>("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [refundReason, setRefundReason] = useState("requested_by_customer");

  const { data: stats, isLoading: statsLoading } = trpc.admin.returns.stats.useQuery();
  const { data, isLoading, refetch } = trpc.admin.returns.list.useQuery({ status: statusFilter });
  const utils = trpc.useUtils();

  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: (result: any) => {
      if (result.refund) {
        toast.success(`Return processed! Refund of RM ${(result.refund.refundedAmount / 100).toFixed(2)} issued.`);
      } else {
        toast.success("Return processed successfully (no refund issued)");
      }
      refetch();
      utils.admin.returns.stats.invalidate();
      utils.admin.refunds.list.invalidate();
      utils.admin.refunds.stats.invalidate();
      setProcessId(null);
      setProcessNote("");
      setRefundType("full");
      setPartialAmount("");
      setRefundReason("requested_by_customer");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Find the order being processed for the dialog
  const processingOrder = useMemo(() => {
    if (!processId || !data?.returns) return null;
    return data.returns.find((r: any) => r.id === processId) || null;
  }, [processId, data]);

  const orderSubtotal = processingOrder?.totalAmount || 0;
  const orderShipping = processingOrder?.shippingCost || 0;
  const orderTotal = orderSubtotal + orderShipping;

  const quickFillPercentages = [25, 50, 75];

  const handleQuickFill = useCallback((pct: number) => {
    const amount = (orderTotal * pct) / 10000;
    setPartialAmount(amount.toFixed(2));
  }, [orderTotal]);

  const handleSubtotalOnly = useCallback(() => {
    setPartialAmount((orderSubtotal / 100).toFixed(2));
  }, [orderSubtotal]);

  const handleProcess = () => {
    if (!processId) return;

    const refundAmountSen = refundType === "full"
      ? orderTotal
      : refundType === "partial"
        ? Math.round(parseFloat(partialAmount || "0") * 100)
        : 0;

    if (refundType === "partial" && refundAmountSen <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    if (refundType === "partial" && refundAmountSen > orderTotal) {
      toast.error("Refund amount cannot exceed the order total");
      return;
    }

    updateStatus.mutate({
      id: processId,
      status: "returned",
      note: processNote || "Return approved and processed",
      refundType,
      refundAmount: refundType === "partial" ? refundAmountSen : undefined,
      refundReason,
    });
  };

  const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;
  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("en-MY", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review, process return requests, and issue refunds</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{statsLoading ? "..." : stats?.pendingReturns || 0}</p>
                <p className="text-xs text-gray-500">Pending Returns</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{statsLoading ? "..." : stats?.processedReturns || 0}</p>
                <p className="text-xs text-gray-500">Processed Returns</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {([
            { value: "return_requested" as StatusFilter, label: "Pending", icon: Clock },
            { value: "returned" as StatusFilter, label: "Processed", icon: CheckCircle2 },
            { value: "all" as StatusFilter, label: "All Returns", icon: RotateCcw },
          ]).map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={statusFilter === value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(value)}
              className={statusFilter === value ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
              {value === "return_requested" && stats?.pendingReturns ? (
                <Badge className="ml-2 bg-white/20 text-white text-xs">{stats.pendingReturns}</Badge>
              ) : null}
            </Button>
          ))}
        </div>

        {/* Returns List */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : !data?.returns?.length ? (
              <div className="text-center py-12 text-gray-500">
                <RotateCcw className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No returns found</p>
                <p className="text-sm mt-1">
                  {statusFilter === "return_requested" ? "No pending return requests" : "No returns in this category"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.returns.map((ret: any) => {
                  const isExpanded = expandedOrder === ret.id;
                  const hasRefund = ret.refundedAmount > 0;
                  const isPartialRefund = hasRefund && ret.refundedAmount < (ret.totalAmount + (ret.shippingCost || 0));
                  return (
                    <div key={ret.id} className="hover:bg-gray-50">
                      {/* Summary Row */}
                      <div
                        className="flex items-center justify-between px-6 py-4 cursor-pointer"
                        onClick={() => setExpandedOrder(isExpanded ? null : ret.id)}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900">
                                #{ret.orderNumber}
                              </span>
                              <Badge className={ret.status === "return_requested"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-green-100 text-green-700 border-green-200"
                              }>
                                {ret.status === "return_requested" ? "Pending" : "Returned"}
                              </Badge>
                              {hasRefund && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {isPartialRefund ? "Partial Refund" : "Full Refund"}: {formatPrice(ret.refundedAmount)}
                                </Badge>
                              )}
                              {ret.status === "returned" && ret.paymentStatus === "refunded" && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Refunded
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {ret.user?.name || ret.user?.email || "Unknown"} &middot; {formatPrice(ret.totalAmount)} &middot; {ret.items?.length || 0} item(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-gray-400">
                            {ret.returnRequestedAt ? formatDate(ret.returnRequestedAt) : formatDate(ret.updatedAt)}
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="px-6 pb-4 space-y-4 border-t border-gray-100 pt-4 bg-gray-50/50">
                          {/* Return Reason */}
                          {ret.returnReason && (
                            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-amber-800">Customer's Return Reason:</p>
                                <p className="text-sm text-amber-700 mt-1">{ret.returnReason}</p>
                              </div>
                            </div>
                          )}

                          {/* Refund Info (for processed returns) */}
                          {hasRefund && (
                            <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <CreditCard className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-blue-800">Refund Details:</p>
                                <p className="text-sm text-blue-700 mt-1">
                                  {isPartialRefund ? "Partial" : "Full"} refund of <strong>{formatPrice(ret.refundedAmount)}</strong> issued
                                  {ret.paymentStatus === "refunded" && " — Payment status: Refunded"}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Order Items */}
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-2">Items in Order:</p>
                            <div className="space-y-2">
                              {ret.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center gap-3">
                                    {item.imageUrl && (
                                      <img src={item.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                                      <p className="text-xs text-gray-500">
                                        {item.color && `${item.color}`}{item.size && ` / ${item.size}`} &middot; Qty: {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-medium text-gray-500">Customer</p>
                              <p className="text-gray-900">{ret.user?.name || "N/A"}</p>
                              <p className="text-gray-500 text-xs">{ret.user?.email}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Order Date</p>
                              <p className="text-gray-900">{formatDate(ret.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Subtotal</p>
                              <p className="text-gray-900">{formatPrice(ret.totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Shipping</p>
                              <p className="text-gray-900">{ret.shippingCost > 0 ? formatPrice(ret.shippingCost) : "FREE"}</p>
                            </div>
                          </div>

                          {/* Payment Info */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>
                              Payment Intent: {ret.paymentIntentId || "Not available"}
                              {!ret.paymentIntentId && (
                                <span className="text-amber-600 ml-1">(Refund will need to be processed manually)</span>
                              )}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          {ret.status === "return_requested" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setProcessId(ret.id);
                                  setRefundType("full");
                                  setPartialAmount("");
                                  setProcessNote("");
                                  setRefundReason("requested_by_customer");
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                Approve Return & Refund
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total */}
        {data?.total ? (
          <p className="text-xs text-gray-400 text-center">{data.total} return(s) total</p>
        ) : null}
      </div>

      {/* Process Return + Refund Dialog */}
      <AlertDialog open={processId !== null} onOpenChange={(open) => {
        if (!open) {
          setProcessId(null);
          setProcessNote("");
          setRefundType("full");
          setPartialAmount("");
          setRefundReason("requested_by_customer");
        }
      }}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-600" />
              Approve Return & Issue Refund
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the order as returned, restore stock quantities, and issue a refund via Stripe.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            {/* Order Breakdown */}
            {processingOrder && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Order #{processingOrder.orderNumber}</span>
                    <span className="text-sm font-bold text-gray-900">
                      Total: {formatPrice(orderTotal)}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-2 space-y-1">
                  {processingOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1">
                      <span className="text-gray-600">
                        {item.productName} ({item.color}/{item.size}) x{item.quantity}
                      </span>
                      <span className="text-gray-800 font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-1 mt-1 space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-700">{formatPrice(orderSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Shipping</span>
                      <span className="text-gray-700">{orderShipping > 0 ? formatPrice(orderShipping) : "FREE"}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold pt-0.5">
                      <span className="text-gray-700">Order Total</span>
                      <span className="text-gray-900">{formatPrice(orderTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Refund Reason */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Refund Reason</label>
              <Select value={refundReason} onValueChange={setRefundReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {REFUND_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refund Type Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Refund Type</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "full" as RefundType, label: "Full Refund", desc: processingOrder ? formatPrice(orderTotal) : "", icon: DollarSign },
                  { value: "partial" as RefundType, label: "Partial", desc: "Custom amount", icon: Percent },
                  { value: "none" as RefundType, label: "No Refund", desc: "Return only", icon: RotateCcw },
                ]).map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRefundType(value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      refundType === value
                        ? value === "none"
                          ? "border-gray-400 bg-gray-50"
                          : "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`h-3.5 w-3.5 ${refundType === value ? (value === "none" ? "text-gray-600" : "text-green-600") : "text-gray-400"}`} />
                      <p className={`text-sm font-medium ${refundType === value ? (value === "none" ? "text-gray-700" : "text-green-700") : "text-gray-700"}`}>
                        {label}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Partial Amount Input with Quick-Fill */}
            {refundType === "partial" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Refund Amount (RM)</label>
                
                {/* Quick-fill buttons */}
                <div className="flex gap-2 flex-wrap">
                  {quickFillPercentages.map(pct => (
                    <Button
                      key={pct}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickFill(pct)}
                      className="text-xs h-7 px-2.5"
                    >
                      {pct}%
                      <span className="text-gray-400 ml-1">({formatPrice(Math.round(orderTotal * pct / 100))})</span>
                    </Button>
                  ))}
                  {orderShipping > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSubtotalOnly}
                      className="text-xs h-7 px-2.5"
                    >
                      Subtotal Only
                      <span className="text-gray-400 ml-1">({formatPrice(orderSubtotal)})</span>
                    </Button>
                  )}
                </div>

                {/* Amount input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">RM</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={processingOrder ? (orderTotal / 100) : undefined}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-10 text-lg font-semibold"
                  />
                </div>

                {/* Validation messages */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Max refundable: {formatPrice(orderTotal)}
                  </span>
                  {partialAmount && parseFloat(partialAmount) > 0 && orderTotal > 0 && (
                    <span className="text-gray-500">
                      {((parseFloat(partialAmount) * 100 / orderTotal) * 100).toFixed(0)}% of order total
                    </span>
                  )}
                </div>

                {partialAmount && parseFloat(partialAmount) > 0 && processingOrder && parseFloat(partialAmount) * 100 > orderTotal && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Amount exceeds order total of {formatPrice(orderTotal)}
                  </p>
                )}
              </div>
            )}

            {/* No Payment Intent Warning */}
            {processingOrder && !processingOrder.paymentIntentId && refundType !== "none" && (
              <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800">No Stripe Payment Found</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This order doesn't have a Stripe payment intent. The return will be processed but the refund will need to be issued manually.
                  </p>
                </div>
              </div>
            )}

            {/* Refund Summary */}
            {refundType !== "none" && processingOrder?.paymentIntentId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Refund Summary</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Refund Amount</span>
                    <span className="font-bold text-green-800">
                      {refundType === "full"
                        ? formatPrice(orderTotal)
                        : partialAmount && parseFloat(partialAmount) > 0
                          ? `RM ${parseFloat(partialAmount).toFixed(2)}`
                          : "Enter amount"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Type</span>
                    <span className="text-green-700">{refundType === "full" ? "Full Refund" : "Partial Refund"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Reason</span>
                    <span className="text-green-700">{REFUND_REASONS.find(r => r.value === refundReason)?.label}</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2 pt-2 border-t border-green-200">
                  Refund will be sent to the customer's original payment method via Stripe. Typically takes 5-10 business days.
                </p>
              </div>
            )}

            {/* Admin Note */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Admin Note (optional)</label>
              <Textarea
                value={processNote}
                onChange={(e) => setProcessNote(e.target.value)}
                placeholder="Add a note about this return..."
                rows={2}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcess}
              disabled={updateStatus.isPending || (refundType === "partial" && (!partialAmount || parseFloat(partialAmount) <= 0))}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updateStatus.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
              {refundType === "none"
                ? "Approve Return (No Refund)"
                : `Approve & Refund ${refundType === "full"
                  ? formatPrice(orderTotal)
                  : partialAmount ? `RM ${parseFloat(partialAmount).toFixed(2)}` : ""
                }`
              }
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
