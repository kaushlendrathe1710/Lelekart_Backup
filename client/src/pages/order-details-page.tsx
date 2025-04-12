import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package2, Truck, ClipboardCheck, Clock, MapPin, User, Phone, Mail } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types for order items and products
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  sellerId: number;
  approved: boolean;
  createdAt: string;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
}

// Type for shipping details
interface ShippingDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
}

// Type for the order
interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  date: string;
  shippingDetails: string | ShippingDetails;
  paymentMethod: string;
  items?: OrderItem[];
}

// Helper to format dates
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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

// Expected delivery date (7 days from order date)
function getExpectedDeliveryDate(orderDate: string) {
  const date = new Date(orderDate);
  date.setDate(date.getDate() + 7);
  return formatDate(date.toISOString());
}

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if user is logged in
    const cachedUser = queryClient.getQueryData<any>(['/api/user']);
    if (!cachedUser) {
      navigate('/auth');
      return;
    }
    
    // Fetch order details
    const fetchOrderDetails = async () => {
      try {
        const orderResponse = await fetch(`/api/orders/${id}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!orderResponse.ok) {
          throw new Error("Failed to fetch order");
        }
        
        const orderData = await orderResponse.json();
        
        // Process shipping details if it's a string
        if (typeof orderData.shippingDetails === 'string') {
          try {
            orderData.shippingDetails = JSON.parse(orderData.shippingDetails);
          } catch (e) {
            console.error("Error parsing shipping details:", e);
          }
        }
        
        setOrder(orderData);
        
        // Fetch order items
        const itemsResponse = await fetch(`/api/orders/${id}/items`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!itemsResponse.ok) {
          throw new Error("Failed to fetch order items");
        }
        
        const itemsData = await itemsResponse.json();
        setItems(itemsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast({
          title: "Error",
          description: "Failed to fetch order details. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id, navigate, toast]);
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700">Order Not Found</h2>
            <p className="text-gray-500 mt-2">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => navigate("/")} className="mt-4">Return to Home</Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-gray-600">Order #{order.id}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button 
              variant="outline" 
              onClick={() => navigate("/orders")}
              className="mr-2"
            >
              Back to Orders
            </Button>
          </div>
        </div>
        
        {/* Order Summary Card */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Placed on {formatDate(order.date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <StatusIcon status={order.status} />
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              <h2 className="text-lg font-semibold mb-2">Payment Info</h2>
              <p className="text-gray-700">
                <span className="font-medium">Method:</span> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Total:</span> ₹{order.total.toFixed(2)}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <h2 className="text-lg font-semibold mb-2">Delivery</h2>
              <p className="text-gray-700">
                <span className="font-medium">Expected by:</span> {getExpectedDeliveryDate(order.date)}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Order Items */}
        <Card className="p-6 mb-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                <div className="md:w-1/6 mb-4 md:mb-0">
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="md:w-5/6 md:pl-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">{item.product.description.substring(0, 100)}...</p>
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 md:mt-0 text-right">
                      <p className="font-semibold text-gray-800">₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Shipping and Billing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-gray-600" />
              Shipping Address
            </h2>
            
            {order.shippingDetails && typeof order.shippingDetails === 'object' && (
              <div className="space-y-2">
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{order.shippingDetails.name}</p>
                    <p className="text-gray-600">{order.shippingDetails.address}</p>
                    <p className="text-gray-600">
                      {order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-gray-500" />
                  <p>{order.shippingDetails.phone}</p>
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-gray-500" />
                  <p>{order.shippingDetails.email}</p>
                </div>
                
                {order.shippingDetails.notes && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Notes: {order.shippingDetails.notes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* Order Timeline */}
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="relative pl-10 pb-8">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                </div>
              </div>
              
              <div className="relative pl-10 pb-8">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Package2 className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">Processing</p>
                  <p className="text-sm text-gray-500">Your order is being processed</p>
                </div>
              </div>
              
              <div className="relative pl-10 pb-8">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">Shipping</p>
                  <p className="text-sm text-gray-500">Estimated ship date: {formatDate(new Date(order.date).toISOString())}</p>
                </div>
              </div>
              
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">Delivery</p>
                  <p className="text-sm text-gray-500">Expected by: {getExpectedDeliveryDate(order.date)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Need Help Section */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Need Help?</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <Button variant="outline">Track Order</Button>
            <Button variant="outline">Cancel Order</Button>
            <Button variant="outline">Return or Exchange</Button>
            <Button variant="outline">Contact Support</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}