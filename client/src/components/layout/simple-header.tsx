import { Link } from "wouter";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SimpleHeader() {
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
            <form className="relative">
              <Input
                type="text"
                placeholder="Search for products, brands and more"
                className="w-full py-2 px-4 text-gray-900 rounded-sm focus:outline-none"
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
            <Button variant="secondary" className="flex items-center py-1 px-2 md:px-4 bg-white text-primary font-medium rounded-sm hover:bg-gray-100">
              <span>Login</span>
            </Button>
            
            <Link href="/">
              <Button variant="link" className="text-white hover:text-gray-200">
                Become a Seller
              </Button>
            </Link>
            
            <Button variant="link" className="text-white flex items-center hover:text-gray-200 relative">
              Cart
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center ml-auto">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}