import { ReactNode } from "react";
import { SimpleHeader } from "./simple-header";
import { Footer } from "./footer";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  // Check if we're on a dashboard route
  const isDashboardRoute = 
    location.startsWith('/admin/dashboard') || 
    location.startsWith('/seller/dashboard') || 
    location.startsWith('/buyer/dashboard');
  
  // Standard layout - Show header and footer except for dashboard routes
  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboardRoute && <SimpleHeader />}
      <main className="flex-grow">
        {children}
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
}