import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Activity, User, Package, ShoppingCart, Settings, FileText } from "lucide-react";

const actionIcons: Record<string, any> = {
  "order": ShoppingCart,
  "product": Package,
  "user": User,
  "settings": Settings,
  "seo": FileText,
};

function getIcon(action: string) {
  const prefix = action.split(".")[0];
  const Icon = actionIcons[prefix] || Activity;
  return <Icon className="h-4 w-4" />;
}

function formatAction(action: string) {
  return action.replace(/\./g, " → ").replace(/_/g, " ");
}

export default function AdminActivityLog() {
  const { data: logs, isLoading } = trpc.admin.activity.list.useQuery({ limit: 100 });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track all admin actions and system events</p>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !logs?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No activity yet</p>
                <p className="text-sm mt-1">Actions performed in the admin panel will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mt-0.5 shrink-0">
                      {getIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">{formatAction(log.action)}</span>
                        {log.entityType && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{log.entityType} {log.entityId ? `#${log.entityId}` : ""}</span>
                        )}
                      </div>
                      {log.details && <p className="text-xs text-gray-500 mt-1 truncate max-w-xl">{log.details}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        User #{log.userId} &middot; {new Date(log.createdAt).toLocaleString()}
                        {log.ipAddress && <span> &middot; {log.ipAddress}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
