import React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Package, 
  Eye,
  MapPin,
  RefreshCw,
  Truck,
  CheckCircle
} from 'lucide-react';

const TrackingManagementPage = () => {
  // Sample data - in a real app, this would come from an API
  const activeTrackings = [
    { 
      id: 'TRK-001', 
      orderId: 'ORD-5893', 
      customer: 'Deepak Singh', 
      carrier: 'Shiprocket', 
      trackingNumber: 'SR123456789', 
      status: 'In Transit',
      lastUpdate: '2025-04-15 14:30',
      location: 'Mumbai, MH'
    },
    { 
      id: 'TRK-002', 
      orderId: 'ORD-5890', 
      customer: 'Priya Sharma', 
      carrier: 'Delhivery', 
      trackingNumber: 'DL987654321', 
      status: 'Out for Delivery',
      lastUpdate: '2025-04-15 10:15',
      location: 'Bangalore, KA'
    },
    { 
      id: 'TRK-003', 
      orderId: 'ORD-5885', 
      customer: 'Rajesh Kumar', 
      carrier: 'BlueDart', 
      trackingNumber: 'BD567891234', 
      status: 'In Transit',
      lastUpdate: '2025-04-14 18:45',
      location: 'Delhi, DL'
    },
    { 
      id: 'TRK-004', 
      orderId: 'ORD-5882', 
      customer: 'Neha Patel', 
      carrier: 'DTDC', 
      trackingNumber: 'DT456789123', 
      status: 'Picked Up',
      lastUpdate: '2025-04-14 12:30',
      location: 'Ahmedabad, GJ'
    },
  ];

  const deliveredTrackings = [
    { 
      id: 'TRK-005', 
      orderId: 'ORD-5878', 
      customer: 'Amit Singh', 
      carrier: 'Shiprocket', 
      trackingNumber: 'SR987654321', 
      status: 'Delivered',
      lastUpdate: '2025-04-13 15:20',
      location: 'Chennai, TN'
    },
    { 
      id: 'TRK-006', 
      orderId: 'ORD-5875', 
      customer: 'Sneha Reddy', 
      carrier: 'Delhivery', 
      trackingNumber: 'DL123456789', 
      status: 'Delivered',
      lastUpdate: '2025-04-12 11:45',
      location: 'Hyderabad, TS'
    },
  ];

  const getStatusBadgeClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in transit':
        return 'bg-blue-100 text-blue-800';
      case 'out for delivery':
        return 'bg-purple-100 text-purple-800';
      case 'picked up':
        return 'bg-yellow-100 text-yellow-800';
      case 'exception':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tracking Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage shipment tracking information
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Tracking
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by order ID, tracking number, or customer..."
                  className="pl-8 w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Active and Delivered Shipments */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center">
              <Truck className="h-4 w-4 mr-2" />
              Active Shipments
            </TabsTrigger>
            <TabsTrigger value="delivered" className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Delivered
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Shipments</CardTitle>
                <CardDescription>
                  Shipments currently in transit or awaiting delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTrackings.map((tracking) => (
                      <TableRow key={tracking.id}>
                        <TableCell className="font-medium">{tracking.orderId}</TableCell>
                        <TableCell>{tracking.customer}</TableCell>
                        <TableCell>{tracking.carrier}</TableCell>
                        <TableCell>{tracking.trackingNumber}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClasses(tracking.status)}`}>
                            {tracking.status}
                          </span>
                        </TableCell>
                        <TableCell>{tracking.lastUpdate}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            {tracking.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="delivered" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivered Shipments</CardTitle>
                <CardDescription>
                  Shipments that have been successfully delivered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivered On</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveredTrackings.map((tracking) => (
                      <TableRow key={tracking.id}>
                        <TableCell className="font-medium">{tracking.orderId}</TableCell>
                        <TableCell>{tracking.customer}</TableCell>
                        <TableCell>{tracking.carrier}</TableCell>
                        <TableCell>{tracking.trackingNumber}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClasses(tracking.status)}`}>
                            {tracking.status}
                          </span>
                        </TableCell>
                        <TableCell>{tracking.lastUpdate}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            {tracking.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default TrackingManagementPage;