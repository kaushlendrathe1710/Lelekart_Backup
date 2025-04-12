import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { User, Package, ShoppingBag, Truck, TrendingUp, Users, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  // Fetch orders data
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/orders"],
    staleTime: 60000, // 1 minute
  });

  // Fetch products data
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
    staleTime: 60000, // 1 minute
  });

  // Fetch users data
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    staleTime: 60000, // 1 minute
  });

  // Stats calculations (simplified)
  const totalOrders = orders?.length || 0;
  const totalProducts = products?.length || 0;
  const totalUsers = users?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  
  // Calculate pending orders
  const pendingOrders = orders?.filter(order => order.status === "pending").length || 0;
  const pendingOrdersPercentage = orders?.length ? Math.round((pendingOrders / orders.length) * 100) : 0;
  
  // Find popular categories if products exist
  const categoryCount = products?.reduce((acc, product) => {
    const category = product.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Sort categories by count
  const popularCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Loading states
  const isLoading = isLoadingOrders || isLoadingProducts || isLoadingUsers;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your store's performance and stats
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    {pendingOrders} order{pendingOrders !== 1 ? 's' : ''} pending
                  </p>
                  <Progress className="mt-2" value={pendingOrdersPercentage} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    From {totalOrders} order{totalOrders !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {Object.keys(categoryCount).length} categories
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active customers in your store
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Rows */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Orders - Wider Card */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Last {Math.min(5, totalOrders)} orders from your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="ml-auto h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center">
                      <div className="mr-4 rounded-md bg-primary/10 p-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Order #{order.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="font-medium">₹{order.total.toFixed(2)}</div>
                      <div className={`ml-4 rounded-full px-2 py-0.5 text-xs font-semibold 
                        ${order.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <AlertCircle className="mb-2 h-6 w-6 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No orders yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Orders will appear here when customers make purchases.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Categories */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Popular Categories</CardTitle>
              <CardDescription>
                Top selling product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : popularCategories.length > 0 ? (
                <div className="space-y-4">
                  {popularCategories.map(([category, count], index) => {
                    const percentage = Math.round((count / totalProducts) * 100);
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{category}</p>
                            <p className="text-xs text-muted-foreground">
                              {count} product{count !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <p className="text-sm font-medium">{percentage}%</p>
                        </div>
                        <Progress value={percentage} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <AlertCircle className="mb-2 h-6 w-6 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No products yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Add products to see category statistics.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}