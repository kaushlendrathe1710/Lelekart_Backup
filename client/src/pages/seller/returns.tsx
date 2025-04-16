import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, Filter, Calendar, MoreHorizontal, Eye, CheckCircle2, XCircle } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Define status badge colors
const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>;
    case "refunded":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function SellerReturnsPage() {
  const [currentTab, setCurrentTab] = useState("all");
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("last30");

  // Fetch returns data
  const { data: returnsData, isLoading } = useQuery({
    queryKey: ['/api/seller/returns', currentTab, dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/seller/returns?status=${currentTab !== 'all' ? currentTab : ''}&dateRange=${dateRange}`);
      if (!res.ok) {
        throw new Error('Failed to fetch returns');
      }
      return res.json();
    }
  });

  // Filter returns by search query
  const filteredReturns = returnsData?.filter((item: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.orderId?.toString().includes(query) ||
      item.productName?.toLowerCase().includes(query) ||
      item.customerName?.toLowerCase().includes(query) ||
      item.reason?.toLowerCase().includes(query)
    );
  }) || [];

  const handleViewDetails = (returnItem: any) => {
    setSelectedReturn(returnItem);
    setShowDetailDialog(true);
  };

  const handleAction = (returnItem: any, action: "approve" | "reject") => {
    setSelectedReturn(returnItem);
    setActionType(action);
    setShowActionDialog(true);
  };

  const submitAction = async () => {
    if (!selectedReturn || !actionType) return;
    
    try {
      const response = await fetch(`/api/seller/returns/${selectedReturn.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'approved' : 'rejected',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update return status');
      }
      
      // Close dialog and refetch data
      setShowActionDialog(false);
      // Invalidate queries to refresh data
    } catch (error) {
      console.error('Error updating return status:', error);
    }
  };

  return (
    <SellerDashboardLayout>
      <div className="container py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Returns Management</h1>
          <p className="text-muted-foreground">View and manage product returns from customers</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search returns..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="last90">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="sm:w-auto w-full">
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Returns</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="refunded">Refunded</TabsTrigger>
          </TabsList>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Return ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No returns found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReturns.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">#{item.id}</TableCell>
                        <TableCell>#{item.orderId}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.returnDate ? format(new Date(item.returnDate), 'dd MMM yyyy') : '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.reason}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {item.status === 'pending' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleAction(item, 'approve')}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                    Approve Return
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction(item, 'reject')}>
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    Reject Return
                                  </DropdownMenuItem>
                                </>
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

      {/* Return Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
            <DialogDescription>
              Return #{selectedReturn?.id} - Order #{selectedReturn?.orderId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Product Information</h3>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedReturn.productImage && (
                      <img 
                        src={selectedReturn.productImage} 
                        alt={selectedReturn.productName} 
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                    )}
                    <div>
                      <p className="font-medium">{selectedReturn.productName}</p>
                      <p className="text-sm text-muted-foreground">SKU: {selectedReturn.productSku}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {selectedReturn.quantity}</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-muted-foreground mt-4 mb-2">Return Reason</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p>{selectedReturn.reason}</p>
                </div>
                
                {selectedReturn.images && selectedReturn.images.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground mt-4 mb-2">Return Images</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedReturn.images.map((img: string, idx: number) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Return image ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Customer Information</h3>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div>
                    <p className="font-medium">{selectedReturn.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedReturn.customerEmail}</p>
                    <p className="text-sm text-muted-foreground">{selectedReturn.customerPhone}</p>
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-muted-foreground mt-4 mb-2">Return Status</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Current Status:</span>
                    {getStatusBadge(selectedReturn.status)}
                  </div>
                  
                  <div className="mt-4">
                    <span className="text-sm font-medium">Return Timeline:</span>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="h-4 w-4 mt-0.5 rounded-full bg-green-500"></div>
                        <div>
                          <p className="text-sm font-medium">Return Requested</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedReturn.returnDate ? format(new Date(selectedReturn.returnDate), 'dd MMM yyyy, h:mm a') : '-'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedReturn.reviewedDate && (
                        <div className="flex items-start gap-2">
                          <div className="h-4 w-4 mt-0.5 rounded-full bg-blue-500"></div>
                          <div>
                            <p className="text-sm font-medium">Return Reviewed</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(selectedReturn.reviewedDate), 'dd MMM yyyy, h:mm a')}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedReturn.refundDate && (
                        <div className="flex items-start gap-2">
                          <div className="h-4 w-4 mt-0.5 rounded-full bg-green-500"></div>
                          <div>
                            <p className="text-sm font-medium">Refund Processed</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(selectedReturn.refundDate), 'dd MMM yyyy, h:mm a')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedReturn.status === 'pending' && (
                  <div className="mt-6 space-x-2 flex">
                    <Button 
                      variant="success" 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleAction(selectedReturn, 'approve');
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve Return
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleAction(selectedReturn, 'reject');
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Return
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' 
                ? 'Approve Return Request' 
                : 'Reject Return Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'The customer will be informed that their return has been approved. You will need to process the refund separately once the item is received.'
                : 'Please provide a reason for rejecting this return request. The customer will be notified of your decision.'}
            </DialogDescription>
          </DialogHeader>
          
          {actionType === 'reject' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="rejectionReason" className="text-sm font-medium">
                  Rejection Reason
                </label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Enter the reason for rejecting this return..."
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={submitAction}
            >
              {actionType === 'approve' ? 'Approve Return' : 'Reject Return'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}