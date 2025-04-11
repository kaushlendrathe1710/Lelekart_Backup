import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Order, Product } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, X } from "lucide-react";
import { useCart } from "@/context/cart-context";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    },
  });

  // Fetch user's orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user?.id,
  });

  // Fetch wishlist (mocked for now)
  const { data: products, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // This is a placeholder - in a real app we would update the user profile through an API
      // const res = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      // return res.json();
      return { ...user, ...data };
    },
    onSuccess: () => {
      // In a real app we would invalidate the user query
      // queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  // For demo purposes, use the first few products as "wishlist" items
  const wishlistItems = products?.slice(0, 4) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Account</h2>
            </div>
            
            {/* Personal Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-1">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-semibold mb-4">
                      {user?.name 
                        ? user.name.substring(0, 2).toUpperCase() 
                        : user?.username.substring(0, 2).toUpperCase()}
                    </div>
                    <p className="text-lg font-medium">{user?.name || user?.username}</p>
                    <p className="text-gray-500 text-sm">Premium Member</p>
                    <div className="mt-4 w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Plus points:</span>
                        <span className="text-xs font-medium">238</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-yellow-400 rounded-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Tabs 
                      defaultValue="profile" 
                      value={activeTab} 
                      onValueChange={setActiveTab}
                      orientation="vertical"
                      className="w-full"
                    >
                      <TabsList className="flex flex-col items-start space-y-2 bg-transparent p-0">
                        <TabsTrigger 
                          value="profile" 
                          className="justify-start w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        >
                          My Profile
                        </TabsTrigger>
                        <TabsTrigger 
                          value="orders" 
                          className="justify-start w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        >
                          My Orders
                        </TabsTrigger>
                        <TabsTrigger 
                          value="wishlist" 
                          className="justify-start w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        >
                          My Wishlist
                        </TabsTrigger>
                        <TabsTrigger 
                          value="addresses" 
                          className="justify-start w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        >
                          My Addresses
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-3">
                {/* Profile Tab */}
                <TabsContent value="profile" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
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
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input type="email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mobile Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex items-end">
                              <FormItem className="w-full">
                                <FormLabel>Gender</FormLabel>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option>Male</option>
                                  <option>Female</option>
                                  <option>Other</option>
                                </select>
                              </FormItem>
                            </div>
                          </div>
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <textarea
                                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Orders</CardTitle>
                      <CardDescription>
                        Track and manage your orders
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isOrdersLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center p-4 border-b">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-6 w-20" />
                              <Skeleton className="h-8 w-24" />
                            </div>
                          ))}
                        </div>
                      ) : orders && orders.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {orders.map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell className="font-medium text-primary">
                                    #ORD{order.id}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    ₹{order.total.toLocaleString('en-IN')}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        order.status === 'completed' 
                                          ? "default"
                                          : order.status === 'pending'
                                          ? "outline"
                                          : "secondary"
                                      }
                                    >
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="outline" size="sm">
                                      View Details
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">You haven't placed any orders yet.</p>
                          <Button 
                            className="mt-4 bg-primary hover:bg-primary/90"
                            onClick={() => window.location.href = "/"}
                          >
                            Start Shopping
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Wishlist Tab */}
                <TabsContent value="wishlist" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Wishlist</CardTitle>
                      <CardDescription>
                        Products you've saved for later
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isProductsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[...Array(4)].map((_, i) => (
                            <Card key={i}>
                              <CardContent className="p-4">
                                <div className="flex">
                                  <Skeleton className="h-32 w-32 rounded" />
                                  <div className="ml-4 space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-6 w-1/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-8 w-full mt-4" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : wishlistItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {wishlistItems.map((product) => (
                            <Card key={product.id} className="relative overflow-hidden group">
                              <CardContent className="p-4">
                                <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="flex">
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="w-32 h-32 object-contain rounded" 
                                  />
                                  <div className="ml-4 flex-1">
                                    <h4 className="font-medium text-sm mb-1">{product.name}</h4>
                                    <div className="text-green-600 font-medium">
                                      ₹{product.price.toLocaleString('en-IN')}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {product.description}
                                    </p>
                                    <Button 
                                      className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm"
                                      onClick={() => addToCart(product)}
                                    >
                                      <ShoppingCart className="h-3 w-3 mr-1" />
                                      Add to Cart
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Your wishlist is empty.</p>
                          <Button 
                            className="mt-4 bg-primary hover:bg-primary/90"
                            onClick={() => window.location.href = "/"}
                          >
                            Explore Products
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Addresses Tab */}
                <TabsContent value="addresses" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Addresses</CardTitle>
                      <CardDescription>
                        Manage your delivery addresses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Card className="border border-green-100 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <h3 className="font-medium">Home</h3>
                                <Badge variant="outline" className="ml-2">Default</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">
                                {user?.address || "No address provided"}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Phone: {user?.phone || "Not provided"}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:border-red-200">Delete</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Button className="mt-4" variant="outline">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4 mr-2" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add New Address
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <CartSidebar />
    </div>
  );
}
