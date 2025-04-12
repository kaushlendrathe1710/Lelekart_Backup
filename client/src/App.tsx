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
import { SimpleHeader } from "@/components/layout/simple-header";
import { Footer } from "@/components/layout/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/seller/dashboard" component={SellerDashboard} />
      <Route path="/buyer/dashboard" component={BuyerDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <SimpleHeader />
      <main className="flex-grow">
        <Router />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default App;
