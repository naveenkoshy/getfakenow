import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2, RotateCcw, Package, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, AlertTriangle, MessageSquare
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

type StatusFilter = "return_requested" | "returned" | "all";

export default function AdminReturns() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("return_requested");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [processId, setProcessId] = useState<number | null>(null);
  const [processNote, setProcessNote] = useState("");

  const { data: stats, isLoading: statsLoading } = trpc.admin.returns.stats.useQuery();
  const { data, isLoading, refetch } = trpc.admin.returns.list.useQuery({ status: statusFilter });
  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Return processed successfully");
      refetch();
      setProcessId(null);
      setProcessNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleProcess = () => {
    if (!processId) return;
    updateStatus.mutate({ id: processId, status: "returned", note: processNote || "Return approved and processed" });
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
          <p className="text-sm text-gray-500 mt-1">Review and process customer return requests</p>
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
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                #{ret.orderNumber}
                              </span>
                              <Badge className={ret.status === "return_requested" 
                                ? "bg-amber-100 text-amber-700 border-amber-200" 
                                : "bg-green-100 text-green-700 border-green-200"
                              }>
                                {ret.status === "return_requested" ? "Pending" : "Returned"}
                              </Badge>
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

                          {/* Customer Info */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-medium text-gray-500">Customer</p>
                              <p className="text-gray-900">{ret.user?.name || "N/A"}</p>
                              <p className="text-gray-500 text-xs">{ret.user?.email}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Order Date</p>
                              <p className="text-gray-900">{formatDate(ret.createdAt)}</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {ret.status === "return_requested" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => setProcessId(ret.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                Approve Return
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

      {/* Process Return Dialog */}
      <AlertDialog open={processId !== null} onOpenChange={(open) => { if (!open) { setProcessId(null); setProcessNote(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Return</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the order as returned and restore the stock quantities. The customer will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-gray-700">Admin Note (optional)</label>
            <Textarea
              value={processNote}
              onChange={(e) => setProcessNote(e.target.value)}
              placeholder="Add a note about this return..."
              rows={3}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcess}
              disabled={updateStatus.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve & Process
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
