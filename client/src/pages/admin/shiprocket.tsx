import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Truck, Settings, Package, RefreshCw, Link as LinkIcon, CheckCircle2, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ShiprocketSettings {
  email: string;
  password: string;
  defaultCourier: string;
  autoShipEnabled: boolean;
}

export default function ShiprocketPage() {
  const [settings, setSettings] = useState<ShiprocketSettings>({
    email: "",
    password: "",
    defaultCourier: "",
    autoShipEnabled: false
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [loadingPendingOrders, setLoadingPendingOrders] = useState(false);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Shiprocket is connected
    checkConnection();
    
    // Load couriers
    loadCouriers();
    
    // Load pending orders
    loadPendingOrders();
    
    // Load shipments
    loadShipments();
  }, []);

  // Function to check connection status
  const checkConnection = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/shiprocket/status");
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        
        // If connected, also fetch settings
        if (data.connected) {
          const settingsResponse = await apiRequest("GET", "/api/shiprocket/settings");
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            setSettings(settingsData);
          }
        }
      }
    } catch (error) {
      console.error("Error checking Shiprocket connection:", error);
      toast({
        title: "Error",
        description: "Failed to check Shiprocket connection status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load couriers
  const loadCouriers = async () => {
    try {
      setLoadingCouriers(true);
      const response = await apiRequest("GET", "/api/shiprocket/couriers");
      
      if (response.ok) {
        const data = await response.json();
        setCouriers(data);
      }
    } catch (error) {
      console.error("Error loading Shiprocket couriers:", error);
    } finally {
      setLoadingCouriers(false);
    }
  };

  // Function to load pending orders
  const loadPendingOrders = async () => {
    try {
      setLoadingPendingOrders(true);
      const response = await apiRequest("GET", "/api/shiprocket/pending-orders");
      
      if (response.ok) {
        const data = await response.json();
        setPendingOrders(data);
      }
    } catch (error) {
      console.error("Error loading pending orders:", error);
    } finally {
      setLoadingPendingOrders(false);
    }
  };

  // Function to load shipments
  const loadShipments = async () => {
    try {
      setLoadingShipments(true);
      const response = await apiRequest("GET", "/api/shiprocket/shipments");
      
      if (response.ok) {
        const data = await response.json();
        setShipments(data);
      }
    } catch (error) {
      console.error("Error loading shipments:", error);
    } finally {
      setLoadingShipments(false);
    }
  };

  // Function to test connection
  const testConnection = async () => {
    try {
      setIsTesting(true);
      const response = await apiRequest("POST", "/api/shiprocket/test");
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Success",
            description: "Successfully connected to Shiprocket",
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to connect to Shiprocket",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to test Shiprocket connection",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing Shiprocket connection:", error);
      toast({
        title: "Error",
        description: "Failed to test Shiprocket connection",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Function to save settings
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await apiRequest("POST", "/api/shiprocket/settings", settings);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Shiprocket settings saved successfully",
        });
        
        // Refresh connection status
        checkConnection();
      } else {
        toast({
          title: "Error",
          description: "Failed to save Shiprocket settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving Shiprocket settings:", error);
      toast({
        title: "Error",
        description: "Failed to save Shiprocket settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to push order to Shiprocket
  const pushOrderToShiprocket = async (orderId: number) => {
    try {
      const response = await apiRequest("POST", `/api/orders/${orderId}/shiprocket`);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Order pushed to Shiprocket successfully",
        });
        
        // Refresh pending orders and shipments
        loadPendingOrders();
        loadShipments();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to push order to Shiprocket",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error pushing order to Shiprocket:", error);
      toast({
        title: "Error",
        description: "Failed to push order to Shiprocket",
        variant: "destructive",
      });
    }
  };

  // Function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // Function to handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setSettings(prev => ({ ...prev, autoShipEnabled: checked }));
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Truck className="mr-2 h-8 w-8" />
          Shiprocket Management
        </h1>

        <Tabs defaultValue="settings">
          <TabsList className="mb-4">
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Pending Orders
            </TabsTrigger>
            <TabsTrigger value="shipments" className="flex items-center">
              <Truck className="mr-2 h-4 w-4" />
              Shipments
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Shiprocket Settings</CardTitle>
                <CardDescription>
                  Configure your Shiprocket integration settings here
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center mb-6 p-4 rounded-md bg-muted">
                      <div className="mr-4">
                        {isConnected ? (
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">
                          {isConnected ? "Connected to Shiprocket" : "Not Connected to Shiprocket"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {isConnected
                            ? `Connected as ${settings.email}`
                            : "Enter your Shiprocket credentials below to connect"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            placeholder="shiprocket@example.com"
                            value={settings.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder={settings.password ? "********" : "Enter password"}
                            value={settings.password}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="defaultCourier">Default Courier</Label>
                          <Input
                            id="defaultCourier"
                            name="defaultCourier"
                            placeholder="e.g., Delhivery, DTDC"
                            value={settings.defaultCourier}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Switch
                            id="autoShipEnabled"
                            checked={settings.autoShipEnabled}
                            onCheckedChange={handleSwitchChange}
                          />
                          <Label htmlFor="autoShipEnabled">Auto-ship new orders</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button onClick={saveSettings} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Settings"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={testConnection}
                        disabled={isTesting || !settings.email || !settings.password}
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {isConnected && !loadingCouriers && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Available Couriers</CardTitle>
                  <CardDescription>
                    List of available courier services from Shiprocket
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {couriers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Courier Name</TableHead>
                          <TableHead>Serviceable Zones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {couriers.map((courier) => (
                          <TableRow key={courier.id}>
                            <TableCell className="font-medium">{courier.name}</TableCell>
                            <TableCell>{courier.serviceable_zones}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      No couriers available
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pending Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Pending Orders</CardTitle>
                    <CardDescription>
                      Orders ready to be shipped through Shiprocket
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPendingOrders}
                    disabled={loadingPendingOrders}
                  >
                    {loadingPendingOrders ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPendingOrders ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>{formatDate(order.date)}</TableCell>
                          <TableCell>
                            {typeof order.shippingDetails === 'string'
                              ? JSON.parse(order.shippingDetails).name
                              : order.shippingDetails.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.status === 'processing' ? 'default' : 'outline'}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{order.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/orders/${order.id}`, '_blank')}
                              >
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => pushOrderToShiprocket(order.id)}
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Ship
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-10 text-muted-foreground">
                    No pending orders to ship
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Shipments</CardTitle>
                    <CardDescription>
                      Track your shipments processed through Shiprocket
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadShipments}
                    disabled={loadingShipments}
                  >
                    {loadingShipments ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingShipments ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : shipments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shipment ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Courier</TableHead>
                        <TableHead>Tracking ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((shipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell className="font-medium">{shipment.id}</TableCell>
                          <TableCell>{shipment.order_id}</TableCell>
                          <TableCell>{formatDate(shipment.created_at)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                shipment.status === 'Delivered'
                                  ? 'success'
                                  : shipment.status === 'Shipped'
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              {shipment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{shipment.courier}</TableCell>
                          <TableCell>{shipment.tracking_id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-10 text-muted-foreground">
                    No shipments found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}