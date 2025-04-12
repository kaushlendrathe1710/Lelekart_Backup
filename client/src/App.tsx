import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductPage from "./pages/product-page";
import AdminDashboard from "./pages/admin/dashboard";
import SellerDashboard from "./pages/seller/dashboard";
import BuyerDashboard from "./pages/buyer/dashboard";
import { Layout } from "@/components/layout/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  const [location] = useLocation();
  
  // Check if we're on a dashboard route
  const isDashboardRoute = 
    location.startsWith('/admin/dashboard') || 
    location.startsWith('/seller/dashboard') || 
    location.startsWith('/buyer/dashboard');

  return (
    <Layout isDashboardRoute={isDashboardRoute}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/product/:id" component={ProductPage} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/seller/dashboard" component={SellerDashboard} />
        <Route path="/buyer/dashboard" component={BuyerDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;
