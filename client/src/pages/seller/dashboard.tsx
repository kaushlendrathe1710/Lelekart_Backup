import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Box, Layers, PackageOpen, Tag, BarChart4 } from "lucide-react";

export default function SellerDashboardPage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Check if user exists and has seller role
  if (!user) return <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
      <p className="mb-4">Please log in to access your seller dashboard.</p>
      <Link href="/auth">
        <Button>Go to Login</Button>
      </Link>
    </div>
  </div>;
  
  // Role check
  if (user.role !== 'seller') return <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
      <p className="mb-4">You don't have permission to access the seller dashboard.</p>
      <Link href="/">
        <Button>Go to Home</Button>
      </Link>
    </div>
  </div>;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-primary text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">Seller Dashboard</div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="bg-transparent text-white hover:bg-primary-foreground/10 border-2 border-white font-medium flex items-center gap-2"
                asChild
              >
                <Link to="/">
                  <Box className="h-4 w-4" />
                  View Store
                </Link>
              </Button>
              <Button 
                variant="secondary" 
                className="bg-white text-primary hover:bg-gray-100 border-2 border-white font-medium flex items-center gap-2 shadow-sm"
                onClick={() => logoutMutation.mutate()}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Stats Cards */}
          <Card className="shadow-md">
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
          
          <Card className="shadow-md">
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
          
          <Card className="shadow-md">
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
          
          <Card className="shadow-md">
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
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
              <CardDescription>
                Your seller account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p><strong>Name:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Account ID:</strong> {user.id}</p>
                <p><strong>Role:</strong> <span className="text-orange-600 font-medium">Seller</span></p>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your seller account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="default"
                className="w-full flex items-center justify-center gap-2"
              >
                <Layers className="h-4 w-4" />
                Add New Product
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <PackageOpen className="h-4 w-4" />
                View Orders
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Edit Store Profile
              </Button>
            </CardContent>
          </Card>
          
          {/* Recent Orders Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest customer orders for your products
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
                >
                  Add a product to start selling
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}