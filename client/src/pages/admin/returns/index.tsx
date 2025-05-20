import { useState } from 'react';
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
  ShoppingCartIcon,
  BarChart3Icon,
  ClockIcon,
  AlertTriangleIcon,
  DollarSignIcon
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
import { AdminLayout } from '@/components/layout/admin-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

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

// Pie chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminReturnManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [actionNote, setActionNote] = useState('');
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const itemsPerPage = 10;

  // Fetch all return requests
  const {
    data: returnRequestsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/returns', activeTab, currentPage, selectedStatus, selectedType, selectedSeller, dateRange, searchQuery],
    enabled: !!user && user.role === 'admin'
  });

  // Get return metrics for the dashboard
  const {
    data: metricsData,
    isLoading: isLoadingMetrics
  } = useQuery({
    queryKey: ['/api/admin/returns/metrics'],
    enabled: !!user && user.role === 'admin'
  });

  // Get return analytics data
  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics
  } = useQuery({
    queryKey: ['/api/admin/returns/analytics'],
    enabled: !!user && user.role === 'admin'
  });

  // Fetch all sellers for filter dropdown
  const {
    data: sellersData
  } = useQuery({
    queryKey: ['/api/admin/sellers'],
    enabled: !!user && user.role === 'admin'
  });

  // Override return policy mutation
  const overridePolicyMutation = useMutation({
    mutationFn: async ({ 
      id, 
      action, 
      reason 
    }: { 
      id: number, 
      action: string, 
      reason: string 
    }) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/override-policy`, { 
        action, 
        reason 
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to override return policy');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Policy Override Applied",
        description: "The return policy has been overridden successfully.",
      });
      setOverrideDialogOpen(false);
      setOverrideReason('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns/metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Override Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Force approve return mutation
  const forceApproveMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number, note: string }) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/force-approve`, { note });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to approve return');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Approved",
        description: "The return request has been approved by admin.",
      });
      setActionDialogOpen(false);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns/metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve return",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Force refund mutation
  const forceRefundMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number, note: string }) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/force-refund`, { note });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to process refund');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Refund Processed",
        description: "The refund has been processed by admin.",
      });
      setActionDialogOpen(false);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns/metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process refund",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign dispute handler mutation
  const assignDisputeMutation = useMutation({
    mutationFn: async ({ id, handlerId, note }: { id: number, handlerId: number, note: string }) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/assign-dispute`, { 
        handlerId, 
        note 
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to assign dispute handler');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Dispute Handler Assigned",
        description: "The dispute handler has been assigned successfully.",
      });
      setActionDialogOpen(false);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign handler",
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
      const res = await apiRequest('POST', `/api/admin/returns/bulk-action`, { 
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns/metrics'] });
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
  const sellers = sellersData?.sellers || [];
  
  // Analytics chart data preparation
  const dailyReturnData = analyticsData?.dailyReturns || [];
  const reasonsData = analyticsData?.returnReasons || [];
  const returnTypeData = analyticsData?.returnTypes || [];
  const sellerPerformanceData = analyticsData?.sellerPerformance || [];

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
    setBulkAction(action);
    setActionNote('');
    setActionDialogOpen(true);
  };

  // Handle override policy click
  const handleOverrideClick = (action: string, returnRequest: any) => {
    setSelectedReturn(returnRequest);
    setBulkAction(action);
    setOverrideReason('');
    setOverrideDialogOpen(true);
  };

  // Execute admin action
  const executeAction = () => {
    if (!selectedReturn) return;

    const id = selectedReturn.id;
    
    switch (bulkAction) {
      case 'force-approve':
        forceApproveMutation.mutate({ id, note: actionNote });
        break;
      case 'force-refund':
        forceRefundMutation.mutate({ id, note: actionNote });
        break;
      case 'assign-dispute':
        // In a real implementation, you would have a dropdown to select handler ID
        assignDisputeMutation.mutate({ id, handlerId: 1, note: actionNote });
        break;
      default:
        console.error('Unknown action:', bulkAction);
    }
  };

  // Execute policy override
  const executeOverride = () => {
    if (!selectedReturn || !bulkAction || !overrideReason) return;
    
    overridePolicyMutation.mutate({
      id: selectedReturn.id,
      action: bulkAction,
      reason: overrideReason
    });
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
    setSelectedSeller(null);
    setDateRange(null);
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Return Management</h1>
            <p className="text-gray-500 mt-1">Manage and oversee all customer return requests</p>
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
                  Print Returns Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metrics/Stats Cards */}
        {!isLoadingMetrics && metricsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Returns"
              value={metricsData.totalReturns.toString()}
              description="Last 30 days"
              icon={<RefreshCcwIcon className="h-5 w-5 text-primary" />}
              trend={{
                value: metricsData.returnsTrend,
                label: "from previous period",
                isUpward: metricsData.returnsTrend > 0,
                isNegative: metricsData.returnsTrend > 0,
              }}
            />
            <StatCard
              title="Pending Approvals"
              value={metricsData.pendingReturns.toString()}
              description="Awaiting action"
              icon={<ClockIcon className="h-5 w-5 text-yellow-500" />}
              trend={{
                value: metricsData.pendingTrend,
                label: "from previous period",
                isUpward: metricsData.pendingTrend > 0,
                isNegative: metricsData.pendingTrend > 0,
              }}
            />
            <StatCard
              title="Disputed Returns"
              value={metricsData.disputedReturns.toString()}
              description="Require attention"
              icon={<AlertTriangleIcon className="h-5 w-5 text-red-500" />}
              trend={{
                value: metricsData.disputedTrend,
                label: "from previous period",
                isUpward: metricsData.disputedTrend > 0,
                isNegative: metricsData.disputedTrend > 0,
              }}
            />
            <StatCard
              title="Total Refund Amount"
              value={`₹${metricsData.totalRefundAmount.toFixed(2)}`}
              description="Last 30 days"
              icon={<DollarSignIcon className="h-5 w-5 text-green-500" />}
              trend={{
                value: metricsData.refundAmountTrend,
                label: "from previous period",
                isUpward: metricsData.refundAmountTrend > 0,
                isNegative: false,
              }}
            />
          </div>
        )}

        {/* Analytics Charts */}
        {!isLoadingAnalytics && analyticsData && (
          <div className="mb-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Return Trends</CardTitle>
                <CardDescription>Daily return requests over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dailyReturnData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="returns" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="refunds" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Return Reasons</CardTitle>
                  <CardDescription>Distribution of return request reasons</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reasonsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {reasonsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Seller Return Performance</CardTitle>
                  <CardDescription>Return rates by top sellers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sellerPerformanceData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="seller" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="returnRate" fill="#8884d8" name="Return Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Filters Section */}
        {filtersOpen && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Advanced Filters</CardTitle>
              <CardDescription>Refine return requests based on specific criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <SelectItem value="disputed">Disputed</SelectItem>
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
                  <Label>Seller</Label>
                  <Select 
                    value={selectedSeller || undefined} 
                    onValueChange={(value) => setSelectedSeller(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Sellers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sellers</SelectItem>
                      {sellers.map((seller: any) => (
                        <SelectItem key={seller.id} value={seller.id.toString()}>
                          {seller.name || seller.username}
                        </SelectItem>
                      ))}
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
                      <SelectItem value="last30days">Last 30 Days</SelectItem>
                      <SelectItem value="last90days">Last 90 Days</SelectItem>
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
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
              <TabsTrigger value="process">In Process</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-4 sm:mt-0 flex w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex space-x-2 w-full sm:w-auto">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search by order #, customer, or product"
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
                  setBulkAction('force-approve');
                  setBulkActionOpen(true);
                }}
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Approve All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setBulkAction('assign-dispute');
                  setBulkActionOpen(true);
                }}
              >
                <AlertTriangleIcon className="h-4 w-4 mr-1" />
                Assign to Handler
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setBulkAction('export-selected');
                  setBulkActionOpen(true);
                }}
              >
                <DownloadIcon className="h-4 w-4 mr-1" />
                Export Selected
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
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
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
                          {format(new Date(request.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Link to={`/admin/users/${request.buyerId}`} className="text-primary hover:underline">
                            {request.buyerName || request.buyerUsername}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link to={`/admin/orders/${request.orderId}`} className="text-primary hover:underline">
                            #{request.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link to={`/admin/users/${request.sellerId}`} className="text-primary hover:underline">
                            {request.sellerName || request.sellerUsername}
                          </Link>
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
                        <TableCell>₹{request.refundAmount || '0.00'}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[request.status as keyof typeof statusColors]} font-normal`}>
                            {formatStatus(request.status)}
                          </Badge>
                          {request.isDisputed && (
                            <Badge className="ml-1 bg-red-100 text-red-800 border-red-200">
                              Disputed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <Link to={`/admin/returns/${request.id}`}>
                                <EyeIcon className="h-4 w-4" />
                              </Link>
                            </Button>
                            
                            {/* Admin specific actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <SlidersIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleActionClick('force-approve', request)}
                                >
                                  <CheckIcon className="mr-2 h-4 w-4" />
                                  Force Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleActionClick('force-refund', request)}
                                >
                                  <RefreshCcwIcon className="mr-2 h-4 w-4" />
                                  Force Refund
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleActionClick('assign-dispute', request)}
                                >
                                  <AlertTriangleIcon className="mr-2 h-4 w-4" />
                                  Assign Dispute Handler
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Policy Overrides</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleOverrideClick('extend-window', request)}
                                >
                                  <ClockIcon className="mr-2 h-4 w-4" />
                                  Extend Return Window
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOverrideClick('bypass-eligibility', request)}
                                >
                                  <XCircleIcon className="mr-2 h-4 w-4" />
                                  Bypass Eligibility Check
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
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

      {/* Admin Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'force-approve' && 'Force Approve Return'}
              {bulkAction === 'force-refund' && 'Force Process Refund'}
              {bulkAction === 'assign-dispute' && 'Assign Dispute Handler'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'force-approve' && 'Approve this return request, overriding seller policy.'}
              {bulkAction === 'force-refund' && 'Process a refund for this return, overriding normal procedures.'}
              {bulkAction === 'assign-dispute' && 'Assign this disputed return to a specialist for resolution.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {bulkAction === 'assign-dispute' && (
              <div className="mb-4">
                <Label htmlFor="handlerId">Dispute Handler</Label>
                <Select>
                  <SelectTrigger id="handlerId">
                    <SelectValue placeholder="Select a handler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">John Smith (Returns)</SelectItem>
                    <SelectItem value="2">Maria Garcia (Customer Service)</SelectItem>
                    <SelectItem value="3">David Lee (Financial Dept)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="adminNote">
                Admin Note {bulkAction !== 'assign-dispute' && '(Required)'}
              </Label>
              <Textarea
                id="adminNote"
                placeholder="Provide a reason for this action"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeAction}
              disabled={!actionNote && bulkAction !== 'assign-dispute'}
            >
              {(forceApproveMutation.isPending ||
                forceRefundMutation.isPending ||
                assignDisputeMutation.isPending) && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Policy Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'extend-window' && 'Extend Return Window'}
              {bulkAction === 'bypass-eligibility' && 'Bypass Eligibility Check'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'extend-window' && 'Extend the return window for this order, allowing a late return.'}
              {bulkAction === 'bypass-eligibility' && 'Allow a return that would normally be ineligible according to policy.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="overrideReason">
                Override Reason (Required)
              </Label>
              <Textarea
                id="overrideReason"
                placeholder="Provide a detailed justification for this policy override"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Note: All policy overrides are logged and require justification for audit purposes.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeOverride}
              disabled={!overrideReason}
              variant="destructive"
            >
              {overridePolicyMutation.isPending && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'force-approve' && 'Approve Selected Returns'}
              {bulkAction === 'assign-dispute' && 'Assign Selected Returns to Handler'}
              {bulkAction === 'export-selected' && 'Export Selected Returns'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'force-approve' && `You are about to approve ${selectedIds.length} return requests.`}
              {bulkAction === 'assign-dispute' && `You are about to assign ${selectedIds.length} returns to a dispute handler.`}
              {bulkAction === 'export-selected' && `You are about to export ${selectedIds.length} return requests.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {bulkAction === 'assign-dispute' && (
              <div className="mb-4">
                <Label htmlFor="bulkHandlerId">Dispute Handler</Label>
                <Select>
                  <SelectTrigger id="bulkHandlerId">
                    <SelectValue placeholder="Select a handler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">John Smith (Returns)</SelectItem>
                    <SelectItem value="2">Maria Garcia (Customer Service)</SelectItem>
                    <SelectItem value="3">David Lee (Financial Dept)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {bulkAction === 'export-selected' && (
              <div className="mb-4">
                <Label htmlFor="exportFormat">Export Format</Label>
                <Select defaultValue="csv">
                  <SelectTrigger id="exportFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {bulkAction !== 'export-selected' && (
              <div className="space-y-2">
                <Label htmlFor="bulkNote">
                  Admin Note {bulkAction === 'force-approve' && '(Required)'}
                </Label>
                <Textarea
                  id="bulkNote"
                  placeholder="Provide a reason for this action"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={bulkAction === 'export-selected' ? () => setBulkActionOpen(false) : executeBulkAction}
              disabled={bulkAction === 'force-approve' && !actionNote}
            >
              {bulkActionMutation.isPending && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {bulkAction === 'export-selected' ? 'Export' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}