import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Search, 
  Menu, 
  X, 
  ShoppingCart, 
  User,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function SimpleHeader() {
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  
  // Use React Query to fetch user data
  const { data: user } = useQuery({
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
    refetchOnWindowFocus: false,
  });
  
  // Use React Query to fetch cart data with real-time updates
  const { data: cartItems = [] } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      if (!user) return [];
      
      const res = await fetch('/api/cart', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      return res.json();
    },
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 2000, // Refresh every 2 seconds
  });
  
  // Handle cart navigation
  const toggleCart = () => {
    // Navigate to cart page or auth page if not logged in
    setLocation(user ? '/cart' : '/auth');
  };
  
  // Get cart item count for notification badge
  const cartItemCount = cartItems.length > 0 
    ? cartItems.reduce((sum: number, item: { quantity: number }) => sum + (item.quantity || 0), 0)
    : 0;
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      queryClient.setQueryData(['/api/user'], null);
      queryClient.setQueryData(['/api/cart'], []);
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
    <header className="bg-primary text-white fixed top-0 left-0 right-0 z-40">
      {/* Desktop Header - with improved padding and spacing */}
      <div className="container mx-auto px-4 h-14 hidden md:flex md:items-center">
        <div className="flex items-center justify-between w-full py-2">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="text-2xl font-bold pt-0.5">Flipkart</div>
            </Link>

            <form onSubmit={handleSearch} className="flex-grow max-w-xl">
              <div className="relative flex items-center">
                <Input
                  type="text"
                  placeholder="Search for products, brands and more"
                  className="w-full bg-white text-black pr-12 h-10"
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

          <div className="flex items-center space-x-5">
            {!user ? (
              // Show login button for non-authenticated users
              <Button 
                variant="ghost" 
                className="text-white hover:text-white hover:bg-primary-foreground/10 h-10"
                onClick={() => setLocation('/auth')}
              >
                Login
              </Button>
            ) : (
              // Show user dropdown for authenticated users
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-white flex items-center hover:bg-primary-foreground/10 h-10 px-4"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>{user.name || user.username}</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={user.role === "admin" ? "/admin" : 
                              user.role === "seller" ? "/seller/dashboard" : 
                              "/buyer/dashboard"} className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-primary-foreground/10 relative h-10 w-10 flex items-center justify-center"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header with improved spacing */}
      <div className="md:hidden px-4">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-gray-200 mr-3 p-1"
            >
              <Menu size={24} />
            </button>

            <Link href="/">
              <div className="text-2xl font-bold">Flipkart</div>
            </Link>
          </div>
          
          <button
            onClick={toggleCart}
            className="text-white hover:text-gray-200 relative p-1"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Search - in a separate fixed position below the header */}
      <div className="md:hidden fixed top-14 left-0 right-0 bg-primary px-4 pb-3 pt-1 z-40 shadow-md">
        <form onSubmit={handleSearch}>
          <div className="relative flex items-center">
            <Input
              type="text"
              placeholder="Search products..."
              className="w-full bg-white text-black pr-12 h-10"
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
                className="text-white hover:text-gray-200 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="space-y-4">
              <button
                onClick={() => navigateTo('/')}
                className="block w-full text-left py-3 border-b border-primary-foreground/20"
              >
                Home
              </button>
              
              {!user ? (
                <button
                  onClick={() => navigateTo('/auth')}
                  className="block w-full text-left py-3 border-b border-primary-foreground/20"
                >
                  Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigateTo(
                      user.role === "admin" ? "/admin" : 
                      user.role === "seller" ? "/seller/dashboard" : 
                      "/buyer/dashboard"
                    )}
                    className="block w-full text-left py-3 border-b border-primary-foreground/20"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-3 border-b border-primary-foreground/20"
                  >
                    Logout
                  </button>
                </>
              )}
              
              <button
                onClick={toggleCart}
                className="block w-full text-left py-3 border-b border-primary-foreground/20"
              >
                Cart {cartItemCount > 0 && `(${cartItemCount})`}
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}