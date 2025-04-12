import { Switch, Route } from "wouter";
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
                    <ProtectedRoute 
                      path="/cart" 
                      role="buyer" 
                      component={() => <CartPage />} 
                    />
                  </Layout>
                )}
              </Route>
              <Route path="/checkout">
                {() => (
                  <Layout>
                    <ProtectedRoute 
                      path="/checkout" 
                      role="buyer" 
                      component={() => <CheckoutPage />} 
                    />
                  </Layout>
                )}
              </Route>
              <Route path="/order-confirmation/:id">
                {(params) => (
                  <Layout>
                    <OrderConfirmationPage />
                  </Layout>
                )}
              </Route>
              <Route path="/orders">
                {() => (
                  <Layout>
                    <ProtectedRoute 
                      path="/orders" 
                      role="buyer" 
                      component={() => <OrdersPage />} 
                    />
                  </Layout>
                )}
              </Route>
              <Route path="/order/:id">
                {(params) => (
                  <Layout>
                    <ProtectedRoute 
                      path="/order/:id" 
                      role="buyer" 
                      component={() => <OrderDetailsPage />} 
                    />
                  </Layout>
                )}
              </Route>
              
              {/* Protected dashboard routes */}
              <Route path="/admin/dashboard">
                {() => (
                  <ProtectedRoute 
                    path="/admin/dashboard" 
                    role="admin" 
                    component={AdminDashboardPage} 
                  />
                )}
              </Route>
              <Route path="/seller/dashboard">
                {() => (
                  <ProtectedRoute 
                    path="/seller/dashboard" 
                    role="seller" 
                    component={SellerDashboardPage} 
                  />
                )}
              </Route>
              <Route path="/buyer/dashboard">
                {() => (
                  <ProtectedRoute 
                    path="/buyer/dashboard" 
                    role="buyer" 
                    component={BuyerDashboardPage} 
                  />
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
