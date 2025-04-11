import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpIcon, ArrowDownIcon, MoreHorizontal, CheckCircle, XCircle, User, ShoppingBag, Store } from "lucide-react";
import { Product, User as UserType, Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("products");

  // Fetch pending approval products
  const { data: pendingProducts, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { approved: false }],
    queryFn: async () => {
      const response = await fetch("/api/products?approved=false");
      if (!response.ok) throw new Error("Failed to fetch pending products");
      return response.json();
    }
  });

  // Fetch all users
  const { data: users, isLoading: isUsersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Fetch recent orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Product approval mutation
  const approveProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("PUT", `/api/products/${productId}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product approved",
        description: "The product has been approved and is now live.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve product",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // User role update mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PUT", `/api/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User role updated",
        description: "The user's role has been successfully updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user role",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleApproveProduct = (productId: number) => {
    approveProductMutation.mutate(productId);
  };

  const handleUpdateUserRole = (userId: number, role: string) => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  // Render the loading state for stats
  const StatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-full mr-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mt-4" />
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
              <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            </div>
            
            {/* Admin Stats */}
            {isProductsLoading || isUsersLoading || isOrdersLoading ? (
              <StatsLoading />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-indigo-50">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-indigo-500 text-white mr-4">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Products</p>
                        <p className="text-2xl font-semibold">{pendingProducts?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm text-green-600">
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                      <span>12% increase this month</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-500 text-white mr-4">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Users</p>
                        <p className="text-2xl font-semibold">{users?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm text-green-600">
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                      <span>8.3% increase this month</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-orange-500 text-white mr-4">
                        <Store className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Active Sellers</p>
                        <p className="text-2xl font-semibold">
                          {users?.filter(user => user.role === 'seller').length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm text-green-600">
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                      <span>4.1% increase this month</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Admin Tabs */}
            <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>
              
              {/* Product Approval Tab */}
              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Product Approvals</CardTitle>
                    <CardDescription>
                      Review and approve products submitted by sellers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isProductsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex justify-between items-center p-4 border-b">
                            <div className="flex items-center">
                              <Skeleton className="h-10 w-10 rounded mr-4" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Skeleton className="h-9 w-20" />
                              <Skeleton className="h-9 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : pendingProducts && pendingProducts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Seller</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingProducts.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0">
                                      <img 
                                        className="h-10 w-10 rounded-md object-cover" 
                                        src={product.imageUrl} 
                                        alt={product.name} 
                                      />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                      <div className="text-sm text-gray-500">ID: PRD{product.id}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-900">
                                    {users?.find(user => user.id === product.sellerId)?.name || 'Unknown'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {users?.find(user => user.id === product.sellerId)?.email || 'No email'}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {product.category}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  ₹{product.price.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {new Date(product.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      className="text-green-600 hover:text-green-900 hover:bg-green-50"
                                      onClick={() => handleApproveProduct(product.id)}
                                      disabled={approveProductMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
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
                        <p className="text-gray-500">No pending product approvals</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* User Management Tab */}
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage users and their roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isUsersLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex justify-between items-center p-4 border-b">
                            <div className="flex items-center">
                              <Skeleton className="h-8 w-8 rounded-full mr-4" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-32" />
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Skeleton className="h-6 w-16" />
                              <Skeleton className="h-9 w-16" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : users && users.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-primary font-medium">
                                        {user.name ? user.name.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.name || user.username}
                                      </div>
                                      <div className="text-xs text-gray-500">ID: USR{user.id}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      user.role === 'admin' ? 'destructive' : 
                                      user.role === 'seller' ? 'default' : 'outline'
                                    }
                                  >
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {user.email}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {user.phone || 'Not provided'}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleUpdateUserRole(user.id, 'admin')}
                                        disabled={user.role === 'admin'}
                                      >
                                        Make Admin
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleUpdateUserRole(user.id, 'seller')}
                                        disabled={user.role === 'seller'}
                                      >
                                        Make Seller
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleUpdateUserRole(user.id, 'buyer')}
                                        disabled={user.role === 'buyer'}
                                      >
                                        Make Buyer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No users found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Orders Tab */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>
                      Monitor recent order activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isOrdersLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex justify-between items-center p-4 border-b">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-24" />
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
                              <TableHead>Amount</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium text-primary">
                                  #ORD{order.id}
                                </TableCell>
                                <TableCell>
                                  {users?.find(user => user.id === order.userId)?.name || 
                                   users?.find(user => user.id === order.userId)?.username || 
                                   'Unknown'}
                                </TableCell>
                                <TableCell>
                                  ₹{order.total.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell>
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      order.status === 'completed' ? 'default' : 
                                      order.status === 'pending' ? 'secondary' : 
                                      order.status === 'processing' ? 'outline' : 'default'
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
                      <div className="text-center py-6">
                        <p className="text-gray-500">No orders found</p>
                      </div>
                    )}
                  </CardContent>
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
