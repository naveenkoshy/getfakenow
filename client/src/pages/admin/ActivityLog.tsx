import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Loader2, Activity, User, Package, ShoppingCart, Settings, FileText,
  Search, Filter, Shield, LogIn, LogOut, UserPlus, Trash2, RotateCcw,
  ChevronLeft, ChevronRight, Globe, AlertTriangle
} from "lucide-react";
import { PageHeader } from "@/components/admin/CmsUI";

const actionIcons: Record<string, any> = {
  "admin.login.success": LogIn,
  "admin.login.failed": AlertTriangle,
  "admin.logout": LogOut,
  "admin.invite.create": UserPlus,
  "admin.invite.revoke": Trash2,
  "customer.anonymize": Shield,
  "order.status.update": ShoppingCart,
  "order": ShoppingCart,
  "product": Package,
  "user": User,
  "settings": Settings,
  "seo": Globe,
  "export": FileText,
};

function getIcon(action: string) {
  const Icon = actionIcons[action] || actionIcons[action.split(".")[0]] || Activity;
  return <Icon className="h-4 w-4" />;
}

function getActionColor(action: string): string {
  if (action.includes("login.failed")) return "bg-red-100 text-red-600";
  if (action.includes("login.success")) return "bg-green-100 text-green-600";
  if (action.includes("logout")) return "bg-gray-100 text-gray-600";
  if (action.includes("invite")) return "bg-purple-100 text-purple-600";
  if (action.includes("anonymize")) return "bg-amber-100 text-amber-600";
  if (action.includes("order")) return "bg-blue-100 text-blue-600";
  if (action.includes("product")) return "bg-indigo-100 text-indigo-600";
  if (action.includes("export")) return "bg-teal-100 text-teal-600";
  return "bg-gray-100 text-gray-500";
}

function formatAction(action: string) {
  return action
    .replace(/\./g, " \u203A ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function parseDetails(details: string | null): Record<string, any> | null {
  if (!details) return null;
  try { return JSON.parse(details); } catch { return null; }
}

export default function AdminActivityLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState<number | undefined>();
  const [page, setPage] = useState(0);
  const pageSize = 30;

  const queryInput = useMemo(() => ({
    action: actionFilter || undefined,
    userId: userFilter,
    search: search || undefined,
    limit: pageSize,
    offset: page * pageSize,
  }), [actionFilter, userFilter, search, page]);

  const { data, isLoading } = trpc.admin.auditLog.list.useQuery(queryInput);
  const { data: actionTypes } = trpc.admin.auditLog.actionTypes.useQuery();
  const { data: adminUsers } = trpc.admin.auditLog.adminUsers.useQuery();

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Activity Audit Log"
          description="Security audit trail of all admin actions with IP tracking"
        />

        {/* Filters */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search details..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="pl-9"
                />
              </div>

              {/* Action Type Filter */}
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Actions</option>
                {actionTypes?.map((t: any) => (
                  <option key={t.action} value={t.action}>
                    {t.action} ({t.count})
                  </option>
                ))}
              </select>

              {/* Admin User Filter */}
              <select
                value={userFilter || ""}
                onChange={(e) => { setUserFilter(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
                className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Admins</option>
                {adminUsers?.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>

              {/* Clear Filters */}
              {(search || actionFilter || userFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(""); setActionFilter(""); setUserFilter(undefined); setPage(0); }}
                  className="h-10"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Log Entries */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : !data?.logs?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No activity found</p>
                <p className="text-sm mt-1">
                  {search || actionFilter || userFilter 
                    ? "Try adjusting your filters" 
                    : "Admin actions will appear here as they occur"
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.logs.map((log: any) => {
                  const details = parseDetails(log.details);
                  const colorClass = getActionColor(log.action);
                  return (
                    <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${colorClass}`}>
                        {getIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{formatAction(log.action)}</span>
                          {log.entityType && (
                            <Badge variant="outline" className="text-xs font-normal">
                              {log.entityType}{log.entityId ? ` #${log.entityId}` : ""}
                            </Badge>
                          )}
                        </div>

                        {/* Parsed Details */}
                        {details && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {Object.entries(details).slice(0, 4).map(([key, val]) => (
                              <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {key}: {typeof val === "object" ? JSON.stringify(val) : String(val)}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.userName}
                          </span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                          {log.ipAddress && (
                            <span className="flex items-center gap-1 font-mono">
                              <Globe className="h-3 w-3" />
                              {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data?.total || 0)} of {data?.total || 0}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
