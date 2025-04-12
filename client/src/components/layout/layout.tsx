import { ReactNode } from "react";
import { SimpleHeader } from "./simple-header";
import { Footer } from "./footer";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  // Check if we're on a dashboard or orders route (these use DashboardLayout)
  const skipHeaderFooter = 
    location.startsWith('/admin/dashboard') || 
    location.startsWith('/seller/dashboard') || 
    location.startsWith('/buyer/dashboard') ||
    location.startsWith('/orders') ||
    location.startsWith('/order/');
  
  // Standard layout - Show header and footer except for dashboard and orders routes
  return (
    <div className="min-h-screen flex flex-col">
      {!skipHeaderFooter && <SimpleHeader />}
      {/* Add a spacer when SimpleHeader is shown to prevent content overlap */}
      {!skipHeaderFooter && <div className="h-14 md:h-14"></div>}
      {/* Add extra height for mobile search bar */}
      {!skipHeaderFooter && <div className="h-10 md:hidden"></div>}
      <main className="flex-grow">
        {children}
      </main>
      {!skipHeaderFooter && <Footer />}
    </div>
  );
}