import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Package2, 
  Truck, 
  ClipboardCheck, 
  Clock, 
  Search,
  ShoppingBag,
  ChevronRight,
  ArrowDownAZ,
  ArrowUpAZ,
  X
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

// Types
interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  date: string;
  shippingDetails: string;
  paymentMethod: string;
  walletDiscount?: number;
  rewardDiscount?: number;
}

// Helper to format dates with time
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleString('en-IN', options);
}

// Helper to get status badge color
function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'shipped':
      return 'bg-blue-100 text-blue-800';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper to get status icon
function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'delivered':
      return <ClipboardCheck className="h-5 w-5 text-green-600" />;
    case 'shipped':
      return <Truck className="h-5 w-5 text-blue-600" />;
    case 'processing':
      return <Package2 className="h-5 w-5 text-yellow-600" />;
    case 'cancelled':
      return <Clock className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
}

export default function OrdersPage() {
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDescending, setSortDescending] = useState(true); // Default to newest first
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [returningOrderId, setReturningOrderId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/cancel`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel order");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Cancelled",
        description: "Your order has been successfully cancelled.",
      });
      // Refetch orders
      fetchOrders();
      // Close dialog
      setShowCancelDialog(false);
      setOrderToCancel(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Function to fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const cachedUser = queryClient.getQueryData<any>(['/api/user']);
    if (!cachedUser) {
      navigate('/auth');
      return;
    }
    
    // Fetch orders on component mount
    fetchOrders();
  }, [navigate]);
  
  // Sort orders by date
  const sortOrders = (ordersToSort: Order[]): Order[] => {
    return [...ordersToSort].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDescending ? dateB - dateA : dateA - dateB;
    });
  };
  
  // Handle search and sorting
  useEffect(() => {
    // Check if orders array is available first
    if (!orders || orders.length === 0) {
      setFilteredOrders([]);
      return;
    }
    
    let result = [...orders];
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      
      result = result.filter((order) => {
        const idMatch = order.id.toString().includes(query);
        const statusMatch = order.status.toLowerCase().includes(query);
        const paymentMatch = order.paymentMethod.toLowerCase().includes(query);
        
        return idMatch || statusMatch || paymentMatch;
      });
    }
    
    // Apply sorting
    result = sortOrders(result);
    
    setFilteredOrders(result);
  }, [searchQuery, orders, sortDescending]);
  
  const handleReturnOrder = async (orderId: number) => {
    setReturningOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/mark-for-return`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to mark order for return');
      }
      toast({
        title: 'Return Initiated',
        description: 'Order marked for return. You can track it in My Returns.',
      });
      fetchOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark order for return. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReturningOrderId(null);
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    return (
      <div>
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Orders</h1>
              <p className="text-muted-foreground">Track, return, or buy again</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-3 w-full md:w-auto">
              {/* Sort Toggle Button */}
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center justify-center gap-2 h-10"
                onClick={() => setSortDescending(!sortDescending)}
                aria-label={sortDescending ? "Sort by oldest first" : "Sort by newest first"}
              >
                {sortDescending ? (
                  <>
                    <ArrowDownAZ className="h-4 w-4" />
                    <span>Newest First</span>
                  </>
                ) : (
                  <>
                    <ArrowUpAZ className="h-4 w-4" />
                    <span>Oldest First</span>
                  </>
                )}
              </Button>
              
              {/* Search Box */}
              <div className="relative md:min-w-[250px]">
                <Input
                  type="text"
                  placeholder="Search by order ID or status"
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search orders"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="bg-background rounded-lg shadow-sm p-8 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No orders match your search criteria." : "You haven't placed any orders yet."}
            </p>
            <Button onClick={() => navigate("/")}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card 
                key={order.id} 
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/order/${order.id}`)}
              >
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <StatusIcon status={order.status} />
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <h3 className="font-medium">Order #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">Placed on {formatDate(order.date)}</p>
                    
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Payment Method:</span> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex flex-col md:items-end justify-between">
                    {/* Show the final total after all discounts */}
                    <p className="font-semibold text-xl">
                      ₹{order.total.toFixed(2)}
                    </p>
                    {/* Show wallet discount if used and > 0 */}
                    {order.walletDiscount && order.walletDiscount > 0 ? (
                      <p className="text-green-600 text-sm">Redeemed Coins Used: -₹{order.walletDiscount.toFixed(2)}</p>
                    ) : null}
                    {/* Show reward discount if used and > 0 */}
                    {order.rewardDiscount && order.rewardDiscount > 0 ? (
                      <p className="text-blue-600 text-sm">Reward Points Used: -₹{order.rewardDiscount.toFixed(2)}</p>
                    ) : null}
                    
                    <div className="flex space-x-2 mt-2 md:mt-auto">
                      {/* Only show cancel button for pending/processing orders */}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center text-red-500 border-red-200 hover:bg-red-50" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToCancel(order);
                            setShowCancelDialog(true);
                          }}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Cancel Order
                        </Button>
                      )}
                      
                      {order.status === 'delivered' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center text-blue-500 border-blue-200 hover:bg-blue-50"
                          disabled={returningOrderId === order.id}
                          onClick={e => {
                            e.stopPropagation();
                            handleReturnOrder(order.id);
                          }}
                        >
                          {returningOrderId === order.id ? (
                            <span className="animate-spin mr-2">⟳</span>
                          ) : null}
                          Return
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        className="flex items-center" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/order/${order.id}`);
                        }}
                      >
                        View Details <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <DashboardLayout>
      {renderContent()}
      
      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order #{orderToCancel?.id}</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 mt-2 bg-red-50 border border-red-100 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Note:</strong> Order cancellation is only possible for orders that have not been shipped. 
              If payment was made, a refund will be initiated automatically.
            </p>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowCancelDialog(false);
                setOrderToCancel(null);
              }}
            >
              Keep Order
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              disabled={cancelOrderMutation.isPending} 
              onClick={() => {
                if (orderToCancel) {
                  cancelOrderMutation.mutate(orderToCancel.id);
                }
              }}
            >
              {cancelOrderMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> Cancelling...
                </>
              ) : (
                'Cancel Order'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}