import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/layout";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  role?: string;
}

export function ProtectedRoute({
  component: Component,
  role
}: ProtectedRouteProps) {
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
}
