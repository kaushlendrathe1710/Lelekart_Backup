import React, { useState } from 'react';
import { useWallet } from '@/context/wallet-context';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2, HelpCircle, TrendingUp, ArrowDownUp, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    wallet,
    walletSettings,
    transactions,
    isLoadingWallet,
    isLoadingTransactions,
    isLoadingSettings,
    redeemCoinsMutation,
  } = useWallet();
  
  const [redeemAmount, setRedeemAmount] = useState<number>(0);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  
  if (isLoadingWallet || isLoadingSettings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!wallet || !walletSettings) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>My Wallet</CardTitle>
              <CardDescription>Your wallet information is not available.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>There was an error loading your wallet information. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  const handleRedeemCoins = async () => {
    if (redeemAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount of coins to redeem.",
        variant: "destructive",
      });
      return;
    }
    
    if (redeemAmount > wallet.balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough coins in your wallet.",
        variant: "destructive",
      });
      return;
    }
    
    if (redeemAmount > walletSettings.maxRedeemableCoins) {
      toast({
        title: "Maximum limit exceeded",
        description: `You can redeem up to ${walletSettings.maxRedeemableCoins} coins at once.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsRedeeming(true);
    try {
      await redeemCoinsMutation.mutateAsync({
        amount: redeemAmount,
        referenceType: "MANUAL_REDEEM",
        description: "Manual redemption by user",
      });
      setRedeemAmount(0);
      setIsRedeeming(false);
    } catch (error) {
      setIsRedeeming(false);
    }
  };
  
  // Calculate estimated value of current coins
  const estimatedValue = parseFloat((wallet.balance * parseFloat(walletSettings.coinToCurrencyRatio.toString())).toFixed(2));
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>My Wallet</CardTitle>
              <CardDescription>Manage your wallet and coins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary/10 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Current Balance</h3>
                  <p className="text-3xl font-bold">{wallet.balance} <span className="text-sm font-normal">coins</span></p>
                  <p className="text-sm text-muted-foreground">Est. value: ₹{estimatedValue}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Lifetime Earned</h3>
                  <p className="text-3xl font-bold">{wallet.lifetimeEarned} <span className="text-sm font-normal">coins</span></p>
                  <p className="text-sm text-muted-foreground">
                    <TrendingUp className="inline-block h-4 w-4 mr-1" />
                    Total coins earned
                  </p>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Lifetime Redeemed</h3>
                  <p className="text-3xl font-bold">{wallet.lifetimeRedeemed} <span className="text-sm font-normal">coins</span></p>
                  <p className="text-sm text-muted-foreground">
                    <ArrowDownUp className="inline-block h-4 w-4 mr-1" />
                    Total coins spent
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Redeem Coins</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Redeem Coins</DialogTitle>
                    <DialogDescription>
                      Convert your coins to discount on your next purchase. Each coin is worth ₹{walletSettings.coinToCurrencyRatio}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Your balance: {wallet.balance} coins</p>
                      <p className="text-sm text-muted-foreground">Maximum redeemable: {walletSettings.maxRedeemableCoins} coins</p>
                      <p className="text-sm text-muted-foreground">Minimum order value: ₹{walletSettings.minOrderValue}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={redeemAmount || ''}
                        onChange={(e) => setRedeemAmount(parseInt(e.target.value) || 0)}
                        placeholder="Enter amount of coins"
                        min={1}
                        max={Math.min(wallet.balance, walletSettings.maxRedeemableCoins)}
                      />
                      <div className="text-sm">
                        = ₹{parseFloat((redeemAmount * parseFloat(walletSettings.coinToCurrencyRatio.toString())).toFixed(2))}
                      </div>
                    </div>
                    {redeemAmount > wallet.balance && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Insufficient balance
                      </p>
                    )}
                    {redeemAmount > walletSettings.maxRedeemableCoins && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Exceeds maximum limit
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleRedeemCoins}
                      disabled={isRedeeming || redeemAmount <= 0 || redeemAmount > wallet.balance || redeemAmount > walletSettings.maxRedeemableCoins}
                    >
                      {isRedeeming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Redeem Now'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Wallet Information</CardTitle>
              <CardDescription>How your wallet works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Coin Value
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">This is the value of each coin when redeemed for discounts</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <p className="text-sm">1 coin = ₹{walletSettings.coinToCurrencyRatio}</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  First Purchase Bonus
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Coins earned on your first purchase</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <p className="text-sm">{walletSettings.firstPurchaseCoins} coins</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Maximum Redemption
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Maximum coins you can redeem in a single transaction</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <p className="text-sm">{walletSettings.maxRedeemableCoins} coins</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Minimum Order Value
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Minimum order value required to use coin redemption</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <p className="text-sm">₹{walletSettings.minOrderValue}</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Coin Expiry
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Coins expire after this many days from when they were earned</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <p className="text-sm">{walletSettings.coinExpiryDays} days</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent wallet transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.transactionType === 'CREDIT' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
                              : transaction.transactionType === 'DEBIT'
                                ? 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                          }`}>
                            {transaction.transactionType}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.description || (
                            transaction.referenceType === 'FIRST_PURCHASE' 
                              ? 'First purchase reward' 
                              : transaction.referenceType === 'ORDER_DISCOUNT'
                                ? 'Order discount'
                                : transaction.referenceType === 'MANUAL_REDEEM'
                                  ? 'Manual redemption'
                                  : transaction.referenceType === 'EXPIRED'
                                    ? 'Expired coins'
                                    : transaction.referenceType || 'Transaction'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}