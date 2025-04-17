import { useState, useEffect, useRef } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download, Eye, FileText, Filter, MoreVertical, 
  Package, PackageCheck, Printer, Search, Truck, XCircle, ShoppingBag, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

// Define types for orders and order items
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl?: string;
  images?: string[];
  sellerId: number;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
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
}

type OrderWithItems = Order & { items: OrderItem[] };

export default function SellerOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const invoiceRef = useRef<HTMLDivElement>(null);
  const shippingLabelRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch seller orders
  const { data: orders = [], isLoading, isError } = useQuery<OrderWithItems[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders');
      const data = await response.json();
      
      // Process each order to ensure shipping details are parsed
      return data.map((order: Order) => {
        if (typeof order.shippingDetails === 'string') {
          try {
            order.shippingDetails = JSON.parse(order.shippingDetails);
          } catch (e) {
            console.error("Error parsing shipping details", e);
          }
        }
        return order;
      });
    },
  });
  
  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
      setIsStatusDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter orders by search query and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === "" || 
      order.id.toString().includes(searchQuery) || 
      getCustomerName(order).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Get status counts for tabs
  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    
    orders.forEach(order => {
      if (counts.hasOwnProperty(order.status)) {
        // @ts-ignore
        counts[order.status]++;
      }
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  // Helper to get formatted date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
  };
  
  // Helper to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Package className="h-3 w-3" /> Processing
          </Badge>
        );
      case 'shipped':
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1">
            <Truck className="h-3 w-3" /> Shipped
          </Badge>
        );
      case 'delivered':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Delivered
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };
  
  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "cod":
        return "Cash on Delivery";
      case "card":
        return "Credit/Debit Card";
      case "upi":
        return "UPI";
      case "netbanking":
        return "Net Banking";
      default:
        return method;
    }
  };
  
  // Get customer name from shipping details
  const getCustomerName = (order: Order) => {
    if (!order.shippingDetails) return "Customer";
    
    const details = typeof order.shippingDetails === 'string' 
      ? JSON.parse(order.shippingDetails) 
      : order.shippingDetails;
    
    return details.name || "Customer";
  };
  
  // Open order details dialog
  const viewOrderDetails = async (orderId: number) => {
    try {
      const response = await apiRequest('GET', `/api/orders/${orderId}`);
      const orderData = await response.json();
      
      // Make sure shipping details are parsed
      if (typeof orderData.shippingDetails === 'string') {
        try {
          orderData.shippingDetails = JSON.parse(orderData.shippingDetails);
        } catch (e) {
          console.error("Error parsing shipping details", e);
        }
      }
      
      setSelectedOrder(orderData);
      setIsViewDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch order details. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Open status update dialog
  const openStatusUpdateDialog = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusDialogOpen(true);
  };
  
  // Update order status
  const handleStatusUpdate = () => {
    if (selectedOrder && newStatus) {
      updateStatusMutation.mutate({ 
        orderId: selectedOrder.id, 
        status: newStatus 
      });
    }
  };
  
  // Print invoice
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
          <title>Invoice #${selectedOrder?.id}</title>
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
  
  // Print shipping label
  const printShippingLabel = () => {
    if (!shippingLabelRef.current) return;
    
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
          <title>Shipping Label #${selectedOrder?.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .shipping-container { width: 100%; max-width: 800px; margin: 0 auto; }
            .meesho-header { background: #f43397; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
            .meesho-logo { font-size: 24px; font-weight: bold; letter-spacing: 1px; }
            .label-type { background: #333; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
            .order-box { border: 2px solid #000; margin: 0; padding: 0; }
            .order-header { display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #ddd; }
            .order-id { font-size: 18px; font-weight: bold; }
            .order-date { font-size: 14px; color: #666; }
            .shipping-info { display: flex; padding: 0; }
            .address-box { flex: 1; padding: 15px; }
            .address-box.to { border-right: 1px dashed #ccc; }
            .address-title { background: #f0f0f0; padding: 5px 10px; margin-bottom: 10px; font-weight: bold; border-left: 4px solid #f43397; }
            .address-content { font-size: 14px; line-height: 1.5; }
            .customer-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .barcode-section { text-align: center; padding: 15px; border-top: 1px solid #ddd; }
            .barcode-text { font-family: 'Courier New', monospace; font-size: 18px; letter-spacing: 2px; margin: 10px 0; font-weight: bold; }
            .product-details { padding: 15px; border-top: 1px solid #ddd; }
            .product-title { font-weight: bold; margin-bottom: 10px; }
            .product-table { width: 100%; border-collapse: collapse; font-size: 14px; }
            .product-table th { background: #f0f0f0; text-align: left; padding: 8px; }
            .product-table td { padding: 8px; border-bottom: 1px solid #eee; }
            .delivery-info { background: #f8f8f8; padding: 10px 15px; margin-top: 10px; border-top: 1px solid #ddd; font-size: 13px; }
            .cod-badge { display: inline-block; background: #ffeb3b; color: #000; padding: 2px 8px; border-radius: 3px; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #999; padding: 10px; border-top: 1px solid #eee; }
            @media print { @page { margin: 0; } body { margin: 0.5cm; } }
          </style>
        </head>
        <body>
          ${shippingLabelRef.current.innerHTML}
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
  
  // Download shipping label
  const downloadShippingLabel = () => {
    // Using browser print to PDF functionality
    printShippingLabel();
    
    toast({
      title: "Download Started",
      description: "Your shipping label is being prepared for download.",
    });
  };
  
  return (
    <SellerDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">Manage and track your customer orders</p>
          </div>
          <div className="w-full md:w-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by order ID or customer"
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
        
        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-white">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statusCounts.all}</div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statusCounts.pending}</div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statusCounts.processing}</div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Shipped</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statusCounts.shipped}</div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statusCounts.delivered}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        {/* Order Tabs */}
        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Orders ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="processing">Processing ({statusCounts.processing})</TabsTrigger>
            <TabsTrigger value="shipped">Shipped ({statusCounts.shipped})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({statusCounts.delivered})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({statusCounts.cancelled})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <OrderTable 
              orders={filteredOrders}
              isLoading={isLoading}
              viewOrderDetails={viewOrderDetails}
              openStatusUpdateDialog={openStatusUpdateDialog}
              getStatusBadge={getStatusBadge}
              formatDate={formatDate}
              formatPaymentMethod={formatPaymentMethod}
              getCustomerName={getCustomerName}
            />
          </TabsContent>
          
          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <TabsContent key={status} value={status}>
              <OrderTable 
                orders={filteredOrders}
                isLoading={isLoading}
                viewOrderDetails={viewOrderDetails}
                openStatusUpdateDialog={openStatusUpdateDialog}
                getStatusBadge={getStatusBadge}
                formatDate={formatDate}
                formatPaymentMethod={formatPaymentMethod}
                getCustomerName={getCustomerName}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Placed on {formatDate(selectedOrder.date)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6">
              {/* Order Status and Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Update Status button removed - only admins can update order status */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={downloadInvoice}
                  >
                    <FileText className="h-4 w-4" />
                    Download Invoice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={downloadShippingLabel}
                  >
                    <Printer className="h-4 w-4" />
                    Shipping Label
                  </Button>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeof selectedOrder.shippingDetails === 'object' && (
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedOrder.shippingDetails.name}</p>
                        <p><span className="font-medium">Email:</span> {selectedOrder.shippingDetails.email}</p>
                        <p><span className="font-medium">Phone:</span> {selectedOrder.shippingDetails.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Shipping Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeof selectedOrder.shippingDetails === 'object' && (
                      <div className="space-y-2">
                        <p><span className="font-medium">Address:</span> {selectedOrder.shippingDetails.address}</p>
                        <p>
                          <span className="font-medium">City/State/Zip:</span> {selectedOrder.shippingDetails.city}, {selectedOrder.shippingDetails.state}, {selectedOrder.shippingDetails.zipCode}
                        </p>
                        {selectedOrder.shippingDetails.notes && (
                          <p><span className="font-medium">Notes:</span> {selectedOrder.shippingDetails.notes}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Items */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                        <TableCell className="text-right font-bold">₹{selectedOrder.total.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {/* Payment Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><span className="font-medium">Payment Method:</span> {formatPaymentMethod(selectedOrder.paymentMethod)}</p>
                    <p><span className="font-medium">Payment Status:</span> {selectedOrder.status === 'delivered' ? 'Paid' : 'Pending'}</p>
                  </div>
                </CardContent>
              </Card>
              
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
                      {typeof selectedOrder.shippingDetails === 'object' && (
                        <>
                          <div>{selectedOrder.shippingDetails.name}</div>
                          <div>{selectedOrder.shippingDetails.address}</div>
                          <div>{selectedOrder.shippingDetails.city}, {selectedOrder.shippingDetails.state}</div>
                          <div>{selectedOrder.shippingDetails.zipCode}</div>
                          <div>Phone: {selectedOrder.shippingDetails.phone}</div>
                          <div>Email: {selectedOrder.shippingDetails.email}</div>
                        </>
                      )}
                    </div>
                    
                    <div className="order-details">
                      <div className="section-title">Invoice Details:</div>
                      <div><strong>Invoice Number:</strong> INV-{selectedOrder.id}</div>
                      <div><strong>Order Number:</strong> ORD-{selectedOrder.id}</div>
                      <div><strong>Date:</strong> {format(new Date(selectedOrder.date), 'dd/MM/yyyy')}</div>
                      <div><strong>Payment Method:</strong> {formatPaymentMethod(selectedOrder.paymentMethod)}</div>
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
                        {selectedOrder.items?.map((item) => (
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
                    <div><strong>Subtotal:</strong> ₹{selectedOrder.total.toFixed(2)}</div>
                    <div><strong>Shipping:</strong> ₹0.00</div>
                    <div><strong>Tax:</strong> Included</div>
                    <div style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                      <strong>Grand Total:</strong> ₹{selectedOrder.total.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="footer">
                    <p>Thank you for shopping with Lelekart!</p>
                    <p>For any questions, please contact our customer service at support@lelekart.com</p>
                    <p>This is a computer-generated invoice and does not require a signature.</p>
                  </div>
                </div>
              </div>
              
              {/* Hidden Shipping Label Template for Printing */}
              <div className="hidden">
                <div ref={shippingLabelRef} className="shipping-container">
                  {/* Meesho-style Header */}
                  <div className="meesho-header">
                    <div className="meesho-logo">LELEKART</div>
                    <div className="label-type">SHIPPING LABEL</div>
                  </div>

                  {/* Order Box */}
                  <div className="order-box">
                    {/* Order Header */}
                    <div className="order-header">
                      <div className="order-id">Order ID: #{selectedOrder.id}</div>
                      <div className="order-date">
                        Date: {format(new Date(selectedOrder.date), 'dd/MM/yyyy')}
                        <span className="ml-3 cod-badge">
                          {selectedOrder.paymentMethod === 'cod' ? 'COD' : 'PREPAID'}
                        </span>
                      </div>
                    </div>

                    {/* Shipping Information */}
                    <div className="shipping-info">
                      {/* Delivery Address */}
                      <div className="address-box to">
                        <div className="address-title">DELIVER TO:</div>
                        <div className="address-content">
                          {typeof selectedOrder.shippingDetails === 'object' && (
                            <>
                              <div className="customer-name">{selectedOrder.shippingDetails.name}</div>
                              <div>{selectedOrder.shippingDetails.address}</div>
                              <div>{selectedOrder.shippingDetails.city}, {selectedOrder.shippingDetails.state} {selectedOrder.shippingDetails.zipCode}</div>
                              <div>Phone: {selectedOrder.shippingDetails.phone}</div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Sender Address */}
                      <div className="address-box from">
                        <div className="address-title">SHIP FROM:</div>
                        <div className="address-content">
                          <div className="customer-name">Lelekart Fulfillment Center</div>
                          <div>123 Commerce Street</div>
                          <div>Bengaluru, Karnataka 560001</div>
                          <div>India</div>
                        </div>
                      </div>
                    </div>

                    {/* Barcode Section */}
                    <div className="barcode-section">
                      <div className="barcode-text">
                        *LK{selectedOrder.id.toString().padStart(10, '0')}*
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="product-details">
                      <div className="product-title">PACKAGE CONTENTS:</div>
                      <table className="product-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th style={{width: '70px', textAlign: 'center'}}>Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items && selectedOrder.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.product.name}</td>
                              <td style={{textAlign: 'center'}}>{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Delivery Information */}
                    <div className="delivery-info">
                      <p><strong>Special Instructions:</strong> {typeof selectedOrder.shippingDetails === 'object' && selectedOrder.shippingDetails.notes || 'None'}</p>
                      <p>Please inspect your package before signing. Thank you for shopping with Lelekart!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Status Update Dialog */}
      {selectedOrder && (
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>
                Change the status for order #{selectedOrder.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="border rounded-md p-2"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending && (
                  <Truck className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </SellerDashboardLayout>
  );
}

// Order Table Component
function OrderTable({ 
  orders, 
  isLoading, 
  viewOrderDetails,
  openStatusUpdateDialog,
  getStatusBadge, 
  formatDate,
  formatPaymentMethod,
  getCustomerName
}: {
  orders: OrderWithItems[];
  isLoading: boolean;
  viewOrderDetails: (orderId: number) => void;
  openStatusUpdateDialog: (order: OrderWithItems) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  formatPaymentMethod: (method: string) => string;
  getCustomerName: (order: Order) => string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-background rounded-lg shadow-sm p-8 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
        <p className="text-muted-foreground mb-4">
          There are no orders matching your filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.id}</TableCell>
              <TableCell>{formatDate(order.date)}</TableCell>
              <TableCell>{getCustomerName(order)}</TableCell>
              <TableCell>₹{order.total.toFixed(2)}</TableCell>
              <TableCell>{formatPaymentMethod(order.paymentMethod)}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => viewOrderDetails(order.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openStatusUpdateDialog(order as OrderWithItems)}>
                      <Package className="h-4 w-4 mr-2" />
                      Update Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => viewOrderDetails(order.id)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewOrderDetails(order.id)}>
                      <Printer className="h-4 w-4 mr-2" />
                      Shipping Label
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}