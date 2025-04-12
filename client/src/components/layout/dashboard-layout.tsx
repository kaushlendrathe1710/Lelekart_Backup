import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  ShoppingCart, 
  Home, 
  User, 
  Package, 
  LogOut, 
  Heart, 
  Gift, 
  CreditCard,
  ShoppingBag,
  Settings, 
  ChevronRight,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarInset,
  SidebarSeparator,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  
  if (!user) {
    setLocation('/auth');
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Function to check if a route is active
  const isActive = (path: string) => {
    return location === path;
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 w-full border-b bg-primary px-4 shadow-sm">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white hover:bg-primary-foreground/10 hover:text-white" />
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-white">Flipkart</span>
                <span className="text-xs italic text-yellow-400 flex items-end ml-1">
                  <span>Explore</span>
                  <span className="ml-1 text-yellow-400">Plus</span>
                  <span className="text-yellow-400 ml-1">+</span>
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/">
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Home</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-primary-foreground/10"
              >
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/buyer/dashboard">My Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 px-1">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium leading-none">Hello,</span>
                  <span className="text-xs text-muted-foreground">{user.username}</span>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${isActive('/buyer/dashboard') ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <Link href="/buyer/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${isActive('/orders') ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <Link href="/orders">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                  >
                    <Link href="/">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Wishlist</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                  >
                    <Link href="/">
                      <Gift className="mr-2 h-4 w-4" />
                      <span>Rewards</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                  >
                    <Link href="/">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Gift Cards</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarSeparator />
              <SidebarMenu>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                  >
                    <Link href="/">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Go Shopping</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                  >
                    <Link href="/">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <div className="text-xs text-muted-foreground px-4 py-2">
                © 2025 Flipkart Replica
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="p-4 md:p-6">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}