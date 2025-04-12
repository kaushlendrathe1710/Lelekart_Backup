import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingCart } from "lucide-react";

export default function BuyerDashboardPage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-primary text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">Buyer Dashboard</div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="bg-transparent text-white hover:bg-primary-foreground/10 border-2 border-white font-medium flex items-center gap-2"
                asChild
              >
                <Link to="/">
                  <ShoppingCart className="h-4 w-4" />
                  Go Shopping
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>My Account</CardTitle>
              <CardDescription>
                Your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p><strong>Name:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Account ID:</strong> {user.id}</p>
                <p><strong>Account Type:</strong> <span className="text-blue-600 font-medium">Buyer</span></p>
              </div>
            </CardContent>
          </Card>
          
          {/* Orders Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>
                Track and manage your purchases
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
                    <path d="M21 5V3H3v2"></path>
                    <path d="M3 19v2h18v-2"></path>
                    <path d="M21 5v14H3V5"></path>
                    <path d="M8 10h8"></path>
                    <path d="M8 14h4"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">No orders yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Your order history will appear here</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  asChild
                >
                  <Link to="/">
                    Browse Products
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="default"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link to="/">
                  <ShoppingCart className="h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
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
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                View Orders
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
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
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}