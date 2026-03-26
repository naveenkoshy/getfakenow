import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, TrendingUp, DollarSign, ShoppingCart, Users, Package, BarChart3, Download, Calendar } from "lucide-react";

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("7");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [showExportPanel, setShowExportPanel] = useState(false);

  const { data: stats, isLoading: statsLoading } = trpc.admin.dashboard.stats.useQuery();
  const { data: ordersData } = trpc.admin.orders.list.useQuery({ offset: 0, limit: 100 });
  const { data: productsData } = trpc.admin.products.list.useQuery({ offset: 0, limit: 1 });
  const utils = trpc.useUtils();

  const orders = ordersData?.orders || [];

  // Calculate analytics from orders
  const analytics = useMemo(() => {
    const now = Date.now();
    const days = parseInt(period);
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const periodOrders = orders.filter((o: any) => new Date(o.createdAt).getTime() > cutoff);
    const prevCutoff = cutoff - days * 24 * 60 * 60 * 1000;
    const prevOrders = orders.filter((o: any) => {
      const t = new Date(o.createdAt).getTime();
      return t > prevCutoff && t <= cutoff;
    });

    const totalRevenue = periodOrders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
    const prevRevenue = prevOrders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;

    const totalOrders = periodOrders.length;
    const prevTotalOrders = prevOrders.length;
    const ordersChange = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders * 100) : 0;

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Daily breakdown
    const dailyData: { date: string; revenue: number; orders: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000;
      const dayEnd = now - i * 24 * 60 * 60 * 1000;
      const dayOrders = periodOrders.filter((o: any) => {
        const t = new Date(o.createdAt).getTime();
        return t > dayStart && t <= dayEnd;
      });
      const d = new Date(dayEnd);
      dailyData.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        revenue: dayOrders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0),
        orders: dayOrders.length,
      });
    }

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    periodOrders.forEach((o: any) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    return { totalRevenue, revenueChange, totalOrders, ordersChange, avgOrderValue, dailyData, statusCounts };
  }, [orders, period]);

  const maxRevenue = Math.max(...analytics.dailyData.map(d => d.revenue), 1);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const filters: Record<string, string> = {};
      if (exportStartDate) filters.startDate = exportStartDate;
      if (exportEndDate) filters.endDate = exportEndDate;
      const result = await utils.admin.export.analytics.fetch(
        Object.keys(filters).length > 0 ? filters : undefined
      );
      if (result && result.csv) {
        const bom = '\uFEFF';
        const blob = new Blob([bom + result.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Sales report exported");
      }
    } catch (error) {
      toast.error('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Track sales performance, revenue trends, and customer insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowExportPanel(!showExportPanel)}
              className={showExportPanel ? "bg-accent" : ""}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Export Panel */}
        {showExportPanel && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Export sales report:</span>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-[160px]"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-[160px]"
                />
                <Button
                  onClick={handleExportReport}
                  disabled={isExporting}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Download CSV"}
                </Button>
                {(exportStartDate || exportEndDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setExportStartDate(""); setExportEndDate(""); }}
                  >
                    Clear dates
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Includes daily revenue breakdown, top products by revenue, and summary totals. Leave dates empty for all-time data.
              </p>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">RM {(analytics.totalRevenue / 100).toFixed(2)}</p>
                  <p className={`text-xs mt-1 ${analytics.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {analytics.revenueChange >= 0 ? "+" : ""}{analytics.revenueChange.toFixed(1)}% vs previous
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalOrders}</p>
                  <p className={`text-xs mt-1 ${analytics.ordersChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {analytics.ordersChange >= 0 ? "+" : ""}{analytics.ordersChange.toFixed(1)}% vs previous
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">RM {(analytics.avgOrderValue / 100).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Per transaction</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{statsLoading ? "..." : productsData?.total || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Active listings</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center"><Package className="h-5 w-5 text-orange-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-gray-400" /> Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-1">
              {analytics.dailyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center">
                    {d.revenue > 0 && <span className="text-[10px] text-gray-500 mb-1">RM{(d.revenue / 100).toFixed(0)}</span>}
                    <div
                      className="w-full bg-red-500 rounded-t transition-all hover:bg-red-600"
                      style={{ height: `${Math.max((d.revenue / maxRevenue) * 200, d.revenue > 0 ? 4 : 0)}px` }}
                      title={`${d.date}: RM ${(d.revenue / 100).toFixed(2)} (${d.orders} orders)`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">{d.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Breakdown */}
          <Card className="bg-white border-gray-200">
            <CardHeader><CardTitle className="text-lg">Order Status Breakdown</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(analytics.statusCounts).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No orders in this period</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.statusCounts).map(([status, count]) => {
                    const total = analytics.totalOrders;
                    const pct = total > 0 ? (count / total * 100) : 0;
                    const colors: Record<string, string> = {
                      pending: "bg-yellow-500", processing: "bg-blue-500", shipped: "bg-purple-500",
                      delivered: "bg-green-500", cancelled: "bg-red-500", refunded: "bg-gray-500",
                    };
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-gray-700">{status}</span>
                          <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors[status] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white border-gray-200">
            <CardHeader><CardTitle className="text-lg">Recent Orders</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 8).map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order #{o.id}</p>
                        <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">RM {(o.totalAmount / 100).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          o.status === "delivered" ? "bg-green-100 text-green-800" :
                          o.status === "shipped" ? "bg-purple-100 text-purple-800" :
                          o.status === "processing" ? "bg-blue-100 text-blue-800" :
                          o.status === "cancelled" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
