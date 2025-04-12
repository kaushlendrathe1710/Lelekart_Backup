import { ReactNode } from "react";
import { Header } from "./simplified-header";
import { Footer } from "./footer";
import { CartSidebar } from "../cart/cart-sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}