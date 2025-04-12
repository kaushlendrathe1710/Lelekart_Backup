import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

export default function BuyerDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">Buyer Dashboard</h1>
          
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">My Orders</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Welcome, {user?.username || 'Shopper'}!</CardTitle>
                    <CardDescription>You're logged in as a buyer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Member Since:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Orders</CardTitle>
                    <CardDescription>Your recent orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <p>You haven't placed any orders yet.</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-2" 
                        onClick={() => setLocation('/')}
                      >
                        Start Shopping
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Wishlist</CardTitle>
                    <CardDescription>Items you've saved</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <p>Your wishlist is empty.</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-2" 
                        onClick={() => setLocation('/')}
                      >
                        Browse Products
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recommended for You</CardTitle>
                  <CardDescription>Based on your browsing history</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Start browsing products to get personalized recommendations.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setLocation('/')}
                  >
                    Shop Now
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Your Orders</CardTitle>
                  <CardDescription>Track and manage your purchases</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M5.8 11.3 2 22l10.7-3.79"></path>
                        <path d="M4 3h.01"></path>
                        <path d="M22 8h.01"></path>
                        <path d="M15 2h.01"></path>
                        <path d="M22 20h.01"></path>
                        <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"></path>
                        <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"></path>
                        <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"></path>
                        <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium">No orders yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">When you place orders, they'll appear here</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setLocation('/')}
                    >
                      Start Shopping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="wishlist">
              <Card>
                <CardHeader>
                  <CardTitle>Your Wishlist</CardTitle>
                  <CardDescription>Products you've saved for later</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium">Your wishlist is empty</h3>
                    <p className="text-sm text-muted-foreground mt-1">Items you save will appear here</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setLocation('/')}
                    >
                      Browse Products
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                      <div className="space-y-2">
                        <p><strong>Name:</strong> {user?.username}</p>
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Role:</strong> {user?.role}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Account Settings</h3>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">Edit Profile</Button>
                        <Button variant="outline" size="sm">Change Password</Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => logoutMutation.mutate()}
                        >
                          Logout
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}