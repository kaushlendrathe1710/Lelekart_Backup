import { ReactNode } from "react";
import { Header } from "./header";
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
  
  // If we're on a dashboard route, don't show the standard header
  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboardRoute && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
}