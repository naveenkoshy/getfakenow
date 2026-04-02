import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Star, Loader2, CheckCircle2, XCircle, Clock, MessageSquare,
  Trash2, Eye, Search, Filter, ThumbsUp, ShieldCheck, AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/admin/CmsUI";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${cls} ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const queryInput = {
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
    offset: 0,
  };

  const { data, isLoading, refetch } = trpc.admin.reviews.list.useQuery(queryInput);
  const { data: stats } = trpc.admin.reviews.stats.useQuery();

  const approveMutation = trpc.admin.reviews.approve.useMutation({
    onSuccess: () => { toast.success("Review approved"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const rejectMutation = trpc.admin.reviews.reject.useMutation({
    onSuccess: () => { toast.success("Review rejected"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.reviews.delete.useMutation({
    onSuccess: () => { toast.success("Review deleted"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const respondMutation = trpc.admin.reviews.respond.useMutation({
    onSuccess: () => { toast.success("Response posted"); setRespondDialog(false); setResponseText(""); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const [respondDialog, setRespondDialog] = useState(false);
  const [respondingReview, setRespondingReview] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [previewReview, setPreviewReview] = useState<any>(null);

  const reviews = (data?.reviews || []).filter((r: any) =>
    !searchQuery ||
    r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case "approved": return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return null;
    }
  };

  const statusVariant = (s: string): "success" | "warning" | "error" | "neutral" => {
    return s === "approved" ? "success" : s === "pending" ? "warning" : s === "rejected" ? "error" : "neutral";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Reviews & Ratings"
          description="Moderate customer reviews, respond to feedback, and manage your product ratings."
        />

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Approved</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats?.approved || 0}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Rejected</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats?.rejected || 0}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
                </div>
                <Star className="h-8 w-8 text-gray-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search reviews by customer, product, or content..." className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : !reviews.length ? (
              <div className="text-center py-12 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">{searchQuery || statusFilter !== "all" ? "No reviews match your filters" : "No reviews yet"}</p>
                <p className="text-sm text-gray-400 mt-1">Customer reviews will appear here once submitted.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reviews.map((review: any) => (
                  <div key={review.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Review Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StarRating rating={review.rating} />
                          <StatusBadge variant={statusVariant(review.status)} dot>
                            {review.status}
                          </StatusBadge>
                          {review.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="h-3 w-3" /> Verified Purchase
                            </span>
                          )}
                          {review.images?.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                              <ImageIcon className="h-3 w-3" /> {review.images.length} photo{review.images.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {review.title && (
                          <p className="text-sm font-semibold text-gray-900 mt-2">{review.title}</p>
                        )}
                        {review.body && (
                          <p className="text-sm text-gray-700 mt-1 line-clamp-3">{review.body}</p>
                        )}

                        {/* Review images */}
                        {review.images?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {review.images.slice(0, 4).map((img: any) => (
                              <img key={img.id} src={img.imageUrl} alt="" className="h-12 w-12 rounded object-cover border" />
                            ))}
                          </div>
                        )}

                        {/* Admin response */}
                        {review.adminResponse && (
                          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <p className="text-xs font-medium text-blue-800 mb-1">Store Response:</p>
                            <p className="text-xs text-blue-700">{review.adminResponse}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>By <strong>{review.userName}</strong></span>
                          <span>Product: <strong>{review.productName}</strong></span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> {review.helpfulCount} helpful
                          </span>
                          <span>{new Date(review.createdAt).toLocaleDateString("en-MY", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {review.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => approveMutation.mutate({ id: review.id })}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => rejectMutation.mutate({ id: review.id })}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setRespondingReview(review); setResponseText(review.adminResponse || ""); setRespondDialog(true); }}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" /> Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => setDeleteTarget(review)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Respond Dialog */}
      <Dialog open={respondDialog} onOpenChange={(o) => { if (!o) setRespondDialog(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Respond to Review
            </DialogTitle>
            <DialogDescription>
              Your response will be publicly visible below the customer's review.
            </DialogDescription>
          </DialogHeader>
          {respondingReview && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={respondingReview.rating} />
                <span className="text-gray-500">by {respondingReview.userName}</span>
              </div>
              {respondingReview.title && <p className="font-medium">{respondingReview.title}</p>}
              {respondingReview.body && <p className="text-gray-600 mt-1 line-clamp-3">{respondingReview.body}</p>}
            </div>
          )}
          <Textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Write your response..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!responseText.trim() || !respondingReview) return;
                respondMutation.mutate({ id: respondingReview.id, response: responseText });
              }}
              disabled={respondMutation.isPending || !responseText.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {respondMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Post Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Delete Review
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this review by <strong>{deleteTarget?.userName}</strong> on <strong>{deleteTarget?.productName}</strong>?
              This will remove the review and update the product's rating. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate({ id: deleteTarget.id });
                setDeleteTarget(null);
              }}
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
