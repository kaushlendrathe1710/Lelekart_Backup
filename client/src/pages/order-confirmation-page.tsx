import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Loader2, Clock, Package, ArrowRight } from "lucide-react";

export default function OrderConfirmationPage() {
  const [, params] = useRoute("/order-confirmation/:id");
  const orderId = params?.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  
  // Fetch order details
  const { data: order, isLoading: isOrderLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId && !!user,
  });
  
  // Fetch order items
  const { data: orderItems, isLoading: isItemsLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}/items`],
    enabled: !!orderId && !!user,
  });
  
  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  // Get estimated delivery date (5 days from order date)
  const getEstimatedDelivery = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 5);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {isOrderLoading || isItemsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Separator />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Separator />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : order ? (
          <Card>
            <CardHeader className="bg-green-50 border-b">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
                  <p className="text-gray-600">Order #{order.id}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 py-6">
              {/* Order Status */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium flex items-center text-blue-700">
                  <Clock className="h-5 w-5 mr-2" />
                  Order Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </h3>
                <p className="mt-2 text-gray-600">
                  Your order has been placed successfully and is being processed.
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium">{formatDate(order.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Delivery</p>
                    <p className="font-medium">{getEstimatedDelivery(order.date)}</p>
                  </div>
                </div>
              </div>
              
              {/* Order Items */}
              <div>
                <h3 className="font-medium text-lg mb-3">Order Items</h3>
                <div className="space-y-3">
                  {orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-3">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                          className="w-16 h-16 object-contain"
                        />
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.price)} x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Payment Summary */}
              <div>
                <h3 className="font-medium text-lg mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
              
              {/* Delivery Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Delivery Information
                </h3>
                <div className="mt-2">
                  {order.shippingDetails ? (
                    <>
                      <p className="font-medium">{order.shippingDetails.name}</p>
                      <p>{order.shippingDetails.address}</p>
                      <p>{order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}</p>
                      <p>Phone: {order.shippingDetails.phone}</p>
                    </>
                  ) : (
                    <p className="text-gray-600">Shipping details not available</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50 flex justify-between">
              <p className="text-gray-600">Thank you for shopping with Flipkart!</p>
              <Link href="/buyer/dashboard">
                <Button className="bg-primary hover:bg-primary/90">
                  View All Orders <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Order Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Sorry, we couldn't find the order you're looking for.</p>
            </CardContent>
            <CardFooter>
              <Link href="/">
                <Button>
                  Continue Shopping
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}