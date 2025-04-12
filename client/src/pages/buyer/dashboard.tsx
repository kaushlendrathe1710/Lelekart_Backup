import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BuyerDashboard() {
  const { user, logoutMutation } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Buyer Dashboard</CardTitle>
              <CardDescription>
                Welcome back, {user?.username}! You're logged in as a buyer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>Account ID:</strong> {user?.id}</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                >
                  Go Shopping
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => logoutMutation.mutate()}
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}