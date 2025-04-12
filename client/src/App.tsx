import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import ProductPage from "./pages/product-page";
import AdminDashboard from "./pages/admin/dashboard";
import SellerDashboard from "./pages/seller/dashboard";
import BuyerDashboard from "./pages/buyer/dashboard";
import { Layout } from "@/components/layout/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Regular routes */}
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/product/:id" component={ProductPage} />
        
        {/* Dashboard routes */}
        <ProtectedRoute path="/admin/dashboard" role="admin" component={AdminDashboard} />
        <ProtectedRoute path="/seller/dashboard" role="seller" component={SellerDashboard} />
        <ProtectedRoute path="/buyer/dashboard" role="buyer" component={BuyerDashboard} />
        
        {/* 404 page */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
