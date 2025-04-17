import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  DollarSign, 
  Edit, 
  Trash2, 
  Plus,
  MapPin,
  Clock,
  Search,
  RefreshCw,
  Download,
  PackageCheck
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

// Define validation schema for shipping rate
const shippingRateSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(0, { message: "Base price must be a positive number" }),
  weightPrice: z.coerce.number().min(0, { message: "Weight price must be a positive number" }),
  distanceFactor: z.coerce.number().min(0, { message: "Distance factor must be a positive number" }),
  estimatedDays: z.string().min(1, { message: "Estimated days is required" }),
  serviceType: z.string().min(1, { message: "Service type is required" }),
  isActive: z.boolean().default(true),
});

// Mock data for shipping rates
const mockShippingRates = [
  {
    id: 1,
    name: "Standard Shipping",
    description: "Regular shipping service for most products",
    basePrice: 99,
    weightPrice: 20,
    distanceFactor: 0.1,
    estimatedDays: "3-5",
    serviceType: "regular",
    isActive: true,
  },
  {
    id: 2,
    name: "Express Shipping",
    description: "Fast shipping service with priority handling",
    basePrice: 199,
    weightPrice: 30,
    distanceFactor: 0.15,
    estimatedDays: "1-2",
    serviceType: "express",
    isActive: true,
  },
  {
    id: 3,
    name: "Economy Shipping",
    description: "Budget-friendly shipping option with longer delivery time",
    basePrice: 49,
    weightPrice: 15,
    distanceFactor: 0.05,
    estimatedDays: "5-7",
    serviceType: "economy",
    isActive: true,
  },
  {
    id: 4,
    name: "Same Day Delivery",
    description: "Ultra-fast delivery within the same day for eligible locations",
    basePrice: 299,
    weightPrice: 40,
    distanceFactor: 0.2,
    estimatedDays: "0-1",
    serviceType: "premium",
    isActive: false,
  },
  {
    id: 5,
    name: "International Shipping",
    description: "Shipping service for international destinations",
    basePrice: 699,
    weightPrice: 50,
    distanceFactor: 0.25,
    estimatedDays: "7-14",
    serviceType: "international",
    isActive: true,
  }
];

// Mock data for shipping zones
const mockShippingZones = [
  {
    id: 1,
    name: "Metro Cities",
    description: "Major metropolitan cities",
    regions: "Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad",
    isActive: true,
  },
  {
    id: 2,
    name: "Tier 2 Cities",
    description: "Secondary urban centers",
    regions: "Pune, Ahmedabad, Jaipur, Lucknow, Kochi, Chandigarh",
    isActive: true,
  },
  {
    id: 3,
    name: "Tier 3 Cities",
    description: "Smaller urban centers",
    regions: "Nagpur, Indore, Coimbatore, Vishakapatnam, Bhopal",
    isActive: true,
  },
  {
    id: 4,
    name: "Rural Areas",
    description: "Rural and remote locations",
    regions: "All other locations",
    isActive: true,
  },
  {
    id: 5,
    name: "International Zone 1",
    description: "Neighboring countries",
    regions: "Nepal, Bhutan, Bangladesh, Sri Lanka",
    isActive: true,
  }
];

// Mock data for zone-specific rates
const mockZoneRates = [
  {
    id: 1,
    rateId: 1,
    zoneId: 1,
    additionalCharge: 0,
    additionalDays: "0",
    isActive: true,
  },
  {
    id: 2,
    rateId: 1,
    zoneId: 2,
    additionalCharge: 20,
    additionalDays: "1",
    isActive: true,
  },
  {
    id: 3,
    rateId: 1,
    zoneId: 3,
    additionalCharge: 50,
    additionalDays: "1-2",
    isActive: true,
  },
  {
    id: 4,
    rateId: 1,
    zoneId: 4,
    additionalCharge: 100,
    additionalDays: "2-3",
    isActive: true,
  },
  {
    id: 5,
    rateId: 2,
    zoneId: 1,
    additionalCharge: 0,
    additionalDays: "0",
    isActive: true,
  },
  {
    id: 6,
    rateId: 2,
    zoneId: 2,
    additionalCharge: 30,
    additionalDays: "0-1",
    isActive: true,
  },
  {
    id: 7,
    rateId: 2,
    zoneId: 3,
    additionalCharge: 70,
    additionalDays: "1",
    isActive: true,
  },
  {
    id: 8,
    rateId: 3,
    zoneId: 1,
    additionalCharge: 0,
    additionalDays: "0",
    isActive: true,
  }
];

const serviceTypeColors = {
  regular: "bg-blue-100 text-blue-800",
  express: "bg-green-100 text-green-800",
  economy: "bg-yellow-100 text-yellow-800",
  premium: "bg-purple-100 text-purple-800",
  international: "bg-orange-100 text-orange-800",
};

const serviceTypeText = {
  regular: "Regular",
  express: "Express",
  economy: "Economy",
  premium: "Premium",
  international: "International",
};

export default function ShippingRatesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("rates");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  const handleRefresh = () => {
    // In a real implementation, this would refetch the data
    console.log("Refreshing data...");
  };

  // Form setup for shipping rate
  const rateForm = useForm<z.infer<typeof shippingRateSchema>>({
    resolver: zodResolver(shippingRateSchema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: 0,
      weightPrice: 0,
      distanceFactor: 0,
      estimatedDays: "",
      serviceType: "",
      isActive: true,
    },
  });

  // Reset rate form when selected rate changes
  const resetRateForm = (rate: any = null) => {
    rateForm.reset(
      rate
        ? {
            name: rate.name,
            description: rate.description || "",
            basePrice: rate.basePrice,
            weightPrice: rate.weightPrice,
            distanceFactor: rate.distanceFactor,
            estimatedDays: rate.estimatedDays,
            serviceType: rate.serviceType,
            isActive: rate.isActive,
          }
        : {
            name: "",
            description: "",
            basePrice: 0,
            weightPrice: 0,
            distanceFactor: 0,
            estimatedDays: "",
            serviceType: "",
            isActive: true,
          }
    );
  };

  // Handle opening rate dialog for create/edit
  const handleOpenRateDialog = (rate: any = null) => {
    setSelectedRate(rate);
    resetRateForm(rate);
    setIsRateDialogOpen(true);
  };

  // Handle opening delete confirmation dialog
  const handleOpenDeleteDialog = (id: number) => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submission
  const onSubmitRate = (values: z.infer<typeof shippingRateSchema>) => {
    // In a real implementation, this would update or create a rate
    console.log("Submitting rate:", values);
    
    toast({
      title: `Shipping rate ${selectedRate ? 'updated' : 'created'}`,
      description: `Shipping rate "${values.name}" has been successfully ${selectedRate ? 'updated' : 'created'}.`,
    });
    
    setIsRateDialogOpen(false);
    setSelectedRate(null);
  };

  // Handle rate deletion
  const handleDeleteRate = () => {
    // In a real implementation, this would delete the rate
    console.log("Deleting rate:", itemToDelete);
    
    toast({
      title: "Shipping rate deleted",
      description: "Shipping rate has been successfully deleted.",
    });
    
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Format price from paise/cents to rupees/dollars with currency symbol
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  // Filter the rates based on search term
  const filteredRates = mockShippingRates.filter((rate) => {
    return (
      searchTerm === "" ||
      rate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get zone name by ID
  const getZoneName = (zoneId: number) => {
    const zone = mockShippingZones.find((zone) => zone.id === zoneId);
    return zone ? zone.name : "Unknown Zone";
  };

  // Get rate name by ID
  const getRateName = (rateId: number) => {
    const rate = mockShippingRates.find((rate) => rate.id === rateId);
    return rate ? rate.name : "Unknown Rate";
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Shipping Rates</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => handleOpenRateDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Rate
            </Button>
          </div>
        </div>

        {/* Tabs for different shipping rate views */}
        <Tabs
          defaultValue="rates"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="rates">Shipping Rates</TabsTrigger>
            <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
            <TabsTrigger value="zone-rates">Zone-Specific Rates</TabsTrigger>
            <TabsTrigger value="calculations">Rate Calculator</TabsTrigger>
          </TabsList>

          {/* Shipping Rates Tab */}
          <TabsContent value="rates">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Shipping Rates</CardTitle>
                  <div className="flex items-center space-x-2">
                    <form onSubmit={handleSearch} className="flex items-center space-x-2">
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search rates..."
                        className="max-w-[220px]"
                      />
                      <Button variant="ghost" type="submit" size="icon">
                        <Search className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
                <CardDescription>
                  Manage shipping rates for different service types and delivery speeds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Weight Factor</TableHead>
                      <TableHead>Distance Factor</TableHead>
                      <TableHead>Est. Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">
                          <div>
                            {rate.name}
                            {rate.description && (
                              <p className="text-xs text-muted-foreground">
                                {rate.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={serviceTypeColors[rate.serviceType as keyof typeof serviceTypeColors]}
                          >
                            {serviceTypeText[rate.serviceType as keyof typeof serviceTypeText]}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPrice(rate.basePrice)}</TableCell>
                        <TableCell>₹{rate.weightPrice}/kg</TableCell>
                        <TableCell>×{rate.distanceFactor}</TableCell>
                        <TableCell>{rate.estimatedDays} days</TableCell>
                        <TableCell>
                          <Badge
                            variant={rate.isActive ? "default" : "outline"}
                            className={rate.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {rate.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenRateDialog(rate)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDeleteDialog(rate.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Zones Tab */}
          <TabsContent value="zones">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Zones</CardTitle>
                <CardDescription>
                  Define geographic regions for shipping rate calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Regions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockShippingZones.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell className="font-medium">{zone.name}</TableCell>
                        <TableCell>{zone.description}</TableCell>
                        <TableCell>
                          <span className="line-clamp-1 text-sm" title={zone.regions}>
                            {zone.regions}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={zone.isActive ? "default" : "outline"}
                            className={zone.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {zone.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zone-Specific Rates Tab */}
          <TabsContent value="zone-rates">
            <Card>
              <CardHeader>
                <CardTitle>Zone-Specific Rates</CardTitle>
                <CardDescription>
                  Configure shipping rate adjustments for specific zones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipping Rate</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Additional Charge</TableHead>
                      <TableHead>Additional Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockZoneRates.map((zoneRate) => (
                      <TableRow key={zoneRate.id}>
                        <TableCell className="font-medium">{getRateName(zoneRate.rateId)}</TableCell>
                        <TableCell>{getZoneName(zoneRate.zoneId)}</TableCell>
                        <TableCell>{formatPrice(zoneRate.additionalCharge)}</TableCell>
                        <TableCell>{zoneRate.additionalDays} days</TableCell>
                        <TableCell>
                          <Badge
                            variant={zoneRate.isActive ? "default" : "outline"}
                            className={zoneRate.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {zoneRate.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rate Calculator Tab */}
          <TabsContent value="calculations">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Rate Calculator</CardTitle>
                <CardDescription>
                  Calculate shipping rates based on package details and destination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Package Details</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Weight (kg)</label>
                            <Input type="number" placeholder="0.5" min="0" step="0.1" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Value (₹)</label>
                            <Input type="number" placeholder="1000" min="0" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Length (cm)</label>
                            <Input type="number" placeholder="20" min="0" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Width (cm)</label>
                            <Input type="number" placeholder="15" min="0" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Height (cm)</label>
                            <Input type="number" placeholder="10" min="0" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Destination</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Origin</label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select origin city" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="delhi">Delhi</SelectItem>
                              <SelectItem value="mumbai">Mumbai</SelectItem>
                              <SelectItem value="bengaluru">Bengaluru</SelectItem>
                              <SelectItem value="chennai">Chennai</SelectItem>
                              <SelectItem value="kolkata">Kolkata</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Destination</label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination city" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="delhi">Delhi</SelectItem>
                              <SelectItem value="mumbai">Mumbai</SelectItem>
                              <SelectItem value="bengaluru">Bengaluru</SelectItem>
                              <SelectItem value="chennai">Chennai</SelectItem>
                              <SelectItem value="kolkata">Kolkata</SelectItem>
                              <SelectItem value="hyderabad">Hyderabad</SelectItem>
                              <SelectItem value="pune">Pune</SelectItem>
                              <SelectItem value="jaipur">Jaipur</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full">
                      Calculate Shipping Rates
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Available Shipping Options</h3>
                    <div className="space-y-4">
                      <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                <Truck className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Standard Shipping</h4>
                                <p className="text-sm text-muted-foreground">3-5 days delivery</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">₹149</div>
                              <div className="text-xs text-muted-foreground">
                                Base: ₹99 + Weight: ₹50
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer border-primary hover:bg-primary/5 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                <PackageCheck className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Express Shipping</h4>
                                <p className="text-sm text-muted-foreground">1-2 days delivery</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">₹249</div>
                              <div className="text-xs text-muted-foreground">
                                Base: ₹199 + Weight: ₹50
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                                <Clock className="h-4 w-4 text-yellow-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Economy Shipping</h4>
                                <p className="text-sm text-muted-foreground">5-7 days delivery</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">₹99</div>
                              <div className="text-xs text-muted-foreground">
                                Base: ₹49 + Weight: ₹50
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Shipping Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRate ? "Edit Shipping Rate" : "Add New Shipping Rate"}
            </DialogTitle>
            <DialogDescription>
              {selectedRate
                ? "Update the shipping rate details below"
                : "Fill in the shipping rate details below"}
            </DialogDescription>
          </DialogHeader>
          <Form {...rateForm}>
            <form onSubmit={rateForm.handleSubmit(onSubmitRate)} className="space-y-4">
              <FormField
                control={rateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Standard Shipping" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. Regular shipping service for most products" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={rateForm.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={rateForm.control}
                  name="weightPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight Price (₹/kg)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={rateForm.control}
                  name="distanceFactor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance Factor</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={0.01} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={rateForm.control}
                  name="estimatedDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Days</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 3-5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={rateForm.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                        <SelectItem value="economy">Economy</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rateForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this shipping rate
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedRate ? "Update Rate" : "Create Rate"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipping Rate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shipping rate?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRate}>
              Delete Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}