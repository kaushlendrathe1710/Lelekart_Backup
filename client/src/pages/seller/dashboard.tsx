import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { 
  Box, 
  Layers, 
  PackageOpen, 
  Tag, 
  BarChart4, 
  Truck,
  Calendar,
  TrendingUp,
  User
} from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ApprovalCheck } from "@/components/seller/approval-check";

export default function SellerDashboardPage() {
  // Try to use context first if available
  const authContext = useContext(AuthContext);
  
  // Get user data from direct API if context is not available
  const { data: apiUser } = useQuery<any>({
    queryKey: ['/api/user'],
    enabled: !authContext?.user,
  });
  
  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  
  return (
    <SellerDashboardLayout>
      <ApprovalCheck>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Seller Dashboard</h1>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                asChild
              >
                <Link href="/seller/products/add">
                  <Layers className="h-4 w-4" />
                  Add Product
                </Link>
              </Button>
              <Button 
                className="flex items-center gap-2"
                asChild
              >
                <Link href="/seller/orders">
                  <PackageOpen className="h-4 w-4" />
                  View Orders
                </Link>
              </Button>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Layers className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <PackageOpen className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">₹0</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <BarChart4 className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Price</p>
                  <p className="text-2xl font-bold">₹0</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <Tag className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seller Info Card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle>Account Overview</CardTitle>
              <CardDescription>
                Your seller details and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-medium">{user?.id}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Seller</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                </div>
              </div>
              <Button 
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <Link href="/seller/profile">
                  View Complete Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Quick Links Card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your store efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="default"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link href="/seller/products/add">
                  <Layers className="h-4 w-4" />
                  Add New Product
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link href="/seller/orders">
                  <PackageOpen className="h-4 w-4" />
                  View Orders
                </Link>
              </Button>
              
              {/* Shipping management removed as per requirement - only available in admin panel */}
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link href="/seller/analytics">
                  <TrendingUp className="h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Recent Orders Card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <PackageOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No orders yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Customer orders will appear here</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  asChild
                >
                  <Link href="/seller/products/add">
                    Add a product to start selling
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sales Performance Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>
              Monitor your store's performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <BarChart4 className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No sales data yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sales performance metrics will appear once you have orders
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Upcoming Events */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Important dates and events for sellers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-md">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Lelekart Sale Event</p>
                  <p className="text-xs text-muted-foreground">May 15, 2025 - May 20, 2025</p>
                  <p className="text-xs mt-1">
                    Prepare your inventory for the upcoming sale event. Special discounts and promotions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-md">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Calendar className="h-5 w-5 text-orange-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Seller Training Webinar</p>
                  <p className="text-xs text-muted-foreground">April 25, 2025 - 2:00 PM</p>
                  <p className="text-xs mt-1">
                    Learn about new platform features and optimization strategies for your store.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </ApprovalCheck>
    </SellerDashboardLayout>
  );
}