import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Users, Loader2, Shield, User, Mail, Calendar, ShoppingBag, Download } from "lucide-react";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filters = useMemo(() => ({
    search: search || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    limit: 50,
    offset: 0,
  }), [search, roleFilter]);

  const { data, isLoading, refetch } = trpc.admin.customers.list.useQuery(filters);
  const { data: customerDetail, isLoading: detailLoading } = trpc.admin.customers.getById.useQuery(
    { id: selectedId! }, { enabled: !!selectedId }
  );
  const utils = trpc.useUtils();
  const updateRole = trpc.admin.customers.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await utils.admin.export.customers.fetch();
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
        toast.success(`Exported ${result.count} customers`);
      }
    } catch (error) {
      toast.error('Failed to export customers. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("en-MY", { month: "short", day: "numeric", year: "numeric" });
  const formatCurrency = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500 mt-1">{data?.total || 0} registered customers</p>
          </div>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !data?.users?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Customer</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Joined</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-red-600">{(u.name || u.email || "?").charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{u.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedId(u.id)}>View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Customer Details</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : customerDetail ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-red-600">{(customerDetail.name || "?").charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{customerDetail.name || "—"}</p>
                  <p className="text-sm text-gray-500">{customerDetail.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Total Spent</p>
                  <p className="font-bold text-lg">{formatCurrency(customerDetail.totalSpent || 0)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Orders</p>
                  <p className="font-bold text-lg">{customerDetail.orderCount || 0}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Select
                  value={customerDetail.role}
                  onValueChange={(v) => updateRole.mutate({ id: customerDetail.id, role: v as any })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {customerDetail.orders?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Orders</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {customerDetail.orders.slice(0, 5).map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                        <span className="font-medium">#{o.orderNumber || o.id}</span>
                        <span>{formatCurrency(o.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
