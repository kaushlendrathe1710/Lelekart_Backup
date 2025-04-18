import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Home, Package, ShoppingBag } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function OrderConfirmationPage() {
  const [, params] = useRoute('/order-confirmation/:id');
  const orderId = params?.id;
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [, setLocation] = useLocation();

  type OrderWithShipping = Order & {
    shippingDetails?: {
      name: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      phone: string;
    }
  };

  type OrderItemWithProduct = OrderItem & {
    product: Product;
  };

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
  }

  interface Order {
    id: number;
    userId: number;
    status: string;
    total: number;
    date: string;
    shippingDetails: string;
    paymentMethod: string;
    walletDiscount?: number;
    walletCoinsUsed?: number;
    items?: OrderItemWithProduct[];
  }

  // We've moved this logic to the main useEffect below

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // Check query parameters for success state
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    const totalParam = urlParams.get('total');
    
    if (successParam === 'true' && totalParam) {
      // We have success parameters - we can create a minimal success state
      const orderSuccess = {
        id: parseInt(orderId || '0'),
        status: "confirmed",
        total: parseFloat(totalParam),
        date: new Date().toISOString(),
        paymentMethod: "cod"
      };
      setOrderDetails(orderSuccess);
      setLoading(false);
      return;
    }

    // Try authenticated API request if possible
    // Fetch order details with retries
    const fetchOrderWithRetry = (retries = 3, delay = 1000) => {
      fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': `order-confirmation/${orderId}`
        }
      })
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to fetch order");
        }
        return res.json();
      })
      .then(data => {
        // Parse shipping details
        const parsedOrder = {
          ...data,
          shippingDetails: data.shippingDetails ? JSON.parse(data.shippingDetails) : null
        };
        setOrderDetails(parsedOrder);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching order:", err);
        if (retries > 0) {
          // Retry after delay
          setTimeout(() => fetchOrderWithRetry(retries - 1, delay * 1.5), delay);
        } else {
          setLoading(false);
        }
      });
    };

    fetchOrderWithRetry();
  }, [orderId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit", 
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-8">We couldn't find the order you're looking for.</p>
          <Button 
            onClick={() => setLocation('/')} 
            className="bg-primary text-white"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full mb-4">
            <Check className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Order Confirmed!</h1>
          <p className="text-gray-600 mt-2">
            Thank you for your purchase. Your order has been received.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-medium">#{orderDetails.id}</p>
            </div>
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{formatDate(orderDetails.date)}</p>
            </div>
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">{orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : orderDetails.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Status</p>
              <p className="font-medium capitalize">{orderDetails.status}</p>
            </div>
          </div>
        </div>

        {/* Order Items - only show if items exist */}
        {orderDetails.items && orderDetails.items.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderDetails.items.map((item: OrderItemWithProduct) => (
                    <tr key={item.id || `${item.productId}-${item.quantity}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {item.product?.image ? (
                              <img className="h-10 w-10 rounded-md object-cover" src={item.product.image} alt={item.product.name} />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.product?.name || 'Product'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ₹{item.price ? item.price.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right font-medium">
                      Subtotal
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ₹{((orderDetails.total || 0) - 40).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right font-medium">
                      Shipping
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ₹40.00
                    </td>
                  </tr>
                  {orderDetails.walletDiscount > 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-right font-medium text-green-600">
                        Wallet Discount ({orderDetails.walletCoinsUsed} coins)
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        -₹{orderDetails.walletDiscount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right text-lg font-bold">
                      Total
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold">
                      ₹{(orderDetails.total || 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-500 mb-4">Your order has been confirmed!</p>
              <div className="text-left mb-4 p-4 bg-gray-50 rounded-lg">
                {orderDetails.walletDiscount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Wallet Discount</span>
                    <span className="font-medium text-green-600">-₹{orderDetails.walletDiscount.toFixed(2)}</span>
                  </div>
                )}
                {orderDetails.walletCoinsUsed > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Coins Used</span>
                    <span className="font-medium">{orderDetails.walletCoinsUsed} coins</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium">₹{(orderDetails.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium capitalize">{orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : orderDetails.paymentMethod}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Information */}
        {orderDetails.shippingDetails && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium">{orderDetails.shippingDetails.name}</p>
              <p className="text-gray-600">{orderDetails.shippingDetails.address}</p>
              <p className="text-gray-600">
                {orderDetails.shippingDetails.city}, {orderDetails.shippingDetails.state} {orderDetails.shippingDetails.zipCode}
              </p>
              <p className="text-gray-600">Phone: {orderDetails.shippingDetails.phone}</p>
              {orderDetails.shippingDetails.notes && (
                <div className="mt-2 border-t pt-2">
                  <p className="text-sm text-gray-500">Notes:</p>
                  <p className="text-gray-600">{orderDetails.shippingDetails.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <Button 
            onClick={() => setLocation('/')} 
            variant="outline" 
            className="flex items-center justify-center"
          >
            <Home className="mr-2 h-4 w-4" /> Continue Shopping
          </Button>
          <Button 
            onClick={() => setLocation(`/order/${orderId}`)} 
            className="bg-primary text-white flex items-center justify-center"
          >
            <Package className="mr-2 h-4 w-4" /> View Order Details
          </Button>
          <Button 
            onClick={() => setLocation('/orders')} 
            variant="outline"
            className="flex items-center justify-center"
          >
            <ShoppingBag className="mr-2 h-4 w-4" /> View All Orders
          </Button>
        </div>
      </div>
    </div>
  );
}