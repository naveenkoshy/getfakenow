import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";

// Storefront pages
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import Casual from "./pages/Casual";
import Professional from "./pages/Professional";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import TermsOfService from "./pages/TermsOfService";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import AdminOrders from "./pages/admin/Orders";
import AdminCustomers from "./pages/admin/Customers";
import AdminInventory from "./pages/admin/Inventory";
import AdminCategories from "./pages/admin/Categories";
import AdminPromotions from "./pages/admin/Promotions";
import AdminEmailTemplates from "./pages/admin/EmailTemplates";
import AdminCampaigns from "./pages/admin/Campaigns";
import AdminBanners from "./pages/admin/Banners";
import AdminPages from "./pages/admin/Pages";
import AdminNavigation from "./pages/admin/Navigation";
import AdminMedia from "./pages/admin/Media";
import AdminShipping from "./pages/admin/Shipping";
import AdminSEO from "./pages/admin/SEO";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AdminActivityLog from "./pages/admin/ActivityLog";
import AdminLogin from "./pages/admin/AdminLogin";
import { AdminRoute } from "./components/AdminRoute";

function Router() {
  return (
    <Switch>
      {/* Storefront */}
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/products" component={Products} />
      <Route path="/casual" component={Casual} />
      <Route path="/professional" component={Professional} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/account" component={Account} />
      <Route path="/orders" component={Orders} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/shipping-policy" component={ShippingPolicy} />
      <Route path="/returns-policy" component={ReturnsPolicy} />
      <Route path="/about" component={About} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/profile" component={Profile} />
      <Route path="/verify-email" component={VerifyEmail} />

      {/* Admin Login — separate from customer auth */}
      <Route path="/admin/login">
        {() => <AdminLogin />}
      </Route>

      {/* Admin — Seller Center (requires admin session) */}
      <Route path="/admin">
        {() => <AdminRoute><AdminDashboard /></AdminRoute>}
      </Route>
      <Route path="/admin/products">
        {() => <AdminRoute><AdminProducts /></AdminRoute>}
      </Route>
      <Route path="/admin/products/new">
        {() => <AdminRoute><AddProduct /></AdminRoute>}
      </Route>
      <Route path="/admin/products/add">
        {() => <AdminRoute><AddProduct /></AdminRoute>}
      </Route>
      <Route path="/admin/products/:id/edit" component={(props: any) => <AdminRoute><EditProduct {...props.params} /></AdminRoute>} />
      <Route path="/admin/orders">
        {() => <AdminRoute><AdminOrders /></AdminRoute>}
      </Route>
      <Route path="/admin/customers">
        {() => <AdminRoute><AdminCustomers /></AdminRoute>}
      </Route>
      <Route path="/admin/inventory">
        {() => <AdminRoute><AdminInventory /></AdminRoute>}
      </Route>
      <Route path="/admin/categories">
        {() => <AdminRoute><AdminCategories /></AdminRoute>}
      </Route>
      <Route path="/admin/promotions">
        {() => <AdminRoute><AdminPromotions /></AdminRoute>}
      </Route>
      <Route path="/admin/email-templates">
        {() => <AdminRoute><AdminEmailTemplates /></AdminRoute>}
      </Route>
      <Route path="/admin/campaigns">
        {() => <AdminRoute><AdminCampaigns /></AdminRoute>}
      </Route>
      <Route path="/admin/banners">
        {() => <AdminRoute><AdminBanners /></AdminRoute>}
      </Route>
      <Route path="/admin/pages">
        {() => <AdminRoute><AdminPages /></AdminRoute>}
      </Route>
      <Route path="/admin/navigation">
        {() => <AdminRoute><AdminNavigation /></AdminRoute>}
      </Route>
      <Route path="/admin/media">
        {() => <AdminRoute><AdminMedia /></AdminRoute>}
      </Route>
      <Route path="/admin/shipping">
        {() => <AdminRoute><AdminShipping /></AdminRoute>}
      </Route>
      <Route path="/admin/seo">
        {() => <AdminRoute><AdminSEO /></AdminRoute>}
      </Route>
      <Route path="/admin/analytics">
        {() => <AdminRoute><AdminAnalytics /></AdminRoute>}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminRoute><AdminSettings /></AdminRoute>}
      </Route>
      <Route path="/admin/activity-log">
        {() => <AdminRoute><AdminActivityLog /></AdminRoute>}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <TooltipProvider>
            <Toaster position="top-center" richColors />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
