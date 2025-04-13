import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useContext } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Users, ShoppingBag, ShoppingCart, LineChart } from "lucide-react";

export default function AdminDashboardPage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  
  if (!user) {
    return null; // Protected route will handle redirects
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stats Cards */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">100</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">250</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">1,204</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₹124,500</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <LineChart className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Info Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
              <CardDescription>
                Your administrative account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p><strong>Name:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Account ID:</strong> {user.id}</p>
                <p><strong>Role:</strong> <span className="text-red-600 font-medium">Administrator</span></p>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="default"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link href="/admin/users">
                  <Users className="h-4 w-4" />
                  Manage Users
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link href="/admin/products">
                  <ShoppingBag className="h-4 w-4" />
                  Manage Products
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link href="/admin/orders">
                  <ShoppingCart className="h-4 w-4" />
                  View Orders
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Recent Activity Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">No recent activity</h3>
                <p className="text-sm text-muted-foreground mt-1">System activity will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}