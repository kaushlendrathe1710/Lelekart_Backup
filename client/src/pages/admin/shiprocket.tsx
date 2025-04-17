import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, Truck, Package, RefreshCw, ExternalLink, Settings, AlertCircle, CheckCircle, Info } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

// Validation schema for Shiprocket credentials
const shiprocketCredentialsSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Validation schema for shipment settings
const shipmentSettingsSchema = z.object({
  autoShipOrders: z.boolean().default(false),
  defaultCourier: z.string().optional(),
  returnAddress: z.string().min(10, { message: "Return address is required" }),
  preferredCouriers: z.string().optional(),
  notifyCustomers: z.boolean().default(true),
});

export default function ShiprocketIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isShipmentDialogOpen, setIsShipmentDialogOpen] = useState(false);
  
  // Check if Shiprocket is connected
  const {
    data: connectionStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['/api/shiprocket/status'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/shiprocket/status');
        if (!res.ok) {
          return { connected: false, message: 'Not connected' };
        }
        return res.json();
      } catch (error) {
        console.error('Error checking connection:', error);
        return { connected: false, message: 'Error checking connection' };
      }
    },
  });
  
  // Fetch Shiprocket couriers
  const {
    data: couriers,
    isLoading: isLoadingCouriers,
  } = useQuery({
    queryKey: ['/api/shiprocket/couriers'],
    queryFn: async () => {
      const res = await fetch('/api/shiprocket/couriers');
      if (!res.ok) {
        throw new Error('Failed to fetch couriers');
      }
      return res.json();
    },
    enabled: connectionStatus?.connected === true,
  });
  
  // Fetch recent shipments
  const {
    data: recentShipments,
    isLoading: isLoadingShipments,
    refetch: refetchShipments,
  } = useQuery({
    queryKey: ['/api/shiprocket/shipments'],
    queryFn: async () => {
      const res = await fetch('/api/shiprocket/shipments');
      if (!res.ok) {
        throw new Error('Failed to fetch shipments');
      }
      return res.json();
    },
    enabled: connectionStatus?.connected === true,
  });
  
  // Fetch orders ready for shipping
  const {
    data: pendingOrders,
    isLoading: isLoadingPendingOrders,
    refetch: refetchPendingOrders,
  } = useQuery({
    queryKey: ['/api/orders/pending-shipment'],
    queryFn: async () => {
      const res = await fetch('/api/orders/pending-shipment');
      if (!res.ok) {
        throw new Error('Failed to fetch pending orders');
      }
      return res.json();
    },
  });
  
  // Fetch Shiprocket settings
  const {
    data: settings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['/api/shiprocket/settings'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/shiprocket/settings');
        if (!res.ok) {
          // Return default settings if none exist
          return {
            autoShipOrders: false,
            notifyCustomers: true,
            defaultCourier: '',
            returnAddress: '',
            preferredCouriers: '',
          };
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching settings:', error);
        return {
          autoShipOrders: false,
          notifyCustomers: true,
          defaultCourier: '',
          returnAddress: '',
          preferredCouriers: '',
        };
      }
    },
  });
  
  // Credentials form setup
  const credentialsForm = useForm<z.infer<typeof shiprocketCredentialsSchema>>({
    resolver: zodResolver(shiprocketCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Settings form setup
  const settingsForm = useForm<z.infer<typeof shipmentSettingsSchema>>({
    resolver: zodResolver(shipmentSettingsSchema),
    defaultValues: {
      autoShipOrders: false,
      defaultCourier: "",
      returnAddress: "",
      preferredCouriers: "",
      notifyCustomers: true,
    },
  });
  
  // Update the settings form when settings are loaded
  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        autoShipOrders: settings.autoShipOrders || false,
        defaultCourier: settings.defaultCourier || "",
        returnAddress: settings.returnAddress || "",
        preferredCouriers: settings.preferredCouriers || "",
        notifyCustomers: settings.notifyCustomers || true,
      });
    }
  }, [settings, settingsForm]);
  
  // Connect to Shiprocket
  const connectMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof shiprocketCredentialsSchema>) => {
      const res = await fetch('/api/shiprocket/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to connect to Shiprocket');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Connection Successful',
        description: 'Successfully connected to Shiprocket API.',
      });
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Save Shiprocket settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shipmentSettingsSchema>) => {
      const res = await fetch('/api/shiprocket/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Saved',
        description: 'Shiprocket settings have been updated successfully.',
      });
      setIsSettingsDialogOpen(false);
      refetchSettings();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Push order to Shiprocket
  const pushOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await fetch(`/api/orders/${orderId}/shiprocket`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to push order to Shiprocket');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Order Pushed',
        description: 'Order has been successfully pushed to Shiprocket.',
      });
      refetchPendingOrders();
      refetchShipments();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Test Shiprocket connection
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await fetch('/api/shiprocket/test-connection');
      if (!res.ok) {
        throw new Error('Connection test failed');
      }
      
      const data = await res.json();
      toast({
        title: 'Connection Test',
        description: data.message || 'Connection to Shiprocket API is working.',
      });
    } catch (error) {
      toast({
        title: 'Connection Test Failed',
        description: 'Could not connect to Shiprocket API. Please check your credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  // Handle shipment dialog for an order
  const handleShipOrder = (order: any) => {
    setSelectedOrder(order);
    setIsShipmentDialogOpen(true);
  };
  
  // Handle submission of credentials form
  const onSubmitCredentials = (values: z.infer<typeof shiprocketCredentialsSchema>) => {
    connectMutation.mutate(values);
  };
  
  // Handle submission of settings form
  const onSubmitSettings = (values: z.infer<typeof shipmentSettingsSchema>) => {
    saveSettingsMutation.mutate(values);
  };
  
  // Manual refresh of data
  const refreshData = () => {
    refetchStatus();
    refetchShipments();
    refetchPendingOrders();
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Shiprocket Integration</h1>
            <p className="text-muted-foreground">
              Manage your Shiprocket shipping integration and settings
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={isLoadingStatus || isLoadingShipments || isLoadingPendingOrders}
            >
              {(isLoadingStatus || isLoadingShipments || isLoadingPendingOrders) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setIsSettingsDialogOpen(true)}
              disabled={!connectionStatus?.connected}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            
            <Button 
              variant="default"
              onClick={() => window.open('https://shiprocket.in/login/', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Shiprocket Dashboard
            </Button>
          </div>
        </div>
        
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Shiprocket Connection Status
            </CardTitle>
            <CardDescription>
              Connect your store with Shiprocket for seamless order shipping and tracking
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoadingStatus ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : connectionStatus?.connected ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Connected to Shiprocket</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Your store is successfully connected to Shiprocket. You can now manage shipments, track orders, and configure shipping settings.
                    </p>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={testConnection}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Not Connected</span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Connect your Shiprocket account to start shipping orders automatically. You'll need your Shiprocket email and password.
                </p>
                
                <Form {...credentialsForm}>
                  <form onSubmit={credentialsForm.handleSubmit(onSubmitCredentials)} className="space-y-4">
                    <FormField
                      control={credentialsForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shiprocket Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your Shiprocket email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={credentialsForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shiprocket Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your Shiprocket password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={connectMutation.isPending}
                      className="mt-2"
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Truck className="h-4 w-4 mr-2" />
                      )}
                      Connect to Shiprocket
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Main Content Tabs */}
        {connectionStatus?.connected && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="shipments">Shipments</TabsTrigger>
              <TabsTrigger value="pending">Pending Orders</TabsTrigger>
            </TabsList>
            
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Shipments Overview Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Shipments</CardTitle>
                    <CardDescription>Recent shipment activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {isLoadingShipments ? (
                        <span className="text-muted-foreground text-lg">Loading...</span>
                      ) : (
                        recentShipments?.length || 0
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Total shipments</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Latest:</span>{" "}
                        {isLoadingShipments ? 
                          "Loading..." : 
                          recentShipments?.length ? 
                            formatDate(recentShipments[0].created_at || recentShipments[0].date) : 
                            "No shipments"
                        }
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab("shipments")}
                      >
                        View All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Pending Orders Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pending Orders</CardTitle>
                    <CardDescription>Orders ready for shipping</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {isLoadingPendingOrders ? (
                        <span className="text-muted-foreground text-lg">Loading...</span>
                      ) : (
                        pendingOrders?.length || 0
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Orders pending shipment</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">
                          {pendingOrders?.length ? "Ready to ship" : "No orders pending"}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab("pending")}
                      >
                        View Orders
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Settings Status Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Settings</CardTitle>
                    <CardDescription>Shipping configuration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Auto-ship orders:</span>
                        <Badge variant={settings?.autoShipOrders ? "default" : "outline"}>
                          {settings?.autoShipOrders ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Customer notifications:</span>
                        <Badge variant={settings?.notifyCustomers ? "default" : "outline"}>
                          {settings?.notifyCustomers ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Default courier:</span>
                        <span className="text-sm truncate max-w-[140px]">
                          {settings?.defaultCourier || "Not set"}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => setIsSettingsDialogOpen(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Shipment Activity</CardTitle>
                  <CardDescription>
                    Latest shipments and order fulfillment events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingShipments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : recentShipments?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Courier</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Tracking</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentShipments.slice(0, 5).map((shipment: any) => (
                          <TableRow key={shipment.id}>
                            <TableCell className="font-medium">#{shipment.order_id}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                shipment.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                shipment.status === 'In Transit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                shipment.status === 'Pickup Scheduled' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }>
                                {shipment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{shipment.courier_name || 'Not assigned'}</TableCell>
                            <TableCell>{formatDate(shipment.created_at || shipment.date)}</TableCell>
                            <TableCell>
                              {shipment.tracking_number ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(shipment.tracking_url || `https://shiprocket.in/tracking/${shipment.tracking_number}`, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Track
                                </Button>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not available</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-2 opacity-20" />
                      <p className="text-muted-foreground">No shipment history found</p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Start shipping your orders with Shiprocket to see the activity here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Shipments Tab */}
            <TabsContent value="shipments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Shipments</CardTitle>
                  <CardDescription>
                    View and track all your Shiprocket shipments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingShipments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : recentShipments?.length ? (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Courier</TableHead>
                              <TableHead>Tracking ID</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentShipments.map((shipment: any) => (
                              <TableRow key={shipment.id}>
                                <TableCell className="font-medium">#{shipment.order_id}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    shipment.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                    shipment.status === 'In Transit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    shipment.status === 'Pickup Scheduled' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }>
                                    {shipment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{shipment.courier_name || 'Not assigned'}</TableCell>
                                <TableCell>{shipment.tracking_number || 'Not available'}</TableCell>
                                <TableCell>{formatDate(shipment.created_at || shipment.date)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {shipment.tracking_number && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => window.open(shipment.tracking_url || `https://shiprocket.in/tracking/${shipment.tracking_number}`, '_blank')}
                                      >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Track
                                      </Button>
                                    )}
                                    
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => window.open(`/admin/orders/${shipment.order_id}`, '_blank')}
                                    >
                                      <Info className="h-4 w-4 mr-1" />
                                      Details
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-2 opacity-20" />
                      <p className="text-muted-foreground">No shipment history found</p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Start shipping your orders with Shiprocket to see them listed here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Pending Orders Tab */}
            <TabsContent value="pending" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Orders</CardTitle>
                  <CardDescription>
                    Orders that are ready to be shipped via Shiprocket
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPendingOrders ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : pendingOrders?.length ? (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingOrders.map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>
                                  {typeof order.shippingDetails === 'string' 
                                    ? JSON.parse(order.shippingDetails).name 
                                    : order.shippingDetails?.name || 'Unknown'}
                                </TableCell>
                                <TableCell>{formatDate(order.date)}</TableCell>
                                <TableCell>₹{order.total.toFixed(2)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => pushOrderMutation.mutate(order.id)}
                                      disabled={pushOrderMutation.isPending}
                                    >
                                      {pushOrderMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      ) : (
                                        <Truck className="h-4 w-4 mr-1" />
                                      )}
                                      Ship Now
                                    </Button>
                                    
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => window.open(`/admin/orders/${order.id}`, '_blank')}
                                    >
                                      <Info className="h-4 w-4 mr-1" />
                                      Details
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mb-2 opacity-20" />
                      <p className="text-muted-foreground">No orders pending shipment</p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        All orders have been processed or there are no new orders to ship.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shiprocket Settings</DialogTitle>
            <DialogDescription>
              Configure your Shiprocket shipping preferences and defaults
            </DialogDescription>
          </DialogHeader>
          
          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSubmitSettings)} className="space-y-4">
              <FormField
                control={settingsForm.control}
                name="autoShipOrders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-ship Orders</FormLabel>
                      <FormDescription>
                        Automatically ship orders when they are paid
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={settingsForm.control}
                name="defaultCourier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Courier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a courier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No default (auto-select)</SelectItem>
                        {couriers?.map((courier: any) => (
                          <SelectItem key={courier.id} value={courier.name}>
                            {courier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Preferred courier for shipping your orders
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={settingsForm.control}
                name="returnAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your return address"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Address where returns should be sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={settingsForm.control}
                name="preferredCouriers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Couriers (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DTDC, Delhivery, BlueDart"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Prioritize these couriers when shipping
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={settingsForm.control}
                name="notifyCustomers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Notify Customers</FormLabel>
                      <FormDescription>
                        Send shipping updates to customers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSettingsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}