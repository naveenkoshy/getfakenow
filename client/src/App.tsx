import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import AdminOrders from "./pages/admin/Orders";
import Casual from "./pages/Casual";
import Professional from "./pages/Professional";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import TermsOfService from "./pages/TermsOfService";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Products} />
      <Route path="/casual" component={Casual} />
      <Route path="/professional" component={Professional} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/account" component={Account} />
      <Route path="/orders" component={Orders} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/products/new" component={AddProduct} />
      <Route path="/admin/products/add" component={AddProduct} />
      <Route path="/admin/products/:id/edit" component={EditProduct} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/shipping-policy" component={ShippingPolicy} />
      <Route path="/returns-policy" component={ReturnsPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
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
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
