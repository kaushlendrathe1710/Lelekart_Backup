import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Search, 
  Menu, 
  X, 
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimplifiedSearch } from "@/components/ui/simplified-search";
import { useCart } from "@/context/cart-context";

export function PublicHeader() {
  const { toggleCart, cartItems } = useCart();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search for:", searchQuery);
  };

  const navigateTo = (path: string) => {
    setLocation(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-primary text-white">
      {/* Desktop Header */}
      <div className="container mx-auto px-4 py-4 hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="text-2xl font-bold">Lelekart</div>
            </Link>

            <div className="flex-grow max-w-xl">
              <SimplifiedSearch />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-white hover:text-white hover:bg-primary-foreground/10"
              onClick={() => setLocation('/auth')}
            >
              Login
            </Button>

            <Button
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-primary"
              onClick={() => toggleCart()}
            >
              <ShoppingCart className="h-5 w-5 mr-1" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="ml-1 bg-white text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:text-gray-200"
          >
            <Menu size={24} />
          </button>

          <Link href="/">
            <div className="text-2xl font-bold">Lelekart</div>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleCart()}
              className="relative text-white hover:text-gray-200"
            >
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="mt-3">
          <SimplifiedSearch />
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="bg-primary h-full w-3/4 max-w-xs p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-4">
                <button
                  onClick={() => navigateTo('/')}
                  className="block w-full text-left py-2 border-b border-primary-foreground/20"
                >
                  Home
                </button>
                <button
                  onClick={() => navigateTo('/auth')}
                  className="block w-full text-left py-2 border-b border-primary-foreground/20"
                >
                  Login
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}