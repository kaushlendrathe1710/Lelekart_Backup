import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { Product, Order } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpIcon, ArrowDownIcon, Plus, Edit, Trash2 } from "lucide-react";
import { insertProductSchema } from "@shared/schema";

// Product form schema
const productFormSchema = insertProductSchema.extend({
  id: z.number().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function SellerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Product form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "Electronics",
      imageUrl: "",
      sellerId: user?.id,
      stock: 0,
    },
  });

  // Fetch seller's products
  const { data: products, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { sellerId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/products?sellerId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch seller products");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch seller's orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user?.id,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormValues) => {
      const res = await apiRequest("POST", "/api/products", productData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product created",
        description: "Your product has been created and is pending approval.",
        variant: "default",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ProductFormValues }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product updated",
        description: "Your product has been updated successfully.",
        variant: "default",
      });
      setIsDialogOpen(false);
      form.reset();
      setSelectedProduct(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/products/${productId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "Your product has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: ProductFormValues) => {
    if (selectedProduct) {
      updateProductMutation.mutate({ id: selectedProduct.id, data: values });
    } else {
      createProductMutation.mutate(values);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      sellerId: product.sellerId,
      stock: product.stock,
    });
    setIsDialogOpen(true);
  };

  // Handle delete product
  const handleDeleteProduct = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  // Handle add new product
  const handleAddNewProduct = () => {
    setSelectedProduct(null);
    form.reset({
      name: "",
      description: "",
      price: 0,
      category: "Electronics",
      imageUrl: "",
      sellerId: user?.id,
      stock: 0,
    });
    setIsDialogOpen(true);
  };

  // Render the loading state for stats
  const StatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-full mt-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Seller Dashboard</h2>
            </div>
            
            {/* Seller Stats */}
            {isProductsLoading || isOrdersLoading ? (
              <StatsLoading />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="text-2xl font-semibold">{orders?.length || 0}</p>
                      <div className="flex items-center mt-2 text-xs text-green-600">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        <span>8% from last week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="text-2xl font-semibold">
                        ₹{orders?.reduce((sum, order) => sum + order.total, 0).toLocaleString('en-IN') || 0}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-green-600">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        <span>12% from last week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-500">Active Products</p>
                      <p className="text-2xl font-semibold">
                        {products?.filter(p => p.isApproved).length || 0}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-red-600">
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
                        <span>2% from last week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-500">Avg. Rating</p>
                      <p className="text-2xl font-semibold">4.7/5</p>
                      <div className="flex items-center mt-2 text-xs text-green-600">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        <span>0.2 from last month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Add New Product Button */}
            <div className="mb-6">
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center"
                onClick={handleAddNewProduct}
              >
                <Plus className="h-4 w-4 mr-2" /> Add New Product
              </Button>
            </div>
            
            {/* Product Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                  <DialogDescription>
                    {selectedProduct 
                      ? "Update your product details below." 
                      : "Fill in the details to add a new product."}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter product name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="Electronics">Electronics</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Home">Home</option>
                                <option value="Appliances">Appliances</option>
                                <option value="Mobiles">Mobiles</option>
                                <option value="Beauty">Beauty</option>
                                <option value="Toys">Toys</option>
                                <option value="Grocery">Grocery</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Enter product description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (in ₹)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter price" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter stock quantity" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter image URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createProductMutation.isPending || updateProductMutation.isPending}
                      >
                        {(createProductMutation.isPending || updateProductMutation.isPending) 
                          ? "Saving..." 
                          : selectedProduct ? "Update Product" : "Add Product"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Seller Tabs */}
            <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="products">Your Products</TabsTrigger>
                <TabsTrigger value="orders">Recent Orders</TabsTrigger>
              </TabsList>
              
              {/* Products Tab */}
              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Products</CardTitle>
                    <CardDescription>
                      Manage your product listings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isProductsLoading ? (
                      <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex justify-between items-center p-4 border-b">
                            <div className="flex items-center">
                              <Skeleton className="h-10 w-10 rounded mr-4" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Skeleton className="h-9 w-16" />
                              <Skeleton className="h-9 w-16" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : products && products.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0">
                                      <img 
                                        className="h-10 w-10 rounded object-cover" 
                                        src={product.imageUrl} 
                                        alt={product.name} 
                                      />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                      <div className="text-sm text-gray-500">SKU: PRD{product.id}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {product.category}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  ₹{product.price.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {product.stock} units
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      product.isApproved 
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {product.isApproved ? "Active" : "Pending Approval"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      onClick={() => handleEditProduct(product)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteProduct(product.id)}
                                      disabled={deleteProductMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">You don't have any products yet.</p>
                        <Button 
                          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={handleAddNewProduct}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Your First Product
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  {products && products.length > 0 && (
                    <CardFooter className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Showing {products.length} {products.length === 1 ? 'product' : 'products'}
                      </span>
                      <div className="flex">
                        <Button variant="outline" size="sm" disabled className="rounded-l">
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled className="rounded-r border-l-0">
                          Next
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
              
              {/* Orders Tab */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>
                      View and manage customer orders for your products
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isOrdersLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex justify-between items-center p-4 border-b">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                        ))}
                      </div>
                    ) : orders && orders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Products</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="text-sm font-medium text-primary">
                                  #ORD{order.id}
                                </TableCell>
                                <TableCell className="text-sm">
                                  Customer #{order.userId}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  Various products
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  ₹{order.total.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString()}
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
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No orders yet</p>
                      </div>
                    )}
                  </CardContent>
                  {orders && orders.length > 0 && (
                    <CardFooter>
                      <Button variant="outline" size="sm" className="ml-auto">
                        View All Orders
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
      <CartSidebar />
    </div>
  );
}
