import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, Link } from "wouter";
import { AuthContext } from "@/hooks/use-auth";
import { useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Users, ShoppingBag, ShoppingCart, LineChart, Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  // Try to use context first if available
  const authContext = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Get user data from direct API if context is not available
  const { data: apiUser, isLoading: apiLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch('/api/user', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch user');
      }
      
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });
  
  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  const isLoading = authContext ? authContext.isLoading : apiLoading;
  
  // Logout mutation if no context available
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      setLocation('/');
    }
  });
  
  // Handle logout with either context or direct API
  const handleLogout = () => {
    if (authContext) {
      authContext.logoutMutation.mutate();
    } else {
      logoutMutation.mutate();
    }
  };
  
  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If no user (not authenticated) or wrong role, redirect to auth page
  if (!user || user.role !== 'admin') {
    setLocation('/auth');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-primary text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">Admin Dashboard</div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="bg-transparent text-white hover:bg-primary-foreground/10 border-2 border-white font-medium flex items-center gap-2"
                asChild
              >
                <Link to="/">
                  <ShoppingCart className="h-4 w-4" />
                  View Store
                </Link>
              </Button>
              <Button 
                variant="secondary" 
                className="bg-white text-primary hover:bg-gray-100 border-2 border-white font-medium flex items-center gap-2 shadow-sm"
                onClick={handleLogout}
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
              >
                <Users className="h-4 w-4" />
                Manage Users
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                Manage Products
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                View Orders
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
    </div>
  );
}