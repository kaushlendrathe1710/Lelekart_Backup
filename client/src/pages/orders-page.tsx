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
  ChevronRight
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types
interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  date: string;
  shippingDetails: string;
  paymentMethod: string;
}

// Helper to format dates
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('en-IN', options);
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
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if user is logged in
    const cachedUser = queryClient.getQueryData<any>(['/api/user']);
    if (!cachedUser) {
      navigate('/auth');
      return;
    }
    
    // Fetch user's orders
    const fetchOrders = async () => {
      try {
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
    
    fetchOrders();
  }, [navigate, toast]);
  
  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = orders.filter((order) => 
        order.id.toString().includes(query) || 
        order.status.toLowerCase().includes(query) ||
        order.paymentMethod.toLowerCase().includes(query)
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);
  
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track, return, or buy again</p>
          </div>
          
          <div className="mt-4 md:mt-0 w-full md:w-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by order ID or status"
                className="pl-10 pr-24 w-full md:w-80"
                disabled
                onClick={() => alert('Search functionality is being improved. Please check back later!')}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                Coming soon
              </span>
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
                    <p className="font-semibold text-xl">₹{order.total.toFixed(2)}</p>
                    
                    <Button 
                      variant="ghost" 
                      className="flex items-center mt-2 md:mt-auto" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/order/${order.id}`);
                      }}
                    >
                      View Details <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
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
    </DashboardLayout>
  );
}