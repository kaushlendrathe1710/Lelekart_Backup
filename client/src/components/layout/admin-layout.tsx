import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  Bell,
  ShoppingCart,
  Search,
  Grid,
  UserCheck,
  CheckSquare,
  Image,
  LayoutGrid,
  LayoutDashboardIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [heroMenuOpen, setHeroMenuOpen] = useState(
    location.includes("/admin/banner-management") || location.includes("/admin/categories")
  );

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/admin/products",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Product Approval",
      href: "/admin/product-approval",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Seller Approval",
      href: "/admin/seller-approval",
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
  ];

  const handleLogout = async () => {
    try {
      // Call the server-side logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
      
      // Redirect to auth page after successful logout
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect anyway as fallback
      window.location.href = '/auth';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Top Navigation - Header (Fixed) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#2874f0] text-white shadow-md h-16">
        <div className="container mx-auto flex h-full items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            {/* Logo - using Link instead of window.location for client-side routing to maintain session */}
            <Link href="/">
              <Button 
                variant="ghost" 
                className="p-0 hover:bg-transparent focus:bg-transparent"
              >
                <div className="flex items-center space-x-2 text-xl font-bold">
                  <div className="text-xl font-bold text-white">Lelekart</div>
                </div>
              </Button>
            </Link>

            {/* Search Box - Now Non-Functional Placeholder */}
            <div className="relative hidden md:flex items-center bg-white rounded-sm px-3 py-1.5 ml-4">
              <input
                type="text"
                placeholder="Search products..."
                className="bg-transparent border-none focus:outline-none text-sm w-40 lg:w-64 placeholder-gray-500 text-gray-900"
                disabled
                onClick={() => alert('Search functionality is coming soon!')}
              />
              <Search className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-400 ml-1 absolute right-10">Coming soon</span>
            </div>
          </div>

          {/* Right Side Elements */}
          <div className="flex items-center space-x-3">
            {/* Cart - using Link instead of window.location to maintain session */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-[#2874f0]/90"
              >
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#2874f0]/90">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                3
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-[#2874f0]/90">
                  <span className="font-medium mr-1">
                    Kaushlendra Admin
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content with Fixed Sidebar and Scrollable Content Area */}
      <div className="flex w-full pt-16">
        {/* Fixed Sidebar - Always Visible */}
        <aside className="fixed left-0 top-16 bottom-0 bg-white w-64 border-r shadow-sm z-20">
          <div className="p-4 h-full overflow-hidden">
            <div className="font-medium text-lg mb-4">Admin Menu</div>
            <nav className="space-y-1 overflow-y-auto h-[calc(100%-2rem)]">
              {/* Hero Management Dropdown */}
              <Collapsible
                open={heroMenuOpen}
                onOpenChange={setHeroMenuOpen}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all hover:bg-gray-100",
                      (location.includes("/admin/banner-management") || location.includes("/admin/categories"))
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <LayoutGrid className="h-5 w-5" />
                      <span>Hero Management</span>
                    </div>
                    <div>
                      {heroMenuOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pt-1">
                  <Link href="/admin/banner-management">
                    <div
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100",
                        location === "/admin/banner-management"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                      )}
                    >
                      <Image className="h-5 w-5" />
                      <span>Banner Management</span>
                    </div>
                  </Link>
                  <Link href="/admin/categories">
                    <div
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 mt-1",
                        location === "/admin/categories"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                      )}
                    >
                      <Grid className="h-5 w-5" />
                      <span>Categories</span>
                    </div>
                  </Link>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Regular Nav Items */}
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100",
                      location === item.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700"
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area - This is the only scrollable area */}
        <main className="pl-64 flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}