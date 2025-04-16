import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layout/admin-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Define wallet settings schema
const walletSettingsSchema = z.object({
  firstPurchaseCoins: z.coerce.number().int().min(1, "Must be at least 1"),
  coinToCurrencyRatio: z.coerce.number().min(0.01, "Must be at least 0.01"),
  minOrderValue: z.coerce.number().int().min(0, "Must be a positive value"),
  maxRedeemableCoins: z.coerce.number().int().min(1, "Must be at least 1"),
  coinExpiryDays: z.coerce.number().int().min(1, "Must be at least 1 day"),
  isEnabled: z.boolean().default(true),
});

const walletAdjustmentSchema = z.object({
  userId: z.coerce.number().int().positive("User ID is required"),
  amount: z.coerce.number().int().nonzero("Amount cannot be zero"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

type WalletSettings = z.infer<typeof walletSettingsSchema>;
type WalletAdjustment = z.infer<typeof walletAdjustmentSchema>;

export default function WalletManagementPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  
  // Fetch wallet settings
  const {
    data: walletSettings,
    isLoading: isLoadingSettings,
    error: settingsError,
  } = useQuery({
    queryKey: ["/api/wallet/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/wallet/settings");
      if (!res.ok) throw new Error("Failed to fetch wallet settings");
      return await res.json();
    },
  });
  
  // Fetch all users with wallets
  const {
    data: usersWithWallets,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["/api/wallet/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/wallet/users");
      if (!res.ok) throw new Error("Failed to fetch users with wallets");
      return await res.json();
    },
  });
  
  // Fetch transactions for a specific user
  const {
    data: userTransactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["/api/wallet/user", selectedUser, "transactions"],
    queryFn: async () => {
      if (!selectedUser) return null;
      const res = await apiRequest("GET", `/api/wallet/user/${selectedUser}/transactions`);
      if (!res.ok) throw new Error("Failed to fetch user transactions");
      return await res.json();
    },
    enabled: !!selectedUser,
  });
  
  // Settings form
  const settingsForm = useForm<WalletSettings>({
    resolver: zodResolver(walletSettingsSchema),
    defaultValues: {
      firstPurchaseCoins: walletSettings?.firstPurchaseCoins || 100,
      coinToCurrencyRatio: walletSettings?.coinToCurrencyRatio || 1,
      minOrderValue: walletSettings?.minOrderValue || 500,
      maxRedeemableCoins: walletSettings?.maxRedeemableCoins || 500,
      coinExpiryDays: walletSettings?.coinExpiryDays || 90,
      isEnabled: walletSettings?.isEnabled || true,
    },
  });
  
  // Process expired coins mutation
  const processExpiredCoinsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/wallet/process-expired");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to process expired coins");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Expired coins processed",
        description: `Processed ${data.processedCount} transactions`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process expired coins",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update wallet settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: WalletSettings) => {
      const res = await apiRequest("PUT", "/api/wallet/settings", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update wallet settings");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Wallet settings have been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Wallet adjustment form
  const adjustmentForm = useForm<WalletAdjustment>({
    resolver: zodResolver(walletAdjustmentSchema),
    defaultValues: {
      userId: undefined,
      amount: undefined,
      reason: "",
    },
  });
  
  // Wallet adjustment mutation
  const walletAdjustmentMutation = useMutation({
    mutationFn: async (data: WalletAdjustment) => {
      const res = await apiRequest("POST", "/api/wallet/adjust", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to adjust wallet");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Wallet adjusted",
        description: "The wallet has been successfully adjusted",
      });
      adjustmentForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/users"] });
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ["/api/wallet/user", selectedUser, "transactions"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to adjust wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update settings form when data is loaded
  React.useEffect(() => {
    if (walletSettings) {
      settingsForm.reset({
        firstPurchaseCoins: walletSettings.firstPurchaseCoins,
        coinToCurrencyRatio: walletSettings.coinToCurrencyRatio,
        minOrderValue: walletSettings.minOrderValue,
        maxRedeemableCoins: walletSettings.maxRedeemableCoins,
        coinExpiryDays: walletSettings.coinExpiryDays,
        isEnabled: walletSettings.isEnabled,
      });
    }
  }, [walletSettings, settingsForm]);
  
  const onSettingsSubmit = (data: WalletSettings) => {
    updateSettingsMutation.mutate(data);
  };
  
  const onWalletAdjustSubmit = (data: WalletAdjustment) => {
    walletAdjustmentMutation.mutate(data);
  };
  
  // Filter users based on search term
  const filteredUsers = usersWithWallets
    ? usersWithWallets.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().includes(searchTerm))
    : [];
  
  // Handle process expired coins
  const handleProcessExpiredCoins = () => {
    processExpiredCoinsMutation.mutate();
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Wallet Management</h1>
        
        <Tabs defaultValue="settings">
          <TabsList className="mb-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="users">User Wallets</TabsTrigger>
            <TabsTrigger value="adjust">Wallet Adjustments</TabsTrigger>
          </TabsList>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Wallet System Settings</CardTitle>
                <CardDescription>Configure how the wallet system works on your platform</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : settingsError ? (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-600">Error loading settings: {(settingsError as Error).message}</p>
                  </div>
                ) : (
                  <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={settingsForm.control}
                          name="firstPurchaseCoins"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Purchase Coins</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Number of coins awarded to users on their first purchase
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={settingsForm.control}
                          name="coinToCurrencyRatio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Coin to Currency Ratio</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormDescription>
                                Value of 1 coin in your currency (e.g., 1 = ₹1)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={settingsForm.control}
                          name="minOrderValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Order Value</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Minimum order value required to use coins
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={settingsForm.control}
                          name="maxRedeemableCoins"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Redeemable Coins</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Maximum coins a user can redeem in a single transaction
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={settingsForm.control}
                          name="coinExpiryDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Coin Expiry Days</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Number of days before coins expire
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={settingsForm.control}
                          name="isEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Enable Wallet System
                                </FormLabel>
                                <FormDescription>
                                  Turn the wallet system on or off
                                </FormDescription>
                              </div>
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={updateSettingsMutation.isPending || !settingsForm.formState.isDirty}
                      >
                        {updateSettingsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Settings'
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={handleProcessExpiredCoins} disabled={processExpiredCoinsMutation.isPending}>
                  {processExpiredCoinsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Process Expired Coins
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Wallets</CardTitle>
                <CardDescription>View and manage user wallets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email or ID"
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : usersError ? (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-600">Error loading users: {(usersError as Error).message}</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Lifetime</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} className={selectedUser === user.id ? "bg-primary/5" : ""}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.username}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{user.wallet.balance} coins</TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div>Earned: {user.wallet.lifetimeEarned}</div>
                                <div>Redeemed: {user.wallet.lifetimeRedeemed}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(user.wallet.createdAt), { addSuffix: true })}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                              >
                                {selectedUser === user.id ? "Hide" : "View"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {selectedUser && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Transaction History</h3>
                      <Button variant="outline" size="sm" onClick={() => refetchTransactions()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                    
                    {isLoadingTransactions ? (
                      <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : transactionsError ? (
                      <div className="bg-red-50 p-4 rounded-md">
                        <p className="text-red-600">Error loading transactions: {(transactionsError as Error).message}</p>
                      </div>
                    ) : !userTransactions || userTransactions.transactions.length === 0 ? (
                      <div className="text-center py-6 border rounded-md">
                        <p className="text-muted-foreground">No transactions found for this user</p>
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Reference</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Expires</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userTransactions.transactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>{transaction.id}</TableCell>
                                <TableCell>
                                  <div className="text-xs">
                                    <div>{new Date(transaction.createdAt).toLocaleDateString()}</div>
                                    <div className="text-muted-foreground">
                                      {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    transaction.transactionType === 'CREDIT' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
                                      : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
                                  }`}>
                                    {transaction.transactionType}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                  </span>
                                </TableCell>
                                <TableCell>{transaction.referenceType || '-'}</TableCell>
                                <TableCell>{transaction.description || '-'}</TableCell>
                                <TableCell>
                                  {transaction.expiresAt ? (
                                    <div className="text-xs">
                                      <div>{new Date(transaction.expiresAt).toLocaleDateString()}</div>
                                      <div className="text-muted-foreground">
                                        {formatDistanceToNow(new Date(transaction.expiresAt), { addSuffix: true })}
                                      </div>
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Adjustments Tab */}
          <TabsContent value="adjust">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Adjustments</CardTitle>
                <CardDescription>Make manual adjustments to user wallets</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...adjustmentForm}>
                  <form onSubmit={adjustmentForm.handleSubmit(onWalletAdjustSubmit)} className="space-y-6">
                    <FormField
                      control={adjustmentForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a user" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {usersWithWallets?.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.username} ({user.id})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the user whose wallet you want to adjust
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={adjustmentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Positive value to add coins, negative to remove coins
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={adjustmentForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Reason for the adjustment (visible to admin only)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={walletAdjustmentMutation.isPending || !adjustmentForm.formState.isValid}
                    >
                      {walletAdjustmentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Submit Adjustment'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Import Switch component since it's used in the form
import { Switch } from "@/components/ui/switch";