import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/context/wallet-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard, Coins, ArrowDown, ArrowUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

// Schema for redeeming coins
const redeemFormSchema = z.object({
  amount: z.coerce
    .number()
    .int()
    .positive("Amount must be a positive number"),
  orderValue: z.coerce
    .number()
    .optional(),
  category: z.string().optional(),
  description: z.string().optional()
});

type RedeemFormValues = z.infer<typeof redeemFormSchema>;

// Type for redeemCoins return value
type RedeemCoinsResult = { voucherCode?: string; discountAmount?: number } | void;

export default function WalletPage() {
  const { 
    wallet, 
    transactions, 
    settings,
    isLoading, 
    isTransactionsLoading,
    isSettingsLoading,
    redeemCoins 
  } = useWallet();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [voucherInfo, setVoucherInfo] = useState<{ code: string; value: number } | null>(null);

  // Set up form with validation
  const form = useForm<RedeemFormValues>({
    resolver: zodResolver(redeemFormSchema),
    defaultValues: {
      amount: 100,
    },
  });

  // Handle form submission
  async function onSubmit(data: RedeemFormValues) {
    try {
      const result = (await redeemCoins(data.amount, {
        referenceType: 'MANUAL',
        description: data.description || 'Manual redemption',
        orderValue: data.orderValue,
        category: data.category
      })) as RedeemCoinsResult;
      // If backend returns voucher info, show it
      if (result && typeof result === 'object' && result.voucherCode && result.discountAmount) {
        setVoucherInfo({ code: result.voucherCode, value: result.discountAmount });
      }
      form.reset({ amount: 100 });
    } catch (error) {
      console.error("Error redeeming coins:", error);
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Check if a coin balance is about to expire
  const getFirstExpiringTransaction = () => {
    // Make sure transactions is an array
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    if (safeTransactions.length === 0) return null;
    
    const now = new Date();
    const creditTransactions = safeTransactions.filter(
      t => t.type === 'credit' && t.expiresAt
    );
    
    if (creditTransactions.length === 0) return null;
    
    // Sort by expiration date (closest first)
    creditTransactions.sort((a, b) => {
      const aDate = a.expiresAt ? new Date(a.expiresAt) : new Date(9999, 11, 31);
      const bDate = b.expiresAt ? new Date(b.expiresAt) : new Date(9999, 11, 31);
      return aDate.getTime() - bDate.getTime();
    });
    
    const closest = creditTransactions[0];
    if (!closest.expiresAt) return null;
    
    const expiryDate = new Date(closest.expiresAt);
    
    // If it's going to expire within the next 7 days
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return {
        amount: closest.amount,
        days: daysUntilExpiry
      };
    }
    
    return null;
  };

  const expiringCoins = getFirstExpiringTransaction();
  
  // Calculate conversion to INR if settings available
  const calculateInrValue = (coins: number) => {
    if (!settings || !settings.conversionRate) return 0;
    return (coins / (settings.conversionRate || 1)).toFixed(2);
  };

  // Get current month's transactions
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  // Make sure transactions is an array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const currentMonthTransactions = safeTransactions.filter(t => {
    const date = new Date(t.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Calculate transactions statistics
  const stats = {
    credited: currentMonthTransactions
      .filter(t => t.type === 'credit')
      .reduce((acc, t) => acc + t.amount, 0),
    spent: currentMonthTransactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => acc + Math.abs(t.amount), 0),
    expired: currentMonthTransactions
      .filter(t => t.type === 'expired')
      .reduce((acc, t) => acc + t.amount, 0)
  };

  if (isLoading || isSettingsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // If wallet system is disabled
  if (settings && typeof settings.isActive === 'boolean' && !settings.isActive) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet System Disabled</AlertTitle>
            <AlertDescription>
              The wallet system is currently disabled by the administrator.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>

        {/* Wallet Points and Redeem Coins Display */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Card className="flex-1 bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Wallet Points</CardTitle>
              <CardDescription>Your current wallet points balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{wallet?.balance ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="flex-1 bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Redeem Coins</CardTitle>
              <CardDescription>Total coins you have redeemed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{wallet?.redeemedBalance ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Show voucher info if available */}
        {voucherInfo && (
          <Alert variant="default">
            <AlertTitle>Voucher Generated!</AlertTitle>
            <AlertDescription>
              Voucher Code: <b>{voucherInfo.code}</b><br />
              Value: ₹{voucherInfo.value}<br />
              <span>This voucher will be auto-applied to your next order.</span>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{wallet?.balance || 0} wallet rupees</div>
              <p className="text-xs text-muted-foreground">
                ≈ ₹{calculateInrValue(wallet?.balance || 0)} value
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redeemed Coins Left</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wallet?.redeemedBalance || 0} coins</div>
              <p className="text-xs text-muted-foreground">
                Coins you have redeemed and can use for discounts at checkout
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month Earned</CardTitle>
              <ArrowUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.credited} coins</div>
              <p className="text-xs text-muted-foreground">
                From {currentMonthTransactions.filter(t => t.type === 'credit').length} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month Spent</CardTitle>
              <ArrowDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.spent} coins</div>
              <p className="text-xs text-muted-foreground">
                From {currentMonthTransactions.filter(t => t.type === 'debit').length} redemptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Expiring coins alert */}
        {expiringCoins && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Coins Expiring Soon!</AlertTitle>
            <AlertDescription>
              {expiringCoins.amount} coins will expire in {expiringCoins.days} days. Redeem them before they expire!
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="redeem">Redeem Coins</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Overview</CardTitle>
                <CardDescription>
                  Your wallet activity and coin statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>Month's Activity</div>
                    <div className="font-medium">
                      {stats.credited - stats.spent - stats.expired} coins (net change)
                    </div>
                  </div>
                  <Progress value={Math.min(stats.credited > 0 ? (stats.credited - stats.spent) / stats.credited * 100 : 0, 100)} />
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Conversion Rate</TableCell>
                        <TableCell>1 wallet rupee = ₹1</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Coin Expiry</TableCell>
                        <TableCell>{settings?.expiryDays || 0} days after earning</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>First Purchase Bonus</TableCell>
                        <TableCell>3000 coins</TableCell>
                      </TableRow>
                      {settings && typeof settings.maxUsagePercentage === 'number' && settings.maxUsagePercentage > 0 && (
                        <TableRow>
                          <TableCell>Maximum Usage</TableCell>
                          <TableCell>{settings.maxUsagePercentage}% of order value</TableCell>
                        </TableRow>
                      )}
                      {settings && typeof settings.minCartValue !== 'undefined' && ((settings.minCartValue ?? 0) > 0) && (
                        <TableRow>
                          <TableCell>Minimum Order Value</TableCell>
                          <TableCell>{settings?.minCartValue ?? 0}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <p className="text-xs text-muted-foreground">
                  Lelekart coins can be redeemed for discounts on your purchases. Coins expire after {settings?.expiryDays || 30} days from the date they were earned.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your recent wallet transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isTransactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Expires</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!Array.isArray(transactions) || transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          // Make sure transactions is an array
                          Array.isArray(transactions) && transactions.map((transaction) => {
                            let typeStyle = '';
                            if (transaction.type === 'credit') typeStyle = 'text-green-600 font-medium';
                            if (transaction.type === 'debit') typeStyle = 'text-red-600 font-medium';
                            if (transaction.type === 'expired') typeStyle = 'text-orange-600 font-medium';
                            
                            return (
                              <TableRow key={transaction.id}>
                                <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                                <TableCell className={typeStyle}>
                                  {transaction.type ? transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) : 'Unknown'}
                                </TableCell>
                                <TableCell className={typeStyle}>
                                  {transaction.type === 'debit' ? '-' : ''}{transaction.amount}
                                </TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell>
                                  {transaction.expiresAt ? formatDate(transaction.expiresAt) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="redeem">
            <Card>
              <CardHeader>
                <CardTitle>Redeem Coins</CardTitle>
                <CardDescription>
                  Convert your coins into vouchers for your next purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount to Redeem</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input type="number" {...field} />
                              <Coins className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            This will generate a discount worth ₹{calculateInrValue(field.value || 0)} on your next purchase
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {settings && typeof settings.minCartValue !== 'undefined' && ((settings.minCartValue ?? 0) > 0) && (
                      <FormField
                        control={form.control}
                        name="orderValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Test Order Value (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} defaultValue={settings.minCartValue} />
                            </FormControl>
                            <FormDescription>
                              For testing purposes only - enter an order value to validate the minimum cart value restriction
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {settings?.applicableCategories && (
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Test Product Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {settings.applicableCategories.split(",").map((category) => (
                                  <SelectItem key={category.trim()} value={category.trim()}>
                                    {category.trim()}
                                  </SelectItem>
                                ))}
                                <SelectItem value="Other">Other (Not applicable)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              For testing purposes - select a category to validate category restrictions
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="space-y-1.5">
                      <div className="text-sm font-semibold">Summary</div>
                      <div className="rounded-lg border p-3 text-sm">
                        <div className="flex justify-between py-1">
                          <span>Current Balance:</span>
                          <span>₹{wallet?.balance || 0} wallet rupees</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Amount to Redeem:</span>
                          <span>₹{form.watch('amount') || 0} wallet rupees</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Conversion Value:</span>
                          <span>₹{calculateInrValue(form.watch('amount') || 0)}</span>
                        </div>
                        <div className="border-t my-2" />
                        <div className="flex justify-between font-medium py-1">
                          <span>Remaining Balance:</span>
                          <span>
                            ₹{Math.max(0, (wallet?.balance || 0) - (form.watch('amount') || 0))} wallet rupees
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={!wallet?.balance || wallet.balance < (form.watch('amount') || 0)}
                    >
                      Redeem Now
                    </Button>
                    
                    {(!wallet?.balance || wallet.balance < (form.watch('amount') || 0)) && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Insufficient Balance</AlertTitle>
                        <AlertDescription>
                          You don't have enough wallet rupees to redeem this amount.
                        </AlertDescription>
                      </Alert>
                    )}
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    Redeemed coins will generate a voucher code that you can use during checkout. 
                    The voucher will be applied automatically to your next order.
                  </p>
                  
                  {typeof settings?.maxUsagePercentage === 'number' && settings?.maxUsagePercentage > 0 && (
                    <p>
                      <span className="font-medium">Usage limit:</span> You can use wallet rupees for up to {settings.maxUsagePercentage}% of your order value.
                    </p>
                  )}
                  
                  {settings && typeof settings.minCartValue !== 'undefined' && ((settings.minCartValue ?? 0) > 0) && (
                    <p>
                      <span className="font-medium">Minimum order:</span> Wallet rupees can only be used on orders worth ₹{settings?.minCartValue ?? 0} or more.
                    </p>
                  )}
                  
                  {settings?.applicableCategories && (
                    <p>
                      <span className="font-medium">Applicable categories:</span> Wallet rupees can only be used on products in these categories: {settings.applicableCategories}.
                    </p>
                  )}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}