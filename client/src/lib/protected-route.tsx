import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/layout";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  role?: string;
}

export function ProtectedRoute({
  path,
  component: Component,
  role
}: ProtectedRouteProps) {
  return (
    <Route path={path}>
      {() => {
        // Move the useAuth call inside the Route render function
        // This ensures it's used within the AuthProvider context
        const { user, isLoading } = useAuth();
        
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Check if user has the required role
        if (role && user.role !== role) {
          // If there's a role mismatch, redirect to their own dashboard
          const dashboardPath = 
            user.role === 'admin' ? '/admin/dashboard' :
            user.role === 'seller' ? '/seller/dashboard' : 
            user.role === 'buyer' ? '/buyer/dashboard' : '/';
            
          return <Redirect to={dashboardPath} />;
        }

        // Special case for orders and order detail pages - don't add Layout as they use DashboardLayout
        const isDashboardOrOrdersRoute = 
          path.startsWith('/admin/dashboard') || 
          path.startsWith('/seller/dashboard') || 
          path.startsWith('/buyer/dashboard') ||
          path.startsWith('/orders') ||
          path.startsWith('/order/');

        // Return component directly for dashboard and order routes
        if (isDashboardOrOrdersRoute) {
          return <Component />;
        }

        // Wrap other protected routes with Layout
        return (
          <Layout>
            <Component />
          </Layout>
        );
      }}
    </Route>
  );
}
