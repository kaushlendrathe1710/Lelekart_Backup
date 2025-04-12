import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  User as UserIcon,
  Bell,
  ShoppingCart,
  Search,
  Grid,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { cartItems, toggleCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      title: "Categories",
      href: "/admin/categories",
      icon: <Grid className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pt-16">
      {/* Top Navigation - Header (Fixed) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Admin Menu</SheetTitle>
                  <SheetDescription>
                    Navigate through admin dashboard
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div
                          className={cn(
                            "flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:bg-gray-100",
                            location === item.href && "bg-gray-100 font-medium"
                          )}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/admin">
              <div className="flex items-center space-x-2 text-xl font-bold">
                <img 
                  src="https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-YIy8BEzxPr-.svg" 
                  alt="Flipkart Logo" 
                  className="h-7 w-auto" 
                />
                <span className="hidden md:inline">Admin Panel</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.href}>
                    <Link href={item.href}>
                      <NavigationMenuLink
                        className={cn(
                          "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-foreground/10 focus:bg-primary-foreground/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50 text-primary-foreground",
                          location === item.href &&
                            "bg-primary-foreground/20 font-semibold"
                        )}
                      >
                        {item.title}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side Elements */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative hidden md:flex items-center bg-white/10 rounded-md px-3 py-1.5">
              <Search className="h-4 w-4 mr-2 text-white/70" />
              <input
                type="text"
                placeholder="Search in admin..."
                className="bg-transparent border-none focus:outline-none text-sm w-40 lg:w-64 placeholder-white/70 text-white"
              />
            </div>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {cartItems.length}
                </span>
              )}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                3
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white">
                  <UserIcon className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline-block">
                    {user?.name || user?.username || "Admin"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-1" />
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

      {/* Main Content with Persistent Sidebar and Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Persistent Sidebar - Always Visible */}
        <aside className="bg-white w-64 border-r h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto shadow-sm z-20">
          <div className="p-4">
            <div className="font-medium text-lg mb-4">Admin Menu</div>
            <nav className="space-y-1">
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}