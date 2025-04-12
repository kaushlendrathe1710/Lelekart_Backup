import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductPage from "./pages/product-page";
import CartPage from "./pages/cart-page";
import CheckoutPage from "./pages/checkout-page";
import OrderConfirmationPage from "./pages/order-confirmation-page";
import OrdersPage from "./pages/orders-page";
import OrderDetailsPage from "./pages/order-details-page";
import { Layout } from "@/components/layout/layout";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Import dashboard components
import AdminDashboardPage from "./pages/admin/dashboard";
import SellerDashboardPage from "./pages/seller/dashboard";
import BuyerDashboardPage from "./pages/buyer/dashboard";

// Create a component for protected routes
function ProtectedRouteGuard({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  // Check if user has the required role
  if (role && user.role !== role) {
    // If there's a role mismatch, redirect to their own dashboard
    const dashboardPath = 
      user.role === 'admin' ? '/admin/dashboard' :
      user.role === 'seller' ? '/seller/dashboard' : 
      user.role === 'buyer' ? '/buyer/dashboard' : '/';
      
    setLocation(dashboardPath);
    return null;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <div className="app">
            <Switch>
              <Route path="/">
                {() => (
                  <Layout>
                    <HomePage />
                  </Layout>
                )}
              </Route>
              <Route path="/auth">
                {() => (
                  <Layout>
                    <AuthPage />
                  </Layout>
                )}
              </Route>
              <Route path="/product/:id">
                {() => (
                  <Layout>
                    <ProductPage />
                  </Layout>
                )}
              </Route>
              
              {/* Cart, Checkout, and Order routes - restricted to buyers */}
              <Route path="/cart">
                {() => (
                  <Layout>
                    <ProtectedRouteGuard role="buyer">
                      <CartPage />
                    </ProtectedRouteGuard>
                  </Layout>
                )}
              </Route>
              <Route path="/checkout">
                {() => (
                  <Layout>
                    <ProtectedRouteGuard role="buyer">
                      <CheckoutPage />
                    </ProtectedRouteGuard>
                  </Layout>
                )}
              </Route>
              <Route path="/order-confirmation/:id">
                {(params) => (
                  <Layout>
                    <ProtectedRouteGuard role="buyer">
                      <OrderConfirmationPage />
                    </ProtectedRouteGuard>
                  </Layout>
                )}
              </Route>
              <Route path="/orders">
                {() => (
                  <Layout>
                    <ProtectedRouteGuard role="buyer">
                      <OrdersPage />
                    </ProtectedRouteGuard>
                  </Layout>
                )}
              </Route>
              <Route path="/order/:id">
                {(params) => (
                  <Layout>
                    <ProtectedRouteGuard role="buyer">
                      <OrderDetailsPage />
                    </ProtectedRouteGuard>
                  </Layout>
                )}
              </Route>
              
              {/* Protected dashboard routes */}
              <Route path="/admin/dashboard">
                {() => (
                  <ProtectedRouteGuard role="admin">
                    <AdminDashboardPage />
                  </ProtectedRouteGuard>
                )}
              </Route>
              <Route path="/seller/dashboard">
                {() => (
                  <ProtectedRouteGuard role="seller">
                    <SellerDashboardPage />
                  </ProtectedRouteGuard>
                )}
              </Route>
              <Route path="/buyer/dashboard">
                {() => (
                  <ProtectedRouteGuard role="buyer">
                    <BuyerDashboardPage />
                  </ProtectedRouteGuard>
                )}
              </Route>
              
              <Route>
                {() => (
                  <Layout>
                    <NotFound />
                  </Layout>
                )}
              </Route>
            </Switch>
            <Toaster />
          </div>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
