import React, { lazy } from 'react';
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
import { WalletProvider } from './context/wallet-context';
import { WishlistProvider } from './context/wishlist-context';
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
import BannerManagement from './pages/admin/banner-management-new';
import DesignHero from './pages/admin/design-hero';
import FooterManagement from './pages/admin/footer-management';
import ManageAdmins from './pages/admin/manage-admins';
import CreateUser from './pages/admin/create-user';
import AdminShippingManagement from './pages/admin/shipping-management';
import RewardsManagement from './pages/admin/rewards-management';
import GiftCardsManagement from './pages/admin/gift-cards-management';
import WalletManagementPage from './pages/admin/wallet-management';
// Import shared components
import { SuspenseWrapper } from './components/shared/suspense-wrapper';

// Import shipping pages dynamically
const ShippingDashboard = lazy(() => import('./pages/admin/shipping-dashboard'));
const PendingShipments = lazy(() => import('./pages/admin/pending-shipments'));
const ShippingRates = lazy(() => import('./pages/admin/shipping-rates'));
const TrackingManagement = lazy(() => import('./pages/admin/tracking-management'));
const TrackingDetails = lazy(() => import('./pages/admin/tracking-details'));
const CreateShipment = lazy(() => import('./pages/admin/create-shipment'));
const OrderDetails = lazy(() => import('./pages/admin/order-details'));

// Seller pages
import SellerDashboardPage from './pages/seller/dashboard';
import SellerProductsPage from './pages/seller/products';
import AddProductPage from './pages/seller/add-product';
import EditProductPage from './pages/seller/edit-product';
import ProductPreviewPage from './pages/seller/product-preview';
import PublicSellerProfilePage from './pages/seller/public-profile';
import SellerOrdersPage from './pages/seller/orders';
import BulkUploadPage from './pages/seller/bulk-upload';
import SmartInventoryPage from './pages/seller/smart-inventory';
import SellerProfilePage from './pages/seller/profile';
import SellerReturnsPage from './pages/seller/returns';
import SellerAnalyticsPage from './pages/seller/analytics';
import SellerPaymentsPage from './pages/seller/payments';
import SellerSettingsPage from './pages/seller/settings';
import SellerHelpPage from './pages/seller/help';
import PublicSellerProfileWrapper from './pages/seller/public-profile-wrapper';

// Buyer pages
import BuyerDashboardPage from './pages/buyer/dashboard';
import BuyerWishlistPage from './pages/buyer/wishlist';
import BuyerSettingsPage from './pages/buyer/settings';
import BuyerReviewsPage from './pages/buyer/reviews';
import AddressManagementPage from './pages/buyer/address-management';
import BuyerRewardsPage from './pages/buyer/rewards';
import BuyerGiftCardsPage from './pages/buyer/gift-cards';
import BuyerWalletPage from './pages/buyer/wallet';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <CartProvider>
            <WishlistProvider>
              <AIAssistantProvider>
                <TooltipProvider>
                  <div className="app">
                    <AIAssistantButton />
                    <AIShoppingAssistant />
                    <Switch>
                      {/* Public seller profile route */}
                      <Route path="/seller/public-profile/:id">
                        {(params) => <PublicSellerProfileWrapper />}
                      </Route>
                      
                      {/* Home page */}
                      <Route path="/">
                        {() => (
                          <Layout>
                            <HomePage />
                          </Layout>
                        )}
                      </Route>
                      
                      {/* Auth page */}
                      <Route path="/auth">
                        {() => (
                          <Layout>
                            <AuthPage />
                          </Layout>
                        )}
                      </Route>
                      
                      {/* Product details page */}
                      <Route path="/product/:id">
                        {(params) => (
                          <Layout>
                            <ProductDetailsPage />
                          </Layout>
                        )}
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
                      
                      <Route path="/admin/design-hero">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/design-hero" 
                            role="admin" 
                            component={DesignHero} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/footer-management">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/footer-management" 
                            role="admin" 
                            component={FooterManagement} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/shipping-management">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/shipping-management" 
                            role="admin" 
                            component={() => (
                              <SuspenseWrapper>
                                <AdminShippingManagement />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/shiprocket">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/shiprocket" 
                            role="admin" 
                            component={() => (
                              <SuspenseWrapper>
                                {React.createElement(lazy(() => import('./pages/admin/shiprocket')))}
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/shipping-dashboard">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/shipping-dashboard" 
                            role="admin" 
                            component={() => (
                              <SuspenseWrapper>
                                <ShippingDashboard />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/pending-shipments">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/pending-shipments" 
                            role="admin" 
                            component={() => (
                              <SuspenseWrapper>
                                <PendingShipments />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/shipping-rates">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/shipping-rates" 
                            role="admin" 
                            component={() => (
                              <SuspenseWrapper>
                                <ShippingRates />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/tracking-management">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/tracking-management" 
                            role="admin" 
                            component={() => (
                              <SuspenseWrapper>
                                <TrackingManagement />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/create-shipment">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/create-shipment" 
                            role="admin" 
                            component={() => (
                              <SuspenseWrapper>
                                <CreateShipment />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/order-details/:id">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/order-details/:id" 
                            role="admin" 
                            component={() => (
                              <SuspenseWrapper>
                                <OrderDetails />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/tracking-details/:trackingNumber">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/tracking-details/:trackingNumber" 
                            role="admin" 
                            component={() => (
                              <SuspenseWrapper>
                                <TrackingDetails />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/manage-admins">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/manage-admins" 
                            role="admin" 
                            component={ManageAdmins} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/create-user">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/create-user" 
                            role="admin" 
                            component={CreateUser} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/rewards-management">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/rewards-management" 
                            role="admin" 
                            component={RewardsManagement} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/gift-cards-management">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/gift-cards-management" 
                            role="admin" 
                            component={GiftCardsManagement} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/admin/wallet-management">
                        {() => (
                          <ProtectedRoute 
                            path="/admin/wallet-management" 
                            role="admin" 
                            component={WalletManagementPage} 
                          />
                        )}
                      </Route>
                      
                      {/* Seller Routes */}
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
                      
                      <Route path="/seller/orders">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/orders" 
                            role="seller" 
                            component={SellerOrdersPage} 
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
                      
                      {/* Redirect for backward compatibility */}
                      <Route path="/seller/bulk-upload">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/bulk-upload" 
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
                      
                      <Route path="/seller/profile">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/profile" 
                            role="seller" 
                            component={SellerProfilePage} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/seller/returns">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/returns" 
                            role="seller" 
                            component={SellerReturnsPage} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/seller/analytics">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/analytics" 
                            role="seller" 
                            component={SellerAnalyticsPage} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/seller/payments">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/payments" 
                            role="seller" 
                            component={SellerPaymentsPage} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/seller/settings">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/settings" 
                            role="seller" 
                            component={SellerSettingsPage} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/seller/help">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/help" 
                            role="seller" 
                            component={SellerHelpPage} 
                          />
                        )}
                      </Route>
                      
                      {/* Add missing route for seller inventory */}
                      <Route path="/seller/inventory">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/inventory" 
                            role="seller" 
                            component={() => (
                              <SellerProductsPage inventoryView={true} />
                            )} 
                          />
                        )}
                      </Route>
                      
                      {/* Add missing route for seller payments */}
                      <Route path="/seller/payments">
                        {() => (
                          <ProtectedRoute 
                            path="/seller/payments" 
                            role="seller" 
                            component={SellerPaymentsPage} 
                          />
                        )}
                      </Route>
                      
                      {/* Buyer Pages */}
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
                      
                      <Route path="/buyer/rewards">
                        {() => (
                          <ProtectedRoute 
                            path="/buyer/rewards" 
                            role="buyer" 
                            component={BuyerRewardsPage} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/buyer/gift-cards">
                        {() => (
                          <ProtectedRoute 
                            path="/buyer/gift-cards" 
                            role="buyer" 
                            component={BuyerGiftCardsPage} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/buyer/wallet">
                        {() => (
                          <ProtectedRoute 
                            path="/buyer/wallet" 
                            role="buyer" 
                            component={BuyerWalletPage} 
                          />
                        )}
                      </Route>
                      
                      <Route path="/buyer/reviews">
                        {() => (
                          <ProtectedRoute 
                            path="/buyer/reviews" 
                            role="buyer" 
                            component={BuyerReviewsPage} 
                          />
                        )}
                      </Route>
                      
                      {/* 404 Not Found */}
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
            </WishlistProvider>
          </CartProvider>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;