import React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Filter, 
  Package, 
  MoreVertical,
  Truck,
  AlertTriangle,
  Check,
  Calendar,
  FileText,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PendingShipmentsPage = () => {
  // Sample data - in a real app, this would come from an API
  const pendingShipments = [
    { 
      id: 'ORD-5893', 
      customer: 'Deepak Singh', 
      date: '2025-04-15', 
      items: 3, 
      total: '₹4,590',
      address: 'Mumbai, Maharashtra',
      status: 'Ready to Ship',
      fulfillmentStatus: 'pending',
      paymentStatus: 'paid'
    },
    { 
      id: 'ORD-5890', 
      customer: 'Priya Sharma', 
      date: '2025-04-15', 
      items: 1, 
      total: '₹1,200',
      address: 'Bangalore, Karnataka',
      status: 'Processing',
      fulfillmentStatus: 'processing',
      paymentStatus: 'paid'
    },
    { 
      id: 'ORD-5885', 
      customer: 'Rajesh Kumar', 
      date: '2025-04-14', 
      items: 2, 
      total: '₹3,450',
      address: 'Delhi, Delhi',
      status: 'Ready to Ship',
      fulfillmentStatus: 'pending',
      paymentStatus: 'paid'
    },
    { 
      id: 'ORD-5882', 
      customer: 'Neha Patel', 
      date: '2025-04-14', 
      items: 4, 
      total: '₹6,700',
      address: 'Ahmedabad, Gujarat',
      status: 'Payment Issue',
      fulfillmentStatus: 'pending',
      paymentStatus: 'failed'
    },
    { 
      id: 'ORD-5878', 
      customer: 'Amit Singh', 
      date: '2025-04-13', 
      items: 2, 
      total: '₹2,340',
      address: 'Chennai, Tamil Nadu',
      status: 'Ready to Ship',
      fulfillmentStatus: 'pending',
      paymentStatus: 'paid'
    },
    { 
      id: 'ORD-5875', 
      customer: 'Sneha Reddy', 
      date: '2025-04-12', 
      items: 1, 
      total: '₹990',
      address: 'Hyderabad, Telangana',
      status: 'Processing',
      fulfillmentStatus: 'processing',
      paymentStatus: 'paid'
    },
    { 
      id: 'ORD-5870', 
      customer: 'Vikram Malhotra', 
      date: '2025-04-12', 
      items: 3, 
      total: '₹5,670',
      address: 'Jaipur, Rajasthan',
      status: 'Ready to Ship',
      fulfillmentStatus: 'pending',
      paymentStatus: 'paid'
    },
    { 
      id: 'ORD-5865', 
      customer: 'Meera Iyer', 
      date: '2025-04-11', 
      items: 1, 
      total: '₹2,100',
      address: 'Kochi, Kerala',
      status: 'Address Issue',
      fulfillmentStatus: 'pending',
      paymentStatus: 'paid'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'ready to ship':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent">Ready to Ship</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent">Processing</Badge>;
      case 'payment issue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-transparent">Payment Issue</Badge>;
      case 'address issue':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-transparent">Address Issue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-transparent">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pending Shipments</h1>
            <p className="text-muted-foreground">
              Manage and process orders awaiting shipment
            </p>
          </div>
          <div className="flex space-x-2">
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Ship Selected
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by order ID, customer name, or address..."
                  className="pl-8 w-full"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem>Ready to Ship</DropdownMenuItem>
                  <DropdownMenuItem>Processing</DropdownMenuItem>
                  <DropdownMenuItem>Payment Issues</DropdownMenuItem>
                  <DropdownMenuItem>Address Issues</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Awaiting Shipment</CardTitle>
            <CardDescription>
              {pendingShipments.length} orders pending shipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  </TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Shipping Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingShipments.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-gray-300"
                        disabled={order.status.toLowerCase() !== 'ready to ship'} 
                      />
                    </TableCell>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {order.date}
                      </div>
                    </TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell>{order.total}</TableCell>
                    <TableCell>{order.address}</TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {order.status.toLowerCase() === 'ready to ship' && (
                            <DropdownMenuItem>
                              <Truck className="h-4 w-4 mr-2" />
                              Ship Now
                            </DropdownMenuItem>
                          )}
                          {order.status.toLowerCase() === 'payment issue' && (
                            <DropdownMenuItem>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Resolve Payment
                            </DropdownMenuItem>
                          )}
                          {order.status.toLowerCase() === 'address issue' && (
                            <DropdownMenuItem>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Edit Address
                            </DropdownMenuItem>
                          )}
                          {order.status.toLowerCase() === 'processing' && (
                            <DropdownMenuItem>
                              <Check className="h-4 w-4 mr-2" />
                              Mark as Ready
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing <strong>1-8</strong> of <strong>24</strong> orders
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PendingShipmentsPage;