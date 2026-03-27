import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X,
  Warehouse,
  Tag,
  Truck,
  Mail,
  Megaphone,
  Image,
  FileText,
  Search,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Globe,
  Navigation,
  ShoppingBag,
  MessageSquare,
  Activity,
  Store,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href?: string;
  icon: any;
  children?: { name: string; href: string }[];
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: user } = trpc.adminAuthRouter.me.useQuery(undefined, { retry: false });
  const adminLogout = trpc.adminAuthRouter.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out of Seller Center");
      window.location.href = "/admin/login";
    },
  });
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["Orders", "Products"]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Please log in to the admin panel.
          </p>
          <Button asChild>
            <Link href="/admin/login">Admin Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    adminLogout.mutate();
  };

  const toggleSection = (name: string) => {
    setExpandedSections(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { 
      name: "Orders", 
      icon: ShoppingCart,
      children: [
        { name: "All Orders", href: "/admin/orders" },
        { name: "Cancellations", href: "/admin/orders/cancellations" },
        { name: "Returns", href: "/admin/orders/returns" },
      ]
    },
    { 
      name: "Products", 
      icon: Package,
      children: [
        { name: "All Products", href: "/admin/products" },
        { name: "Add Product", href: "/admin/products/new" },
        { name: "Categories", href: "/admin/categories" },
        { name: "Inventory", href: "/admin/inventory" },
      ]
    },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { 
      name: "Marketing", 
      icon: Megaphone,
      children: [
        { name: "Promotions", href: "/admin/promotions" },
        { name: "Campaigns", href: "/admin/campaigns" },
        { name: "Cart Recovery", href: "/admin/cart-recovery" },
      ]
    },
    { 
      name: "Messaging", 
      icon: MessageSquare,
      children: [
        { name: "Email Templates", href: "/admin/email-templates" },
        { name: "Message Log", href: "/admin/messages" },
      ]
    },
    { 
      name: "Content", 
      icon: FileText,
      children: [
        { name: "Banners", href: "/admin/banners" },
        { name: "Pages", href: "/admin/pages" },
        { name: "Navigation", href: "/admin/navigation" },
        { name: "Media Library", href: "/admin/media" },
      ]
    },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { 
      name: "SEO", 
      icon: Search,
      children: [
        { name: "Meta Tags", href: "/admin/seo" },
        { name: "Redirects", href: "/admin/seo/redirects" },
      ]
    },
    { name: "Shipping", href: "/admin/shipping", icon: Truck },
    { name: "Activity Log", href: "/admin/activity", icon: Activity },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (href: string) => location === href;
  const isSectionActive = (item: NavItem) => {
    if (item.href) return location === item.href;
    return item.children?.some(child => location === child.href || location.startsWith(child.href + "/"));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200">
            <Link href="/admin">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Store className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Logo size="sm" variant="dark" />
                  <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase border-l border-gray-200 pl-1.5">Seller Center</span>
                </div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {navigation.map((item) => {
              if (item.children) {
                const isExpanded = expandedSections.includes(item.name);
                const sectionActive = isSectionActive(item);
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        sectionActive
                          ? "text-red-700 bg-red-50 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-[18px] w-[18px]" />
                        <span>{item.name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="ml-5 pl-4 border-l border-gray-200 mt-0.5 mb-1 space-y-0.5">
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href}>
                            <span
                              className={`block px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                                isActive(child.href)
                                  ? "text-red-700 bg-red-50 font-medium"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              {child.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link key={item.name} href={item.href!}>
                  <span
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                      isActive(item.href!)
                        ? "text-red-700 bg-red-50 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    <span>{item.name}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-red-600">
                  {user.name?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name || "Admin"}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                asChild
              >
                <Link href="/">
                  <Globe className="h-3.5 w-3.5 mr-1" />
                  Store
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-full px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/">
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  View Storefront
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
