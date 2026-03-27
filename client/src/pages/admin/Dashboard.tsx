import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Package, ShoppingCart, Users, DollarSign, TrendingUp, 
  AlertTriangle, ArrowRight, Clock, CheckCircle2, XCircle,
  Loader2
} from "lucide-react";
import { RefundTrendsChart } from "@/components/RefundTrendsChart";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.dashboard.stats.useQuery();
  const { data: recentOrders, isLoading: ordersLoading } = trpc.admin.orders.list.useQuery({ limit: 5, offset: 0 });
  const { data: lowStock, isLoading: stockLoading } = trpc.admin.inventory.lowStock.useQuery({ threshold: 10 });
  const { data: outOfStock } = trpc.admin.inventory.outOfStock.useQuery();
  const { data: productsData } = trpc.admin.products.list.useQuery({ limit: 1, offset: 0 });

  const formatCurrency = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;
  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("en-MY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return map[s] || "bg-gray-100 text-gray-800";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your store performance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        </div>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Orders - takes 2 cols */}
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
                <div className="text-center py-8 text-gray-500 text-sm">No orders yet</div>
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
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(order.status)}`}>
                          {order.status}
                        </span>
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
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">All products in stock</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {outOfStock?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900 truncate">{p.name}</p>
                      </div>
                      <span className="text-xs font-bold text-red-600 ml-2">OUT</span>
                    </div>
                  ))}
                  {lowStock?.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-yellow-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-yellow-900 truncate">{p.name}</p>
                      </div>
                      <span className="text-xs font-bold text-yellow-600 ml-2">{p.stockQuantity} left</span>
                    </div>
                  ))}
                </div>
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
