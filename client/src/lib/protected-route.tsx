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

        // Dashboard routes don't need Layout wrapper, only regular pages
        const isDashboardRoute = 
          path.startsWith('/admin/dashboard') || 
          path.startsWith('/seller/dashboard') || 
          path.startsWith('/buyer/dashboard');

        if (isDashboardRoute) {
          return <Component />;
        }

        return (
          <Layout>
            <Component />
          </Layout>
        );
      }}
    </Route>
  );
}
