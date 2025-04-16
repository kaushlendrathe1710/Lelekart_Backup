import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AuthContext } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Gift, Award, TrendingUp, AlertCircle, ShoppingBag, Check, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type RewardTransaction = {
  id: number;
  userId: number;
  orderId: number | null;
  productId: number | null;
  points: number;
  type: string;
  description: string | null;
  transactionDate: string;
  expiryDate: string | null;
  status: string;
};

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const authContext = useContext(AuthContext);
  const { toast } = useToast();
  
  // Get the authenticated user
  const user = authContext?.user;
  const userId = user?.id;
  
  // Fetch user rewards data
  const { data: rewardsData, isLoading: isLoadingRewards } = useQuery({
    queryKey: [`/api/rewards/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/rewards/${userId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch rewards data');
      }
      return response.json();
    },
    enabled: !!userId,
  });
  
  // Fetch reward transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: [`/api/rewards/${userId}/transactions`],
    queryFn: async () => {
      const response = await fetch(`/api/rewards/${userId}/transactions`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    enabled: !!userId,
  });
  
  // Handle redeem points
  const handleRedeemPoints = async () => {
    toast({
      title: "Coming Soon",
      description: "The redemption feature will be available soon!",
    });
  };
  
  const availablePoints = rewardsData?.availablePoints || 0;
  const lifetimePoints = rewardsData?.lifetimePoints || 0;
  const redeemedPoints = rewardsData?.redeemedPoints || 0;
  
  // Calculate progress towards next tier
  const nextTierThreshold = 1000;
  const progressToNextTier = Math.min(100, (availablePoints / nextTierThreshold) * 100);
  const pointsNeededForNextTier = nextTierThreshold - availablePoints;
  
  // Determine current tier based on lifetime points
  let currentTier = "Bronze";
  if (lifetimePoints >= 5000) {
    currentTier = "Platinum";
  } else if (lifetimePoints >= 2500) {
    currentTier = "Gold";
  } else if (lifetimePoints >= 1000) {
    currentTier = "Silver";
  }
  
  // Loading state
  if (isLoadingRewards) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rewards</h1>
          <p className="text-muted-foreground">Manage your reward points and view your transaction history</p>
        </div>
        
        <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Main overview card */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Your Reward Points</CardTitle>
                    <CardDescription>Earn points with every purchase</CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{currentTier} Tier</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Available Points */}
                  <div className="flex flex-col bg-gray-50 p-4 rounded-lg text-center">
                    <span className="text-xs uppercase text-muted-foreground mb-1">Available Points</span>
                    <span className="text-3xl font-bold">{availablePoints}</span>
                    <span className="text-sm text-muted-foreground mt-1">Worth ₹{(availablePoints * 0.25).toFixed(2)}</span>
                  </div>
                  
                  {/* Lifetime Points */}
                  <div className="flex flex-col bg-gray-50 p-4 rounded-lg text-center">
                    <span className="text-xs uppercase text-muted-foreground mb-1">Lifetime Points</span>
                    <span className="text-3xl font-bold">{lifetimePoints}</span>
                    <span className="text-sm text-muted-foreground mt-1">Total earned</span>
                  </div>
                  
                  {/* Redeemed Points */}
                  <div className="flex flex-col bg-gray-50 p-4 rounded-lg text-center">
                    <span className="text-xs uppercase text-muted-foreground mb-1">Redeemed Points</span>
                    <span className="text-3xl font-bold">{redeemedPoints}</span>
                    <span className="text-sm text-muted-foreground mt-1">Value saved</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progress to next tier ({pointsNeededForNextTier} points needed)</span>
                    <span className="text-sm">{progressToNextTier.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressToNextTier} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">Learn More</Button>
                <Button onClick={handleRedeemPoints} size="sm">Redeem Points</Button>
              </CardFooter>
            </Card>
            
            {/* How to earn points */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>How to Earn Points</CardTitle>
                <CardDescription>Multiple ways to earn rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Shop & Earn</h4>
                      <p className="text-sm text-muted-foreground">Earn points with every purchase. 1 point for every ₹20 spent.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Write Reviews</h4>
                      <p className="text-sm text-muted-foreground">Earn 50 points for each product review with photos.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Special Events</h4>
                      <p className="text-sm text-muted-foreground">Double points during special shopping events and sales.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Referral Bonus</h4>
                      <p className="text-sm text-muted-foreground">Refer a friend and get 200 points when they make their first purchase.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-6 mt-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Recent rewards activity</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction: RewardTransaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {format(new Date(transaction.transactionDate), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm">
                                {transaction.type === 'purchase' ? 'Purchase Reward' : 
                                 transaction.type === 'referral' ? 'Referral Bonus' : 
                                 transaction.type === 'redeem' ? 'Points Redemption' : 
                                 transaction.type}
                              </div>
                              {transaction.description && (
                                <div className="text-xs text-muted-foreground">{transaction.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={transaction.points > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={transaction.status === 'active' ? 'outline' : 'secondary'}>
                              {transaction.status === 'active' ? 'Active' : transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <div className="mx-auto bg-gray-100 rounded-full p-3 w-fit mb-3">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium">No transactions yet</h3>
                    <p className="text-xs text-muted-foreground mt-1">Your reward activities will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Rewards Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Points are valid for 12 months from the date they are earned.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p>You need a minimum of 500 points to start redeeming rewards.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Points will be added to your account within 24 hours of eligible activities.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Points cannot be earned on taxes, gift wrap charges, or shipping fees.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}