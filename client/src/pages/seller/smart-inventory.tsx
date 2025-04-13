import React, { useState, useEffect } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/utils";
import { Loader2, TrendingUp, LineChart, ShoppingBag, DollarSign, ClipboardCheck, Check, X, PencilRuler } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

export default function SmartInventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("demand-forecasting");

  // Get all seller products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products", { sellerId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/products?sellerId=${user?.id}`);
      const data = await res.json();
      return data.products;
    },
    enabled: !!user?.id,
  });

  // Handle product selection
  const handleProductSelect = (productId: number) => {
    setSelectedProduct(productId);
  };

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Smart Inventory & Price Management</h1>
          <p className="text-muted-foreground mt-2">
            Leverage AI-powered insights to optimize your inventory, pricing, and product content
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar for product selection */}
          <div className="col-span-12 md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>Select a product to analyze</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {isLoadingProducts ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products && products.length > 0 ? (
                      products.map((product: any) => (
                        <div
                          key={product.id}
                          className={`p-3 rounded-md cursor-pointer border transition-colors ${
                            selectedProduct === product.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleProductSelect(product.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-md overflow-hidden">
                              <img 
                                src={product.imageUrl || '/images/placeholder.svg'} 
                                alt={product.name} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                              <p className="text-sm font-medium">{formatPrice(product.price)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-muted-foreground">No products found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content area */}
          <div className="col-span-12 md:col-span-9">
            {selectedProduct ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="demand-forecasting">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Demand Forecasting
                  </TabsTrigger>
                  <TabsTrigger value="price-optimization">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Price Optimization
                  </TabsTrigger>
                  <TabsTrigger value="inventory-optimization">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Inventory Optimization
                  </TabsTrigger>
                  <TabsTrigger value="ai-content">
                    <PencilRuler className="h-4 w-4 mr-2" />
                    AI Content Generator
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="demand-forecasting">
                  <DemandForecastingTab productId={selectedProduct} />
                </TabsContent>

                <TabsContent value="price-optimization">
                  <PriceOptimizationTab productId={selectedProduct} />
                </TabsContent>

                <TabsContent value="inventory-optimization">
                  <InventoryOptimizationTab productId={selectedProduct} />
                </TabsContent>

                <TabsContent value="ai-content">
                  <AIContentTab productId={selectedProduct} />
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full p-3 bg-primary/10 mb-4">
                    <LineChart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Select a Product</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Choose a product from the sidebar to view AI-powered inventory insights, 
                    pricing recommendations, and generate optimized product content.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
}

function DemandForecastingTab({ productId }: { productId: number }) {
  const { toast } = useToast();
  const [period, setPeriod] = useState<string>("monthly");

  // Get demand forecasts
  const { data: forecasts, isLoading } = useQuery({
    queryKey: ["/api/seller/demand-forecasts", productId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/seller/demand-forecasts/${productId}`);
      const data = await res.json();
      return data;
    },
    enabled: !!productId,
  });

  // Generate new forecast
  const forecastMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/seller/demand-forecasts/${productId}`, {
        period,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Forecast generated",
        description: "Your demand forecast has been successfully generated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/demand-forecasts", productId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate forecast",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Get sales history
  const { data: salesHistory, isLoading: isLoadingSales } = useQuery({
    queryKey: ["/api/seller/sales-history", productId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/seller/sales-history/${productId}`);
      const data = await res.json();
      return data;
    },
    enabled: !!productId,
  });

  // Prepare chart data from latest forecast
  const chartData = React.useMemo(() => {
    if (!forecasts || forecasts.length === 0) return [];
    
    // Get the most recent forecast
    const latestForecast = forecasts[0];
    
    try {
      // Convert forecast data to chart format
      const forecastData = JSON.parse(latestForecast.forecastData);
      
      if (Array.isArray(forecastData)) {
        return forecastData.map((item: any) => ({
          name: item.period,
          forecast: item.value,
        }));
      }
      
      return [];
    } catch (e) {
      console.error("Error parsing forecast data:", e);
      return [];
    }
  }, [forecasts]);

  // Prepare historical sales data for chart
  const salesData = React.useMemo(() => {
    if (!salesHistory || salesHistory.length === 0) return [];
    
    // Group by date (month) and sum quantities
    const salesByMonth = salesHistory.reduce((acc: any, sale: any) => {
      const date = new Date(sale.date);
      const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!acc[month]) {
        acc[month] = 0;
      }
      
      acc[month] += sale.quantity;
      return acc;
    }, {});
    
    // Convert to chart data format
    return Object.entries(salesByMonth).map(([month, quantity]) => ({
      name: month,
      sales: quantity,
    }));
  }, [salesHistory]);

  // Combined chart data (if we have both forecasts and sales history)
  const combinedData = React.useMemo(() => {
    if (chartData.length === 0 && salesData.length === 0) return [];
    
    // Create a map of all periods
    const allPeriods = new Map();
    
    // Add sales data periods
    salesData.forEach((item: any) => {
      allPeriods.set(item.name, { name: item.name, sales: item.sales });
    });
    
    // Add forecast data periods
    chartData.forEach((item: any) => {
      const existing = allPeriods.get(item.name) || { name: item.name };
      existing.forecast = item.forecast;
      allPeriods.set(item.name, existing);
    });
    
    // Convert map to array and sort by period
    return Array.from(allPeriods.values())
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [chartData, salesData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div>Demand Forecast</div>
            <Button 
              size="sm" 
              onClick={() => forecastMutation.mutate()}
              disabled={forecastMutation.isPending}
            >
              {forecastMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate New Forecast
            </Button>
          </CardTitle>
          <CardDescription>
            ML-powered predictions of future demand based on your sales history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : forecasts && forecasts.length > 0 ? (
            <div className="space-y-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {salesData.length > 0 && (
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        name="Historical Sales"
                      />
                    )}
                    <Area 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Forecast"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary/5 rounded-md p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Forecast</div>
                  <div className="text-2xl font-bold">
                    {forecasts[0].totalForecastedDemand} units
                  </div>
                </div>
                <div className="bg-primary/5 rounded-md p-4">
                  <div className="text-sm text-muted-foreground mb-1">Confidence Level</div>
                  <div className="text-2xl font-bold">
                    {forecasts[0].confidenceLevel}%
                  </div>
                </div>
                <div className="bg-primary/5 rounded-md p-4">
                  <div className="text-sm text-muted-foreground mb-1">Period</div>
                  <div className="text-2xl font-bold capitalize">
                    {forecasts[0].forecastPeriod}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Forecast Insights</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {forecasts[0].insights || "No insights available for this forecast."}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="inline-flex rounded-full p-3 bg-primary/10 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Forecasts Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Generate your first demand forecast to get insights on future customer demand.
              </p>
              <Button 
                onClick={() => forecastMutation.mutate()}
                disabled={forecastMutation.isPending}
              >
                {forecastMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Forecast
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>
            Historical sales data used to inform demand forecasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSales ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : salesHistory && salesHistory.length > 0 ? (
            <div className="space-y-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground">Quantity</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground">Revenue</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground">Profit Margin</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground">Channel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map((sale: any) => (
                      <tr key={sale.id} className="border-b border-border">
                        <td className="py-2 px-3 text-sm">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-sm">{sale.quantity} units</td>
                        <td className="py-2 px-3 text-sm">{formatPrice(sale.revenue)}</td>
                        <td className="py-2 px-3 text-sm">{sale.profitMargin.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-sm capitalize">{sale.channel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="inline-flex rounded-full p-3 bg-primary/10 mb-4">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Sales History</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Sales history will automatically be recorded as you make sales.
                More sales data will improve the accuracy of demand forecasts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PriceOptimizationTab({ productId }: { productId: number }) {
  const { toast } = useToast();
  
  // Get price optimizations
  const { data: optimizations, isLoading } = useQuery({
    queryKey: ["/api/seller/price-optimizations", productId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/seller/price-optimizations/${productId}`);
      const data = await res.json();
      return data;
    },
    enabled: !!productId,
  });

  // Get current product details
  const { data: product } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      return data;
    },
    enabled: !!productId,
  });

  // Generate new price optimization
  const optimizationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/seller/price-optimizations/${productId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Price optimization generated",
        description: "Your price optimization has been successfully generated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/price-optimizations", productId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate price optimization",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Apply price optimization
  const applyMutation = useMutation({
    mutationFn: async (optimizationId: number) => {
      const res = await apiRequest("POST", `/api/seller/price-optimizations/${optimizationId}/apply`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Price applied",
        description: "The optimized price has been applied to your product",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/price-optimizations", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to apply price",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Reject price optimization
  const rejectMutation = useMutation({
    mutationFn: async (optimizationId: number) => {
      const res = await apiRequest("PUT", `/api/seller/price-optimizations/${optimizationId}/status`, {
        status: "rejected"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Price optimization rejected",
        description: "The price optimization has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/price-optimizations", productId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to reject price optimization",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div>Price Optimization</div>
            <Button 
              size="sm" 
              onClick={() => optimizationMutation.mutate()}
              disabled={optimizationMutation.isPending}
            >
              {optimizationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate New Optimization
            </Button>
          </CardTitle>
          <CardDescription>
            AI-powered pricing recommendations to maximize your revenue and profits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : optimizations && optimizations.length > 0 ? (
            <div className="space-y-6">
              {optimizations.map((optimization: any) => (
                <Card key={optimization.id} className="border border-border">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Price Optimization {new Date(optimization.createdAt).toLocaleDateString()}
                      </CardTitle>
                      <Badge
                        className={
                          optimization.status === "applied"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : optimization.status === "rejected"
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        }
                      >
                        {optimization.status.charAt(0).toUpperCase() + optimization.status.slice(1)}
                      </Badge>
                    </div>
                    {optimization.appliedAt && (
                      <CardDescription>
                        Applied on {new Date(optimization.appliedAt).toLocaleDateString()}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-primary/5 rounded-md p-4">
                        <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                        <div className="text-2xl font-bold">
                          {formatPrice(product?.price || optimization.currentPrice)}
                        </div>
                      </div>
                      <div className="bg-primary/5 rounded-md p-4">
                        <div className="text-sm text-muted-foreground mb-1">Suggested Price</div>
                        <div className="text-2xl font-bold">
                          {formatPrice(optimization.suggestedPrice)}
                        </div>
                      </div>
                      <div className="bg-primary/5 rounded-md p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          Expected Revenue Change
                        </div>
                        <div className={`text-2xl font-bold ${optimization.expectedRevenueIncrease > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {optimization.expectedRevenueIncrease > 0 ? '+' : ''}
                          {optimization.expectedRevenueIncrease}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Pricing Rationale</h3>
                        <p className="text-muted-foreground">
                          {optimization.pricingRationale}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Market Analysis</h3>
                        <p className="text-muted-foreground">
                          {optimization.marketAnalysis}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  {optimization.status === "pending" && (
                    <CardFooter className="bg-muted/30 border-t border-border flex justify-end gap-3 pt-3">
                      <Button 
                        variant="outline" 
                        onClick={() => rejectMutation.mutate(optimization.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => applyMutation.mutate(optimization.id)}
                        disabled={applyMutation.isPending}
                      >
                        {applyMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Check className="mr-2 h-4 w-4" />
                        Apply Price
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="inline-flex rounded-full p-3 bg-primary/10 mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Price Optimizations</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Generate your first price optimization to get AI-powered pricing recommendations.
              </p>
              <Button 
                onClick={() => optimizationMutation.mutate()}
                disabled={optimizationMutation.isPending}
              >
                {optimizationMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Price Optimization
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryOptimizationTab({ productId }: { productId: number }) {
  const { toast } = useToast();
  
  // Get inventory optimizations
  const { data: optimizations, isLoading } = useQuery({
    queryKey: ["/api/seller/inventory-optimizations", productId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/seller/inventory-optimizations/${productId}`);
      const data = await res.json();
      return data;
    },
    enabled: !!productId,
  });

  // Get current product details
  const { data: product } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      return data;
    },
    enabled: !!productId,
  });

  // Generate new inventory optimization
  const optimizationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/seller/inventory-optimizations/${productId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Inventory optimization generated",
        description: "Your inventory optimization has been successfully generated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/inventory-optimizations", productId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate inventory optimization",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Apply inventory optimization
  const applyMutation = useMutation({
    mutationFn: async (optimizationId: number) => {
      const res = await apiRequest("POST", `/api/seller/inventory-optimizations/${optimizationId}/apply`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Inventory updated",
        description: "The recommended stock level has been applied to your product",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/inventory-optimizations", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update inventory",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Reject inventory optimization
  const rejectMutation = useMutation({
    mutationFn: async (optimizationId: number) => {
      const res = await apiRequest("PUT", `/api/seller/inventory-optimizations/${optimizationId}/status`, {
        status: "rejected"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Inventory optimization rejected",
        description: "The inventory optimization has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/inventory-optimizations", productId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to reject inventory optimization",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div>Inventory Optimization</div>
            <Button 
              size="sm" 
              onClick={() => optimizationMutation.mutate()}
              disabled={optimizationMutation.isPending}
            >
              {optimizationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate New Optimization
            </Button>
          </CardTitle>
          <CardDescription>
            ML-powered inventory recommendations to prevent stockouts and reduce excess inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : optimizations && optimizations.length > 0 ? (
            <div className="space-y-6">
              {optimizations.map((optimization: any) => (
                <Card key={optimization.id} className="border border-border">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Inventory Optimization {new Date(optimization.createdAt).toLocaleDateString()}
                      </CardTitle>
                      <Badge
                        className={
                          optimization.status === "applied"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : optimization.status === "rejected"
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        }
                      >
                        {optimization.status.charAt(0).toUpperCase() + optimization.status.slice(1)}
                      </Badge>
                    </div>
                    {optimization.appliedAt && (
                      <CardDescription>
                        Applied on {new Date(optimization.appliedAt).toLocaleDateString()}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-primary/5 rounded-md p-4">
                        <div className="text-sm text-muted-foreground mb-1">Current Stock</div>
                        <div className="text-2xl font-bold">
                          {product?.stock || optimization.currentStock} units
                        </div>
                      </div>
                      <div className="bg-primary/5 rounded-md p-4">
                        <div className="text-sm text-muted-foreground mb-1">Recommended Stock</div>
                        <div className="text-2xl font-bold">
                          {optimization.recommendedStock} units
                        </div>
                      </div>
                      <div className="bg-primary/5 rounded-md p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          Stock Change
                        </div>
                        <div className={`text-2xl font-bold`}>
                          {optimization.recommendedStock > (product?.stock || optimization.currentStock) ? '+' : ''}
                          {optimization.recommendedStock - (product?.stock || optimization.currentStock)} units
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Restocking Advice</h3>
                        <p className="text-muted-foreground">
                          {optimization.restockingAdvice}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Seasonal Considerations</h3>
                        <p className="text-muted-foreground">
                          {optimization.seasonalConsiderations}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Lead Time Recommendations</h3>
                        <p className="text-muted-foreground">
                          {optimization.leadTimeRecommendations}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  {optimization.status === "pending" && (
                    <CardFooter className="bg-muted/30 border-t border-border flex justify-end gap-3 pt-3">
                      <Button 
                        variant="outline" 
                        onClick={() => rejectMutation.mutate(optimization.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => applyMutation.mutate(optimization.id)}
                        disabled={applyMutation.isPending}
                      >
                        {applyMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Check className="mr-2 h-4 w-4" />
                        Update Inventory
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="inline-flex rounded-full p-3 bg-primary/10 mb-4">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Inventory Optimizations</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Generate your first inventory optimization to get AI-powered stock level recommendations.
              </p>
              <Button 
                onClick={() => optimizationMutation.mutate()}
                disabled={optimizationMutation.isPending}
              >
                {optimizationMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Inventory Optimization
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AIContentTab({ productId }: { productId: number }) {
  const { toast } = useToast();
  const [contentType, setContentType] = useState<string>("description");
  
  // Get AI generated content
  const { data: contents, isLoading } = useQuery({
    queryKey: ["/api/seller/ai-generated-content", productId, contentType],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/seller/ai-generated-content/${productId}?contentType=${contentType}`);
      const data = await res.json();
      return data;
    },
    enabled: !!productId,
  });

  // Get product details
  const { data: product } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      return data;
    },
    enabled: !!productId,
  });

  // Generate new AI content
  const contentMutation = useMutation({
    mutationFn: async () => {
      let originalData = "";
      
      if (product) {
        if (contentType === "description") {
          originalData = product.description || "";
        } else if (contentType === "specifications") {
          originalData = product.specifications || "";
        } else if (contentType === "features") {
          originalData = product.features || "";
        }
      }
      
      const res = await apiRequest("POST", `/api/seller/ai-generated-content/${productId}`, {
        contentType,
        originalData
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Content generated",
        description: `AI-generated ${contentType} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/ai-generated-content", productId, contentType] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate content",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Apply AI content
  const applyMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const res = await apiRequest("POST", `/api/seller/ai-generated-content/${contentId}/apply`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Content applied",
        description: `The AI-generated ${contentType} has been applied to your product`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/ai-generated-content", productId, contentType] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to apply content",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Reject AI content
  const rejectMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const res = await apiRequest("PUT", `/api/seller/ai-generated-content/${contentId}/status`, {
        status: "rejected"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Content rejected",
        description: `The AI-generated ${contentType} has been rejected`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/ai-generated-content", productId, contentType] });
    },
    onError: (error) => {
      toast({
        title: "Failed to reject content",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div>AI Content Generator</div>
            <div className="flex items-center gap-3">
              <select
                className="border border-input rounded-md px-3 py-1 text-sm"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="description">Description</option>
                <option value="specifications">Specifications</option>
                <option value="features">Features</option>
              </select>
              <Button 
                size="sm" 
                onClick={() => contentMutation.mutate()}
                disabled={contentMutation.isPending}
              >
                {contentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Content
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Generate high-quality product content with AI to improve your product listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contents && contents.length > 0 ? (
            <div className="space-y-6">
              <div className="p-4 bg-primary/5 rounded-md mb-4">
                <h3 className="font-medium mb-2 capitalize">Current {contentType}</h3>
                <p className="text-muted-foreground">
                  {contentType === "description" && (product?.description || "No description available")}
                  {contentType === "specifications" && (product?.specifications || "No specifications available")}
                  {contentType === "features" && (product?.features || "No features available")}
                </p>
              </div>
              
              {contents.map((content: any) => (
                <Card key={content.id} className="border border-border">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">
                        AI-Generated {content.contentType}
                      </CardTitle>
                      <Badge
                        className={
                          content.status === "applied"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : content.status === "rejected"
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        }
                      >
                        {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Generated on {new Date(content.createdAt).toLocaleDateString()}
                      {content.appliedAt && ` • Applied on ${new Date(content.appliedAt).toLocaleDateString()}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="p-4 border border-border rounded-md bg-muted/20">
                      <p className="whitespace-pre-line">{content.generatedContent}</p>
                    </div>
                  </CardContent>
                  {content.status === "pending" && (
                    <CardFooter className="bg-muted/30 border-t border-border flex justify-end gap-3 pt-3">
                      <Button 
                        variant="outline" 
                        onClick={() => rejectMutation.mutate(content.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => applyMutation.mutate(content.id)}
                        disabled={applyMutation.isPending}
                      >
                        {applyMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Check className="mr-2 h-4 w-4" />
                        Apply to Product
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="inline-flex rounded-full p-3 bg-primary/10 mb-4">
                <PencilRuler className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 capitalize">No {contentType} Generated</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Generate AI-powered product {contentType} to enhance your product listing and increase conversions.
              </p>
              <Button 
                onClick={() => contentMutation.mutate()}
                disabled={contentMutation.isPending}
              >
                {contentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}