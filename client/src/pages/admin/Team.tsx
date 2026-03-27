import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Loader2, UserPlus, Mail, Shield, Clock, CheckCircle2, XCircle, 
  AlertTriangle, Copy, Users 
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

export default function AdminTeam() {
  const { data: invites, isLoading, refetch } = trpc.admin.invites.list.useQuery();
  const createInvite = trpc.admin.invites.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setEmail("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const revokeInvite = trpc.admin.invites.revoke.useMutation({
    onSuccess: () => {
      toast.success("Invite revoked");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [email, setEmail] = useState("");
  const [revokeId, setRevokeId] = useState<number | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    createInvite.mutate({ email: email.trim() });
  };

  const getStatusBadge = (status: string, expiresAt: string | Date) => {
    const expired = new Date(expiresAt) < new Date();
    if (status === "accepted") return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Accepted</Badge>;
    if (status === "revoked") return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Revoked</Badge>;
    if (expired) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" /> Expired</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
  };

  const pendingCount = invites?.filter((i: any) => i.status === "pending" && new Date(i.expiresAt) > new Date()).length || 0;
  const acceptedCount = invites?.filter((i: any) => i.status === "accepted").length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team & Invites</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin team members and send invitations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-xs text-gray-500">Pending Invites</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{acceptedCount}</p>
                <p className="text-xs text-gray-500">Accepted</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(invites?.length || 0)}</p>
                <p className="text-xs text-gray-500">Total Invites</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invite Form */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-gray-400" />
              Invite New Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-3">
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button 
                type="submit" 
                disabled={createInvite.isPending || !email.trim()} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Send Invite
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              The invited user will receive an email with a secure setup link. Invites expire after 7 days.
              Admin passwords must be at least 12 characters with uppercase, lowercase, numbers, and special characters.
            </p>
          </CardContent>
        </Card>

        {/* Invites List */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Invite History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : !invites?.length ? (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No invites sent yet</p>
                <p className="text-sm mt-1">Use the form above to invite team members</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invites.map((invite: any) => {
                  const isPending = invite.status === "pending" && new Date(invite.expiresAt) > new Date();
                  return (
                    <div key={invite.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{invite.email}</p>
                          <p className="text-xs text-gray-500">
                            Invited by {invite.inviterName} &middot; {new Date(invite.createdAt).toLocaleDateString()}
                            {invite.acceptedAt && <span> &middot; Accepted {new Date(invite.acceptedAt).toLocaleDateString()}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(invite.status, invite.expiresAt)}
                        {isPending && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRevokeId(invite.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeId !== null} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invite?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the invite link. The recipient will no longer be able to set up their admin account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (revokeId) revokeInvite.mutate({ id: revokeId });
                setRevokeId(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Revoke Invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
