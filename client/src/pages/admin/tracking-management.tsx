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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Search, 
  RefreshCw, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Calendar,
  MapPin,
  MessageSquare,
  ExternalLink,
  Loader2,
  History
} from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Mock data for tracking entries
const mockTrackingEntries = [
  {
    id: "TRK12345",
    orderId: "ORD98765",
    shipmentId: "SHP45678",
    trackingNumber: "IND123456789",
    carrier: "shiprocket",
    status: "delivered",
    lastUpdate: "2025-04-16T14:35:00",
    customerName: "Amit Kumar",
    destination: "Mumbai, MH",
    expectedDelivery: "2025-04-16",
    hasIssues: false,
  },
  {
    id: "TRK12344",
    orderId: "ORD98764",
    shipmentId: "SHP45677",
    trackingNumber: "IND123456788",
    carrier: "shiprocket",
    status: "in_transit",
    lastUpdate: "2025-04-17T09:23:00",
    customerName: "Priya Sharma",
    destination: "Delhi, DL",
    expectedDelivery: "2025-04-18",
    hasIssues: false,
  },
  {
    id: "TRK12343",
    orderId: "ORD98763",
    shipmentId: "SHP45676",
    trackingNumber: "IND123456787",
    carrier: "shiprocket",
    status: "out_for_delivery",
    lastUpdate: "2025-04-17T08:45:00",
    customerName: "Rahul Singh",
    destination: "Bengaluru, KA",
    expectedDelivery: "2025-04-17",
    hasIssues: false,
  },
  {
    id: "TRK12342",
    orderId: "ORD98762",
    shipmentId: "SHP45675",
    trackingNumber: "IND123456786",
    carrier: "shiprocket",
    status: "delayed",
    lastUpdate: "2025-04-15T18:12:00",
    customerName: "Ananya Patel",
    destination: "Chennai, TN",
    expectedDelivery: "2025-04-16",
    hasIssues: true,
  },
  {
    id: "TRK12341",
    orderId: "ORD98761",
    shipmentId: "SHP45674",
    trackingNumber: "IND123456785",
    carrier: "shiprocket",
    status: "exception",
    lastUpdate: "2025-04-14T16:50:00",
    customerName: "Vikram Reddy",
    destination: "Hyderabad, TS",
    expectedDelivery: "2025-04-15",
    hasIssues: true,
  },
];

// Mock data for tracking events (for a specific shipment)
const mockTrackingEvents = [
  {
    id: 1,
    trackingId: "TRK12345",
    timestamp: "2025-04-16T14:35:00",
    location: "Mumbai, MH",
    status: "delivered",
    description: "Package delivered to customer",
    notes: "Signed by: A. Kumar",
  },
  {
    id: 2,
    trackingId: "TRK12345",
    timestamp: "2025-04-16T09:12:00",
    location: "Mumbai, MH",
    status: "out_for_delivery",
    description: "Package is out for delivery",
    notes: "",
  },
  {
    id: 3,
    trackingId: "TRK12345",
    timestamp: "2025-04-15T18:45:00",
    location: "Mumbai, MH",
    status: "in_transit",
    description: "Package arrived at local facility",
    notes: "",
  },
  {
    id: 4,
    trackingId: "TRK12345",
    timestamp: "2025-04-14T20:30:00",
    location: "Delhi, DL",
    status: "in_transit",
    description: "Package departed sorting facility",
    notes: "",
  },
  {
    id: 5,
    trackingId: "TRK12345",
    timestamp: "2025-04-14T14:22:00",
    location: "Delhi, DL",
    status: "in_transit",
    description: "Package arrived at sorting facility",
    notes: "",
  },
  {
    id: 6,
    trackingId: "TRK12345",
    timestamp: "2025-04-13T16:15:00",
    location: "Gurugram, HR",
    status: "picked_up",
    description: "Package picked up from seller",
    notes: "",
  },
  {
    id: 7,
    trackingId: "TRK12345",
    timestamp: "2025-04-13T10:05:00",
    location: "Gurugram, HR",
    status: "info_received",
    description: "Shipping information received",
    notes: "",
  }
];

// Status colors and text
const statusColors = {
  delivered: "bg-green-100 text-green-800",
  in_transit: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  info_received: "bg-gray-100 text-gray-800",
  delayed: "bg-yellow-100 text-yellow-800",
  exception: "bg-red-100 text-red-800",
};

const statusText = {
  delivered: "Delivered",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  picked_up: "Picked Up",
  info_received: "Info Received",
  delayed: "Delayed",
  exception: "Exception",
};

export default function TrackingManagementPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [issueFilter, setIssueFilter] = useState("all");
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [isManualUpdateDialogOpen, setIsManualUpdateDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // In a real implementation, this would refetch the data
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Tracking data refreshed",
        description: "All tracking information has been updated from carriers."
      });
    }, 1500);
  };

  const handleSelectTracking = (trackingId: string) => {
    setSelectedTracking(trackingId);
    setIsDetailDialogOpen(true);
  };

  const handleManualUpdate = () => {
    // In a real implementation, this would add a manual update
    toast({
      title: "Manual update added",
      description: "The tracking update has been recorded successfully."
    });
    setIsManualUpdateDialogOpen(false);
  };

  // Filter the tracking entries based on search term, status, and issues
  const filteredTrackingEntries = mockTrackingEntries.filter((entry) => {
    const matchesSearch =
      searchTerm === "" ||
      entry.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || entry.status === statusFilter;

    const matchesIssues =
      issueFilter === "all" ||
      (issueFilter === "with_issues" && entry.hasIssues) ||
      (issueFilter === "no_issues" && !entry.hasIssues);

    return matchesSearch && matchesStatus && matchesIssues;
  });

  // Get tracking events for a specific tracking ID
  const getTrackingEvents = (trackingId: string) => {
    return mockTrackingEvents.filter((event) => event.trackingId === trackingId);
  };

  // Format timestamp to a readable date and time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get the selected tracking entry
  const selectedTrackingEntry = selectedTracking
    ? mockTrackingEntries.find((entry) => entry.id === selectedTracking)
    : null;

  // Get the tracking events for the selected tracking
  const selectedTrackingEvents = selectedTracking
    ? getTrackingEvents(selectedTracking)
    : [];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tracking Management</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={() => setIsManualUpdateDialogOpen(true)}>
              Add Manual Update
            </Button>
          </div>
        </div>

        {/* Tabs for different tracking views */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Shipments</TabsTrigger>
            <TabsTrigger value="active">Active Shipments</TabsTrigger>
            <TabsTrigger value="issues">Shipments with Issues</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Shipment Tracking</CardTitle>
                  <div className="flex items-center space-x-2">
                    <form onSubmit={handleSearch} className="flex items-center space-x-2">
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search tracking, order..."
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
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="exception">Exception</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={issueFilter}
                      onValueChange={setIssueFilter}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Issues" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Shipments</SelectItem>
                        <SelectItem value="with_issues">With Issues</SelectItem>
                        <SelectItem value="no_issues">No Issues</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardDescription>
                  Track and manage all shipments in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrackingEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {entry.hasIssues && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1.5" />
                            )}
                            {entry.trackingNumber}
                          </div>
                        </TableCell>
                        <TableCell>{entry.orderId}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[entry.status as keyof typeof statusColors]}
                          >
                            {statusText[entry.status as keyof typeof statusText]}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.customerName}</TableCell>
                        <TableCell>{entry.destination}</TableCell>
                        <TableCell>{formatTimestamp(entry.lastUpdate)}</TableCell>
                        <TableCell>
                          {formatDate(entry.expectedDelivery)}
                          {entry.status === "delayed" && (
                            <span className="text-yellow-500 ml-1.5">
                              (Delayed)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectTracking(entry.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredTrackingEntries.length} of {mockTrackingEntries.length} shipments
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Shipments</CardTitle>
                <CardDescription>
                  Track shipments that are currently in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTrackingEntries
                      .filter((entry) => entry.status !== "delivered")
                      .map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {entry.hasIssues && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1.5" />
                              )}
                              {entry.trackingNumber}
                            </div>
                          </TableCell>
                          <TableCell>{entry.orderId}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusColors[entry.status as keyof typeof statusColors]}
                            >
                              {statusText[entry.status as keyof typeof statusText]}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.customerName}</TableCell>
                          <TableCell>{entry.destination}</TableCell>
                          <TableCell>{formatTimestamp(entry.lastUpdate)}</TableCell>
                          <TableCell>
                            {formatDate(entry.expectedDelivery)}
                            {entry.status === "delayed" && (
                              <span className="text-yellow-500 ml-1.5">
                                (Delayed)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectTracking(entry.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle>Shipments with Issues</CardTitle>
                <CardDescription>
                  Track shipments that have delays or exceptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTrackingEntries
                      .filter((entry) => entry.hasIssues)
                      .map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1.5" />
                              {entry.trackingNumber}
                            </div>
                          </TableCell>
                          <TableCell>{entry.orderId}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusColors[entry.status as keyof typeof statusColors]}
                            >
                              {statusText[entry.status as keyof typeof statusText]}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.customerName}</TableCell>
                          <TableCell>{entry.destination}</TableCell>
                          <TableCell>{formatTimestamp(entry.lastUpdate)}</TableCell>
                          <TableCell>
                            {formatDate(entry.expectedDelivery)}
                            {entry.status === "delayed" && (
                              <span className="text-yellow-500 ml-1.5">
                                (Delayed)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectTracking(entry.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivered">
            <Card>
              <CardHeader>
                <CardTitle>Delivered Shipments</CardTitle>
                <CardDescription>
                  View shipments that have been successfully delivered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTrackingEntries
                      .filter((entry) => entry.status === "delivered")
                      .map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {entry.trackingNumber}
                          </TableCell>
                          <TableCell>{entry.orderId}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusColors[entry.status as keyof typeof statusColors]}
                            >
                              {statusText[entry.status as keyof typeof statusText]}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.customerName}</TableCell>
                          <TableCell>{entry.destination}</TableCell>
                          <TableCell>{formatTimestamp(entry.lastUpdate)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectTracking(entry.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
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

      {/* Tracking Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Shipment Tracking Details
            </DialogTitle>
            <DialogDescription>
              Detailed tracking information for shipment
            </DialogDescription>
          </DialogHeader>

          {selectedTrackingEntry && (
            <div className="space-y-6">
              {/* Shipment Info Card */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Tracking Number</h3>
                  <p className="font-medium">{selectedTrackingEntry.trackingNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Carrier</h3>
                  <p className="font-medium capitalize">{selectedTrackingEntry.carrier}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Order ID</h3>
                  <p>{selectedTrackingEntry.orderId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Shipment ID</h3>
                  <p>{selectedTrackingEntry.shipmentId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                  <Badge
                    variant="outline"
                    className={statusColors[selectedTrackingEntry.status as keyof typeof statusColors]}
                  >
                    {statusText[selectedTrackingEntry.status as keyof typeof statusText]}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Expected Delivery</h3>
                  <p>
                    {formatDate(selectedTrackingEntry.expectedDelivery)}
                    {selectedTrackingEntry.status === "delayed" && (
                      <span className="text-yellow-500 ml-1.5">
                        (Delayed)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
                  <p>{selectedTrackingEntry.customerName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Destination</h3>
                  <p>{selectedTrackingEntry.destination}</p>
                </div>
              </div>

              <Separator />

              {/* Tracking Timeline */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Tracking History</h3>
                <div className="space-y-4">
                  {selectedTrackingEvents.map((event, index) => (
                    <div key={event.id} className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className={`rounded-full p-1 ${
                          index === 0 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        }`}>
                          {index === 0 ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                          )}
                        </div>
                        {index < selectedTrackingEvents.length - 1 && (
                          <div className="h-full w-px bg-muted-foreground/20 my-1" />
                        )}
                      </div>
                      <div className="pb-5">
                        <div className="flex">
                          <p className="font-medium">{event.description}</p>
                          <Badge
                            variant="outline"
                            className={`ml-2 ${statusColors[event.status as keyof typeof statusColors]}`}
                          >
                            {statusText[event.status as keyof typeof statusText]}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatTimestamp(event.timestamp)}</span>
                          <MapPin className="h-3 w-3 mx-1 ml-3" />
                          <span>{event.location}</span>
                        </div>
                        {event.notes && (
                          <div className="text-sm mt-1 bg-muted p-2 rounded-md">
                            <span className="text-muted-foreground">Note: </span>
                            {event.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsManualUpdateDialogOpen(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Add Manual Update
                </Button>
                <Button 
                  variant="outline"
                  className="text-primary" 
                  onClick={() => window.open(`https://track.shiprocket.co/?awb=${selectedTrackingEntry.trackingNumber}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Carrier Site
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Update Dialog */}
      <Dialog open={isManualUpdateDialogOpen} onOpenChange={setIsManualUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Manual Tracking Update</DialogTitle>
            <DialogDescription>
              Add a manual update to the tracking history
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedTracking && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tracking Number</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tracking number" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTrackingEntries.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.trackingNumber} ({entry.orderId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="exception">Exception</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input placeholder="e.g. Mumbai, MH" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="e.g. Package arrived at local facility" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea placeholder="Any additional information..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualUpdate}>
              Add Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}