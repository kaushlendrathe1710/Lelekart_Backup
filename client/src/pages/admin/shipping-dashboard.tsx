import React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart4
} from 'lucide-react';

const ShippingDashboard = () => {
  // Sample data - in a real app, this would come from an API
  const shippingStats = {
    pendingShipments: 14,
    inTransit: 23,
    delivered: 198,
    exceptions: 3,
    totalOrders: 238
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shipping Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor all shipment activities from a single view
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Download Report</Button>
            <Button>Refresh Data</Button>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippingStats.pendingShipments}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippingStats.inTransit}</div>
              <p className="text-xs text-muted-foreground">
                Currently in delivery
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippingStats.delivered}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippingStats.exceptions}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shipment Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Activity</CardTitle>
            <CardDescription>
              Shipment status distribution over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-2">
                <BarChart4 className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">Shipment activity chart will be displayed here</p>
                <p className="text-xs text-muted-foreground">Connect to Shiprocket API to visualize real data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Shipments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Shipments</CardTitle>
            <CardDescription>
              Most recent shipment activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">Order ID</div>
                <div className="col-span-3">Customer</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Actions</div>
              </div>
              
              {/* Sample recent shipments - in a real app, map through API data */}
              <div className="grid grid-cols-12 gap-4 items-center py-3 border-t">
                <div className="col-span-3 font-medium">#ORD-5893</div>
                <div className="col-span-3">Deepak Singh</div>
                <div className="col-span-2 text-sm">2025-04-15</div>
                <div className="col-span-2">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800">
                    In Transit
                  </span>
                </div>
                <div className="col-span-2">
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-4 items-center py-3 border-t">
                <div className="col-span-3 font-medium">#ORD-5892</div>
                <div className="col-span-3">Riya Patel</div>
                <div className="col-span-2 text-sm">2025-04-15</div>
                <div className="col-span-2">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                    Delivered
                  </span>
                </div>
                <div className="col-span-2">
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-4 items-center py-3 border-t">
                <div className="col-span-3 font-medium">#ORD-5891</div>
                <div className="col-span-3">Amit Kumar</div>
                <div className="col-span-2 text-sm">2025-04-14</div>
                <div className="col-span-2">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                    Pending
                  </span>
                </div>
                <div className="col-span-2">
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-4 items-center py-3 border-t">
                <div className="col-span-3 font-medium">#ORD-5890</div>
                <div className="col-span-3">Priya Sharma</div>
                <div className="col-span-2 text-sm">2025-04-14</div>
                <div className="col-span-2">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">
                    Exception
                  </span>
                </div>
                <div className="col-span-2">
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-4 items-center py-3 border-t">
                <div className="col-span-3 font-medium">#ORD-5889</div>
                <div className="col-span-3">Raj Malhotra</div>
                <div className="col-span-2 text-sm">2025-04-13</div>
                <div className="col-span-2">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                    Delivered
                  </span>
                </div>
                <div className="col-span-2">
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ShippingDashboard;