import React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Package, 
  MoreVertical,
  Truck,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const PendingShipmentsPage = () => {
  // Sample data - in a real app, this would come from an API
  const pendingShipments = [
    { 
      id: 'ORD-5823', 
      customer: 'Rahul Verma', 
      address: '123 Main St, New Delhi, 110001', 
      date: '2025-04-15', 
      items: 3, 
      value: '₹4,200', 
      status: 'Not Processed',
      priority: 'High'
    },
    { 
      id: 'ORD-5822', 
      customer: 'Anjali Sharma', 
      address: '456 Park Ave, Mumbai, 400001', 
      date: '2025-04-15', 
      items: 1, 
      value: '₹1,500', 
      status: 'Processing',
      priority: 'Medium'
    },
    { 
      id: 'ORD-5821', 
      customer: 'Vikram Singh', 
      address: '789 Lake View, Bangalore, 560001', 
      date: '2025-04-14', 
      items: 2, 
      value: '₹2,800', 
      status: 'Ready for Pickup',
      priority: 'Low'
    },
    { 
      id: 'ORD-5820', 
      customer: 'Neha Patel', 
      address: '15 Ring Road, Ahmedabad, 380001', 
      date: '2025-04-14', 
      items: 5, 
      value: '₹7,350', 
      status: 'Not Processed',
      priority: 'High'
    },
    { 
      id: 'ORD-5819', 
      customer: 'Rajesh Kumar', 
      address: '22 MG Road, Chennai, 600001', 
      date: '2025-04-13', 
      items: 1, 
      value: '₹990', 
      status: 'Processing',
      priority: 'Medium'
    },
  ];

  const getPriorityBadgeClasses = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'not processed':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'ready for pickup':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pending Shipments</h1>
            <p className="text-muted-foreground">
              Manage shipments that need processing
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-8 w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="shrink-0">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shrink-0">
                      Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Not Processed</DropdownMenuItem>
                    <DropdownMenuItem>Processing</DropdownMenuItem>
                    <DropdownMenuItem>Ready for Pickup</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shrink-0">
                      Priority
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>High</DropdownMenuItem>
                    <DropdownMenuItem>Medium</DropdownMenuItem>
                    <DropdownMenuItem>Low</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Shipments Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Shipments Awaiting Processing</CardTitle>
              <div className="flex items-center text-muted-foreground">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-sm">5 shipments need attention</span>
              </div>
            </div>
            <CardDescription>
              Process these shipments to prepare them for pickup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">{shipment.id}</TableCell>
                    <TableCell>{shipment.customer}</TableCell>
                    <TableCell className="hidden md:table-cell">{shipment.date}</TableCell>
                    <TableCell className="hidden md:table-cell">{shipment.items}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClasses(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityBadgeClasses(shipment.priority)}`}>
                        {shipment.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Truck className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Print Label</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PendingShipmentsPage;