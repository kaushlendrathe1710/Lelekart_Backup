import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package2, Truck, ClipboardCheck, Clock, MapPin, User, Phone, Mail, FileText, Download, Printer, X, RefreshCw, MessageSquare } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Types for order items and products
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  image_url?: string;
  images?: string;
  description: string;
  category: string;
  sellerId: number;
  approved: boolean;
  createdAt: string;
  specifications?: string;
  purchasePrice?: number;
  color?: string;
  size?: string;
  stock?: number;
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

// Helper to get the product image URL from various sources
function getProductImageUrl(product: Product): string {
  // First try to use imageUrl (camelCase)
  if (product.imageUrl) {
    return product.imageUrl;
  }
  
  // Then try image_url (snake_case)
  if (product.image_url) {
    return product.image_url;
  }
  
  // Then try to parse images JSON array and get first image
  if (product.images) {
    try {
      // If it's already a string, parse it
      if (typeof product.images === 'string') {
        const parsedImages = JSON.parse(product.images);
        if (parsedImages && Array.isArray(parsedImages) && parsedImages.length > 0) {
          return parsedImages[0];
        }
      }
    } catch (error) {
      console.error("Failed to parse product images:", error);
    }
  }
  
  // Fallback to placeholder
  return 'https://via.placeholder.com/80?text=Product';
}

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Function to print/download invoice
  const printInvoice = () => {
    if (!invoiceRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order?.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .company-details { text-align: right; }
            .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .customer-details, .order-details { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f9f9f9; }
            .total-section { margin-top: 20px; text-align: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { @page { margin: 0.5cm; } }
          </style>
        </head>
        <body>
          ${invoiceRef.current.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  
  // Download invoice as PDF
  const downloadInvoice = () => {
    // Using browser print to PDF functionality
    printInvoice();
    
    toast({
      title: "Download Started",
      description: "Your invoice is being prepared for download.",
    });
  };

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
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!order) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <p className="text-muted-foreground mt-2">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate("/")} className="mt-4">Return to Home</Button>
        </div>
      );
    }
    
    return (
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Order #{order.id}</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/orders")}
            >
              Back to Orders
            </Button>
            <Button
              variant="outline"
              onClick={downloadInvoice}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" /> Download Invoice
            </Button>
          </div>
        </div>
        
        {/* Order Summary Card */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Placed on {formatDate(order.date)}</span>
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
              <p className="text-muted-foreground">
                <span className="font-medium">Method:</span> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Total:</span> ₹{order.total.toFixed(2)}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <h2 className="text-lg font-semibold mb-2">Delivery</h2>
              <p className="text-muted-foreground">
                <span className="font-medium">Expected by:</span> {getExpectedDeliveryDate(order.date)}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Order Items */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                <div className="md:w-1/6 mb-4 md:mb-0">
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                    <img
                      src={getProductImageUrl(item.product)}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.log("Image load error for:", item.product.name);
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/80?text=Product';
                      }}
                    />
                  </div>
                </div>
                
                <div className="md:w-5/6 md:pl-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.product.description.substring(0, 100)}...</p>
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">Quantity: {item.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 md:mt-0 text-right">
                      <p className="font-semibold">₹{item.price.toFixed(2)}</p>
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
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
              Shipping Address
            </h2>
            
            {order.shippingDetails && typeof order.shippingDetails === 'object' && (
              <div className="space-y-2">
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{order.shippingDetails.name}</p>
                    <p className="text-muted-foreground">{order.shippingDetails.address}</p>
                    <p className="text-muted-foreground">
                      {order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                  <p className="text-muted-foreground">{order.shippingDetails.phone}</p>
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                  <p className="text-muted-foreground">{order.shippingDetails.email}</p>
                </div>
                
                {order.shippingDetails.notes && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Notes: {order.shippingDetails.notes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* Order Timeline */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="relative pl-10 pb-8">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.date)}</p>
                </div>
              </div>
              
              <div className="relative pl-10 pb-8">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Package2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Processing</p>
                  <p className="text-sm text-muted-foreground">Your order is being processed</p>
                </div>
              </div>
              
              <div className="relative pl-10 pb-8">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Shipping</p>
                  <p className="text-sm text-muted-foreground">Estimated ship date: {formatDate(new Date(order.date).toISOString())}</p>
                </div>
              </div>
              
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Delivery</p>
                  <p className="text-sm text-muted-foreground">Expected by: {getExpectedDeliveryDate(order.date)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Need Help Section */}
        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Need Help?</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                const shipmentTrackingDialog = () => {
                  toast({
                    title: "Track Your Order",
                    description: `Your order #${order.id} is currently ${order.status}. We'll update you when there's a change in status.`,
                    variant: "default",
                  });
                };
                
                // For orders in delivered/cancelled state - show different message
                if (order.status.toLowerCase() === 'delivered') {
                  toast({
                    title: "Order Delivered",
                    description: `Your order #${order.id} has been delivered successfully.`,
                    variant: "default",
                  });
                } else if (order.status.toLowerCase() === 'cancelled') {
                  toast({
                    title: "Order Cancelled",
                    description: `Your order #${order.id} has been cancelled.`,
                    variant: "default",
                  });
                } else {
                  shipmentTrackingDialog();
                }
              }}
            >
              <Truck className="h-4 w-4" /> Track Order
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={['delivered', 'cancelled'].includes(order.status.toLowerCase())}
              onClick={() => {
                if (['delivered', 'cancelled'].includes(order.status.toLowerCase())) {
                  toast({
                    title: "Cannot Cancel Order",
                    description: `Orders that are already ${order.status} cannot be cancelled.`,
                    variant: "destructive",
                  });
                  return;
                }
                
                // Open a confirmation dialog
                if (confirm(`Are you sure you want to cancel order #${order.id}? This action cannot be undone.`)) {
                  // Call API to cancel order
                  fetch(`/api/orders/${order.id}/cancel`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  })
                  .then(response => {
                    if (response.ok) {
                      toast({
                        title: "Order Cancelled",
                        description: "Your order has been cancelled successfully. Refund will be processed within 5-7 business days.",
                        variant: "default",
                      });
                      
                      // Update local state to show cancelled status
                      setOrder({
                        ...order,
                        status: 'cancelled'
                      });
                    } else {
                      throw new Error("Failed to cancel order");
                    }
                  })
                  .catch(error => {
                    console.error("Error cancelling order:", error);
                    toast({
                      title: "Failed to Cancel Order",
                      description: "There was an error cancelling your order. Please try again or contact customer support.",
                      variant: "destructive",
                    });
                  });
                }
              }}
            >
              <X className="h-4 w-4" /> Cancel Order
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={!['delivered'].includes(order.status.toLowerCase())}
              onClick={() => {
                if (!['delivered'].includes(order.status.toLowerCase())) {
                  toast({
                    title: "Return Not Available",
                    description: "You can only return or exchange items from delivered orders.",
                    variant: "destructive",
                  });
                  return;
                }
                
                // Calculate if within return window (10 days from delivery)
                const deliveryDate = new Date(order.date);
                deliveryDate.setDate(deliveryDate.getDate() + 7); // Assuming delivery 7 days after order
                const returnWindowEnd = new Date(deliveryDate);
                returnWindowEnd.setDate(returnWindowEnd.getDate() + 10);
                
                const now = new Date();
                if (now > returnWindowEnd) {
                  toast({
                    title: "Return Period Expired",
                    description: "The 10-day return period for this order has expired. Please contact customer support for assistance.",
                    variant: "destructive",
                  });
                  return;
                }
                
                // Show a return dialog - in real app this would open a modal with product selection
                toast({
                  title: "Initiate Return/Exchange",
                  description: "To process your return or exchange, please select the items you wish to return and the reason for return. A customer service representative will contact you shortly.",
                  variant: "default",
                  duration: 5000,
                });
                
                // Navigate to returns page (would be implemented in a real app)
                setTimeout(() => {
                  navigate(`/returns/new?orderId=${order.id}`);
                }, 2000);
              }}
            >
              <RefreshCw className="h-4 w-4" /> Return or Exchange
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                // Show contact options
                toast({
                  title: "Contact Customer Support",
                  description: "Our customer support team is available 24/7. Select your preferred contact method.",
                  variant: "default",
                  duration: 5000,
                });
                
                // Create a popup with contact methods
                const supportOptions = `
                  <div class="support-options">
                    <h3>Contact Us</h3>
                    <p><strong>Email:</strong> support@lelekart.com</p>
                    <p><strong>Phone:</strong> 1800-202-9898 (Toll Free)</p>
                    <p><strong>Hours:</strong> 24x7 Available</p>
                    <p>Please have your Order ID (#${order.id}) ready when contacting support</p>
                  </div>
                `;
                
                const supportWindow = window.open('', 'Contact Support', 'width=400,height=300');
                if (supportWindow) {
                  supportWindow.document.write(`
                    <html>
                      <head>
                        <title>Contact Support</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 20px; }
                          .support-options { max-width: 400px; margin: 0 auto; }
                          h3 { color: #2563eb; }
                          p { margin: 10px 0; }
                        </style>
                      </head>
                      <body>
                        ${supportOptions}
                      </body>
                    </html>
                  `);
                } else {
                  // Fallback if popup blocked
                  alert("Contact customer support at: support@lelekart.com or call 1800-202-9898 (Toll Free)");
                }
              }}
            >
              <MessageSquare className="h-4 w-4" /> Contact Support
            </Button>
          </div>
        </div>

        {/* Hidden Invoice Template for Printing */}
        <div className="hidden">
          <div ref={invoiceRef} className="invoice-container">
            <div className="invoice-header">
              <div className="logo">
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Lelekart</div>
                <div>Online Marketplace</div>
              </div>
              <div className="company-details">
                <div>Lelekart Internet Private Limited</div>
                <div>123 Commerce Street, Bangalore</div>
                <div>Karnataka, India 560001</div>
                <div>GST: 29AABCT1332L1ZT</div>
              </div>
            </div>
            
            <div className="invoice-title">TAX INVOICE</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="customer-details">
                <div className="section-title">Bill To:</div>
                {order.shippingDetails && typeof order.shippingDetails === 'object' && (
                  <>
                    <div>{order.shippingDetails.name}</div>
                    <div>{order.shippingDetails.address}</div>
                    <div>{order.shippingDetails.city}, {order.shippingDetails.state}</div>
                    <div>{order.shippingDetails.zipCode}</div>
                    <div>Phone: {order.shippingDetails.phone}</div>
                    <div>Email: {order.shippingDetails.email}</div>
                  </>
                )}
              </div>
              
              <div className="order-details">
                <div className="section-title">Invoice Details:</div>
                <div><strong>Invoice Number:</strong> INV-{order.id}</div>
                <div><strong>Order Number:</strong> ORD-{order.id}</div>
                <div><strong>Date:</strong> {format(new Date(order.date), 'dd/MM/yyyy')}</div>
                <div><strong>Payment Method:</strong> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>Item Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product.name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price.toFixed(2)}</td>
                      <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="total-section">
              <div><strong>Subtotal:</strong> ₹{order.total.toFixed(2)}</div>
              <div><strong>Shipping:</strong> ₹0.00</div>
              <div><strong>Tax:</strong> Included</div>
              <div style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                <strong>Grand Total:</strong> ₹{order.total.toFixed(2)}
              </div>
            </div>
            
            <div className="footer">
              <p>Thank you for shopping with Lelekart!</p>
              <p>For any questions, please contact our customer service at support@lelekart.com</p>
              <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
}