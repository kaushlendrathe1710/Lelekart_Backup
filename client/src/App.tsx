import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import HomePage from './pages/home-page';
import AuthPage from './pages/auth-page';
import SearchResultsPage from './pages/search-results-page';
import ProductDetailsPage from './pages/product-details';
import CartPage from './pages/cart-page';
import CheckoutPage from './pages/checkout-page';
import OrdersPage from './pages/orders-page';
import OrderDetailsPage from './pages/order-details-page';
import OrderConfirmationPage from './pages/order-confirmation-page';
import CategoryPage from './pages/category-page';
import AllProductsPage from './pages/all-products-page';
import NotFound from './pages/not-found';
import { Layout } from './components/layout/layout';
import { ProtectedRoute } from './lib/protected-route';
import { AuthProvider } from './hooks/use-auth';
import { CartProvider } from './context/cart-context';
import { AIAssistantProvider } from './context/ai-assistant-context';
import { AIAssistantButton } from './components/ai/ai-assistant-button';
import { AIShoppingAssistant } from './components/ai/ai-shopping-assistant';

// Admin pages
import AdminDashboard from './pages/admin/dashboard';
import AdminProducts from './pages/admin/products';
import AdminUsers from './pages/admin/users';
import AdminOrders from './pages/admin/orders';
import AdminCategories from './pages/admin/categories';
import SellerApproval from './pages/admin/seller-approval';
import ProductApproval from './pages/admin/product-approval';
import BannerManagement from './pages/admin/banner-management';

// Seller pages
import SellerDashboardPage from './pages/seller/dashboard';
import SellerProductsPage from './pages/seller/products';
import AddProductPage from './pages/seller/add-product';
import EditProductPage from './pages/seller/edit-product';
import ProductPreviewPage from './pages/seller/product-preview';
import SellerOrdersPage from './pages/seller/orders';
import BulkUploadPage from './pages/seller/bulk-upload';
import SmartInventoryPage from './pages/seller/smart-inventory';
import SellerProfilePage from './pages/seller/profile';
import BuyerDashboardPage from './pages/buyer/dashboard';
import BuyerWishlistPage from './pages/buyer/wishlist';
import BuyerSettingsPage from './pages/buyer/settings';
import AddressManagementPage from './pages/buyer/address-management';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AIAssistantProvider>
          <CartProvider>
            <TooltipProvider>
              <div className="app">
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
                  
                  {/* All Products Page with pagination */}
                  <Route path="/products">
                    {() => (
                      <Layout>
                        <AllProductsPage />
                      </Layout>
                    )}
                  </Route>
                  
                  <Route path="/products/page/:page">
                    {() => (
                      <Layout>
                        <AllProductsPage />
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
                  <Route path="/admin/seller-approval">
                    {() => (
                      <ProtectedRoute 
                        path="/admin/seller-approval" 
                        role="admin" 
                        component={SellerApproval} 
                      />
                    )}
                  </Route>
                  <Route path="/admin/product-approval">
                    {() => (
                      <ProtectedRoute 
                        path="/admin/product-approval" 
                        role="admin" 
                        component={ProductApproval} 
                      />
                    )}
                  </Route>
                  <Route path="/admin/banner-management">
                    {() => (
                      <ProtectedRoute 
                        path="/admin/banner-management" 
                        role="admin" 
                        component={BannerManagement} 
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
                  <Route path="/seller/smart-inventory">
                    {() => (
                      <ProtectedRoute 
                        path="/seller/smart-inventory" 
                        role="seller" 
                        component={SmartInventoryPage} 
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
                        component={SellerProfilePage} 
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
                  <Route path="/buyer/wishlist">
                    {() => (
                      <ProtectedRoute 
                        path="/buyer/wishlist" 
                        role="buyer" 
                        component={BuyerWishlistPage} 
                      />
                    )}
                  </Route>
                  <Route path="/buyer/settings">
                    {() => (
                      <ProtectedRoute 
                        path="/buyer/settings" 
                        role="buyer" 
                        component={BuyerSettingsPage} 
                      />
                    )}
                  </Route>
                  <Route path="/buyer/addresses">
                    {() => (
                      <ProtectedRoute 
                        path="/buyer/addresses" 
                        role="buyer" 
                        component={AddressManagementPage} 
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
          </CartProvider>
        </AIAssistantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;