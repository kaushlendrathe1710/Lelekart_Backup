import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CalendarIcon, 
  ClockIcon, 
  RefreshCcwIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChevronRightIcon,
  Loader2Icon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';

// Return status badge colors
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

// Return type labels
const requestTypeLabels = {
  return: 'Return',
  refund: 'Refund',
  replacement: 'Replacement'
};

// Format status labels for display
const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function ReturnsList() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  
  // Fetch user's return requests
  const { 
    data: returnRequests, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/returns'],
    enabled: !!user
  });
  
  // Filter returns based on active tab
  const getFilteredReturns = () => {
    if (!returnRequests) return [];
    
    if (activeTab === 'all') {
      return returnRequests;
    }
    
    if (activeTab === 'active') {
      return returnRequests.filter(request => 
        !['completed', 'rejected', 'cancelled'].includes(request.status)
      );
    }
    
    if (activeTab === 'completed') {
      return returnRequests.filter(request => 
        ['completed'].includes(request.status)
      );
    }
    
    if (activeTab === 'cancelled') {
      return returnRequests.filter(request => 
        ['rejected', 'cancelled'].includes(request.status)
      );
    }
    
    return returnRequests;
  };
  
  const filteredReturns = getFilteredReturns();

  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching returns",
        description: "Could not load your return requests. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg text-gray-600 mb-4">Please login to view your returns</p>
        <Button asChild>
          <Link to="/auth">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/account">My Account</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Return Requests</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Returns</h1>
          <p className="text-gray-500 mt-1">Track and manage your return requests</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          className="mt-4 sm:mt-0"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcwIcon className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Returns</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled/Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredReturns.length > 0 ? (
        <Card>
          <CardHeader className="px-6">
            <CardTitle>Your Return Requests</CardTitle>
            <CardDescription>
              {filteredReturns.length} return {filteredReturns.length === 1 ? 'request' : 'requests'} found
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((returnRequest) => (
                    <TableRow key={returnRequest.id}>
                      <TableCell className="font-medium">#{returnRequest.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                          {format(new Date(returnRequest.createdAt), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={`/orders/${returnRequest.orderId}`} className="text-primary hover:underline">
                          #{returnRequest.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {returnRequest.requestType && requestTypeLabels[returnRequest.requestType as keyof typeof requestTypeLabels]}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[returnRequest.status as keyof typeof statusColors]} font-normal`}>
                          {formatStatus(returnRequest.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/returns/${returnRequest.id}`}>
                            View Details
                            <ChevronRightIcon className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <RefreshCcwIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No return requests found</h3>
            <p className="text-gray-500 text-center mt-1 max-w-md">
              You don't have any {activeTab !== 'all' ? activeTab + ' ' : ''}return requests yet.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/orders">View My Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}