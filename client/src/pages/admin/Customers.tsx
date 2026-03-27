import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search, Users, Loader2, Shield, User, Mail, Calendar, ShoppingBag, Download, UserX,
  AlertTriangle, Plus, Pencil, Phone, MapPin, Tag, CheckCircle2, XCircle, Save
} from "lucide-react";
import { PageHeader, HelpText, FormField, ConfirmDialog, StatusBadge as CmsStatusBadge } from "@/components/admin/CmsUI";

const CUSTOMER_GROUPS = [
  { value: "new", label: "New Customer", color: "bg-blue-100 text-blue-800" },
  { value: "returning", label: "Returning", color: "bg-green-100 text-green-800" },
  { value: "vip", label: "VIP", color: "bg-purple-100 text-purple-800" },
  { value: "wholesale", label: "Wholesale", color: "bg-amber-100 text-amber-800" },
];

const MALAYSIAN_STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang",
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor",
  "Terengganu", "W.P. Kuala Lumpur", "W.P. Labuan", "W.P. Putrajaya",
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function VerifiedBadge({ verified, label }: { verified: boolean; label: string }) {
  return (
    <CmsStatusBadge variant={verified ? "success" : "neutral"} dot>
      {label}
    </CmsStatusBadge>
  );
}

const emptyForm = {
  name: "", email: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", state: "", postalCode: "", country: "Malaysia", role: "user" as const,
  customerGroup: "new",
};

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [anonymizeTarget, setAnonymizeTarget] = useState<{ id: number; name: string; email: string } | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ id: number; name: string; newRole: string } | null>(null);

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

  const createMut = trpc.admin.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Customer created successfully");
      setCreateDialog(false);
      setCreateForm({ ...emptyForm });
      setFormErrors({});
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.admin.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Customer updated");
      setEditMode(false);
      setEditForm({});
      utils.admin.customers.getById.invalidate({ id: selectedId! });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRole = trpc.admin.customers.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      setRoleChangeTarget(null);
      utils.admin.customers.getById.invalidate();
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const anonymizeMutation = trpc.admin.customers.anonymize.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setAnonymizeTarget(null);
      setSelectedId(null);
      refetch();
      utils.admin.customers.getById.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};
    if (!createForm.name.trim()) errors.name = "Name is required";
    if (!createForm.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) errors.email = "Invalid email format";
    if (createForm.phone && !/^[\d\s\-+()]+$/.test(createForm.phone)) errors.phone = "Invalid phone format";
    if (createForm.postalCode && !/^\d{5}$/.test(createForm.postalCode)) errors.postalCode = "Malaysian postal codes are 5 digits";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateCreateForm()) return;
    createMut.mutate(createForm);
  };

  const handleSaveEdit = () => {
    if (!selectedId || Object.keys(editForm).length === 0) return;
    updateMut.mutate({ id: selectedId, ...editForm });
  };

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
    } catch {
      toast.error('Failed to export customers. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("en-MY", { month: "short", day: "numeric", year: "numeric" });
  const formatCurrency = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;
  const getGroupBadge = (group: string) => CUSTOMER_GROUPS.find(g => g.value === group) || CUSTOMER_GROUPS[0];

  const customerList = data?.users || [];
  const filteredCustomers = groupFilter === "all"
    ? customerList
    : customerList.filter((u: any) => u.customerGroup === groupFilter);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description={`Manage your customer base. ${data?.total || 0} registered customers. Create, edit, and manage customer profiles and roles.`}
        >
          <Button variant="outline" onClick={handleExportCSV} disabled={isExporting || isLoading}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button onClick={() => setCreateDialog(true)} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </PageHeader>

        {/* Filters */}
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
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {CUSTOMER_GROUPS.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customer Table */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !filteredCustomers?.length ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No customers found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or create a new customer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Customer</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Contact</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Group</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Joined</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCustomers.map((u: any) => {
                      const group = getGroupBadge(u.customerGroup || 'new');
                      return (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-red-600">{(u.name || u.email || "?").charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">{u.name || "—"}</span>
                                {u.totalOrders > 0 && (
                                  <p className="text-xs text-gray-400">{u.totalOrders} order{u.totalOrders !== 1 ? 's' : ''}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500">{u.email}</p>
                            {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${group.color}`}>
                              {group.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <VerifiedBadge verified={u.emailVerified} label={u.emailVerified ? "Verified" : "Unverified"} />
                              {u.profileCompleted && <VerifiedBadge verified={true} label="Profile complete" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedId(u.id); setEditMode(false); setEditForm({}); }}>View</Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Create Customer Dialog ===== */}
      <Dialog open={createDialog} onOpenChange={(o) => { if (!o) { setCreateDialog(false); setFormErrors({}); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create New Customer</DialogTitle>
            <DialogDescription>
              Add a customer manually. They will receive a welcome email with login instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
              <div>
                <FieldLabel required>Full Name</FieldLabel>
                <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Ahmad bin Abdullah" className={formErrors.name ? "border-red-400" : ""} />
                {formErrors.name ? <p className="text-xs text-red-500 mt-1">{formErrors.name}</p> : <HelpText>Customer's full legal name as it appears on their ID.</HelpText>}
              </div>
              <div>
                <FieldLabel required>Email Address</FieldLabel>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="ahmad@example.com" className={formErrors.email ? "border-red-400" : ""} />
                {formErrors.email ? <p className="text-xs text-red-500 mt-1">{formErrors.email}</p> : <HelpText>Must be unique. Used for login and order notifications.</HelpText>}
              </div>
              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+60 12-345 6789" className={formErrors.phone ? "border-red-400" : ""} />
                {formErrors.phone ? <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p> : <HelpText>Malaysian format preferred. Used for SMS notifications and delivery updates.</HelpText>}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Shipping Address</h3>
              <div>
                <FieldLabel>Address Line 1</FieldLabel>
                <Input value={createForm.addressLine1} onChange={(e) => setCreateForm({ ...createForm, addressLine1: e.target.value })} placeholder="No. 12, Jalan Bukit Bintang" />
                <HelpText>Street address, unit number, or building name.</HelpText>
              </div>
              <div>
                <FieldLabel>Address Line 2</FieldLabel>
                <Input value={createForm.addressLine2} onChange={(e) => setCreateForm({ ...createForm, addressLine2: e.target.value })} placeholder="Taman Sri Hartamas" />
                <HelpText>Apartment, suite, floor, or additional details.</HelpText>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>City</FieldLabel>
                  <Input value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} placeholder="Kuala Lumpur" />
                </div>
                <div>
                  <FieldLabel>State</FieldLabel>
                  <Select value={createForm.state} onValueChange={(v) => setCreateForm({ ...createForm, state: v })}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {MALAYSIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Postal Code</FieldLabel>
                  <Input value={createForm.postalCode} onChange={(e) => setCreateForm({ ...createForm, postalCode: e.target.value })} placeholder="50450" className={formErrors.postalCode ? "border-red-400" : ""} />
                  {formErrors.postalCode && <p className="text-xs text-red-500 mt-1">{formErrors.postalCode}</p>}
                </div>
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <Input value={createForm.country} onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Classification</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Role</FieldLabel>
                  <Select value={createForm.role} onValueChange={(v: any) => setCreateForm({ ...createForm, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <HelpText>Admins have full access to the seller center.</HelpText>
                </div>
                <div>
                  <FieldLabel>Customer Group</FieldLabel>
                  <Select value={createForm.customerGroup} onValueChange={(v) => setCreateForm({ ...createForm, customerGroup: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_GROUPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <HelpText>Used for segmentation and targeted promotions.</HelpText>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setCreateDialog(false); setFormErrors({}); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Customer Detail / Edit Dialog ===== */}
      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) { setSelectedId(null); setEditMode(false); setEditForm({}); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Customer Details</span>
              {customerDetail && !editMode && (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : customerDetail ? (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-xl font-bold text-red-600">{(customerDetail.name || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{customerDetail.name || "—"}</p>
                    <p className="text-sm text-gray-500">{customerDetail.email}</p>
                    <div className="flex gap-2 mt-1">
                      <VerifiedBadge verified={customerDetail.emailVerified} label={customerDetail.emailVerified ? "Email verified" : "Email unverified"} />
                      <VerifiedBadge verified={customerDetail.profileCompleted} label={customerDetail.profileCompleted ? "Profile complete" : "Profile incomplete"} />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">Total Spent</p>
                    <p className="font-bold text-lg">{formatCurrency(customerDetail.totalSpent || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">Orders</p>
                    <p className="font-bold text-lg">{customerDetail.orderCount || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">Avg. Order</p>
                    <p className="font-bold text-lg">{customerDetail.orderCount > 0 ? formatCurrency(Math.round((customerDetail.totalSpent || 0) / customerDetail.orderCount)) : "—"}</p>
                  </div>
                </div>

                {/* Editable Fields */}
                {editMode ? (
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700">Edit Customer Details</h3>
                    <div>
                      <FieldLabel>Name</FieldLabel>
                      <Input defaultValue={customerDetail.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <FieldLabel>Phone</FieldLabel>
                      <Input defaultValue={customerDetail.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+60 12-345 6789" />
                    </div>
                    <div>
                      <FieldLabel>Address Line 1</FieldLabel>
                      <Input defaultValue={customerDetail.addressLine1 || ""} onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })} />
                    </div>
                    <div>
                      <FieldLabel>Address Line 2</FieldLabel>
                      <Input defaultValue={customerDetail.addressLine2 || ""} onChange={(e) => setEditForm({ ...editForm, addressLine2: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>City</FieldLabel>
                        <Input defaultValue={customerDetail.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                      </div>
                      <div>
                        <FieldLabel>State</FieldLabel>
                        <Select defaultValue={customerDetail.state || ""} onValueChange={(v) => setEditForm({ ...editForm, state: v })}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {MALAYSIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Postal Code</FieldLabel>
                        <Input defaultValue={customerDetail.postalCode || ""} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
                      </div>
                      <div>
                        <FieldLabel>Customer Group</FieldLabel>
                        <Select defaultValue={customerDetail.customerGroup || "new"} onValueChange={(v) => setEditForm({ ...editForm, customerGroup: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CUSTOMER_GROUPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveEdit} disabled={updateMut.isPending || Object.keys(editForm).length === 0} className="bg-red-600 hover:bg-red-700 text-white">
                        {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => { setEditMode(false); setEditForm({}); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 border-t pt-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-gray-400" /> {customerDetail.phone || "No phone"}</div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>{customerDetail.addressLine1 ? `${customerDetail.addressLine1}${customerDetail.addressLine2 ? ', ' + customerDetail.addressLine2 : ''}, ${customerDetail.city || ''} ${customerDetail.postalCode || ''}, ${customerDetail.state || ''}, ${customerDetail.country || 'Malaysia'}` : "No address on file"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getGroupBadge(customerDetail.customerGroup || 'new').color}`}>
                        {getGroupBadge(customerDetail.customerGroup || 'new').label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600"><Calendar className="h-4 w-4 text-gray-400" /> Joined {formatDate(customerDetail.createdAt)}</div>
                  </div>
                )}
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="mt-4">
                {customerDetail.orders?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {customerDetail.orders.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-3">
                        <div>
                          <span className="font-medium">#{o.orderNumber || o.id}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{o.status}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(o.totalAmount)}</span>
                          <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2" />
                    <p>No orders yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-4 mt-4">
                {/* Role Change */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Shield className="h-4 w-4" /> Role Management</h4>
                  <p className="text-xs text-gray-500 mt-1 mb-3">Change the customer's access level. Admins can access the full seller center.</p>
                  <Select
                    value={customerDetail.role}
                    onValueChange={(v) => setRoleChangeTarget({ id: customerDetail.id, name: customerDetail.name || customerDetail.email, newRole: v })}
                  >
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Anonymize */}
                {customerDetail.role !== "admin" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-800">Data Privacy (PDPA/GDPR)</h4>
                        <p className="text-xs text-red-600 mt-1">
                          Permanently anonymize this customer's personal data. This action is irreversible.
                          Order records are retained for accounting with anonymized details.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                          onClick={() => setAnonymizeTarget({ id: customerDetail.id, name: customerDetail.name || "Unknown", email: customerDetail.email })}
                        >
                          <UserX className="h-4 w-4 mr-1.5" /> Anonymize Customer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ===== Role Change Confirmation ===== */}
      <AlertDialog open={!!roleChangeTarget} onOpenChange={(o) => !o && setRoleChangeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-purple-500" /> Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>You are about to change the role for <strong>{roleChangeTarget?.name}</strong> to <strong>{roleChangeTarget?.newRole === 'admin' ? 'Admin' : 'Customer'}</strong>.</p>
                {roleChangeTarget?.newRole === 'admin' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    <strong>Warning:</strong> Admin users have full access to the seller center, including orders, products, customer data, and settings.
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                if (roleChangeTarget) updateRole.mutate({ id: roleChangeTarget.id, role: roleChangeTarget.newRole as any });
              }}
            >
              {updateRole.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Anonymize Confirmation ===== */}
      <AlertDialog open={!!anonymizeTarget} onOpenChange={(open) => !open && setAnonymizeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Anonymize Customer Data</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to permanently anonymize all personal data for:</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="font-semibold text-gray-900">{anonymizeTarget?.name}</p>
                  <p className="text-sm text-gray-500">{anonymizeTarget?.email}</p>
                </div>
                <p className="font-semibold text-red-600">This action is irreversible. The following data will be permanently deleted:</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Name, email, phone number</li>
                  <li>Shipping addresses on all orders</li>
                  <li>Password and authentication tokens</li>
                  <li>Marketing consent and preferences</li>
                  <li>UTM tracking and referral data</li>
                </ul>
                <p className="text-sm text-gray-500">Order records will be retained for accounting purposes with anonymized details.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={anonymizeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={anonymizeMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (anonymizeTarget) anonymizeMutation.mutate({ id: anonymizeTarget.id });
              }}
            >
              {anonymizeMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Anonymizing...</> : <><UserX className="h-4 w-4 mr-2" /> Anonymize Permanently</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
