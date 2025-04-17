import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  MapPin, 
  Calendar,
  FileText,
  AlertTriangle,
  Check,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const CreateShipmentPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(window.location.search);
  const orderId = queryParams.get('orderId');
  
  const [selectedOrder, setSelectedOrder] = useState<string | null>(orderId);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [packageWeight, setPackageWeight] = useState<string>('');
  const [packageDimensions, setPackageDimensions] = useState({ length: '', width: '', height: '' });
  const [isInsurance, setIsInsurance] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Fetch orders ready to ship
  const { 
    data: pendingOrders,
    isLoading: isLoadingOrders
  } = useQuery({
    queryKey: ['/api/shiprocket/pending-orders'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/shiprocket/pending-orders');
        if (!res.ok) throw new Error('Failed to fetch pending orders');
        return res.json();
      } catch (error) {
        console.error('Error fetching pending orders:', error);
        return [];
      }
    }
  });

  // Fetch available couriers
  const { 
    data: couriers,
    isLoading: isLoadingCouriers
  } = useQuery({
    queryKey: ['/api/shiprocket/couriers'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/shiprocket/couriers');
        if (!res.ok) throw new Error('Failed to fetch couriers');
        return res.json();
      } catch (error) {
        console.error('Error fetching couriers:', error);
        // Return some sample data for demonstration
        return [
          { id: 1, name: 'Shiprocket', serviceable_zones: 'Nationwide' },
          { id: 2, name: 'Delhivery', serviceable_zones: 'Nationwide' },
          { id: 3, name: 'BlueDart', serviceable_zones: 'Urban Areas' },
          { id: 4, name: 'DTDC', serviceable_zones: 'Nationwide' },
          { id: 5, name: 'FedEx', serviceable_zones: 'International' }
        ];
      }
    }
  });

  // If an order ID is provided in the URL, fetch that specific order
  const { 
    data: orderDetails,
    isLoading: isLoadingOrderDetails
  } = useQuery({
    queryKey: ['/api/orders', selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return null;
      
      try {
        const res = await apiRequest('GET', `/api/orders/${selectedOrder}`);
        if (!res.ok) throw new Error('Failed to fetch order details');
        return res.json();
      } catch (error) {
        console.error('Error fetching order details:', error);
        // Return some sample data for the selected order
        return {
          id: selectedOrder,
          customer: 'Deepak Singh',
          items: [
            { name: 'Smartphone XYZ', quantity: 1 },
            { name: 'Bluetooth Headphones', quantity: 1 },
            { name: 'Phone Case', quantity: 2 }
          ],
          shipping: {
            address: 'Flat 501, Sunrise Tower',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India'
          }
        };
      }
    },
    enabled: !!selectedOrder
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/shiprocket/create-shipment', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create shipment');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Shipment Created',
        description: 'The shipment has been created successfully.',
        variant: 'default',
      });
      
      // Redirect to shipping dashboard after successful creation
      setTimeout(() => {
        setLocation('/admin/shipping-dashboard');
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: 'Failed to Create Shipment',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleCreateShipment = () => {
    if (!selectedOrder) {
      toast({
        title: 'Order Required',
        description: 'Please select an order to ship.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCourier) {
      toast({
        title: 'Courier Required',
        description: 'Please select a courier service.',
        variant: 'destructive',
      });
      return;
    }

    const shipmentData = {
      orderId: selectedOrder,
      courier: selectedCourier,
      packageDetails: {
        weight: packageWeight || '1',
        dimensions: {
          length: packageDimensions.length || '10',
          width: packageDimensions.width || '10',
          height: packageDimensions.height || '10'
        }
      },
      insurance: isInsurance,
      notes: notes
    };

    createShipmentMutation.mutate(shipmentData);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Create Shipment</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Select Order */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Order Selection
              </CardTitle>
              <CardDescription>
                Select the order you want to create a shipment for
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orderId ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <p className="font-medium">Order #{orderId}</p>
                      {orderDetails && (
                        <>
                          <p className="text-sm text-muted-foreground">Customer: {orderDetails.customer}</p>
                          <p className="text-sm text-muted-foreground">
                            Items: {orderDetails.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                          </p>
                        </>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                      Change
                    </Button>
                  </div>
                  
                  {orderDetails && (
                    <div className="p-4 border rounded-md bg-muted/50">
                      <p className="font-medium mb-2">Shipping Address:</p>
                      <p className="text-sm">{orderDetails.shipping.address}</p>
                      <p className="text-sm">{orderDetails.shipping.city}, {orderDetails.shipping.state} {orderDetails.shipping.postalCode}</p>
                      <p className="text-sm">{orderDetails.shipping.country}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Label htmlFor="order">Select Order</Label>
                  <Select value={selectedOrder || ''} onValueChange={setSelectedOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {!isLoadingOrders && pendingOrders ? (
                        pendingOrders.map((order: any) => (
                          <SelectItem key={order.id} value={order.id}>
                            #{order.id} - {order.customer} ({order.items.length} items)
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="ORD-5893">ORD-5893 - Deepak Singh (3 items)</SelectItem>
                          <SelectItem value="ORD-5885">ORD-5885 - Rajesh Kumar (2 items)</SelectItem>
                          <SelectItem value="ORD-5878">ORD-5878 - Amit Singh (2 items)</SelectItem>
                          <SelectItem value="ORD-5870">ORD-5870 - Vikram Malhotra (3 items)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Status */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order Selected</p>
                    <p className="text-sm text-muted-foreground">Order ready for shipping</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full ${selectedCourier ? 'bg-green-100' : 'bg-muted'} flex items-center justify-center`}>
                    {selectedCourier ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Truck className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Courier Selection</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCourier ? `Selected: ${selectedCourier}` : 'Choose a courier service'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center`}>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Package Details</p>
                    <p className="text-sm text-muted-foreground">
                      Enter package information
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courier Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-4 w-4 mr-2" />
              Courier Selection
            </CardTitle>
            <CardDescription>
              Select the courier service you want to use for this shipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedCourier} onValueChange={setSelectedCourier} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!isLoadingCouriers && couriers ? (
                couriers.map((courier: any) => (
                  <div key={courier.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={courier.name} id={`courier-${courier.id}`} />
                    <Label 
                      htmlFor={`courier-${courier.id}`}
                      className="cursor-pointer flex flex-col space-y-1"
                    >
                      <span className="font-medium">{courier.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Coverage: {courier.serviceable_zones}
                      </span>
                    </Label>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="Shiprocket" id="courier-1" />
                    <Label 
                      htmlFor="courier-1"
                      className="cursor-pointer flex flex-col space-y-1"
                    >
                      <span className="font-medium">Shiprocket</span>
                      <span className="text-sm text-muted-foreground">
                        Coverage: Nationwide
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="Delhivery" id="courier-2" />
                    <Label 
                      htmlFor="courier-2"
                      className="cursor-pointer flex flex-col space-y-1"
                    >
                      <span className="font-medium">Delhivery</span>
                      <span className="text-sm text-muted-foreground">
                        Coverage: Nationwide
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="BlueDart" id="courier-3" />
                    <Label 
                      htmlFor="courier-3"
                      className="cursor-pointer flex flex-col space-y-1"
                    >
                      <span className="font-medium">BlueDart</span>
                      <span className="text-sm text-muted-foreground">
                        Coverage: Urban Areas
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="DTDC" id="courier-4" />
                    <Label 
                      htmlFor="courier-4"
                      className="cursor-pointer flex flex-col space-y-1"
                    >
                      <span className="font-medium">DTDC</span>
                      <span className="text-sm text-muted-foreground">
                        Coverage: Nationwide
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="FedEx" id="courier-5" />
                    <Label 
                      htmlFor="courier-5"
                      className="cursor-pointer flex flex-col space-y-1"
                    >
                      <span className="font-medium">FedEx</span>
                      <span className="text-sm text-muted-foreground">
                        Coverage: International
                      </span>
                    </Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Package Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Package Details
            </CardTitle>
            <CardDescription>
              Enter details about the package for accurate shipping
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="weight">Package Weight (kg)</Label>
                  <Input 
                    id="weight" 
                    type="number" 
                    placeholder="1.0" 
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox 
                    id="insurance" 
                    checked={isInsurance}
                    onCheckedChange={(checked) => setIsInsurance(checked as boolean)}
                  />
                  <Label htmlFor="insurance" className="cursor-pointer">
                    Add shipping insurance
                  </Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Package Dimensions (cm)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="length" className="text-sm">Length</Label>
                    <Input 
                      id="length" 
                      type="number" 
                      placeholder="10"
                      value={packageDimensions.length}
                      onChange={(e) => setPackageDimensions({...packageDimensions, length: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="width" className="text-sm">Width</Label>
                    <Input 
                      id="width" 
                      type="number" 
                      placeholder="10"
                      value={packageDimensions.width}
                      onChange={(e) => setPackageDimensions({...packageDimensions, width: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-sm">Height</Label>
                    <Input 
                      id="height" 
                      type="number" 
                      placeholder="10"
                      value={packageDimensions.height}
                      onChange={(e) => setPackageDimensions({...packageDimensions, height: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Label htmlFor="notes">Special Instructions</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any special handling instructions or notes for the courier..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateShipment}
              disabled={!selectedOrder || !selectedCourier || createShipmentMutation.isPending}
            >
              {createShipmentMutation.isPending ? 'Creating Shipment...' : 'Create Shipment'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CreateShipmentPage;