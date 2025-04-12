import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, ShoppingCart } from "lucide-react";

// Form schema
const checkoutSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  city: z.string().min(2, { message: "City must be at least 2 characters" }),
  state: z.string().min(2, { message: "State must be at least 2 characters" }),
  pincode: z.string().regex(/^\d{6}$/, { message: "Please enter a valid 6-digit pincode" })
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // Check if user is authenticated and redirect if not
  useEffect(() => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to access the checkout page",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, navigate, toast]);

  // Check if cart is empty and redirect if it is
  useEffect(() => {
    if (cartItems.length === 0 && !isOrderPlaced) {
      toast({
        title: "Your cart is empty",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [cartItems, navigate, toast, isOrderPlaced]);

  // Form setup
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: "",
      state: "",
      pincode: ""
    }
  });

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const discount = Math.round(subtotal * 0.05); // 5% discount
  const shipping = subtotal > 1000 ? 0 : 40; // Free shipping over ₹1000
  const total = subtotal - discount + shipping;

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async (shippingDetails: CheckoutFormValues) => {
      const res = await apiRequest("POST", "/api/orders", { shippingDetails });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setIsOrderPlaced(true);
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your purchase.",
        variant: "default",
      });
      // Navigate to order confirmation page (to be created)
      navigate(`/order-confirmation/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit handler
  const onSubmit = (values: CheckoutFormValues) => {
    checkoutMutation.mutate(values);
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input placeholder="6-digit pincode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={checkoutMutation.isPending}
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Order...
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-12 h-12 object-contain"
                      />
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="font-medium">{formatPrice(item.product.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              {/* Price Details */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">- {formatPrice(discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                
                {/* Shipping info */}
                <div className="mt-4 text-sm text-gray-500">
                  <p>Free shipping on orders over ₹1,000</p>
                  <p>Estimated delivery: 3-5 business days</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-lg">
              <div className="w-full">
                <div className="flex items-center text-green-600 mb-2">
                  <Check className="h-4 w-4 mr-2" />
                  <span className="text-sm">Secure checkout</span>
                </div>
                <div className="flex items-center text-blue-600">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-600"
                    onClick={() => navigate("/")}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}