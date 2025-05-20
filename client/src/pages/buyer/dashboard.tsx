import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Link, useLocation } from "wouter";
import { AuthContext } from "@/hooks/use-auth";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { 
  ShoppingCart, 
  ShoppingBag, 
  PhoneCall, 
  Mail, 
  MapPin, 
  ChevronRight,
  Package, 
  Truck,
  ClipboardList,
  Heart,
  Clock,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function BuyerDashboardPage() {
  console.log("BuyerDashboardPage: Component mounted");
  
  // Try to use context first if available
  const authContext = useContext(AuthContext);
  const [location, setLocation] = useLocation();
  
  console.log("BuyerDashboardPage: AuthContext available:", !!authContext, "Current location:", location);
  
  // Get user data from direct API if context is not available
  const { data: apiUser, isLoading: apiLoading, error: apiError } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      console.log("BuyerDashboardPage: Fetching user data from API");
      try {
        const res = await fetch('/api/user', {
          credentials: 'include',
        });
        
        console.log("BuyerDashboardPage: API response status:", res.status);
        
        if (!res.ok) {
          if (res.status === 401) {
            console.log("BuyerDashboardPage: User not authenticated (401)");
            return null;
          }
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        
        const userData = await res.json();
        console.log("BuyerDashboardPage: User data received:", userData?.role);
        return userData;
      } catch (err) {
        console.error("BuyerDashboardPage: Error fetching user data", err);
        throw err;
      }
    },
    staleTime: 60000, // 1 minute
    retry: 1,
    retryDelay: 1000,
  });
  
  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  const isLoading = authContext ? authContext.isLoading : apiLoading;
  
  console.log("BuyerDashboardPage: User data:", 
    "Available:", !!user, 
    "Role:", user?.role, 
    "Loading:", isLoading,
    "API Error:", apiError?.message || "none"
  );
  
  // Show loading state while fetching user data
  if (isLoading) {
    console.log("BuyerDashboardPage: Showing loading state");
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  // If no user (not authenticated) or wrong role, redirect to auth page
  if (!user || user.role !== 'buyer') {
    console.log("BuyerDashboardPage: No authenticated buyer found, redirecting to /auth");
    console.log("User data:", user?.id, user?.username, user?.role);
    
    // Use wouter for navigation - add a small delay to ensure rendering completes
    setTimeout(() => {
      setLocation('/auth');
    }, 100);
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mb-2">Redirecting to login page...</p>
          <div className="animate-spin inline-block rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Account</h1>
          <p className="text-muted-foreground">Manage your account and see your purchases</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center flex-wrap">
                <span className="mr-2">Personal Information</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8" 
                  onClick={() => setLocation('/buyer/settings')}
                >
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{user.name || user.username}</p>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 mt-2">
                        <PhoneCall className="h-4 w-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.address && (
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4" />
                        <span>{user.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-3 pb-1 px-6">
              <Button 
                variant="link" 
                size="sm" 
                className="text-primary p-0 h-auto flex items-center"
                onClick={() => setLocation('/buyer/settings')}
              >
                <span>View account details</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          {/* Account Summary Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Account Summary</CardTitle>
              <CardDescription>Your Lelekart account at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">My Orders</p>
                      <p className="text-xs text-muted-foreground">Track, return, or buy again</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-purple-100 rounded-full p-2 mr-3">
                      <Heart className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">My Wishlist</p>
                      <p className="text-xs text-muted-foreground">Items you saved for later</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-orange-100 rounded-full p-2 mr-3">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">My Reviews</p>
                      <p className="text-xs text-muted-foreground">Reviews you've written</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent purchases and activity</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <Tabs defaultValue="orders">
                <TabsList className="w-full">
                  <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="orders" className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-8 text-center flex-col">
                      <div className="bg-gray-100 rounded-full p-3 mb-3">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-medium">No recent orders</h3>
                      <p className="text-xs text-muted-foreground mt-1">Your recent orders will appear here</p>
                      <Button 
                        variant="link" 
                        size="sm"
                        className="mt-2"
                        asChild
                      >
                        <Link href="/">
                          Browse Products
                        </Link>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="pt-4">
                  <div className="flex items-center justify-center py-8 text-center flex-col">
                    <div className="bg-gray-100 rounded-full p-3 mb-3">
                      <ClipboardList className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium">No reviews yet</h3>
                    <p className="text-xs text-muted-foreground mt-1">Your product reviews will appear here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Order Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Track the status of your recent orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-center flex-col">
                <div className="bg-gray-100 rounded-full p-3 mb-3">
                  <Truck className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">No active orders</h3>
                <p className="text-xs text-muted-foreground mt-1">Your active orders will appear here</p>
                <Button 
                  variant="link" 
                  size="sm"
                  className="mt-2"
                  asChild
                >
                  <Link href="/orders">
                    View All Orders
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Purchases */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Lelekart Plus</CardTitle>
              <CardDescription>Enjoy exclusive benefits with Lelekart Plus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SuperCoins earned</span>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700">0 Coins</Badge>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground">Earn SuperCoins with every purchase to unlock benefits</p>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button className="bg-primary" size="sm" asChild>
                  <Link href="/">
                    Explore Lelekart Plus
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recently Viewed Products */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center">
              <span>Recently Viewed Products</span>
              <Button variant="link" size="sm" className="text-primary p-0 h-auto flex items-center">
                <span>View All</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-center flex-col">
              <div className="bg-gray-100 rounded-full p-3 mb-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">No recently viewed products</h3>
              <p className="text-xs text-muted-foreground mt-1">Products you view will appear here</p>
              <Button 
                variant="link" 
                size="sm"
                className="mt-2"
                asChild
              >
                <Link href="/">
                  Browse Products
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}