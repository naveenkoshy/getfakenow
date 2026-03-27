import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Loader2, Download, Search, DollarSign, TrendingUp,
  Clock, CheckCircle2, XCircle, AlertTriangle, Filter,
  ChevronLeft, ChevronRight, ExternalLink, Copy, RefreshCw
} from "lucide-react";
import { PageHeader } from "@/components/admin/CmsUI";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type RefundTypeFilter = "full" | "partial" | "all";
type StatusFilter = "succeeded" | "pending" | "failed" | "all";

const REASON_LABELS: Record<string, string> = {
  requested_by_customer: "Customer Request",
  defective_item: "Defective / Damaged",
  wrong_item: "Wrong Item",
  not_as_described: "Not As Described",
  size_issue: "Size / Fit Issue",
  late_delivery: "Late Delivery",
  duplicate_order: "Duplicate Order",
  other: "Other",
};

export default function AdminRefundHistory() {
  const [search, setSearch] = useState("");
  const [refundType, setRefundType] = useState<RefundTypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const queryInput = useMemo(() => ({
    search: search || undefined,
    refundType,
    status,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit,
    offset: page * limit,
  }), [search, refundType, status, startDate, endDate, page]);

  const { data, isLoading, refetch } = trpc.admin.refunds.list.useQuery(queryInput);
  const { data: stats, isLoading: statsLoading } = trpc.admin.refunds.stats.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const exportMutation = trpc.admin.refunds.export.useMutation({
    onSuccess: (result) => {
      // Download CSV
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `refund-history-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.count} refund records`);
    },
    onError: (e) => toast.error(e.message),
  });

  const pdfExportMutation = trpc.admin.refunds.exportPdf.useMutation({
    onSuccess: (result) => {
      // Decode base64 and download PDF
      const byteChars = atob(result.pdf);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `refund-history-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.count} refund records as PDF`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleExport = () => {
    exportMutation.mutate({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      refundType: refundType !== "all" ? refundType : undefined,
      status: status !== "all" ? status : undefined,
    });
  };

  const handlePdfExport = () => {
    pdfExportMutation.mutate({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      refundType: refundType !== "all" ? refundType : undefined,
      status: status !== "all" ? status : undefined,
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Copied to clipboard");
  };

  const clearFilters = () => {
    setSearch("");
    setRefundType("all");
    setStatus("all");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const hasFilters = search || refundType !== "all" || status !== "all" || startDate || endDate;

  const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;
  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("en-MY", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const statusBadge = (s: string) => {
    switch (s) {
      case "succeeded":
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Succeeded</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  const totalPages = data?.total ? Math.ceil(data.total / limit) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Refund History"
          description="Track all processed refunds with Stripe IDs, amounts, and timestamps"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="bg-gray-900 hover:bg-gray-800 text-white gap-1.5"
          >
            {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePdfExport}
            disabled={pdfExportMutation.isPending}
            className="gap-1.5"
          >
            {pdfExportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.refundCount || 0}
                  </p>
                  <p className="text-xs text-gray-500">Total Refunds</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.totalRefunded ? formatPrice(stats.totalRefunded) : "RM 0.00"}
                  </p>
                  <p className="text-xs text-gray-500">Total Refunded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : (stats ? Math.max(0, stats.refundCount - stats.failedRefunds - (stats.fullRefunds + stats.partialRefunds)) : 0)}
                  </p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.failedRefunds || 0}
                  </p>
                  <p className="text-xs text-gray-500">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-gray-500 h-6 px-2">
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search order #, email, Stripe ID..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="pl-9 text-sm"
                />
              </div>
              <Select value={refundType} onValueChange={(v) => { setRefundType(v as RefundTypeFilter); setPage(0); }}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Refund Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full">Full Refund</SelectItem>
                  <SelectItem value="partial">Partial Refund</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(0); }}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                className="text-sm"
                placeholder="Start Date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                className="text-sm"
                placeholder="End Date"
              />
            </div>
          </CardContent>
        </Card>

        {/* Refund Table */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading refund history...</span>
              </div>
            ) : !data?.refunds?.length ? (
              <div className="text-center py-16">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No refunds found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {hasFilters ? "Try adjusting your filters" : "Refund records will appear here after processing returns"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Order Total</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Stripe IDs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.refunds.map((refund: any) => (
                        <tr key={refund.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                            {formatDate(refund.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-medium text-gray-900">
                              {refund.orderNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-gray-900 text-xs font-medium">{refund.customerName || "—"}</p>
                              <p className="text-gray-500 text-xs">{refund.customerEmail || "—"}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${
                              refund.refundType === "full" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-purple-200 text-purple-700 bg-purple-50"
                            }`}>
                              {refund.refundType === "full" ? "Full" : "Partial"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-gray-900">{formatPrice(refund.refundAmount)}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500 text-xs">
                            {formatPrice(refund.orderTotal)}
                          </td>
                          <td className="px-4 py-3">
                            {statusBadge(refund.status)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {REASON_LABELS[refund.reason] || refund.reason || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {refund.stripeRefundId && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopyId(refund.stripeRefundId)}
                                      className="flex items-center gap-1 text-xs font-mono text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <Copy className="h-3 w-3" />
                                      {refund.stripeRefundId.slice(0, 18)}...
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-mono text-xs">{refund.stripeRefundId}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Click to copy</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {refund.stripePaymentIntentId && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopyId(refund.stripePaymentIntentId)}
                                      className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                      <Copy className="h-3 w-3" />
                                      {refund.stripePaymentIntentId.slice(0, 14)}...
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-mono text-xs">{refund.stripePaymentIntentId}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Payment Intent — click to copy</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {!refund.stripeRefundId && !refund.stripePaymentIntentId && (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {data.refunds.map((refund: any) => (
                    <div key={refund.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium text-gray-900">{refund.orderNumber}</span>
                        {statusBadge(refund.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">{formatPrice(refund.refundAmount)}</span>
                        <Badge variant="outline" className={`text-xs ${
                          refund.refundType === "full" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-purple-200 text-purple-700 bg-purple-50"
                        }`}>
                          {refund.refundType === "full" ? "Full" : "Partial"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>{refund.customerName || "—"} · {refund.customerEmail || "—"}</p>
                        <p>{formatDate(refund.createdAt)}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {REASON_LABELS[refund.reason] || refund.reason || "—"}
                      </div>
                      {refund.stripeRefundId && (
                        <button
                          onClick={() => handleCopyId(refund.stripeRefundId)}
                          className="flex items-center gap-1 text-xs font-mono text-blue-600"
                        >
                          <Copy className="h-3 w-3" />
                          Refund: {refund.stripeRefundId.slice(0, 20)}...
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Showing {page * limit + 1}-{Math.min((page + 1) * limit, data.total)} of {data.total} refunds
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="h-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-gray-600">
                        Page {page + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="h-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary footer */}
        {data?.total ? (
          <p className="text-xs text-gray-400 text-center">{data.total} refund record(s) total</p>
        ) : null}
      </div>
    </AdminLayout>
  );
}
