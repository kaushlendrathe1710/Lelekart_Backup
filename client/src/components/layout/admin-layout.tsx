import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";
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
  FileText,
  FileEdit,
  LayoutDashboardIcon,
  UserCog,
  UserPlus,
  Truck,
  Award,
  Gift,
  CreditCard,
  Clock,
  DollarSign,
  Upload,
  RefreshCcw,
} from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SimpleSearch } from "@/components/ui/simple-search";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [heroMenuOpen, setHeroMenuOpen] = useState(
    location.includes("/admin/banner-management") ||
      location.includes("/admin/category-management") ||
      location.includes("/admin/design-hero")
  );

  const [footerMenuOpen, setFooterMenuOpen] = useState(
    location.includes("/admin/footer-management")
  );

  const [usersMenuOpen, setUsersMenuOpen] = useState(
    location.includes("/admin/users") || location.includes("/admin/create-user")
  );

  const [shippingMenuOpen, setShippingMenuOpen] = useState(
    location.includes("/admin/shipping-management") ||
      location.includes("/admin/shipping-settings") ||
      location.includes("/admin/shipping-dashboard") ||
      location.includes("/admin/pending-shipments") ||
      location.includes("/admin/shipping-rates") ||
      location.includes("/admin/tracking-management") ||
      location.includes("/admin/shiprocket-dashboard") ||
      location.includes("/admin/shiprocket-pending-shipments")
  );

  const [productDisplayMenuOpen, setProductDisplayMenuOpen] = useState(
    location.includes("/admin/product-display-settings")
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
      collapsible: true,
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      open: usersMenuOpen,
      onOpenChange: setUsersMenuOpen,
      items: [
        {
          title: "Manage Users",
          href: "/admin/users",
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: "Create User",
          href: "/admin/create-user",
          icon: <UserPlus className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Manage Admins",
      href: "/admin/manage-admins",
      icon: <UserCog className="h-5 w-5" />,
    },
    {
      title: "Seller Approval",
      href: "/admin/seller-approval",
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      title: "Seller Agreements",
      href: "/admin/agreements",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Return Management",
      href: "/admin/returns",
      icon: <RefreshCcw className="h-5 w-5" />,
    },
    {
      collapsible: true,
      title: "Shipping Management",
      icon: <Truck className="h-5 w-5" />,
      open: shippingMenuOpen,
      onOpenChange: setShippingMenuOpen,
      items: [
        {
          title: "Shipping Settings",
          href: "/admin/shipping-settings",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          title: "General Settings",
          href: "/admin/shipping-management",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          title: "Shiprocket Dashboard",
          href: "/admin/shiprocket-dashboard",
          icon: <Truck className="h-5 w-5" />,
        },
        {
          title: "Shiprocket Pending Shipments",
          href: "/admin/shiprocket-pending-shipments",
          icon: <Truck className="h-5 w-5" />,
        },
        {
          title: "Shipment Dashboard",
          href: "/admin/shipping-dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
          title: "Pending Shipments",
          href: "/admin/pending-shipments",
          icon: <Clock className="h-5 w-5" />,
        },
        {
          title: "Shipping Rates",
          href: "/admin/shipping-rates",
          icon: <DollarSign className="h-5 w-5" />,
        },
        {
          title: "Tracking Management",
          href: "/admin/tracking-management",
          icon: <Search className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Rewards Management",
      href: "/admin/rewards-management",
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Gift Cards Management",
      href: "/admin/gift-cards-management",
      icon: <Gift className="h-5 w-5" />,
    },
    {
      title: "Wallet Management",
      href: "/admin/wallet-management",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Document Templates",
      href: "/admin/document-templates",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Media Library",
      href: "/admin/media-library",
      icon: <Image className="h-5 w-5" />,
    },
    {
      title: "Product Display Settings",
      href: "/admin/product-display-settings",
      icon: <LayoutGrid className="h-5 w-5" />,
    },
    {
      title: "GST Management",
      href: "/admin/gst-management",
      icon: <DollarSign className="h-5 w-5" />,
    },
  ];

  const handleLogout = async () => {
    try {
      // Call the server-side logout endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Logout failed:", response.statusText);
      }

      // Redirect to auth page after successful logout
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      // Redirect anyway as fallback
      window.location.href = "/auth";
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

            {/* AI-powered Search Box */}
            <div className="relative hidden md:flex items-center ml-4 w-64">
              <SimpleSearch className="w-full" variant="admin" />
            </div>
          </div>

          {/* Right Side Elements */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative text-white">
              <NotificationBell
                className="text-white hover:bg-[#2874f0]/90"
                iconClassName="text-white"
                badgeClassName="bg-red-500"
              />
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-[#2874f0]/90"
                >
                  <span className="font-medium mr-1">Kaushlendra Admin</span>
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
                      location.includes("/admin/banner-management") ||
                        location.includes("/admin/category-management") ||
                        location.includes("/admin/design-hero")
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
                  <Link href="/admin/category-management">
                    <div
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 mt-1",
                        location === "/admin/category-management"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                      )}
                    >
                      <Grid className="h-5 w-5" />
                      <span>Category Management</span>
                    </div>
                  </Link>

                  <Link href="/admin/design-hero">
                    <div
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 mt-1",
                        location === "/admin/design-hero"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                      )}
                    >
                      <LayoutDashboardIcon className="h-5 w-5" />
                      <span>Design Hero</span>
                    </div>
                  </Link>
                </CollapsibleContent>
              </Collapsible>

              {/* Footer Management Dropdown */}
              <Collapsible
                open={footerMenuOpen}
                onOpenChange={setFooterMenuOpen}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all hover:bg-gray-100",
                      location.includes("/admin/footer-management")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5" />
                      <span>Footer Management</span>
                    </div>
                    <div>
                      {footerMenuOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pt-1">
                  <Link href="/admin/footer-management">
                    <div
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100",
                        location === "/admin/footer-management"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                      )}
                    >
                      <FileEdit className="h-5 w-5" />
                      <span>Edit Footer Content</span>
                    </div>
                  </Link>
                </CollapsibleContent>
              </Collapsible>

              {/* Regular Nav Items */}
              {navItems.map((item, index) =>
                item.collapsible ? (
                  <Collapsible
                    key={`collapsible-${index}`}
                    open={item.open}
                    onOpenChange={item.onOpenChange}
                    className="w-full"
                  >
                    <CollapsibleTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all hover:bg-gray-100",
                          location.includes(
                            `/admin/${item.title
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`
                          )
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <span>{item.title}</span>
                        </div>
                        <div>
                          {item.open ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 pt-1">
                      {item.items?.map((subItem, subIndex) => (
                        <Link
                          key={`${subItem.href}-${subIndex}`}
                          href={subItem.href || ""}
                        >
                          <div
                            className={cn(
                              "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-100",
                              location === subItem.href
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-gray-700"
                            )}
                          >
                            {subItem.icon}
                            <span>{subItem.title}</span>
                          </div>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Link key={`link-${index}`} href={item.href || ""}>
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
                )
              )}
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

export default AdminLayout;
