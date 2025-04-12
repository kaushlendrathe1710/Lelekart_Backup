import { ReactNode } from "react";
import { SimpleHeader } from "./simple-header";
import { Footer } from "./footer";
import { DashboardHeader } from "./dashboard-header";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Redirect } from "wouter";

interface LayoutProps {
  children: ReactNode;
  isDashboardRoute?: boolean;
}

export function Layout({ children, isDashboardRoute = false }: LayoutProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // For dashboard routes, ensure user is authenticated
  if (isDashboardRoute) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    if (!user) {
      return <Redirect to="/auth" />;
    }
    
    // Check route matches user role
    const isAdmin = user.role === 'admin';
    const isSeller = user.role === 'seller';
    const isBuyer = user.role === 'buyer';
    
    if (
      (location.startsWith('/admin/dashboard') && !isAdmin) ||
      (location.startsWith('/seller/dashboard') && !isSeller) ||
      (location.startsWith('/buyer/dashboard') && !isBuyer)
    ) {
      // Redirect to appropriate dashboard based on role
      if (isAdmin) return <Redirect to="/admin/dashboard" />;
      if (isSeller) return <Redirect to="/seller/dashboard" />;
      if (isBuyer) return <Redirect to="/buyer/dashboard" />;
      
      // Fallback
      return <Redirect to="/" />;
    }
    
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader userRole={user.role} />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    );
  }
  
  // Regular route layout
  return (
    <div className="min-h-screen flex flex-col">
      <SimpleHeader />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}