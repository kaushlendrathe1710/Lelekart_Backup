import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/layout";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  role?: string;
}

export function ProtectedRoute({
  component: Component,
  role
}: ProtectedRouteProps) {
  // Use try-catch to handle cases where useAuth might throw
  try {
    // Use the auth hook to get user data
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

    // The component contains its own layout if needed
    return <Component />;
  } catch (error) {
    // If useAuth fails (likely because we're outside AuthProvider),
    // redirect to the login page
    console.error("Auth context error:", error);
    return <Redirect to="/auth" />;
  }
}
