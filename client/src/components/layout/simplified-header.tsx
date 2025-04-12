import { useState } from "react";
import { Link } from "wouter";
import { 
  Search, 
  Menu, 
  X, 
  ShoppingCart, 
  ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/cart-context";

export function Header() {
  const { toggleCart, cartItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search for:", searchQuery);
  };

  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center py-2">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center mb-2 md:mb-0">
              <span className="text-2xl font-bold mr-1">Flipkart</span>
              <span className="text-xs italic text-yellow-400 flex items-end">
                <span>Explore</span>
                <span className="ml-1 text-yellow-400">Plus</span>
                <span className="text-yellow-400 ml-1">+</span>
              </span>
            </Link>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-5/12 md:ml-4 relative mb-2 md:mb-0">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search for products, brands and more"
                className="w-full py-2 px-4 text-gray-900 rounded-sm focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary"
              >
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-between md:ml-auto space-x-4 md:space-x-6">
            {/* More Options */}
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
            
            {/* Cart Button */}
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
                <Link href="/help" className="flex items-center text-white py-1">
                  <span className="mr-2 text-white">📱</span>
                  Download App
                </Link>
              </li>
              <li>
                <Link href="/help" className="flex items-center text-white py-1">
                  <span className="mr-2 text-white">🎧</span>
                  24x7 Customer Care
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}