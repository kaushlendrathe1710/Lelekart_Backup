import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductPage from "./pages/product-page";
import { Layout } from "@/components/layout/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ProtectedRoute } from "@/lib/protected-route";

// Import dashboard components
import AdminDashboardPage from "./pages/admin/dashboard";
import SellerDashboardPage from "./pages/seller/dashboard";
import BuyerDashboardPage from "./pages/buyer/dashboard";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/product/:id" component={ProductPage} />
              
              {/* Protected dashboard routes */}
              <ProtectedRoute path="/admin/dashboard" role="admin" component={AdminDashboardPage} />
              <ProtectedRoute path="/seller/dashboard" role="seller" component={SellerDashboardPage} />
              <ProtectedRoute path="/buyer/dashboard" role="buyer" component={BuyerDashboardPage} />
              
              <Route component={NotFound} />
            </Switch>
          </Layout>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
