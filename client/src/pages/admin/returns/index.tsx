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

  // Mutation for updating return status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/update-status`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Status Updated', description: 'Order status updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/returns'] }); // Also refresh buyer returns
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update status', variant: 'destructive' });
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

  // Filter for marked_for_return status only
  const filteredReturns = (returnRequestsData?.returns || []).filter((r: any) => r.status === 'marked_for_return');

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

  // Only show combined list of marked_for_return orders/returns
  const combinedReturns = returnRequestsData || [];

  // Handle status update for both return requests and pseudo orders
  const handleStatusUpdate = (item: any, status: string) => {
    if (item.isOrderOnly) {
      // Update order status directly for pseudo order
      fetch(`/api/admin/orders/${item.orderId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include',
      })
        .then(res => res.json())
        .then(() => {
          toast({ title: 'Status Updated', description: 'Order status updated successfully.' });
          refetch();
        })
        .catch(() => {
          toast({ title: 'Error', description: 'Failed to update order status', variant: 'destructive' });
        });
    } else {
      updateStatusMutation.mutate({ id: item.id, status });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Return Management</h1>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Orders Marked for Return</CardTitle>
            <CardDescription>
              {combinedReturns.length} {combinedReturns.length === 1 ? 'order' : 'orders'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : combinedReturns.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedReturns.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">#{item.id}</TableCell>
                        <TableCell>{format(new Date(item.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Link to={`/admin/orders/${item.orderId}`} className="text-primary hover:underline">
                            #{item.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={status => handleStatusUpdate(item, status)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="marked_for_return">Marked for Return</SelectItem>
                              <SelectItem value="coming_to_collect_order_again">Coming to Collect Order Again</SelectItem>
                              <SelectItem value="cant_be_returned">Can't Be Returned</SelectItem>
                              <SelectItem value="returned_successfully">Returned Successfully</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link to={`/admin/orders/${item.orderId}`}>
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex justify-center items-center h-32 text-gray-500">
                No orders currently marked for return.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}