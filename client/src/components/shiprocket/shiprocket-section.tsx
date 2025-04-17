import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Truck, RefreshCw, X, ExternalLink, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ShiprocketSectionProps {
  order: any;
  refreshOrder: () => void;
}

export function ShiprocketSection({ order, refreshOrder }: ShiprocketSectionProps) {
  const [loading, setLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const { toast } = useToast();
  const cachedUser = queryClient.getQueryData<any>(['/api/user']);
  const isAdmin = cachedUser?.role === 'admin' || cachedUser?.role === 'co-admin';
  const isSeller = cachedUser?.role === 'seller';
  
  // Function to push order to Shiprocket
  const pushToShiprocket = async () => {
    if (!order) return;
    
    setLoading(true);
    try {
      const response = await apiRequest('POST', `/api/orders/${order.id}/shiprocket`);
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Order pushed to Shiprocket successfully",
        });
        refreshOrder();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to push order to Shiprocket",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error pushing order to Shiprocket:", error);
      toast({
        title: "Error",
        description: "An error occurred while pushing order to Shiprocket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to track Shiprocket order
  const trackOrder = async () => {
    if (!order || !order.trackingId) return;
    
    setTrackingLoading(true);
    try {
      const response = await apiRequest('GET', `/api/tracking/${order.trackingId}`);
      
      if (response.ok) {
        const result = await response.json();
        setTrackingInfo(result);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to track order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error tracking order:", error);
      toast({
        title: "Error",
        description: "An error occurred while tracking the order",
        variant: "destructive",
      });
    } finally {
      setTrackingLoading(false);
    }
  };
  
  // Function to cancel Shiprocket order
  const cancelOrder = async () => {
    if (!order) return;
    
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiRequest('POST', `/api/orders/${order.id}/shiprocket/cancel`, {
        reason: "Cancelled by user"
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Order cancelled successfully",
        });
        refreshOrder();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to cancel order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "An error occurred while cancelling the order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check if order is from an external seller
  const canUseShiprocket = order && order.sellerId !== undefined && order.sellerId > 0;
  
  // Check if order has already been pushed to Shiprocket
  const isPushedToShiprocket = Boolean(order.shiprocketOrderId);
  
  // Determine if user can push to Shiprocket
  const canPushToShiprocket = (isAdmin || isSeller) && 
                            canUseShiprocket && 
                            !isPushedToShiprocket && 
                            order.status.toLowerCase() !== 'cancelled';
                            
  // Determine if user can view tracking
  const canViewTracking = isPushedToShiprocket && order.trackingId;
  
  // Determine if user can cancel
  const canCancelOrder = (isAdmin || (isSeller && isSeller === order.sellerId)) && 
                       isPushedToShiprocket && 
                       order.status.toLowerCase() !== 'cancelled' && 
                       order.status.toLowerCase() !== 'delivered';

  return (
    <Card className="p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Truck className="h-5 w-5 mr-2 text-muted-foreground" />
        Shiprocket Shipping
      </h2>
      
      {!canUseShiprocket && (
        <div className="flex items-center p-4 bg-yellow-50 rounded-md mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
          <p className="text-sm text-yellow-700">
            This order is not eligible for Shiprocket shipping as it's not from an external seller.
          </p>
        </div>
      )}
      
      {isPushedToShiprocket ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Shiprocket Order ID</p>
              <p className="text-sm text-muted-foreground">{order.shiprocketOrderId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Shipment ID</p>
              <p className="text-sm text-muted-foreground">{order.shiprocketShipmentId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Tracking ID</p>
              <p className="text-sm text-muted-foreground">{order.trackingId || 'Not available yet'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Courier</p>
              <p className="text-sm text-muted-foreground">{order.courierName || 'Not assigned yet'}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {canViewTracking && order.trackingUrl && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => window.open(order.trackingUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Track Order
              </Button>
            )}
            
            {canViewTracking && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={trackOrder}
                disabled={trackingLoading}
              >
                {trackingLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Tracking
              </Button>
            )}
            
            {canCancelOrder && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={cancelOrder}
                disabled={loading}
              >
                <X className="h-4 w-4" />
                Cancel Shipment
              </Button>
            )}
          </div>
          
          {trackingInfo && (
            <div className="mt-4 border rounded-md p-4">
              <h3 className="text-md font-semibold mb-2">Tracking Details</h3>
              <div className="space-y-2">
                {trackingInfo.tracking_data?.track_status ? (
                  <>
                    <p className="text-sm"><span className="font-medium">Status:</span> {trackingInfo.tracking_data.track_status}</p>
                    <p className="text-sm"><span className="font-medium">Last Updated:</span> {trackingInfo.tracking_data.shipment_track_activities?.[0]?.date || 'N/A'}</p>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Shipment Activities</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {trackingInfo.tracking_data.shipment_track_activities?.map((activity: any, index: number) => (
                          <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                            <p className="font-medium">{activity.date}</p>
                            <p>{activity.activity}</p>
                            <p className="text-muted-foreground">{activity.location}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No detailed tracking information available yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {canPushToShiprocket ? (
            <div>
              <p className="text-sm mb-4">This order can be shipped using Shiprocket's delivery services.</p>
              <Button 
                variant="default" 
                className="flex items-center gap-2"
                onClick={pushToShiprocket}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Push to Shiprocket
              </Button>
            </div>
          ) : canUseShiprocket ? (
            <p className="text-sm text-muted-foreground">
              This order has not been pushed to Shiprocket yet. Only administrators and sellers can push orders to Shiprocket.
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}