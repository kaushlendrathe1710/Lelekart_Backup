import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Truck, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Search,
  RefreshCw,
  Download,
  BarChart4
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Mock data for the dashboard
const mockStatistics = {
  totalShipments: 352,
  completedShipments: 284,
  pendingShipments: 43,
  failedShipments: 25,
  avgDeliveryTime: "2.4 days",
  onTimeDeliveryRate: 93,
};

const mockRecentShipments = [
  {
    id: "SHP12345",
    orderId: "ORD98765",
    date: "2025-04-17",
    status: "delivered",
    customerName: "Amit Kumar",
    destination: "Mumbai, MH",
    service: "Shiprocket Express",
  },
  {
    id: "SHP12344",
    orderId: "ORD98764",
    date: "2025-04-16",
    status: "in_transit",
    customerName: "Priya Sharma",
    destination: "Delhi, DL",
    service: "Shiprocket Standard",
  },
  {
    id: "SHP12343",
    orderId: "ORD98763",
    date: "2025-04-16",
    status: "processing",
    customerName: "Rahul Singh",
    destination: "Bengaluru, KA",
    service: "Shiprocket Economy",
  },
  {
    id: "SHP12342",
    orderId: "ORD98762",
    date: "2025-04-15",
    status: "delivered",
    customerName: "Ananya Patel",
    destination: "Chennai, TN",
    service: "Shiprocket Premium",
  },
  {
    id: "SHP12341",
    orderId: "ORD98761",
    date: "2025-04-15",
    status: "failed",
    customerName: "Vikram Reddy",
    destination: "Hyderabad, TS",
    service: "Shiprocket Express",
  },
];

const statusColors = {
  delivered: "bg-green-100 text-green-800",
  in_transit: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  canceled: "bg-gray-100 text-gray-800",
};

const statusText = {
  delivered: "Delivered",
  in_transit: "In Transit",
  processing: "Processing",
  failed: "Failed",
  canceled: "Canceled",
};

export default function ShippingDashboard() {
  const [dateRange, setDateRange] = useState("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleRefresh = () => {
    // In a real implementation, this would refetch the data
    console.log("Refreshing data...");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  const handleDownloadReport = () => {
    console.log("Downloading report...");
    // In a real implementation, this would trigger a download
  };

  // Filter the shipments based on search term and status
  const filteredShipments = mockRecentShipments.filter((shipment) => {
    const matchesSearch =
      searchTerm === "" ||
      shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Shipping Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Select
              value={dateRange}
              onValueChange={setDateRange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Shipment Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {mockStatistics.totalShipments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total Shipments
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Completed</span>
                  <span>{mockStatistics.completedShipments}</span>
                </div>
                <Progress
                  value={(mockStatistics.completedShipments / mockStatistics.totalShipments) * 100}
                  className="h-1 bg-gray-200"
                />
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Pending</span>
                  <span>{mockStatistics.pendingShipments}</span>
                </div>
                <Progress
                  value={(mockStatistics.pendingShipments / mockStatistics.totalShipments) * 100}
                  className="h-1 bg-gray-200"
                />
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Failed</span>
                  <span>{mockStatistics.failedShipments}</span>
                </div>
                <Progress
                  value={(mockStatistics.failedShipments / mockStatistics.totalShipments) * 100}
                  className="h-1 bg-gray-200"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                On-Time Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {mockStatistics.onTimeDeliveryRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    On-Time Delivery Rate
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress
                  value={mockStatistics.onTimeDeliveryRate}
                  className="h-2"
                />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Avg. Delivery Time</span>
                  <span>{mockStatistics.avgDeliveryTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Shipping by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {mockStatistics.pendingShipments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pending Shipments
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-xs flex-1">Delivered</span>
                  <span className="text-xs font-medium">
                    {((mockStatistics.completedShipments / mockStatistics.totalShipments) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-xs flex-1">In Transit</span>
                  <span className="text-xs font-medium">
                    {((mockStatistics.pendingShipments / 2 / mockStatistics.totalShipments) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-xs flex-1">Processing</span>
                  <span className="text-xs font-medium">
                    {((mockStatistics.pendingShipments / 2 / mockStatistics.totalShipments) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-xs flex-1">Failed</span>
                  <span className="text-xs font-medium">
                    {((mockStatistics.failedShipments / mockStatistics.totalShipments) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Shipments */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Shipments</CardTitle>
              <div className="flex items-center space-x-2">
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search shipments..."
                    className="max-w-[220px]"
                  />
                  <Button variant="ghost" type="submit" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">{shipment.id}</TableCell>
                    <TableCell>{shipment.orderId}</TableCell>
                    <TableCell>{shipment.date}</TableCell>
                    <TableCell>{shipment.customerName}</TableCell>
                    <TableCell>{shipment.destination}</TableCell>
                    <TableCell>{shipment.service}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[shipment.status as keyof typeof statusColors]}
                      >
                        {statusText[shipment.status as keyof typeof statusText]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredShipments.length} of {mockRecentShipments.length} shipments
            </div>
            <Button variant="outline" size="sm">
              View All Shipments
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}