import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Menu, 
  X, 
  ShoppingCart, 
  ChevronDown, 
  User, 
  LogOut,
  LayoutDashboard,
  Store,
  ShoppingBag,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SimpleSearch } from "@/components/ui/simple-search";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { toggleCart, cartItems } = useCart();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
          variant: "default",
        });
      }
    });
  };

  const getDashboardLink = () => {
    if (!user) return "/auth";
    
    switch (user.role) {
      case "admin":
        return "/admin"; // Changed from /admin/dashboard to /admin to match our routes
      case "seller":
        return "/seller/dashboard";
      case "buyer":
        return "/buyer/dashboard";
      default:
        return "/";
    }
  };

  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center py-2">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center mb-2 md:mb-0">
              <span className="text-2xl font-bold mr-1">Lelekart</span>
              <span className="text-xs italic text-yellow-400 flex items-end">
                <span>Explore</span>
                <span className="ml-1 text-yellow-400">Plus</span>
                <span className="text-yellow-400 ml-1">+</span>
              </span>
            </Link>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-5/12 md:ml-4 relative mb-2 md:mb-0">
            <SimpleSearch />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-between md:ml-auto space-x-4 md:space-x-6">
            {/* User Controls */}
            {!user ? (
              // If not logged in, show a direct login button
              <Link href="/auth">
                <Button variant="secondary" className="flex items-center py-1 px-2 md:px-4 bg-white text-primary font-medium rounded-sm hover:bg-gray-100">
                  <User className="mr-2 h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
            ) : (
              // If logged in, show user menu dropdown
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="flex items-center py-1 px-2 md:px-4 bg-white text-primary font-medium rounded-sm hover:bg-gray-100">
                    <span>{user.name || user.username}</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>Hello, {user.name || user.username}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> 
                      {user.role === "admin" ? "Admin Dashboard" : 
                       user.role === "seller" ? "Seller Dashboard" :
                       "My Profile"}
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "buyer" && (
                    <DropdownMenuItem asChild>
                      <Link href="/buyer/orders" className="cursor-pointer">
                        <ShoppingBag className="mr-2 h-4 w-4" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "buyer" && (
                    <DropdownMenuItem asChild>
                      <Link href="/buyer/wishlist" className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" /> Wishlist
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {!user || (user.role !== "buyer" && user.role !== "seller") && (
              <Link href="/seller/dashboard">
                <Button variant="link" className="text-white hover:text-gray-200">
                  Become a Seller
                </Button>
              </Link>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="link" className="text-white flex items-center hover:text-gray-200">
                  <span>More</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem className="cursor-pointer">
                  <span className="mr-2 text-primary">📢</span> Notification Preferences
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <span className="mr-2 text-primary">🎧</span> 24x7 Customer Care
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <span className="mr-2 text-primary">📈</span> Advertise
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <span className="mr-2 text-primary">📱</span> Download App
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="link"
              className="text-white flex items-center hover:text-gray-200 relative"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-1">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center ml-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 bg-yellow-400 text-primary text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-primary-foreground/20">
            <ul className="space-y-3">
              <li>
                <Link href={user ? getDashboardLink() : "/auth"} className="flex items-center text-white py-1">
                  <User className="mr-2 h-5 w-5" />
                  {user ? (user.name || user.username) : "Login / Sign Up"}
                </Link>
              </li>
              {!user || (user.role !== "buyer" && user.role !== "seller") && (
                <li>
                  <Link href="/seller/dashboard" className="flex items-center text-white py-1">
                    <Store className="mr-2 h-5 w-5" />
                    Become a Seller
                  </Link>
                </li>
              )}
              {user && (
                <li>
                  <Button 
                    variant="ghost" 
                    className="flex items-center text-white py-1 w-full justify-start px-0 hover:bg-transparent"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
