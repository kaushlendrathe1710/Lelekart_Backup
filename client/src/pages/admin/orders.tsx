import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Order } from "@shared/schema";
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Loader2,
  PackageCheck,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  Truck,
  AlertCircle,
  XCircle,
} from "lucide-react";

// Define GST details type
interface GstDetails {
  gstRate: number;
  basePrice: number;
  gstAmount: number;
}

// Define Product type with GST details
interface AdminProduct {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  sellerId: number;
  approved: boolean;
  createdAt: string;
  imageUrl?: string;
  image_url?: string;
  images?: string;
  specifications?: string;
  gstDetails?: GstDetails;
}

// Define type for order items with product info
type OrderItemWithProduct = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: AdminProduct;
  variant?: string;
  variantId?: number;
};

// Define shipping details type
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

// Define type for order with items
type OrderWithItems = Order & {
  items?: OrderItemWithProduct[];
  shippingDetails: string | ShippingDetails;
  shippingCharges?: number;
  discount?: number;
};

// Add a type guard for AdminShippingDetails
interface AdminShippingDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
}

function isAdminShippingDetails(details: any): details is AdminShippingDetails {
  return details && typeof details === 'object' && 'name' in details && 'address' in details;
}

export default function AdminOrders() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<OrderWithItems | null>(null);
  const [dateFilter, setDateFilter] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });
  const invoiceRef = useRef<HTMLDivElement>(null);
  const shippingLabelRef = useRef<HTMLDivElement>(null);

  // Fetch orders data
  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number;
      status: string;
    }) => {
      const res = await apiRequest("PUT", `/api/orders/${orderId}/status`, {
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch order details when viewing an order
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const orderData = await res.json();
      setViewOrder(orderData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    await updateStatusMutation.mutateAsync({ orderId, status: newStatus });
    
    // If we're viewing the order details, update the local state too
    if (viewOrder && viewOrder.id === orderId) {
      setViewOrder({ ...viewOrder, status: newStatus });
    }
  };

  // Filter orders
  const filteredOrders = orders
    ?.filter((order) => {
      // Status filter
      const matchesStatus = !statusFilter ? true : order.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter.start) {
        const startDate = new Date(dateFilter.start);
        const orderDate = new Date(order.date);
        matchesDate = orderDate >= startDate;
      }
      if (dateFilter.end && matchesDate) {
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999); // End of the day
        const orderDate = new Date(order.date);
        matchesDate = orderDate <= endDate;
      }

      // Search filter (search by order ID)
      const matchesSearch = !search
        ? true
        : order.id.toString().includes(search);

      return matchesStatus && matchesDate && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by newest first
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Order counts by status
  const orderCounts = orders?.reduce(
    (acc, order) => {
      acc.total += 1;
      const status = order.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number>
  ) || { total: 0 };

  // Calculate today's orders
  const todayOrders = orders?.filter((order) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(order.date);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  }).length || 0;

  // Get status badge based on order status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <RefreshCw className="h-3 w-3 mr-1" /> Processing
          </Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Truck className="h-3 w-3 mr-1" /> Shipped
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Delivered
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
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
  
  // Print invoice
  const printInvoice = () => {
    if (!invoiceRef.current || !viewOrder) return;
    
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
          <title>Invoice #${viewOrder.id}</title>
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
  const downloadInvoice = async () => {
    if (!viewOrder) return;
    
    try {
      toast({
        title: "Preparing Invoice",
        description: "Your invoice is being generated...",
      });

      // Create a blob from the fetch response and open it in a new window
      const response = await fetch(`/api/orders/${viewOrder.id}/invoice`, {
        method: 'GET',
        credentials: 'include', // Important: Include credentials for authentication
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Get the PDF blob and create an object URL
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      toast({
        title: "Invoice Generated",
        description: "Your invoice has been opened in a new tab. You can save it from there.",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Download tax invoice as PDF
  const downloadTaxInvoice = async () => {
    if (!viewOrder) return;
    
    try {
      toast({
        title: "Preparing Tax Invoice",
        description: "Your tax invoice is being generated...",
      });

      // Create a blob from the fetch response and open it in a new window
      const response = await fetch(`/api/orders/${viewOrder.id}/tax-invoice`, {
        method: 'GET',
        credentials: 'include', // Important: Include credentials for authentication
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Get the PDF blob and create an object URL
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      toast({
        title: "Tax Invoice Generated",
        description: "Your tax invoice has been opened in a new tab. You can save it from there.",
      });
    } catch (error) {
      console.error("Error downloading tax invoice:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the tax invoice. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Print shipping label
  const printShippingLabel = () => {
    if (!shippingLabelRef.current || !viewOrder) return;
    
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
          <title>Shipping Label #${viewOrder.id}</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #fff; }
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
  
  // Download shipping label as PDF
  const downloadShippingLabel = () => {
    if (!viewOrder) return;
    
    try {
      // Open the PDF in a new tab
      window.open(`/api/orders/${viewOrder.id}/shipping-label?format=pdf`, '_blank');
      
      toast({
        title: "Shipping Label Generated",
        description: "Your shipping label has been opened in a new tab. You can save it from there.",
      });
    } catch (error) {
      console.error("Error downloading shipping label:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the shipping label. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            Manage and track all customer orders
          </p>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      <Skeleton className="h-4 w-24" />
                    </CardTitle>
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
                  <div className="text-2xl font-bold">{orderCounts.total}</div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orderCounts.pending || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orderCounts.delivered || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayOrders}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Orders Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by order ID..."
                className="pl-8 pr-24 w-full"
                disabled
                onClick={() => alert('Search functionality is being improved. Please check back later!')}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                Coming soon
              </span>
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {(statusFilter || dateFilter.start || dateFilter.end) && (
                    <Badge variant="secondary" className="ml-2 px-1">
                      {(statusFilter ? 1 : 0) +
                        (dateFilter.start || dateFilter.end ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Filter Orders</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-2">
                  <div className="mb-2 font-medium text-sm">Order Status</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={statusFilter === null ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(null)}
                    >
                      All
                    </Button>
                    <Button
                      variant={statusFilter === "pending" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("pending")}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={
                        statusFilter === "processing" ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setStatusFilter("processing")}
                    >
                      Processing
                    </Button>
                    <Button
                      variant={statusFilter === "shipped" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("shipped")}
                    >
                      Shipped
                    </Button>
                    <Button
                      variant={
                        statusFilter === "delivered" ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setStatusFilter("delivered")}
                    >
                      Delivered
                    </Button>
                    <Button
                      variant={
                        statusFilter === "cancelled" ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setStatusFilter("cancelled")}
                    >
                      Cancelled
                    </Button>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <div className="mb-2 font-medium text-sm">Date Range</div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={dateFilter.start || ""}
                          onChange={(e) =>
                            setDateFilter({
                              ...dateFilter,
                              start: e.target.value || null,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          End Date
                        </label>
                        <Input
                          type="date"
                          value={dateFilter.end || ""}
                          onChange={(e) =>
                            setDateFilter({
                              ...dateFilter,
                              end: e.target.value || null,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center cursor-pointer"
                  onClick={() => {
                    setStatusFilter(null);
                    setDateFilter({ start: null, end: null });
                    setSearch("");
                  }}
                >
                  Clear All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {isLoading ? (
            // Loading state
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredOrders?.length ? (
            // Orders table
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const isReturnStatusRow = [
                      "marked_for_return",
                      "approve_return",
                      "reject_return",
                      "process_return",
                      "completed_return"
                    ].includes(order.status);

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          {new Date(order.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>User #{order.userId}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>₹{order.total.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">
                          {formatPaymentMethod(order.paymentMethod)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => fetchOrderDetails(order.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              {isReturnStatusRow ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => updateOrderStatus(order.id, "approve_return")}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    Approve Return
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateOrderStatus(order.id, "reject_return")}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    Reject Return
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateOrderStatus(order.id, "process_return")}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    Process Return
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateOrderStatus(order.id, "completed_return")}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    Completed Return
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  {order.status !== "pending" && (
                                    <DropdownMenuItem
                                      onClick={() => updateOrderStatus(order.id, "pending")}
                                      disabled={updateStatusMutation.isPending}
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      Mark as Pending
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "processing" && (
                                    <DropdownMenuItem
                                      onClick={() => updateOrderStatus(order.id, "processing")}
                                      disabled={updateStatusMutation.isPending}
                                    >
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Mark as Processing
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "shipped" && (
                                    <DropdownMenuItem
                                      onClick={() => updateOrderStatus(order.id, "shipped")}
                                      disabled={updateStatusMutation.isPending}
                                    >
                                      <Truck className="mr-2 h-4 w-4" />
                                      Mark as Shipped
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "delivered" && (
                                    <DropdownMenuItem
                                      onClick={() => updateOrderStatus(order.id, "delivered")}
                                      disabled={updateStatusMutation.isPending}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Mark as Delivered
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "cancelled" && (
                                    <DropdownMenuItem
                                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                                      disabled={updateStatusMutation.isPending}
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancel Order
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Empty state
            <div className="rounded-md border bg-white p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <PackageCheck className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">No orders found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter || dateFilter.start || dateFilter.end
                  ? "Try adjusting your search or filters."
                  : "Orders will appear here once customers make purchases."}
              </p>
              {search || statusFilter || dateFilter.start || dateFilter.end ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter(null);
                    setDateFilter({ start: null, end: null });
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          )}

          {filteredOrders?.length ? (
            <div className="text-xs text-muted-foreground text-right">
              Showing {filteredOrders.length} of {orders?.length} orders
            </div>
          ) : null}
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog
        open={viewOrder !== null}
        onOpenChange={(open) => !open && setViewOrder(null)}
      >
        {viewOrder && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order #{viewOrder.id}</DialogTitle>
              <DialogDescription>
                Placed on {new Date(viewOrder.date).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="items">Order Items</TabsTrigger>
                <TabsTrigger value="shipping">Shipping Info</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Order ID:</span>
                        <span className="text-sm font-medium">#{viewOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Date:</span>
                        <span className="text-sm">
                          {new Date(viewOrder.date).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span>{getStatusBadge(viewOrder.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Customer:</span>
                        <span className="text-sm">User #{viewOrder.userId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Payment Method:</span>
                        <span className="text-sm capitalize">
                          {formatPaymentMethod(viewOrder.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Amount:</span>
                        <span>₹{viewOrder.total.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Update Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        Current status: <span className="font-medium">{viewOrder.status}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {viewOrder.status === "marked_for_return" ? (
                          <>
                            <Button
                              size="sm"
                              variant={viewOrder.status === "approve_return" ? "secondary" : "outline"}
                              onClick={() => updateOrderStatus(viewOrder.id, "approve_return")}
                              disabled={viewOrder.status === "approve_return" || updateStatusMutation.isPending}
                            >
                              Approve Return
                            </Button>
                            <Button
                              size="sm"
                              variant={viewOrder.status === "reject_return" ? "secondary" : "outline"}
                              onClick={() => updateOrderStatus(viewOrder.id, "reject_return")}
                              disabled={viewOrder.status === "reject_return" || updateStatusMutation.isPending}
                            >
                              Reject Return
                            </Button>
                            <Button
                              size="sm"
                              variant={viewOrder.status === "process_return" ? "secondary" : "outline"}
                              onClick={() => updateOrderStatus(viewOrder.id, "process_return")}
                              disabled={viewOrder.status === "process_return" || updateStatusMutation.isPending}
                            >
                              Process Return
                            </Button>
                            <Button
                              size="sm"
                              variant={viewOrder.status === "completed_return" ? "secondary" : "outline"}
                              onClick={() => updateOrderStatus(viewOrder.id, "completed_return")}
                              disabled={viewOrder.status === "completed_return" || updateStatusMutation.isPending}
                            >
                              Completed Return
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant={viewOrder.status === "pending" ? "secondary" : "outline"}
                              onClick={() => updateOrderStatus(viewOrder.id, "pending")}
                              disabled={viewOrder.status === "pending" || updateStatusMutation.isPending}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Pending
                            </Button>
                            <Button
                              size="sm"
                              variant={viewOrder.status === "processing" ? "secondary" : "outline"}
                              onClick={() => updateOrderStatus(viewOrder.id, "processing")}
                              disabled={viewOrder.status === "processing" || updateStatusMutation.isPending}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Processing
                            </Button>
                            <Button
                              size="sm"
                              variant={viewOrder.status === "shipped" ? "secondary" : "outline"}
                              onClick={() => updateOrderStatus(viewOrder.id, "shipped")}
                              disabled={viewOrder.status === "shipped" || updateStatusMutation.isPending}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Shipped
                            </Button>
                            <Button
                              size="sm"
                              variant={viewOrder.status === "delivered" ? "secondary" : "outline"}
                              onClick={() => updateOrderStatus(viewOrder.id, "delivered")}
                              disabled={viewOrder.status === "delivered" || updateStatusMutation.isPending}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Delivered
                            </Button>
                            <Button
                              size="sm"
                              variant={viewOrder.status === "cancelled" ? "secondary" : "outline"}
                              className={viewOrder.status === "cancelled" ? "" : "bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"}
                              onClick={() => updateOrderStatus(viewOrder.id, "cancelled")}
                              disabled={viewOrder.status === "cancelled" || updateStatusMutation.isPending}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelled
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="items" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Ordered Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {viewOrder.items && viewOrder.items.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewOrder.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded bg-gray-100 relative overflow-hidden">
                                    <img
                                      src={item.product.imageUrl}
                                      alt={item.product.name}
                                      className="object-cover h-full w-full"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://placehold.co/100?text=No+Image";
                                      }}
                                    />
                                  </div>
                                  <div className="font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-xs">
                                    {item.product.name}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>₹{item.price.toFixed(2)}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">
                              Total:
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              ₹{viewOrder.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p>No items found for this order</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="shipping" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {viewOrder.shippingDetails ? (
                      <div className="space-y-3">
                        {typeof viewOrder.shippingDetails === 'string' ? (
                          (() => {
                            const details = JSON.parse(viewOrder.shippingDetails);
                            return (
                              <>
                                <p><strong>Name:</strong> {details.name}</p>
                                <p><strong>Address:</strong> {details.address}</p>
                                <p><strong>City:</strong> {details.city}</p>
                                <p><strong>State:</strong> {details.state}</p>
                                <p><strong>Zip Code:</strong> {details.zipCode}</p>
                                <p><strong>Phone:</strong> {details.phone}</p>
                                <p><strong>Email:</strong> {details.email}</p>
                                {details.notes && <p><strong>Notes:</strong> {details.notes}</p>}
                              </>
                            );
                          })()
                        ) : (
                          <>
                            <p><strong>Name:</strong> {viewOrder.shippingDetails.name}</p>
                            <p><strong>Address:</strong> {viewOrder.shippingDetails.address}</p>
                            <p><strong>City:</strong> {viewOrder.shippingDetails.city}</p>
                            <p><strong>State:</strong> {viewOrder.shippingDetails.state}</p>
                            <p><strong>Zip Code:</strong> {viewOrder.shippingDetails.zipCode}</p>
                            <p><strong>Phone:</strong> {viewOrder.shippingDetails.phone}</p>
                            <p><strong>Email:</strong> {viewOrder.shippingDetails.email}</p>
                            {viewOrder.shippingDetails.notes && (
                              <p><strong>Notes:</strong> {viewOrder.shippingDetails.notes}</p>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p>No shipping details available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Invoice Document */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Invoice</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Generate and print a professional invoice for this order for your records.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={printInvoice} variant="outline" size="sm">
                          <Printer className="mr-2 h-4 w-4" />
                          Print Invoice
                        </Button>
                        <Button onClick={downloadInvoice} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download Invoice
                        </Button>
                        <Button onClick={downloadTaxInvoice} variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Tax Invoice
                        </Button>
                      </div>

                      {/* Hidden invoice template for printing */}
                      <div className="hidden">
                        <div ref={invoiceRef} className="invoice-container p-8">
                          <div className="invoice-header">
                            <div>
                              <h1 className="invoice-title mb-1">INVOICE</h1>
                              <p className="text-sm text-gray-600">#{viewOrder.id}</p>
                            </div>
                            <div className="company-details">
                              <h2 className="text-xl font-bold mb-1">Lelekart</h2>
                              <p className="text-sm">
                                123 Commerce Street<br />
                                Bengaluru, Karnataka 560001<br />
                                India<br />
                                hello@lelekart.com
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-8 my-8">
                            <div className="customer-details">
                              <h3 className="section-title">Bill To:</h3>
                              {viewOrder.shippingDetails ? (
                                <div className="text-sm">
                                  {typeof viewOrder.shippingDetails === 'string' ? (
                                    (() => {
                                      const details = JSON.parse(viewOrder.shippingDetails);
                                      return (
                                        <>
                                          <p className="font-medium">{details.name}</p>
                                          <p>{details.address}</p>
                                          <p>{details.city}, {details.state} {details.zipCode}</p>
                                          <p>Phone: {details.phone}</p>
                                          <p>Email: {details.email}</p>
                                        </>
                                      );
                                    })()
                                  ) : (
                                    <>
                                      <p className="font-medium">{viewOrder.shippingDetails.name}</p>
                                      <p>{viewOrder.shippingDetails.address}</p>
                                      <p>{viewOrder.shippingDetails.city}, {viewOrder.shippingDetails.state} {viewOrder.shippingDetails.zipCode}</p>
                                      <p>Phone: {viewOrder.shippingDetails.phone}</p>
                                      <p>Email: {viewOrder.shippingDetails.email}</p>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm">User #{viewOrder.userId}</p>
                              )}
                            </div>
                            <div className="order-details">
                              <h3 className="section-title">Invoice Details:</h3>
                              <table className="w-full text-sm">
                                <tbody>
                                  <tr>
                                    <td className="py-1 font-medium">Invoice Number:</td>
                                    <td className="py-1 text-right">INV-{viewOrder.id}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 font-medium">Order ID:</td>
                                    <td className="py-1 text-right">{viewOrder.id}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 font-medium">Invoice Date:</td>
                                    <td className="py-1 text-right">{new Date().toLocaleDateString()}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 font-medium">Order Date:</td>
                                    <td className="py-1 text-right">{new Date(viewOrder.date).toLocaleDateString()}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 font-medium">Payment Method:</td>
                                    <td className="py-1 text-right capitalize">{formatPaymentMethod(viewOrder.paymentMethod)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <h3 className="section-title mb-4">Order Items:</h3>
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="py-2 text-left">Item</th>
                                <th className="py-2 text-right">Base Price</th>
                                <th className="py-2 text-right">GST Rate</th>
                                <th className="py-2 text-right">GST Amount</th>
                                <th className="py-2 text-right">Unit Price</th>
                                <th className="py-2 text-right">Quantity</th>
                                <th className="py-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {viewOrder.items && viewOrder.items.map((item) => {
                                // Get GST details if available
                                const hasGstDetails = item.product.gstDetails;
                                const gstRate = hasGstDetails ? item.product.gstDetails.gstRate : 0;
                                const basePrice = hasGstDetails ? item.product.gstDetails.basePrice : item.price;
                                const gstAmount = hasGstDetails ? item.product.gstDetails.gstAmount : 0;
                                
                                return (
                                  <tr key={item.id} className="border-b">
                                    <td className="py-3">
                                      {item.product.name}
                                      {item.variant && <div className="text-xs text-gray-500">Variant: {item.variant}</div>}
                                    </td>
                                    <td className="py-3 text-right">₹{basePrice.toFixed(2)}</td>
                                    <td className="py-3 text-right">{gstRate}%</td>
                                    <td className="py-3 text-right">₹{gstAmount.toFixed(2)}</td>
                                    <td className="py-3 text-right">₹{item.price.toFixed(2)}</td>
                                    <td className="py-3 text-right">{item.quantity}</td>
                                    <td className="py-3 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          <div className="total-section mt-6">
                            <table className="w-1/2 ml-auto">
                              <tbody>
                                {/* Calculate tax breakdown */}
                                {(() => {
                                  let totalBasePrice = 0;
                                  let totalGstAmount = 0;
                                  
                                  viewOrder.items && viewOrder.items.forEach(item => {
                                    const quantity = item.quantity || 1;
                                    const hasGstDetails = item.product.gstDetails;
                                    
                                    if (hasGstDetails) {
                                      totalBasePrice += (item.product.gstDetails.basePrice * quantity);
                                      totalGstAmount += (item.product.gstDetails.gstAmount * quantity);
                                    } else {
                                      // Fallback if no GST details available
                                      totalBasePrice += (item.price * quantity);
                                    }
                                  });
                                  
                                  return (
                                    <>
                                      <tr>
                                        <td className="py-1 font-medium">Total Base Price:</td>
                                        <td className="py-1 text-right">₹{totalBasePrice.toFixed(2)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 font-medium">Total GST Amount:</td>
                                        <td className="py-1 text-right">₹{totalGstAmount.toFixed(2)}</td>
                                      </tr>
                                    </>
                                  );
                                })()}
                                
                                {/* Shipping charges */}
                                <tr>
                                  <td className="py-1 font-medium">Shipping Charges:</td>
                                  <td className="py-1 text-right">
                                    ₹{(viewOrder.shippingCharges || 0).toFixed(2)}
                                  </td>
                                </tr>
                                
                                {/* Discount if applicable */}
                                {viewOrder.discount > 0 && (
                                  <tr>
                                    <td className="py-1 font-medium">Discount:</td>
                                    <td className="py-1 text-right text-green-600">
                                      -₹{viewOrder.discount.toFixed(2)}
                                    </td>
                                  </tr>
                                )}
                                
                                {/* Grand total with border */}
                                <tr className="border-t">
                                  <td className="py-2 font-bold">Grand Total:</td>
                                  <td className="py-2 text-right font-bold">₹{viewOrder.total.toFixed(2)}</td>
                                </tr>
                                
                                {/* Additional info */}
                                <tr>
                                  <td colSpan={2} className="pt-2 text-xs text-gray-500 text-right">
                                    All prices are inclusive of applicable taxes
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="footer mt-8 pt-4 border-t text-center text-gray-500">
                            <p>Thank you for shopping with Lelekart!</p>
                            <p>For questions or concerns, please contact customer service at support@lelekart.com</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipping Label Document */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Shipping Label</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Generate and print a shipping label for this order for packaging.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={printShippingLabel} variant="outline" size="sm">
                          <Printer className="mr-2 h-4 w-4" />
                          Print Shipping Label
                        </Button>
                        <Button onClick={downloadShippingLabel} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>

                      {/* Hidden shipping label template for printing */}
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
                              <div className="order-id">Order ID: #{viewOrder.id}</div>
                              <div className="order-date">
                                Date: {new Date().toLocaleDateString()}
                                <span className="ml-3 cod-badge">
                                  {viewOrder.paymentMethod === 'cod' ? 'COD' : 'PREPAID'}
                                </span>
                              </div>
                            </div>

                            {/* Shipping Information */}
                            <div className="shipping-info">
                              {/* Delivery Address */}
                              <div className="address-box to">
                                <div className="address-title">DELIVER TO:</div>
                                <div className="address-content">
                                  {viewOrder.shippingDetails ? (
                                    <>
                                      {typeof viewOrder.shippingDetails === 'string' ? (
                                        (() => {
                                          const details = JSON.parse(viewOrder.shippingDetails);
                                          return (
                                            <>
                                              <div className="customer-name">{details.name}</div>
                                              <div>{details.address}</div>
                                              <div>{details.city}, {details.state} {details.zipCode}</div>
                                              <div>Phone: {details.phone}</div>
                                            </>
                                          );
                                        })()
                                      ) : (
                                        <>
                                          <div className="customer-name">{viewOrder.shippingDetails.name}</div>
                                          <div>{viewOrder.shippingDetails.address}</div>
                                          <div>{viewOrder.shippingDetails.city}, {viewOrder.shippingDetails.state} {viewOrder.shippingDetails.zipCode}</div>
                                          <div>Phone: {viewOrder.shippingDetails.phone}</div>
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    <div className="customer-name">User #{viewOrder.userId}</div>
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
                                *LK{viewOrder.id.toString().padStart(10, '0')}*
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
                                  {viewOrder.items && viewOrder.items.map((item) => (
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
                              <div>Shipped via: Express Delivery | Expected: 3-5 business days</div>
                              <div style={{marginTop: '5px', fontWeight: 'bold'}}>HANDLE WITH CARE</div>
                            </div>

                            {/* Footer */}
                            <div className="footer">
                              Thank you for shopping with Lelekart | Questions? Contact help@lelekart.com
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setViewOrder(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AdminLayout>
  );
}