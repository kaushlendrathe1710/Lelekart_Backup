import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Overview Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Business Overview</CardTitle>
            <CardDescription>
              Your store performance at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p><strong>Store Name:</strong> {user?.username}'s Store</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Account ID:</strong> {user?.id}</p>
              <p><strong>Store Status:</strong> <span className="text-green-600 font-medium">Active</span></p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="border rounded p-2">
                <p className="text-lg font-bold">0</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
              <div className="border rounded p-2">
                <p className="text-lg font-bold">0</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your store efficiently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="default"
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
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Add New Product
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
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
              </svg>
              View Analytics
            </Button>
          </CardContent>
        </Card>
        
        {/* Recent Activity Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your store
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
              <p className="text-sm text-muted-foreground mt-1">Your recent activity will appear here</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => setLocation('/')}
              >
                Return to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}