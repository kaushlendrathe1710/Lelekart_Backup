import React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package,
  Truck,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  Activity,
  ArrowRight
} from 'lucide-react';

const ShippingDashboardPage = () => {
  // Sample data for the dashboard
  const shippingStats = [
    { 
      title: 'Pending Shipments',
      value: '24',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800'
    },
    { 
      title: 'Shipped Today',
      value: '12',
      icon: Truck,
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      title: 'Delivered',
      value: '78',
      icon: ClipboardCheck,
      color: 'bg-green-100 text-green-800'
    },
    { 
      title: 'Issues',
      value: '3',
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800'
    },
  ];

  // Sample recent shipments
  const recentShipments = [
    { 
      id: 'TRK-001', 
      orderId: 'ORD-5893', 
      customer: 'Deepak Singh', 
      carrier: 'Shiprocket', 
      status: 'In Transit',
      sentDate: '2025-04-15'
    },
    { 
      id: 'TRK-002', 
      orderId: 'ORD-5890', 
      customer: 'Priya Sharma', 
      carrier: 'Delhivery', 
      status: 'Out for Delivery',
      sentDate: '2025-04-15'
    },
    { 
      id: 'TRK-003', 
      orderId: 'ORD-5885', 
      customer: 'Rajesh Kumar', 
      carrier: 'BlueDart', 
      status: 'In Transit',
      sentDate: '2025-04-14'
    },
    { 
      id: 'TRK-004', 
      orderId: 'ORD-5882', 
      customer: 'Neha Patel', 
      carrier: 'DTDC', 
      status: 'Picked Up',
      sentDate: '2025-04-14'
    },
    { 
      id: 'TRK-005', 
      orderId: 'ORD-5878', 
      customer: 'Amit Singh', 
      carrier: 'Shiprocket', 
      status: 'Delivered',
      sentDate: '2025-04-13'
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Shipping Dashboard</h1>
          <Button>
            <Truck className="h-4 w-4 mr-2" />
            Create Shipment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {shippingStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    </div>
                    <div className={`p-2 rounded-full ${stat.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Shipping Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Shipping Activity</CardTitle>
              <CardDescription>
                Overview of monthly shipping performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                This Week
              </Button>
              <Button variant="outline" size="sm">
                This Month
              </Button>
              <Button variant="outline" size="sm">
                This Year
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] w-full flex items-center justify-center">
              <div className="flex flex-col items-center text-muted-foreground">
                <Activity className="h-16 w-16 mb-2" />
                <p>Shipping activity chart will appear here</p>
                <p className="text-sm">Showing data for April 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Shipments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Shipments</CardTitle>
              <CardDescription>
                Last 5 shipments processed in the system
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shipped Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">{shipment.id}</TableCell>
                    <TableCell>{shipment.orderId}</TableCell>
                    <TableCell>{shipment.customer}</TableCell>
                    <TableCell>{shipment.carrier}</TableCell>
                    <TableCell>
                      <span 
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          shipment.status === 'Delivered' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : shipment.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : shipment.status === 'Out for Delivery'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}
                      >
                        {shipment.status}
                      </span>
                    </TableCell>
                    <TableCell>{shipment.sentDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Carrier Performance */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Performance</CardTitle>
              <CardDescription>
                Delivery success rates by carrier
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] w-full flex items-center justify-center">
                <div className="flex flex-col items-center text-muted-foreground">
                  <TrendingUp className="h-16 w-16 mb-2" />
                  <p>Carrier performance chart will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Cost Analysis</CardTitle>
              <CardDescription>
                Average shipping costs and trends
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] w-full flex items-center justify-center">
                <div className="flex flex-col items-center text-muted-foreground">
                  <TrendingUp className="h-16 w-16 mb-2" />
                  <p>Shipping cost chart will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShippingDashboardPage;