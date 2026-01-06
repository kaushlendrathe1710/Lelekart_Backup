import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Trash2,
  ShoppingCart,
  Package,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import * as bulkOrdersService from "@/services/bulk-orders";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface OrderItem {
  productId: number;
  orderType: "pieces" | "sets";
  quantity: number;
}

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

export default function DistributorBulkOrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch available bulk items
  const { data: bulkItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["available-bulk-items"],
    queryFn: () => bulkOrdersService.getAvailableBulkItems(),
  });

  // Fetch distributor's bulk orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["distributor-bulk-orders"],
    queryFn: () => bulkOrdersService.getDistributorBulkOrders(),
    enabled: activeTab === "history",
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: any) => bulkOrdersService.createBulkOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributor-bulk-orders"] });
      toast({
        title: "Success",
        description: "Bulk order submitted successfully",
      });
      setOrderItems([]);
      setNotes("");
      setActiveTab("history");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    setOrderItems([...orderItems, { productId: 0, orderType: "pieces", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const getItemTotal = (item: OrderItem) => {
    const bulkItem = bulkItems?.find((bi: any) => bi.productId === item.productId);
    if (!bulkItem) return 0;

    // Use sellingPrice if available, otherwise fall back to productPrice
    const price = parseFloat(bulkItem.sellingPrice || bulkItem.productPrice || "0");
    let actualQuantity = item.quantity;

    if (item.orderType === "sets" && bulkItem.piecesPerSet) {
      actualQuantity = item.quantity * bulkItem.piecesPerSet;
    }

    return actualQuantity * price;
  };

  const getGrandTotal = () => {
    return orderItems.reduce((sum, item) => sum + getItemTotal(item), 0);
  };

  const getAvailableOrderTypes = (productId: number) => {
    const bulkItem = bulkItems?.find((bi: any) => bi.productId === productId);
    if (!bulkItem) return [];

    const types = [];
    if (bulkItem.allowPieces) types.push("pieces");
    if (bulkItem.allowSets) types.push("sets");
    return types;
  };

  const handleSubmitOrder = () => {
    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the order",
        variant: "destructive",
      });
      return;
    }

    // Validate all items
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.productId || item.productId === 0) {
        toast({
          title: "Error",
          description: `Please select a product for item ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast({
          title: "Error",
          description: `Please enter a valid quantity for item ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
    }

    createOrderMutation.mutate({
      items: orderItems.map((item) => ({
        productId: item.productId,
        orderType: item.orderType,
        quantity: item.quantity,
      })),
      notes: notes || undefined,
    });
  };

  const handleViewOrderDetails = async (orderId: number) => {
    try {
      const orderDetails = await bulkOrdersService.getBulkOrderById(orderId);
      setSelectedOrderDetails(orderDetails);
      setIsDetailsOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Bulk Orders</h1>
          <p className="text-muted-foreground">
            Place bulk orders and track your order history
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "new" ? "default" : "outline"}
            onClick={() => setActiveTab("new")}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Order
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
          >
            <Package className="h-4 w-4 mr-2" />
            Order History
          </Button>
        </div>

        {activeTab === "new" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Create Bulk Order</span>
                    <Button onClick={addItem} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orderItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No items added yet. Click "Add Item" to start building your order.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderItems.map((item, index) => {
                        const selectedBulkItem = bulkItems?.find(
                          (bi: any) => bi.productId === item.productId
                        );
                        const availableTypes = getAvailableOrderTypes(item.productId);

                        return (
                          <Card key={index} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <span className="font-semibold">Item {index + 1}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>Product</Label>
                                <Select
                                  value={item.productId.toString()}
                                  onValueChange={(value) =>
                                    updateItem(index, "productId", parseInt(value))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {bulkItems?.map((bulkItem: any) => (
                                      <SelectItem
                                        key={bulkItem.productId}
                                        value={bulkItem.productId.toString()}
                                      >
                                        {bulkItem.productName} - ₹{bulkItem.sellingPrice || bulkItem.productPrice}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Order Type</Label>
                                <Select
                                  value={item.orderType}
                                  onValueChange={(value) =>
                                    updateItem(index, "orderType", value as "pieces" | "sets")
                                  }
                                  disabled={!item.productId || availableTypes.length === 0}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableTypes.includes("pieces") && (
                                      <SelectItem value="pieces">Pieces</SelectItem>
                                    )}
                                    {availableTypes.includes("sets") && (
                                      <SelectItem value="sets">
                                        Sets
                                        {selectedBulkItem?.piecesPerSet &&
                                          ` (${selectedBulkItem.piecesPerSet} pcs/set)`}
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(index, "quantity", parseInt(e.target.value) || 0)
                                  }
                                />
                              </div>
                            </div>

                            {item.productId > 0 && (
                              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Item Total:</span>
                                <span className="font-semibold text-lg">
                                  ₹{getItemTotal(item).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {orderItems.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any special instructions or notes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span className="font-medium">{orderItems.length}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-semibold">Grand Total:</span>
                      <span className="text-2xl font-bold">
                        ₹{getGrandTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmitOrder}
                    disabled={orderItems.length === 0 || createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? "Submitting..." : "Submit Order"}
                  </Button>

                  {orderItems.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Add items to enable order submission
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : orders && orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOrderDetails(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found. Create your first bulk order!
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Order Details #{selectedOrderDetails?.id}</DialogTitle>
            </DialogHeader>

            {selectedOrderDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedOrderDetails.status} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <div className="mt-1 text-lg font-semibold">
                      ₹{parseFloat(selectedOrderDetails.totalAmount).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Order Date</Label>
                    <div className="mt-1">
                      {format(
                        new Date(selectedOrderDetails.createdAt),
                        "dd MMM yyyy, hh:mm a"
                      )}
                    </div>
                  </div>
                </div>

                {selectedOrderDetails.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-1 text-sm">{selectedOrderDetails.notes}</p>
                  </div>
                )}

                <div>
                  <Label className="font-semibold mb-2 block">Order Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrderDetails.items?.map((item: any) => (
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
                              <span className="font-medium">{item.productName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{item.orderType}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
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
      </div>
    </DashboardLayout>
  );
}
