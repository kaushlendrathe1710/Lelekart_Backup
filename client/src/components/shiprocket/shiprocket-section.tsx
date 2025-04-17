import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Truck, 
  Package, 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  PackageCheck 
} from "lucide-react";

interface ShiprocketSectionProps {
  order: any;
  refreshOrder: () => void;
}

export function ShiprocketSection({ order, refreshOrder }: ShiprocketSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [isFetchingCouriers, setIsFetchingCouriers] = useState(false);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [trackingUrl, setTrackingUrl] = useState("");

  // Check if order is already shipped with Shiprocket
  const isShipped = order.shiprocketShipmentId || 
    (order.shipmentStatus && order.shipmentStatus !== 'pending');

  // Push order to Shiprocket
  const shiprocketMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/${order.id}/shiprocket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courier: selectedCourier || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create shipment');
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Shipment Created',
        description: 'Order has been successfully pushed to Shiprocket for shipping.',
      });
      refreshOrder();
      setIsDialogOpen(false);
      // If tracking URL is provided, set it
      if (data.tracking_url) {
        setTrackingUrl(data.tracking_url);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Shipment Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch couriers from Shiprocket
  const fetchCouriers = async () => {
    setIsFetchingCouriers(true);
    try {
      const res = await fetch('/api/shiprocket/couriers');
      if (!res.ok) {
        throw new Error('Failed to fetch couriers');
      }
      const data = await res.json();
      setCouriers(data);
    } catch (error) {
      console.error('Error fetching couriers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch couriers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingCouriers(false);
    }
  };

  // Handle dialog open
  const handleDialogOpen = () => {
    // Fetch couriers if dialog is opened
    fetchCouriers();
    setIsDialogOpen(true);
  };

  // Format shipment status for display
  const formatShipmentStatus = (status: string) => {
    if (!status) return 'Not Shipped';
    
    // Convert to title case
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Get shipment status color
  const getStatusColor = (status: string) => {
    if (!status || status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'in_transit') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status === 'delivered') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'pickup_scheduled' || status === 'pickup_generated') 
      return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Open tracking URL in new tab
  const openTrackingUrl = () => {
    if (order.trackingUrl) {
      window.open(order.trackingUrl, '_blank');
    } else if (order.trackingId) {
      window.open(`https://shiprocket.in/tracking/${order.trackingId}`, '_blank');
    } else {
      toast({
        title: 'Tracking Not Available',
        description: 'Tracking information is not yet available for this order.',
        variant: 'destructive',
      });
    }
  };

  // If order is not eligible for shipping (e.g., cancelled, already delivered)
  if (order.status === 'cancelled' || order.status === 'delivered') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Information
        </CardTitle>
        <CardDescription>
          Manage shipping for this order through Shiprocket integration
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isShipped ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Shipment Created</span>
              </div>
              <Badge variant="outline" className={getStatusColor(order.shipmentStatus || '')}>
                {formatShipmentStatus(order.shipmentStatus || 'Processing')}
              </Badge>
            </div>

            {/* Shipment Details */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Shipment ID:</span>
                  <span className="font-medium">
                    {order.shiprocketShipmentId || 'Not available'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Courier:</span>
                  <span className="font-medium">
                    {order.courierName || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tracking ID:</span>
                  <span className="font-medium">
                    {order.trackingId || 'Not available'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center gap-3">
                {order.trackingId && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={openTrackingUrl}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Track Shipment
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={refreshOrder}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </div>

            {/* Shipping Timeline */}
            {order.shipmentStatus && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Shipping Progress</h3>
                <div className="relative">
                  <Progress 
                    value={order.shipmentStatus === 'delivered' ? 100 : 
                          order.shipmentStatus === 'in_transit' ? 50 : 
                          order.shipmentStatus === 'pickup_scheduled' ? 25 : 10} 
                    className="h-2"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Processing</span>
                    <span>Pickup</span>
                    <span>In Transit</span>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Shipment Pending</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              This order has not been shipped yet. Create a shipment through Shiprocket to arrange delivery.
            </p>
            
            <Button 
              onClick={handleDialogOpen}
              className="mt-2"
              disabled={shiprocketMutation.isPending}
            >
              {shiprocketMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Truck className="h-4 w-4 mr-2" />
              )}
              Create Shipment
            </Button>
          </div>
        )}
      </CardContent>

      {/* Create Shipment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shipment</DialogTitle>
            <DialogDescription>
              Push this order to Shiprocket for fulfillment and shipping
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="courier">Select Courier (Optional)</Label>
              {isFetchingCouriers ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading couriers...</span>
                </div>
              ) : (
                <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a courier (or let Shiprocket choose)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-select Best Courier</SelectItem>
                    {couriers.map((courier) => (
                      <SelectItem key={courier.id} value={courier.name}>
                        {courier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                If you don't select a courier, Shiprocket will automatically choose the best one based on your location and package details.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Order Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-medium">Order ID:</div>
                <div>#{order.id}</div>
                <div className="font-medium">Customer:</div>
                <div>{
                  typeof order.shippingDetails === 'string' 
                    ? JSON.parse(order.shippingDetails).name 
                    : order.shippingDetails?.name || 'N/A'
                }</div>
                <div className="font-medium">Items:</div>
                <div>{order.items?.length || 0} items</div>
                <div className="font-medium">Total:</div>
                <div>₹{order.total?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => shiprocketMutation.mutate()}
              disabled={shiprocketMutation.isPending}
            >
              {shiprocketMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              Create Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}