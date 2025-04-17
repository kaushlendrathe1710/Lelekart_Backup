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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  Filter,
  MoreHorizontal,
  PlayCircle,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Mock data for pending shipments
const mockPendingShipments = [
  {
    id: "SHP12350",
    orderId: "ORD98770",
    date: "2025-04-17",
    status: "processing",
    customerName: "Ravi Sharma",
    destination: "Pune, MH",
    service: "Shiprocket Express",
    items: 3,
    value: 2499,
    priority: "high",
  },
  {
    id: "SHP12349",
    orderId: "ORD98769",
    date: "2025-04-17",
    status: "ready_to_ship",
    customerName: "Neha Gupta",
    destination: "Kolkata, WB",
    service: "Shiprocket Standard",
    items: 1,
    value: 999,
    priority: "medium",
  },
  {
    id: "SHP12348",
    orderId: "ORD98768",
    date: "2025-04-16",
    status: "label_created",
    customerName: "Suresh Patel",
    destination: "Ahmedabad, GJ",
    service: "Shiprocket Economy",
    items: 2,
    value: 1299,
    priority: "low",
  },
  {
    id: "SHP12347",
    orderId: "ORD98767",
    date: "2025-04-16",
    status: "pending_pickup",
    customerName: "Divya Singh",
    destination: "Lucknow, UP",
    service: "Shiprocket Premium",
    items: 4,
    value: 3599,
    priority: "high",
  },
  {
    id: "SHP12346",
    orderId: "ORD98766",
    date: "2025-04-15",
    status: "processing",
    customerName: "Karan Malhotra",
    destination: "Jaipur, RJ",
    service: "Shiprocket Express",
    items: 2,
    value: 1799,
    priority: "medium",
  },
  {
    id: "SHP12345",
    orderId: "ORD98765",
    date: "2025-04-15",
    status: "ready_to_ship",
    customerName: "Anjali Verma",
    destination: "Chandigarh, CH",
    service: "Shiprocket Standard",
    items: 1,
    value: 899,
    priority: "low",
  },
  {
    id: "SHP12344",
    orderId: "ORD98764",
    date: "2025-04-14",
    status: "label_created",
    customerName: "Rajesh Kumar",
    destination: "Bhopal, MP",
    service: "Shiprocket Economy",
    items: 3,
    value: 2199,
    priority: "medium",
  },
  {
    id: "SHP12343",
    orderId: "ORD98763",
    date: "2025-04-14",
    status: "pending_pickup",
    customerName: "Meera Reddy",
    destination: "Hyderabad, TS",
    service: "Shiprocket Premium",
    items: 2,
    value: 1499,
    priority: "high",
  },
];

const statusColors = {
  processing: "bg-yellow-100 text-yellow-800",
  ready_to_ship: "bg-green-100 text-green-800",
  label_created: "bg-blue-100 text-blue-800",
  pending_pickup: "bg-purple-100 text-purple-800",
};

const statusText = {
  processing: "Processing",
  ready_to_ship: "Ready to Ship",
  label_created: "Label Created",
  pending_pickup: "Pending Pickup",
};

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-blue-100 text-blue-800",
};

export default function PendingShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [processingShipmentId, setProcessingShipmentId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  const handleRefresh = () => {
    // In a real implementation, this would refetch the data
    console.log("Refreshing data...");
  };

  const handleBulkProcess = () => {
    if (selectedShipments.length === 0) {
      toast({
        title: "No shipments selected",
        description: "Please select at least one shipment to process.",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, this would process the selected shipments
    console.log("Processing shipments:", selectedShipments);
    
    toast({
      title: "Shipments processed",
      description: `${selectedShipments.length} shipments have been processed successfully.`,
    });
    
    setSelectedShipments([]);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(filteredShipments.map((shipment) => shipment.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const toggleSelectShipment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments([...selectedShipments, id]);
    } else {
      setSelectedShipments(selectedShipments.filter((shipmentId) => shipmentId !== id));
    }
  };

  const handleProcessShipment = (id: string) => {
    setProcessingShipmentId(id);
    setIsProcessingDialogOpen(true);
  };

  const confirmProcessShipment = () => {
    // In a real implementation, this would process the shipment
    console.log("Processing shipment:", processingShipmentId);
    
    toast({
      title: "Shipment processed",
      description: `Shipment ${processingShipmentId} has been processed successfully.`,
    });
    
    setIsProcessingDialogOpen(false);
    setProcessingShipmentId(null);
  };

  // Filter the shipments based on search term, status, and priority
  const filteredShipments = mockPendingShipments.filter((shipment) => {
    const matchesSearch =
      searchTerm === "" ||
      shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || shipment.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" || shipment.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pending Shipments</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleBulkProcess}>
              Process Selected ({selectedShipments.length})
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Processing
                </p>
                <p className="text-2xl font-bold">
                  {mockPendingShipments.filter(s => s.status === 'processing').length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ready to Ship
                </p>
                <p className="text-2xl font-bold">
                  {mockPendingShipments.filter(s => s.status === 'ready_to_ship').length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Label Created
                </p>
                <p className="text-2xl font-bold">
                  {mockPendingShipments.filter(s => s.status === 'label_created').length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Pickup
                </p>
                <p className="text-2xl font-bold">
                  {mockPendingShipments.filter(s => s.status === 'pending_pickup').length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Shipments Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pending Shipments</CardTitle>
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
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                    <SelectItem value="label_created">Label Created</SelectItem>
                    <SelectItem value="pending_pickup">Pending Pickup</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedShipments.length === filteredShipments.length && filteredShipments.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Shipment ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedShipments.includes(shipment.id)}
                        onCheckedChange={(checked) => toggleSelectShipment(shipment.id, !!checked)}
                        aria-label={`Select shipment ${shipment.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{shipment.id}</TableCell>
                    <TableCell>{shipment.orderId}</TableCell>
                    <TableCell>{shipment.date}</TableCell>
                    <TableCell>{shipment.customerName}</TableCell>
                    <TableCell>{shipment.destination}</TableCell>
                    <TableCell>{shipment.items}</TableCell>
                    <TableCell>₹{shipment.value.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[shipment.status as keyof typeof statusColors]}
                      >
                        {statusText[shipment.status as keyof typeof statusText]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={priorityColors[shipment.priority as keyof typeof priorityColors]}
                      >
                        {shipment.priority.charAt(0).toUpperCase() + shipment.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleProcessShipment(shipment.id)}>
                            <PlayCircle className="mr-2 h-4 w-4" /> Process Shipment
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Shipment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredShipments.length} of {mockPendingShipments.length} pending shipments
            </div>
            <Button variant="outline" size="sm">
              View All Shipments
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Processing Dialog */}
      <Dialog open={isProcessingDialogOpen} onOpenChange={setIsProcessingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to process shipment {processingShipmentId}?
              This will move the shipment to the next stage in the shipping process.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmProcessShipment}>
              Process Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}