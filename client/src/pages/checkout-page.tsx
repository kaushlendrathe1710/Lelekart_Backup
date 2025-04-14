import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import RazorpayPayment from "@/components/payment/razorpay-payment";
import { Home, Building2, MapPin, Phone, User, Plus } from "lucide-react";
import { UserAddress } from "@shared/schema";

// Define form schema with Zod
const checkoutSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  city: z.string().min(2, { message: "City must be at least 2 characters" }),
  state: z.string().min(2, { message: "State must be at least 2 characters" }),
  zipCode: z.string().min(5, { message: "ZIP code must be at least 5 characters" }),
  paymentMethod: z.enum(["cod", "razorpay"], {
    required_error: "Please select a payment method",
  }),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface CartItem {
  id: number;
  quantity: number;
  userId: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    sellerId: number;
    approved: boolean;
    createdAt: string;
  };
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      paymentMethod: "cod",
      notes: "",
    },
  });

  // Fetch user and cart data
  useEffect(() => {
    // Check if user is already cached
    const cachedUser = queryClient.getQueryData<any>(['/api/user']);
    if (cachedUser) {
      setUser(cachedUser);
      // Pre-fill form with user data if available
      form.setValue("name", cachedUser.name || "");
      form.setValue("email", cachedUser.email || "");
      form.setValue("phone", cachedUser.phone || "");
      form.setValue("address", cachedUser.address || "");
    }
    
    // Fetch fresh user data
    fetch('/api/user', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    .then(res => {
      if (res.ok) return res.json();
      return null;
    })
    .then(userData => {
      if (userData) {
        setUser(userData);
        queryClient.setQueryData(['/api/user'], userData);
        // Pre-fill form with user data if available
        form.setValue("name", userData.name || "");
        form.setValue("email", userData.email || "");
        form.setValue("phone", userData.phone || "");
        form.setValue("address", userData.address || "");
        
        // Fetch cart data
        fetchCartItems();
        
        // Fetch user addresses
        fetchUserAddresses();
      } else {
        setLoading(false);
        setLocation('/auth');
      }
    })
    .catch(err => {
      console.error("Error fetching user:", err);
      setLoading(false);
    });
  }, [form]);
  
  // Fetch user addresses
  const fetchUserAddresses = () => {
    fetch('/api/addresses', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    .then(res => res.json())
    .then(data => {
      setAddresses(data);
      
      // If user has addresses, show address selection instead of the form
      if (data.length > 0) {
        setShowAddressForm(false);
        
        // Get default address if exists
        const defaultAddress = data.find((addr: UserAddress) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id.toString());
          
          // Pre-fill form with default address data for payment processing
          form.setValue("name", defaultAddress.fullName);
          form.setValue("phone", defaultAddress.phone);
          form.setValue("address", defaultAddress.address);
          form.setValue("city", defaultAddress.city);
          form.setValue("state", defaultAddress.state);
          form.setValue("zipCode", defaultAddress.pincode);
        } else {
          // Use the first address if no default
          setSelectedAddressId(data[0].id.toString());
          
          // Pre-fill form with first address data for payment processing
          form.setValue("name", data[0].fullName);
          form.setValue("phone", data[0].phone);
          form.setValue("address", data[0].address);
          form.setValue("city", data[0].city);
          form.setValue("state", data[0].state);
          form.setValue("zipCode", data[0].pincode);
        }
      }
    })
    .catch(err => {
      console.error("Error fetching addresses:", err);
    });
  };

  const fetchCartItems = () => {
    fetch('/api/cart', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    .then(res => res.json())
    .then(data => {
      console.log("Cart items debug:", data);
      setCartItems(data);
      setLoading(false);
      
      // If cart is empty, redirect to cart page
      if (data.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Your cart is empty. Please add some items before proceeding to checkout.",
          variant: "destructive",
        });
        setLocation('/cart');
      }
    })
    .catch(err => {
      console.error("Error fetching cart:", err);
      setLoading(false);
    });
  }

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => 
    total + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 40 : 0;
  const total = subtotal + shipping;

  // Handle form submission
  const onSubmit = async (values: CheckoutFormValues) => {
    setProcessingOrder(true);
    
    try {
      // Prepare order data
      const orderData: any = {
        userId: user.id,
        total,
        status: "pending",
        paymentMethod: values.paymentMethod,
        shippingDetails: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          notes: values.notes,
        }),
      };
      
      // Add address ID if using saved address
      if (addresses.length > 0 && selectedAddressId && !showAddressForm) {
        orderData.addressId = parseInt(selectedAddressId);
      }
      
      // Log order data before submission
      console.log("Submitting order with data:", orderData);
      
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        console.error("Error placing order:", errorData);
        throw new Error("Failed to create order");
      }
      
      const order = await orderResponse.json();
      
      // Clear cart
      await fetch('/api/cart/clear', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Show success message
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been placed successfully. Thank you for shopping with us!",
      });
      
      // Redirect to order confirmation page with success parameter and total
      setLocation(`/order-confirmation/${order.id}?success=true&total=${total}`);
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
      setProcessingOrder(false);
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Shipping Form */}
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-6">Shipping Information</h2>
            
            {addresses.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-base mb-4">Select Delivery Address</h3>
                
                <div className="grid grid-cols-1 gap-4 mb-4">
                  {addresses.map((address) => (
                    <div 
                      key={address.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAddressId === address.id.toString() 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedAddressId(address.id.toString());
                        
                        // Update form values when address is selected
                        form.setValue("name", address.fullName);
                        form.setValue("phone", address.phone);
                        form.setValue("address", address.address);
                        form.setValue("city", address.city);
                        form.setValue("state", address.state);
                        form.setValue("zipCode", address.pincode);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <span className="font-semibold">{address.addressName}</span>
                          {address.isDefault && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        {selectedAddressId === address.id.toString() && (
                          <div className="w-4 h-4 rounded-full bg-primary"></div>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        <User className="inline-block h-3 w-3 mr-1" /> 
                        {address.fullName}
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        <MapPin className="inline-block h-3 w-3 mr-1" /> 
                        {address.address}, {address.city}, {address.state}, {address.pincode}
                      </div>
                      <div className="text-sm text-gray-700">
                        <Phone className="inline-block h-3 w-3 mr-1" /> 
                        {address.phone}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center mb-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAddressForm(!showAddressForm)}
                  >
                    {showAddressForm ? "Hide Form" : "Enter New Address"}
                  </Button>
                  <span className="text-sm text-gray-500 ml-2">
                    {showAddressForm ? "Fill in the form below" : "Or use a different address"}
                  </span>
                </div>
                
                <div className={`${showAddressForm ? 'block' : 'hidden'}`}>
                  <div className="border-t border-dashed my-4"></div>
                  <h3 className="font-medium text-base mb-4">Or Enter New Address</h3>
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Address entry section - conditionally shown/hidden */}
                <div style={{ display: addresses.length > 0 && !showAddressForm ? 'none' : 'block' }}>
                  <div className="address-form-section mb-8">
                    <h3 className="font-medium text-base mb-4">Shipping Address</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
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
                            <Textarea placeholder="123 Main St, Apt 4B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
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
                              <Input placeholder="NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Special instructions for delivery" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Payment section - always visible */}
                <div className="payment-section pt-4 border-t">
                  <h3 className="font-medium text-base mb-4">Payment Method</h3>
                  
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Select Payment Option</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-3"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cod" id="cod" />
                              <Label htmlFor="cod">Cash on Delivery (COD)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="razorpay" id="razorpay" />
                              <Label htmlFor="razorpay">Pay Online with Razorpay</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("paymentMethod") === "razorpay" ? (
                    <div className="border-t pt-4 mt-4">
                      <RazorpayPayment 
                        amount={total * 100} // Convert to paise
                        shippingDetails={{
                          name: form.getValues("name"),
                          address: form.getValues("address"),
                          city: form.getValues("city"),
                          state: form.getValues("state"),
                          zipCode: form.getValues("zipCode"),
                          phone: form.getValues("phone"),
                        }}
                        onSuccess={(orderId) => {
                          // Redirect to order confirmation page
                          setLocation(`/order-confirmation/${orderId}?success=true&total=${total}`);
                        }}
                        onError={(error) => {
                          toast({
                            title: "Payment Failed",
                            description: error || "There was an error processing your payment. Please try again.",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="pt-4 mt-4">
                      <Button 
                        type="submit" 
                        className="w-full bg-primary text-white"
                        disabled={processingOrder}
                      >
                        {processingOrder ? "Processing..." : "Place Order"}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-lg font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md overflow-hidden mr-2 bg-gray-100 flex items-center justify-center">
                      <img 
                        src={item.product.image || 'https://via.placeholder.com/80?text=Product'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/80?text=Product';
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">₹{shipping.toFixed(2)}</span>
            </div>
            <hr className="my-4" />
            <div className="flex justify-between mb-6">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-semibold">₹{total.toFixed(2)}</span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-sm mb-2">Payment Method</h3>
              <p className="text-sm text-gray-600">
                {form.watch("paymentMethod") === "razorpay" 
                  ? "Pay Online with Razorpay" 
                  : "Cash on Delivery (COD)"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}