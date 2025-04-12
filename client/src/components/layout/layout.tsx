import { ReactNode } from "react";
import { SimpleHeader } from "./simple-header";
import { Footer } from "./footer";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const auth = useAuth();
  
  // Check if we're on a dashboard route
  const isDashboardRoute = 
    location.startsWith('/admin/dashboard') || 
    location.startsWith('/seller/dashboard') || 
    location.startsWith('/buyer/dashboard');
  
  // Standard layout - Show header and footer except for dashboard routes
  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboardRoute && <SimpleHeader user={auth.user} logoutMutation={auth.logoutMutation} />}
      <main className="flex-grow">
        {children}
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
}