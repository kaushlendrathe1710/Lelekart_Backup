import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Phone, 
  Mail, 
  ExternalLink, 
  FileText, 
  Download, 
  MapPin, 
  User, 
  Calendar, 
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ShoppingBag,
  Package
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface GstDetails {
  gstRate: number;
  basePrice: number;
  gstAmount: number;
}

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
  seller?: {
    id: number;
    name: string;
    username: string;
  };
  approved: boolean;
  createdAt: string;
  specifications?: string;
  purchasePrice?: number;
  color?: string;
  size?: string;
  stock?: number;
  gstDetails?: GstDetails;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
  variant?: string;
  variantId?: number;
}

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

interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  date: string;
  shippingDetails: string | ShippingDetails;
  paymentMethod: string;
  items?: OrderItem[];
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  trackingId?: string;
  sellerId?: number;
  courierName?: string;
  trackingUrl?: string;
  shippingCharges?: number;
  discount?: number;
}

function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case 'processing':
      return "bg-blue-100 text-blue-800 border-blue-200";
    case 'shipped':
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case 'delivered':
      return "bg-green-100 text-green-800 border-green-200";
    case 'cancelled':
      return "bg-red-100 text-red-800 border-red-200";
    case 'refunded':
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'pending':
      return <Clock className="h-4 w-4 mr-1" />;
    case 'processing':
      return <ArrowRight className="h-4 w-4 mr-1" />;
    case 'shipped':
      return <Truck className="h-4 w-4 mr-1" />;
    case 'delivered':
      return <CheckCircle2 className="h-4 w-4 mr-1" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 mr-1" />;
    case 'refunded':
      return <CreditCard className="h-4 w-4 mr-1" />;
    default:
      return <Package className="h-4 w-4 mr-1" />;
  }
}

function getExpectedDeliveryDate(orderDate: string) {
  const date = new Date(orderDate);
  date.setDate(date.getDate() + 7); // adding 7 days delivery time
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getProductImageUrl(product: Product): string {
  // First try product.imageUrl
  if (product.imageUrl) {
    return product.imageUrl;
  }
  
  // Then try product.image_url
  if (product.image_url) {
    return product.image_url;
  }
  
  // Finally try to get first image from product.images JSON
  if (product.images) {
    try {
      const imagesArray = JSON.parse(product.images);
      if (Array.isArray(imagesArray) && imagesArray.length > 0) {
        return imagesArray[0];
      }
    } catch {
      // If JSON parsing fails, try using it directly
      return product.images;
    }
  }
  
  // Return a default image if nothing found
  return "https://placehold.co/100x100?text=No+Image";
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const orderId = id ? parseInt(id) : 0;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [invoiceLoading, setInvoiceLoading] = useState<boolean>(false);
  const [shippingLabelLoading, setShippingLabelLoading] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const orderData = await response.json();
      setOrder(orderData);
      
      // Fetch order items
      if (orderData) {
        const itemsResponse = await fetch(`/api/orders/${orderId}/items`);
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setItems(itemsData);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshOrderData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to refresh order details');
      }
      
      const orderData = await response.json();
      setOrder(orderData);
      
      toast({
        title: "Success",
        description: "Order details refreshed successfully.",
      });
    } catch (error) {
      console.error('Error refreshing order details:', error);
      toast({
        title: "Error",
        description: "Failed to refresh order details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setInvoiceLoading(true);
      
      // Use fetch with credentials to maintain session
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Invoice downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Error",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleDownloadShippingLabel = async () => {
    try {
      setShippingLabelLoading(true);
      
      // Use fetch with credentials to maintain session
      const response = await fetch(`/api/orders/${orderId}/shipping-label`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download shipping label');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `shipping-label-order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Shipping label downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading shipping label:', error);
      toast({
        title: "Error",
        description: "Failed to download shipping label. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShippingLabelLoading(false);
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
    
    if (!order) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <p className="text-muted-foreground mt-2">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate("/")} className="mt-4">Return to Home</Button>
        </div>
      );
    }
    
    // Parse shipping details
    let shippingDetails: ShippingDetails;
    if (typeof order.shippingDetails === 'string') {
      try {
        shippingDetails = JSON.parse(order.shippingDetails);
      } catch (error) {
        shippingDetails = {
          name: 'Unknown',
          email: 'Unknown',
          phone: 'Unknown',
          address: 'Unknown',
          city: 'Unknown',
          state: 'Unknown',
          zipCode: 'Unknown'
        };
      }
    } else {
      shippingDetails = order.shippingDetails;
    }
    
    // Use a single div to wrap all components to avoid adjacent JSX elements
    return (
      <div className="order-details-container">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Order #{order.id}</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-1" 
              onClick={handleDownloadInvoice}
              disabled={invoiceLoading}
            >
              {invoiceLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <FileText className="h-4 w-4" />}
              Download Invoice
            </Button>
            
            {user?.role === 'seller' || user?.role === 'admin' || user?.role === 'co-admin' ? (
              <Button 
                variant="outline" 
                className="flex items-center gap-1" 
                onClick={handleDownloadShippingLabel}
                disabled={shippingLabelLoading}
              >
                {shippingLabelLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Download className="h-4 w-4" />}
                Shipping Label
              </Button>
            ) : null}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2 text-muted-foreground" />
              Order Status
            </h2>
            <div>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                <StatusIcon status={order.status} />
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Ordered on {formatDate(order.date)}</p>
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <p className="text-sm text-muted-foreground">
                  Expected delivery by {getExpectedDeliveryDate(order.date)}
                </p>
              )}
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
              Payment Information
            </h2>
            <div>
              <p>
                <span className="font-medium">Method: </span>
                <span>{order.paymentMethod}</span>
              </p>
              <p className="mt-1">
                <span className="font-medium">Status: </span>
                <span className="text-green-600 font-medium">Paid</span>
              </p>
              <div className="mt-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{(order.total - (order.shippingCharges || 0) + (order.discount || 0)).toFixed(2)}</span>
                </div>
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>₹{(order.shippingCharges || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
          
          {order.trackingId && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-muted-foreground" />
                Tracking Information
              </h2>
              <div>
                <p>
                  <span className="font-medium">Courier: </span>
                  <span>{order.courierName || 'Not specified'}</span>
                </p>
                <p className="mt-1">
                  <span className="font-medium">Tracking ID: </span>
                  <span>{order.trackingId}</span>
                </p>
                {order.trackingUrl && (
                  <div className="mt-3">
                    <Button variant="outline" size="sm" asChild>
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                        Track Package
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
        
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative w-20 h-20 rounded bg-gray-100 flex-shrink-0">
                    <img 
                      src={getProductImageUrl(item.product)} 
                      alt={item.product.name}
                      className="absolute inset-0 w-full h-full object-cover rounded"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image"; 
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.product.name}</h3>
                    {item.product.seller && (
                      <p className="text-sm text-gray-500">
                        Sold by: {item.product.seller.name}
                      </p>
                    )}
                    {item.variant && (
                      <p className="text-sm text-gray-500">
                        Variant: {item.variant}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Unit Price:</span> ₹{item.price.toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Quantity:</span> {item.quantity}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Total:</span> ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Shiprocket integration is currently disabled */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
              Shipping Information
            </h2>
            <div>
              <p className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                {shippingDetails.name}
              </p>
              <p className="flex items-center mt-1">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {shippingDetails.email}
              </p>
              <p className="flex items-center mt-1">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                {shippingDetails.phone}
              </p>
              <Separator className="my-3" />
              <p className="text-muted-foreground">{shippingDetails.address}</p>
              <p className="text-muted-foreground">{shippingDetails.city}, {shippingDetails.state} {shippingDetails.zipCode}</p>
              {shippingDetails.notes && (
                <div className="mt-3">
                  <p className="font-medium">Notes:</p>
                  <p className="text-muted-foreground">{shippingDetails.notes}</p>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
              Billing Information
            </h2>
            <div>
              <p className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                {shippingDetails.name}
              </p>
              <p className="flex items-center mt-1">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {shippingDetails.email}
              </p>
              <p className="flex items-center mt-1">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                {shippingDetails.phone}
              </p>
              <Separator className="my-3" />
              <p className="text-muted-foreground">{shippingDetails.address}</p>
              <p className="text-muted-foreground">{shippingDetails.city}, {shippingDetails.state} {shippingDetails.zipCode}</p>
            </div>
          </Card>
        </div>
        
        {/* Tax Invoice */}
        <div className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
              Tax Invoice Information
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => {
                    const gstDetails = item.product.gstDetails || { 
                      gstRate: 18, // Default GST rate
                      basePrice: item.price / 1.18, // Approximate base price
                      gstAmount: item.price - (item.price / 1.18) // Approximate GST amount
                    };
                    
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.product.name}
                          {item.variant && <span className="text-gray-500"> ({item.variant})</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{gstDetails.basePrice.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gstDetails.gstRate}% (₹{gstDetails.gstAmount.toFixed(2)})</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  {(() => {
                    // Calculate totals
                    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
                    const gstTotal = items.reduce((total, item) => {
                      const gstDetails = item.product.gstDetails || { 
                        gstAmount: item.price - (item.price / 1.18) 
                      };
                      return total + (gstDetails.gstAmount * item.quantity);
                    }, 0);
                    
                    return (
                      <>
                        <tr>
                          <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium">Subtotal:</td>
                          <td colSpan={2} className="px-6 py-3 text-left text-sm">₹{subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium">GST Total:</td>
                          <td colSpan={2} className="px-6 py-3 text-left text-sm">₹{gstTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium">Shipping:</td>
                          <td colSpan={2} className="px-6 py-3 text-left text-sm">₹{(order.shippingCharges || 0).toFixed(2)}</td>
                        </tr>
                        {order.discount && order.discount > 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-green-600">Discount:</td>
                            <td colSpan={2} className="px-6 py-3 text-left text-sm text-green-600">-₹{order.discount.toFixed(2)}</td>
                          </tr>
                        )}
                        <tr className="bg-gray-100">
                          <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold">Grand Total:</td>
                          <td colSpan={2} className="px-6 py-3 text-left text-sm font-bold">₹{order.total.toFixed(2)}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
            
            <div className="border-t mt-8 pt-6 text-sm text-gray-600">
              <h3 className="font-semibold mb-2">Terms & Conditions</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>All prices are inclusive of GST.</li>
                <li>Returns accepted within 7 days of delivery for most items.</li>
                <li>Damaged or defective products should be reported within 48 hours of receipt.</li>
              </ul>
              
              <div className="mt-6">
                <p>Thank you for shopping with Lelekart!</p>
                <p>For any questions, please contact our customer service at support@lelekart.com</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
              </div>
            </div>
          </Card>
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