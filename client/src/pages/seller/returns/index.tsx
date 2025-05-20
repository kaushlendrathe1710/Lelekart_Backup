import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DownloadIcon,
  FileIcon,
  FilterIcon,
  RefreshCcwIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CheckIcon,
  XIcon,
  ChevronRightIcon,
  Loader2Icon,
  SearchIcon,
  SlidersIcon,
  EyeIcon,
  FileTextIcon,
  TruckIcon,
  ShoppingCartIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { SellerDashboardLayout } from '@/components/layout/seller-dashboard-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Status badge colors
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  item_in_transit: 'bg-purple-100 text-purple-800 border-purple-200',
  item_received: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  replacement_in_transit: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  refund_initiated: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  refund_processed: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Format status for display
const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Return type labels
const requestTypeLabels = {
  return: 'Return',
  refund: 'Refund',
  replacement: 'Replacement'
};

export default function SellerReturnManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [actionNote, setActionNote] = useState('');
  const itemsPerPage = 10;

  // Fetch all return requests for the seller
  const {
    data: returnRequestsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/seller/returns', activeTab, currentPage, selectedStatus, selectedType, dateRange, searchQuery],
    enabled: !!user && user.role === 'seller'
  });

  // Get metrics for the dashboard
  const {
    data: metricsData,
    isLoading: isLoadingMetrics
  } = useQuery({
    queryKey: ['/api/seller/returns/metrics'],
    enabled: !!user && user.role === 'seller'
  });
  
  // Handle approve return request
  const approveReturnMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number, note: string }) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/approve`, { note });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to approve return');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return request approved",
        description: "The return request has been approved successfully.",
      });
      setActionDialogOpen(false);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns/metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve return",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle reject return request
  const rejectReturnMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number, note: string }) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/reject`, { note });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to reject return');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return request rejected",
        description: "The return request has been rejected successfully.",
      });
      setActionDialogOpen(false);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns/metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject return",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle mark as received
  const markReceivedMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number, note: string }) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/received`, { note });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to mark return as received');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return marked as received",
        description: "The returned item has been marked as received successfully.",
      });
      setActionDialogOpen(false);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns/metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark as received",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle process refund
  const processRefundMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number, note: string }) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/process-refund`, { note });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to process refund');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Refund processed",
        description: "The refund has been processed successfully.",
      });
      setActionDialogOpen(false);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns/metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process refund",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle ship replacement
  const shipReplacementMutation = useMutation({
    mutationFn: async ({ 
      id, 
      trackingNumber,
      courierName,
      trackingUrl,
      note 
    }: { 
      id: number, 
      trackingNumber: string,
      courierName: string,
      trackingUrl?: string,
      note: string 
    }) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/ship-replacement`, { 
        trackingNumber, 
        courierName, 
        trackingUrl, 
        note 
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to ship replacement');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Replacement shipped",
        description: "The replacement has been marked as shipped successfully.",
      });
      setActionDialogOpen(false);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns/metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to ship replacement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ 
      action, 
      ids, 
      note 
    }: { 
      action: string, 
      ids: number[], 
      note: string 
    }) => {
      const res = await apiRequest('POST', `/api/seller/returns/bulk-action`, { 
        action, 
        ids, 
        note 
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to perform bulk action');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bulk action completed",
        description: `Successfully processed ${selectedIds.length} return requests.`,
      });
      setBulkActionOpen(false);
      setSelectedIds([]);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/returns/metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const returnRequests = returnRequestsData?.returns || [];
  const totalCount = returnRequestsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Handle bulk selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(returnRequests.map((request: any) => request.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    }
  };

  // Handle action click
  const handleActionClick = (action: string, returnRequest: any) => {
    setSelectedReturn(returnRequest);
    setActionNote('');
    setActionDialogOpen(true);
  };

  // Execute the action
  const executeAction = () => {
    if (!selectedReturn) return;

    const id = selectedReturn.id;
    
    switch (bulkAction) {
      case 'approve':
        approveReturnMutation.mutate({ id, note: actionNote });
        break;
      case 'reject':
        rejectReturnMutation.mutate({ id, note: actionNote });
        break;
      case 'received':
        markReceivedMutation.mutate({ id, note: actionNote });
        break;
      case 'process-refund':
        processRefundMutation.mutate({ id, note: actionNote });
        break;
      default:
        console.error('Unknown action:', bulkAction);
    }
  };

  // Execute bulk action
  const executeBulkAction = () => {
    if (selectedIds.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one return request.",
        variant: "destructive",
      });
      return;
    }

    bulkActionMutation.mutate({
      action: bulkAction,
      ids: selectedIds,
      note: actionNote
    });
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // searchQuery state is already set via input onChange
    // The query will re-run due to the dependency on searchQuery
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedStatus(null);
    setSelectedType(null);
    setDateRange(null);
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <SellerDashboardLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Return Management</h1>
            <p className="text-gray-500 mt-1">Manage customer return requests and process refunds</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcwIcon className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersIcon className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Filters</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileIcon className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileIcon className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileIcon className="h-4 w-4 mr-2" />
                  Print Returns
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metrics/Stats Cards */}
        {!isLoadingMetrics && metricsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Pending Returns"
              value={metricsData.pendingCount.toString()}
              description="Awaiting action"
              icon={<ClockIcon className="h-5 w-5 text-yellow-500" />}
              trend={{
                value: metricsData.pendingTrend,
                label: "from last month",
                isUpward: metricsData.pendingTrend > 0,
              }}
            />
            <StatCard
              title="Approved Returns"
              value={metricsData.approvedCount.toString()}
              description="In progress"
              icon={<CheckCircleIcon className="h-5 w-5 text-blue-500" />}
              trend={{
                value: metricsData.approvedTrend,
                label: "from last month",
                isUpward: metricsData.approvedTrend > 0,
              }}
            />
            <StatCard
              title="Completed Returns"
              value={metricsData.completedCount.toString()}
              description="Successfully processed"
              icon={<CheckIcon className="h-5 w-5 text-green-500" />}
              trend={{
                value: metricsData.completedTrend,
                label: "from last month",
                isUpward: metricsData.completedTrend > 0,
              }}
            />
            <StatCard
              title="Refund Amount"
              value={`₹${metricsData.totalRefundAmount.toFixed(2)}`}
              description="Total refunded"
              icon={<RefreshCcwIcon className="h-5 w-5 text-primary" />}
              trend={{
                value: metricsData.refundAmountTrend,
                label: "from last month",
                isUpward: metricsData.refundAmountTrend > 0,
                isNegative: false,
              }}
            />
          </div>
        )}

        {/* Filters Section */}
        {filtersOpen && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Filters</CardTitle>
              <CardDescription>Refine return requests based on specific criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={selectedStatus || undefined} 
                    onValueChange={(value) => setSelectedStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="item_in_transit">Item in Transit</SelectItem>
                      <SelectItem value="item_received">Item Received</SelectItem>
                      <SelectItem value="replacement_in_transit">Replacement in Transit</SelectItem>
                      <SelectItem value="refund_initiated">Refund Initiated</SelectItem>
                      <SelectItem value="refund_processed">Refund Processed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Return Type</Label>
                  <Select 
                    value={selectedType || undefined} 
                    onValueChange={(value) => setSelectedType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="replacement">Replacement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select 
                    value={dateRange || undefined} 
                    onValueChange={(value) => setDateRange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="lastWeek">Last Week</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              <Button onClick={() => setFiltersOpen(false)}>
                Apply Filters
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Tabs and Search */}
        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-4 sm:mt-0 flex w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex space-x-2 w-full sm:w-auto">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search returns..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-muted p-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <span className="font-medium">{selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setBulkAction('approve');
                  setBulkActionOpen(true);
                }}
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setBulkAction('reject');
                  setBulkActionOpen(true);
                }}
              >
                <XIcon className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setBulkAction('received');
                  setBulkActionOpen(true);
                }}
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Mark Received
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setBulkAction('process-refund');
                  setBulkActionOpen(true);
                }}
              >
                <RefreshCcwIcon className="h-4 w-4 mr-1" />
                Process Refund
              </Button>
            </div>
          </div>
        )}

        {/* Returns Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Return Requests</CardTitle>
            <CardDescription>
              {totalCount} {totalCount === 1 ? 'return' : 'returns'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : returnRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          onCheckedChange={(checked) => {
                            if (typeof checked === 'boolean') {
                              if (checked) {
                                setSelectedIds(returnRequests.map((request: any) => request.id));
                              } else {
                                setSelectedIds([]);
                              }
                            }
                          }}
                          checked={
                            returnRequests.length > 0 && selectedIds.length === returnRequests.length
                          }
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(request.id)}
                            onCheckedChange={(checked) => {
                              if (typeof checked === 'boolean') {
                                handleSelectItem(request.id, checked);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">#{request.id}</TableCell>
                        <TableCell>
                          <Link to={`/seller/orders/${request.orderId}`} className="text-primary hover:underline">
                            #{request.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {request.buyerName || request.buyerUsername}
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {request.requestType && requestTypeLabels[request.requestType as keyof typeof requestTypeLabels]}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center max-w-[150px]">
                            <div className="w-8 h-8 rounded-sm border mr-2 overflow-hidden flex-shrink-0">
                              <img
                                src={request.productImage || "https://via.placeholder.com/100"}
                                alt={request.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="truncate text-sm">{request.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="truncate max-w-[100px] inline-block" title={request.reasonText}>
                            {request.reasonText}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[request.status]} font-normal`}>
                            {formatStatus(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <Link to={`/seller/returns/${request.id}`}>
                                <EyeIcon className="h-4 w-4" />
                              </Link>
                            </Button>
                            
                            {/* Action buttons based on status */}
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setBulkAction('approve');
                                    handleActionClick('approve', request);
                                  }}
                                  title="Approve Return"
                                >
                                  <CheckIcon className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setBulkAction('reject');
                                    handleActionClick('reject', request);
                                  }}
                                  title="Reject Return"
                                >
                                  <XIcon className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            
                            {request.status === 'item_in_transit' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setBulkAction('received');
                                  handleActionClick('received', request);
                                }}
                                title="Mark as Received"
                              >
                                <ShoppingCartIcon className="h-4 w-4 text-indigo-600" />
                              </Button>
                            )}
                            
                            {request.status === 'item_received' && (
                              <>
                                {request.requestType === 'replacement' ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setBulkAction('ship-replacement');
                                      handleActionClick('ship-replacement', request);
                                    }}
                                    title="Ship Replacement"
                                  >
                                    <TruckIcon className="h-4 w-4 text-cyan-600" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setBulkAction('process-refund');
                                      handleActionClick('process-refund', request);
                                    }}
                                    title="Process Refund"
                                  >
                                    <RefreshCcwIcon className="h-4 w-4 text-emerald-600" />
                                  </Button>
                                )}
                              </>
                            )}
                            
                            {request.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Print Return Label"
                                onClick={() => window.open(`/api/seller/returns/${request.id}/label`, '_blank')}
                              >
                                <FileTextIcon className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <RefreshCcwIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No return requests found</h3>
                <p className="text-gray-500 text-center mt-1">
                  There are no return requests matching your criteria
                </p>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'approve' && 'Approve Return Request'}
              {bulkAction === 'reject' && 'Reject Return Request'}
              {bulkAction === 'received' && 'Mark Return as Received'}
              {bulkAction === 'process-refund' && 'Process Refund'}
              {bulkAction === 'ship-replacement' && 'Ship Replacement'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'approve' && 'Approve this return request and generate a return label.'}
              {bulkAction === 'reject' && 'Reject this return request with a reason.'}
              {bulkAction === 'received' && 'Mark this return as received at your facility.'}
              {bulkAction === 'process-refund' && 'Process a refund for this return request.'}
              {bulkAction === 'ship-replacement' && 'Ship a replacement product to the customer.'}
            </DialogDescription>
          </DialogHeader>

          {bulkAction === 'ship-replacement' ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="courierName">Courier Service</Label>
                <Input
                  id="courierName"
                  placeholder="e.g. FedEx, DHL, DTDC"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trackingUrl">Tracking URL (Optional)</Label>
                <Input
                  id="trackingUrl"
                  placeholder="https://example.com/track/..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Additional Notes (Optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Add any additional information about this shipment"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="note">
                  {bulkAction === 'reject' ? 'Reason for Rejection' : 'Notes (Optional)'}
                </Label>
                <Textarea
                  id="note"
                  placeholder={
                    bulkAction === 'reject'
                      ? "Please provide a reason for rejecting this return"
                      : "Add any additional notes"
                  }
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={4}
                  required={bulkAction === 'reject'}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeAction}
              disabled={
                (bulkAction === 'reject' && !actionNote) ||
                (bulkAction === 'ship-replacement' && (
                  !document.getElementById('courierName')?.value ||
                  !document.getElementById('trackingNumber')?.value
                ))
              }
            >
              {approveReturnMutation.isPending ||
               rejectReturnMutation.isPending ||
               markReceivedMutation.isPending ||
               processRefundMutation.isPending ||
               shipReplacementMutation.isPending ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'approve' && 'Approve Selected Returns'}
              {bulkAction === 'reject' && 'Reject Selected Returns'}
              {bulkAction === 'received' && 'Mark Selected Returns as Received'}
              {bulkAction === 'process-refund' && 'Process Refunds for Selected Returns'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'approve' && `You are about to approve ${selectedIds.length} return requests.`}
              {bulkAction === 'reject' && `You are about to reject ${selectedIds.length} return requests.`}
              {bulkAction === 'received' && `You are about to mark ${selectedIds.length} returns as received.`}
              {bulkAction === 'process-refund' && `You are about to process refunds for ${selectedIds.length} return requests.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulkNote">
                {bulkAction === 'reject' ? 'Reason for Rejection' : 'Notes (Optional)'}
              </Label>
              <Textarea
                id="bulkNote"
                placeholder={
                  bulkAction === 'reject'
                    ? "Please provide a reason for rejecting these returns"
                    : "Add any additional notes"
                }
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={4}
                required={bulkAction === 'reject'}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeBulkAction}
              disabled={bulkAction === 'reject' && !actionNote}
            >
              {bulkActionMutation.isPending ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}