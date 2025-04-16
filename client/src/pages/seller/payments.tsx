import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  Filter,
  FileText,
  HelpCircle,
  MoreHorizontal,
  FileDown,
  Search,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "processing":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Processing</Badge>;
    case "paid":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Paid</Badge>;
    case "failed":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Failed</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function SellerPaymentsPage() {
  const [currentTab, setCurrentTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("last30");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Fetch payments summary
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['/api/seller/payments-summary'],
    queryFn: async () => {
      const res = await fetch('/api/seller/payments-summary');
      if (!res.ok) {
        throw new Error('Failed to fetch payments summary');
      }
      return res.json();
    }
  });

  // Fetch payments data
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['/api/seller/payments', currentTab, dateRange],
    queryFn: async () => {
      const status = currentTab !== 'all' ? currentTab : '';
      const res = await fetch(`/api/seller/payments?status=${status}&dateRange=${dateRange}`);
      if (!res.ok) {
        throw new Error('Failed to fetch payments data');
      }
      return res.json();
    }
  });

  // Filter payments by search query
  const filteredPayments = paymentsData?.filter((payment: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      payment.id?.toString().includes(query) ||
      payment.transactionId?.toLowerCase().includes(query) ||
      payment.amount?.toString().includes(query)
    );
  }) || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleViewPaymentDetails = (payment: any) => {
    setSelectedPayment(payment);
    setShowDetailDialog(true);
  };

  return (
    <SellerDashboardLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">View and manage your payment transactions</p>
        </div>

        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Available Balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isSummaryLoading ? (
                  <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  formatCurrency(summaryData?.availableBalance || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available for withdrawal
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" size="sm" className="w-full">
                Withdraw Funds
              </Button>
            </CardFooter>
          </Card>

          {/* Pending Balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isSummaryLoading ? (
                  <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  formatCurrency(summaryData?.pendingBalance || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Will be available after order processing
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="w-full">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Releasing soon</span>
                  <span>{formatCurrency(summaryData?.releasingSoon || 0)}</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </CardFooter>
          </Card>

          {/* Lifetime Earnings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isSummaryLoading ? (
                  <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  formatCurrency(summaryData?.lifetimeEarnings || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total earnings to date
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="flex items-center text-sm text-green-600">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>{summaryData?.growthRate || 0}% from last month</span>
              </div>
            </CardFooter>
          </Card>

          {/* Next Payout */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isSummaryLoading ? (
                  <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  formatCurrency(summaryData?.nextPayoutAmount || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated on {summaryData?.nextPayoutDate ? format(new Date(summaryData.nextPayoutDate), 'dd MMM yyyy') : 'loading...'}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="link" size="sm" className="px-0 h-auto text-primary">
                <Calendar className="h-4 w-4 mr-1" />
                View payout schedule
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Payment Transactions */}
        <div className="mb-6">
          <div className="mb-4 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPaymentsLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell colSpan={7} className="py-3">
                            <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <CreditCard className="h-10 w-10 mb-2" />
                            <p>No payment transactions found</p>
                            <p className="text-sm">Try adjusting your filters or search term</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.transactionId}</TableCell>
                          <TableCell>{format(new Date(payment.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            {payment.type === 'payout' ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Payout</Badge>
                            ) : payment.type === 'order' ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Order</Badge>
                            ) : (
                              <Badge variant="outline">{payment.type}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[240px] truncate">{payment.description}</TableCell>
                          <TableCell className="text-right">
                            <span className={payment.amount < 0 ? "text-red-600" : "text-green-600"}>
                              {payment.amount < 0 ? "-" : "+"}
                              {formatCurrency(Math.abs(payment.amount))}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewPaymentDetails(payment)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {payment.type === 'payout' && payment.status === 'paid' && (
                                  <DropdownMenuItem>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Download Receipt
                                  </DropdownMenuItem>
                                )}
                                {payment.status === 'failed' && (
                                  <DropdownMenuItem className="text-red-600">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    View Issue
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Tabs>
        </div>

        {/* Help & Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout Schedule</CardTitle>
              <CardDescription>When you'll receive your funds</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Your current payout cycle is set to <span className="font-semibold">Weekly</span> on <span className="font-semibold">Monday</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                Funds are typically processed within 1-2 business days after the payout is initiated.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">
                Change Schedule
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bank Account</CardTitle>
              <CardDescription>Your payout destination</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bank Name:</span>
                  <span className="text-sm">{summaryData?.bankDetails?.bankName || 'HDFC Bank'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Account Number:</span>
                  <span className="text-sm">
                    ****{summaryData?.bankDetails?.accountNumber?.slice(-4) || '1234'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">IFSC Code:</span>
                  <span className="text-sm">{summaryData?.bankDetails?.ifscCode || 'HDFC0001234'}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">
                Update Details
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
              <CardDescription>Support for payment issues</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                If you have any questions about your payments or are facing issues with payouts, our support team is here to help.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Payment FAQs
                </Button>
                <Button size="sm">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Transaction Details</DialogTitle>
            <DialogDescription>
              Transaction {selectedPayment?.transactionId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Transaction Information</h3>
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Transaction ID:</span>
                    <span className="text-sm font-medium">{selectedPayment.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Date:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(selectedPayment.date), 'dd MMM yyyy, h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Type:</span>
                    <span className="text-sm font-medium">{selectedPayment.type}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-sm">Amount:</span>
                    <span className={`text-sm font-medium ${selectedPayment.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                      {selectedPayment.amount < 0 ? "-" : "+"}
                      {formatCurrency(Math.abs(selectedPayment.amount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <span className="text-sm font-medium">{getStatusBadge(selectedPayment.status)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Details</h3>
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Payment Method:</span>
                    <span className="text-sm font-medium">{selectedPayment.paymentMethod || "Bank Transfer"}</span>
                  </div>
                  {selectedPayment.type === 'order' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm">Order ID:</span>
                        <span className="text-sm font-medium">#{selectedPayment.orderId || "123456"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Products:</span>
                        <span className="text-sm font-medium">{selectedPayment.productCount || "3"} items</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm">Reference:</span>
                    <span className="text-sm font-medium">{selectedPayment.reference || "-"}</span>
                  </div>
                </div>
              </div>
              
              {selectedPayment.type === 'payout' && selectedPayment.status === 'paid' && (
                <div className="flex justify-center">
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Receipt
                  </Button>
                </div>
              )}
              
              {selectedPayment.status === 'failed' && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Transaction Failed</h4>
                      <p className="text-xs text-red-700 mt-1">
                        {selectedPayment.failureReason || "This transaction failed due to insufficient funds in the customer's account. No action is required from your side."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}