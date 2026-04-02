import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import {
  Package, ShoppingCart, Users, DollarSign, TrendingUp,
  AlertTriangle, ArrowRight, Clock, CheckCircle2,
  Loader2, Calendar, Activity, BarChart3, Star, Box
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { RefundTrendsChart } from "@/components/RefundTrendsChart";
import { PageHeader, StatusBadge, EmptyState } from "@/components/admin/CmsUI";

const TIME_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 0 },
] as const;

export default function AdminDashboard() {
  const [rangeDays, setRangeDays] = useState(30);

  const dateRange = useMemo(() => {
    if (rangeDays === 0) return undefined;
    const end = new Date();
    const start = new Date(end.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [rangeDays]);

  const { data: stats, isLoading: statsLoading } = trpc.admin.dashboard.stats.useQuery(dateRange);
  const { data: recentOrders, isLoading: ordersLoading } = trpc.admin.orders.list.useQuery({ limit: 5, offset: 0 });
  const { data: lowStock, isLoading: stockLoading } = trpc.admin.inventory.lowStock.useQuery({ threshold: 10 });
  const { data: outOfStock } = trpc.admin.inventory.outOfStock.useQuery();
  const { data: productsData } = trpc.admin.products.list.useQuery({ limit: 1, offset: 0 });
  const { data: revenueData, isLoading: revenueLoading } = trpc.admin.dashboard.revenueChart.useQuery({ days: rangeDays || 365 });
  const { data: topProducts, isLoading: topProductsLoading } = trpc.admin.dashboard.topProducts.useQuery({ limit: 5 });
  const { data: ordersByStatus } = trpc.admin.dashboard.ordersByStatus.useQuery();
  const { data: activityLog, isLoading: activityLoading } = trpc.admin.dashboard.recentActivity.useQuery({ limit: 10 });

  const formatCurrency = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;
  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("en-MY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatChartDate = (d: string) => new Date(d).toLocaleDateString("en-MY", { month: "short", day: "numeric" });

  const orderStatusVariant = (s: string) => {
    const map: Record<string, "success" | "warning" | "error" | "info" | "neutral" | "purple"> = {
      pending: "warning", processing: "info", shipped: "purple",
      delivered: "success", cancelled: "error", refunded: "neutral",
    };
    return map[s] || "neutral";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader title="Dashboard" description="Overview of your store performance" />
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {TIME_RANGES.map((r) => (
              <Button
                key={r.label}
                variant={rangeDays === r.days ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setRangeDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statsLoading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs text-green-600 font-medium">From paid orders</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statsLoading ? "..." : stats?.orderCount || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <Clock className="h-3.5 w-3.5 text-yellow-600" />
                <span className="text-xs text-yellow-600 font-medium">
                  {statsLoading ? "..." : stats?.pendingOrders || 0} pending
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Products</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statsLoading ? "..." : productsData?.total || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {(outOfStock?.length || 0) > 0 ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">{outOfStock?.length} out of stock</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">All in stock</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Customers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statsLoading ? "..." : stats?.customerCount || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <span className="text-xs text-gray-500">Registered accounts</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Order</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statsLoading ? "..." : formatCurrency(
                      stats?.orderCount ? Math.round(stats.totalRevenue / stats.orderCount) : 0
                    )}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <span className="text-xs text-gray-500">Per paid order</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">To Ship</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statsLoading ? "..." : stats?.ordersToShip || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Package className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs text-amber-600 font-medium">Paid, awaiting shipment</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Revenue Overview
            </CardTitle>
            <span className="text-xs text-gray-500">
              {rangeDays === 0 ? "All time" : `Last ${rangeDays} days`}
            </span>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : !revenueData?.length ? (
              <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No revenue data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueData.map((d: any) => ({ ...d, revenue: Number(d.revenue || 0) / 100 }))}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={formatChartDate} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `RM${v}`} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value: number) => [`RM ${value.toFixed(2)}`, "Revenue"]}
                    labelFormatter={formatChartDate}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#DC2626" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <Card className="lg:col-span-2 bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700" asChild>
                <Link href="/admin/orders">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : !recentOrders?.orders?.length ? (
                <EmptyState icon="inbox" title="No orders yet" description="Orders will appear here once customers start purchasing." />
              ) : (
                <div className="space-y-3">
                  {recentOrders.orders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">#{order.id}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge variant={orderStatusVariant(order.status)} dot>
                          {order.status}
                        </StatusBadge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Stock Alerts</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700" asChild>
                <Link href="/admin/inventory">Manage <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : !lowStock?.length && !outOfStock?.length ? (
                <EmptyState icon="package" title="All products in stock" description="No stock alerts at this time." />
              ) : (
                <div className="space-y-2">
                  {outOfStock?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900 truncate">{p.name}</p>
                      </div>
                      <StatusBadge variant="error">OUT</StatusBadge>
                    </div>
                  ))}
                  {lowStock?.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-yellow-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-yellow-900 truncate">{p.name}</p>
                      </div>
                      <StatusBadge variant="warning">{p.stockQuantity} left</StatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products + Activity Feed + Order Status */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Products */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Star className="h-4 w-4" /> Top Products
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700" asChild>
                <Link href="/admin/products">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {topProductsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : !topProducts?.length ? (
                <EmptyState icon="package" title="No sales data yet" description="Top products will appear once orders come in." />
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p: any, i: number) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5 text-right">#{i + 1}</span>
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Box className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.productName}</p>
                        <p className="text-xs text-gray-500">{Number(p.totalQuantity)} sold</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(Number(p.totalRevenue))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : !activityLog?.length ? (
                <EmptyState icon="inbox" title="No activity yet" description="Store activity will be logged here." />
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto">
                  {activityLog.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800">
                          <span className="font-medium">{a.action}</span>
                          {a.entityType && <span className="text-gray-500"> on {a.entityType}</span>}
                          {a.entityId && <span className="text-gray-400"> #{a.entityId}</span>}
                        </p>
                        {a.details && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{typeof a.details === "string" ? a.details : JSON.stringify(a.details)}</p>}
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(a.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders by Status */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Orders by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!ordersByStatus?.length ? (
                <EmptyState icon="inbox" title="No orders" description="Order status breakdown will appear here." />
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {ordersByStatus.map((s: any) => {
                      const total = ordersByStatus.reduce((sum: number, x: any) => sum + (x.count || 0), 0);
                      const pct = total > 0 ? ((s.count / total) * 100).toFixed(0) : 0;
                      return (
                        <div key={s.status} className="flex items-center gap-3">
                          <StatusBadge variant={orderStatusVariant(s.status)} dot>
                            {s.status}
                          </StatusBadge>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-12 text-right">{s.count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={ordersByStatus} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                      <YAxis dataKey="status" type="category" tick={{ fontSize: 10, fill: "#6B7280" }} width={80} />
                      <Bar dataKey="count" fill="#DC2626" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Refund Trends Chart */}
        <RefundTrendsChart />

        {/* Quick Actions */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link href="/admin/products/new">
                  <Package className="h-5 w-5" />
                  <span className="text-xs">Add Product</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link href="/admin/promotions">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs">Create Promo</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link href="/admin/banners">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Manage Banners</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link href="/admin/analytics">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">View Analytics</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
