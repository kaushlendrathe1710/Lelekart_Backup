import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Components without direct auth/cart dependencies for safer rendering
export function SimpleHeader() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
              <div className="text-2xl font-bold">Flipkart</div>
            </Link>

            <form onSubmit={handleSearch} className="flex-grow max-w-xl">
              <div className="relative flex items-center">
                <Input
                  type="text"
                  placeholder="Search for products, brands and more"
                  className="w-full bg-white text-black pr-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-0 h-full px-3 bg-transparent text-gray-500 hover:text-gray-700"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>
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
              className="text-white border-white hover:bg-white/10"
              onClick={() => setLocation('/auth')}
            >
              Become a Seller
            </Button>
            
            <Button 
              variant="outline" 
              className="text-white border-white hover:bg-white/10 relative"
            >
              <ShoppingCart className="h-5 w-5" />
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
            <div className="text-2xl font-bold">Flipkart</div>
          </Link>
        </div>

        {/* Mobile Search */}
        <div className="mt-3">
          <form onSubmit={handleSearch}>
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="Search products..."
                className="w-full bg-white text-black pr-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-0 h-full px-3 bg-transparent text-gray-500 hover:text-gray-700"
              >
                <Search size={20} />
              </button>
            </div>
          </form>
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
                
                <button
                  onClick={() => navigateTo('/auth')}
                  className="block w-full text-left py-2 border-b border-primary-foreground/20"
                >
                  Become a Seller
                </button>
                
                <button
                  className="block w-full text-left py-2 border-b border-primary-foreground/20"
                >
                  Cart
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}