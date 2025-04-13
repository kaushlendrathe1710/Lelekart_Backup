import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductDetailsPage from "./pages/product-details"; // New Flipkart-style product page
import SearchResultsPage from "./pages/search-results-page"; // Search Results Page
import CategoryPage from "./pages/category-page";
import CartPage from "./pages/cart-page";
import CheckoutPage from "./pages/checkout-page";
import OrderConfirmationPage from "./pages/order-confirmation-page";
import OrdersPage from "./pages/orders-page";
import OrderDetailsPage from "./pages/order-details-page";
import { Layout } from "@/components/layout/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { AIAssistantProvider } from "@/context/ai-assistant-context";
import { AIAssistantButton, AIShoppingAssistant } from "@/components/ai";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ProtectedRoute } from "./lib/protected-route";

// Import dashboard components
import SellerOrdersPage from "./pages/seller/orders";
import AdminDashboard from "./pages/admin/index";
import AdminProducts from "./pages/admin/products";
import AdminUsers from "./pages/admin/users";
import AdminOrders from "./pages/admin/orders";
import AdminCategories from "./pages/admin/categories";
import SellerDashboardPage from "./pages/seller/dashboard";
import SellerProductsPage from "./pages/seller/products";
import AddProductPage from "./pages/seller/add-product";
import EditProductPage from "./pages/seller/edit-product";
import ProductPreviewPage from "./pages/seller/product-preview";
import BulkUploadPage from "./pages/seller/bulk-upload";
import BuyerDashboardPage from "./pages/buyer/dashboard";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <AIAssistantProvider>
            <TooltipProvider>
              <div className="app">
                {/* AI Assistant components */}
                <AIAssistantButton />
                <AIShoppingAssistant />
                
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
              {/* New Flipkart-style product details page */}
              <Route path="/product/:id">
                {(params) => {
                  console.log("App router matched product page with params:", params);
                  return (
                    <Layout>
                      <ProductDetailsPage />
                    </Layout>
                  );
                }}
              </Route>
              
              {/* Search Results Page */}
              <Route path="/search">
                {() => (
                  <Layout>
                    <SearchResultsPage />
                  </Layout>
                )}
              </Route>
              
              {/* Category page */}
              <Route path="/category/:category">
                {(params) => {
                  const category = params?.category;
                  
                  if (!category) {
                    return (
                      <Layout>
                        <NotFound />
                      </Layout>
                    );
                  }
                  
                  // Use unique key that includes route path to force complete remounting
                  const componentKey = `category-${category}-${Date.now()}`;
                  return (
                    <Layout>
                      <div className="category-page-container" key={componentKey}>
                        <CategoryPage />
                      </div>
                    </Layout>
                  );
                }}
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
                {() => (
                  <Layout>
                    <ProtectedRoute 
                      path="/order-confirmation/:id" 
                      role="buyer" 
                      component={() => <OrderConfirmationPage />} 
                    />
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
                {() => (
                  <Layout>
                    <ProtectedRoute 
                      path="/order/:id" 
                      role="buyer" 
                      component={() => <OrderDetailsPage />} 
                    />
                  </Layout>
                )}
              </Route>
              
              {/* Admin Routes */}
              <Route path="/admin">
                {() => (
                  <ProtectedRoute 
                    path="/admin" 
                    role="admin" 
                    component={AdminDashboard} 
                  />
                )}
              </Route>
              {/* Redirect for old dashboard URL to new URL */}
              <Route path="/admin/dashboard">
                {() => (
                  <ProtectedRoute 
                    path="/admin/dashboard" 
                    role="admin" 
                    component={() => {
                      window.location.href = "/admin";
                      return null;
                    }} 
                  />
                )}
              </Route>
              <Route path="/admin/products">
                {() => (
                  <ProtectedRoute 
                    path="/admin/products" 
                    role="admin" 
                    component={AdminProducts} 
                  />
                )}
              </Route>
              <Route path="/admin/users">
                {() => (
                  <ProtectedRoute 
                    path="/admin/users" 
                    role="admin" 
                    component={AdminUsers} 
                  />
                )}
              </Route>
              <Route path="/admin/orders">
                {() => (
                  <ProtectedRoute 
                    path="/admin/orders" 
                    role="admin" 
                    component={AdminOrders} 
                  />
                )}
              </Route>
              <Route path="/admin/categories">
                {() => (
                  <ProtectedRoute 
                    path="/admin/categories" 
                    role="admin" 
                    component={AdminCategories} 
                  />
                )}
              </Route>
              {/* Seller route with nested paths to use the same layout */}
              <Route path="/seller/dashboard">
                {() => (
                  <ProtectedRoute 
                    path="/seller/dashboard" 
                    role="seller" 
                    component={SellerDashboardPage} 
                  />
                )}
              </Route>
              <Route path="/seller/products">
                {() => (
                  <ProtectedRoute 
                    path="/seller/products" 
                    role="seller" 
                    component={SellerProductsPage} 
                  />
                )}
              </Route>
              <Route path="/seller/products/add">
                {() => (
                  <ProtectedRoute 
                    path="/seller/products/add" 
                    role="seller" 
                    component={AddProductPage} 
                  />
                )}
              </Route>
              <Route path="/seller/products/edit/:id">
                {() => (
                  <ProtectedRoute 
                    path="/seller/products/edit/:id" 
                    role="seller" 
                    component={EditProductPage} 
                  />
                )}
              </Route>
              <Route path="/seller/products/preview/:id">
                {() => (
                  <ProtectedRoute 
                    path="/seller/products/preview/:id" 
                    role="seller" 
                    component={ProductPreviewPage} 
                  />
                )}
              </Route>
              <Route path="/seller/products/bulk-upload">
                {() => (
                  <ProtectedRoute 
                    path="/seller/products/bulk-upload" 
                    role="seller" 
                    component={BulkUploadPage} 
                  />
                )}
              </Route>
              <Route path="/seller/inventory">
                {() => (
                  <ProtectedRoute 
                    path="/seller/inventory" 
                    role="seller" 
                    component={() => (
                      <SellerDashboardPage />
                    )} 
                  />
                )}
              </Route>
              <Route path="/seller/orders">
                {() => (
                  <ProtectedRoute 
                    path="/seller/orders" 
                    role="seller" 
                    component={SellerOrdersPage} 
                  />
                )}
              </Route>
              <Route path="/seller/shipping">
                {() => (
                  <ProtectedRoute 
                    path="/seller/shipping" 
                    role="seller" 
                    component={() => (
                      <SellerDashboardPage />
                    )} 
                  />
                )}
              </Route>
              <Route path="/seller/returns">
                {() => (
                  <ProtectedRoute 
                    path="/seller/returns" 
                    role="seller" 
                    component={() => (
                      <SellerDashboardPage />
                    )} 
                  />
                )}
              </Route>
              <Route path="/seller/analytics">
                {() => (
                  <ProtectedRoute 
                    path="/seller/analytics" 
                    role="seller" 
                    component={() => (
                      <SellerDashboardPage />
                    )} 
                  />
                )}
              </Route>
              <Route path="/seller/payments">
                {() => (
                  <ProtectedRoute 
                    path="/seller/payments" 
                    role="seller" 
                    component={() => (
                      <SellerDashboardPage />
                    )} 
                  />
                )}
              </Route>
              <Route path="/seller/settings">
                {() => (
                  <ProtectedRoute 
                    path="/seller/settings" 
                    role="seller" 
                    component={() => (
                      <SellerDashboardPage />
                    )} 
                  />
                )}
              </Route>
              <Route path="/seller/help">
                {() => (
                  <ProtectedRoute 
                    path="/seller/help" 
                    role="seller" 
                    component={() => (
                      <SellerDashboardPage />
                    )} 
                  />
                )}
              </Route>
              <Route path="/seller/profile">
                {() => (
                  <ProtectedRoute 
                    path="/seller/profile" 
                    role="seller" 
                    component={() => (
                      <SellerDashboardPage />
                    )} 
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
            </TooltipProvider>
          </AIAssistantProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
