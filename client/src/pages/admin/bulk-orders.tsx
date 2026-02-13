import { useState, useEffect, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import * as bulkOrdersService from "@/services/bulk-orders";

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { color: string; icon: any }> = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
  };

  const { color, icon: Icon } = variants[status] || variants.pending;

  return (
    <Badge className={`${color} flex items-center gap-1 w-fit`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

// Memoized table component to prevent unnecessary re-renders
const BulkOrdersTable = memo(
  ({
    orders,
    onViewDetails,
    onDownloadInvoice,
    onStatusChange,
    onDelete,
  }: {
    orders: any[];
    onViewDetails: (id: number) => void;
    onDownloadInvoice: (id: number) => void;
    onStatusChange: (order: any) => void;
    onDelete: (order: any) => void;
  }) => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Distributor</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order: any) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono">#{order.id}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{order.distributorName}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.distributorEmail}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-semibold">
                ₹{parseFloat(order.totalAmount).toFixed(2)}
              </TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell>
                {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(order.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {order.status === "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadInvoice(order.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Invoice
                    </Button>
                  )}
                  {order.status === "pending" && (
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(order)}
                    >
                    Change Status
                  </Button>
                  )}
                  {order.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(order)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
);

BulkOrdersTable.displayName = "BulkOrdersTable";

export default function AdminBulkOrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  // Fetch bulk orders with pagination, search, and filters
  const { data: ordersData, isLoading } = useQuery({
    queryKey: [
      "admin-bulk-orders",
      currentPage,
      itemsPerPage,
      statusFilter,
      debouncedSearch,
    ],
    queryFn: async () => {
      let url = `/api/admin/bulk-orders?page=${currentPage}&limit=${itemsPerPage}`;
      if (statusFilter && statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch bulk orders");
      return response.json();
    },
  });

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || {
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: itemsPerPage,
  };

  // Fetch order stats
  const { data: stats } = useQuery({
    queryKey: ["bulk-order-stats"],
    queryFn: () => bulkOrdersService.getBulkOrderStats(),
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      bulkOrdersService.updateBulkOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bulk-orders"] });
      queryClient.invalidateQueries({ queryKey: ["bulk-order-stats"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      setIsStatusDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Delete bulk order mutation
  const deleteBulkOrderMutation = useMutation({
    mutationFn: (id: number) => bulkOrdersService.deleteBulkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bulk-orders"] });
      queryClient.invalidateQueries({ queryKey: ["bulk-order-stats"] });
      toast({
        title: "Success",
        description: "Bulk order deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to delete bulk order",
        variant: "destructive",
      });
    },
  });

  // Handle invoice download
  const handleDownloadInvoice = async (orderId: number) => {
    try {
      toast({
        title: "Downloading...",
        description: "Preparing invoice",
      });
      await bulkOrdersService.downloadBulkOrderInvoice(orderId);
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (orderId: number) => {
    try {
      const orderDetails =
        await bulkOrdersService.getAdminBulkOrderById(orderId);
      setSelectedOrder(orderDetails);
      setIsDetailsOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNotes(order.notes || "");
    setIsStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!newStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      id: selectedOrder.id,
      data: {
        status: newStatus as any,
        notes: statusNotes || undefined,
      },
    });
  };

  const handleDeleteOrder = (order: any) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      deleteBulkOrderMutation.mutate(orderToDelete.id);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            {stats.byStatus.map((stat: any) => (
              <Card key={stat.status}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                    {stat.status}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{parseFloat(stat.totalAmount || "0").toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6" />
                Bulk Orders
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                View and manage bulk orders from distributors
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, distributor name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchInput("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {debouncedSearch && (
                <p className="text-sm text-muted-foreground mt-2">
                  Found {pagination.total} order(s) matching "{debouncedSearch}"
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : orders && orders.length > 0 ? (
              <>
                <BulkOrdersTable
                  orders={orders}
                  onViewDetails={handleViewDetails}
                  onDownloadInvoice={handleDownloadInvoice}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteOrder}
                />

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, pagination.total)} of{" "}
                    {pagination.total} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(pagination.totalPages, p + 1),
                        )
                      }
                      disabled={
                        currentPage >= pagination.totalPages || isLoading
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {debouncedSearch ? (
                  <div className="space-y-2">
                    <p>No orders found matching "{debouncedSearch}"</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchInput("")}
                    >
                      Clear search
                    </Button>
                  </div>
                ) : (
                  "No bulk orders found"
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Bulk Order Details #{selectedOrder?.id}</DialogTitle>
              <DialogDescription>
                Order placed by {selectedOrder?.distributorName}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Total Amount
                    </Label>
                    <div className="mt-1 text-lg font-semibold">
                      ₹{parseFloat(selectedOrder.totalAmount).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Order Date</Label>
                    <div className="mt-1">
                      {format(
                        new Date(selectedOrder.createdAt),
                        "dd MMM yyyy, hh:mm a",
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Distributor</Label>
                    <div className="mt-1">{selectedOrder.distributorName}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedOrder.distributorEmail}
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-1 text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                <div>
                  <Label className="font-semibold mb-2 block">
                    Order Items
                  </Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.productImage && (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium">
                                  {item.productName}
                                </div>
                                {item.productSku && (
                                  <div className="text-xs text-muted-foreground">
                                    SKU: {item.productSku}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {item.orderType}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            ₹{parseFloat(item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{parseFloat(item.totalPrice).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bulk Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete bulk order #
                {orderToDelete?.id}?
                <br />
                <br />
                This action cannot be undone. This will permanently delete the
                order and all associated order items from the distributor{" "}
                <strong>{orderToDelete?.distributorName}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setOrderToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteOrder}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteBulkOrderMutation.isPending}
              >
                {deleteBulkOrderMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Update Status Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>
                Change the status of bulk order #{selectedOrder?.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or comments..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
