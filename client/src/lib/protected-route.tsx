import { Loader2 } from "lucide-react";
import { Redirect, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AuthContext, AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { useContext } from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  role?: string;
}

export function ProtectedRoute({
  component: Component,
  role
}: ProtectedRouteProps) {
  // Try to use AuthContext first
  const authContext = useContext(AuthContext);
  
  // Fallback to direct API call if context is not available
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch('/api/user', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch user');
      }
      
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });
  
  // Use context user if available, otherwise use query user
  const currentUser = authContext?.user || user;
  const isCurrentlyLoading = authContext ? authContext.isLoading : isLoading;
  
  if (isCurrentlyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <Redirect to="/auth" />;
  }

  // Check if user has the required role
  if (role && currentUser.role !== role) {
    // If there's a role mismatch, redirect to their own dashboard
    const dashboardPath = 
      currentUser.role === 'admin' ? '/admin' : // Changed from /admin/dashboard to /admin
      currentUser.role === 'seller' ? '/seller/dashboard' : 
      currentUser.role === 'buyer' ? '/buyer/dashboard' : '/';
      
    return <Redirect to={dashboardPath} />;
  }

  // Wrap component with necessary providers
  return (
    <AuthProvider>
      <CartProvider>
        <Component />
      </CartProvider>
    </AuthProvider>
  );
}
