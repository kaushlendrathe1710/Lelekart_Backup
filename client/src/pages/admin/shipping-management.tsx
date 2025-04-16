import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Loader2,
  MapPin,
  Package,
  PlusCircle,
  Truck,
  Edit,
  Settings,
  Info,
  HelpCircle,
  Globe,
  AlertTriangle,
  TruckIcon,
  Trash2,
  ChevronDown,
  Search,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define validation schema for shipping method
const shippingMethodSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  estimatedDays: z.string().min(1, "Estimated delivery time is required"),
  isActive: z.boolean().default(true),
  icon: z.string().optional(),
});

// Define validation schema for shipping zone
const shippingZoneSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  countries: z.string().min(1, "At least one country is required"),
  states: z.string().optional(),
  cities: z.string().optional(),
  zipCodes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Define validation schema for shipping rule
const shippingRuleSchema = z.object({
  id: z.number().optional(),
  zoneId: z.number().min(1, "Shipping zone is required"),
  methodId: z.number().min(1, "Shipping method is required"),
  price: z.number().nullable().optional(),
  freeShippingThreshold: z.number().nullable().optional(),
  additionalDays: z.number().default(0),
  isActive: z.boolean().default(true),
});

export default function AdminShippingManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("methods");
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: string; id: number | null}>({
    type: '',
    id: null
  });

  // Fetch shipping methods
  const { data: shippingMethods, isLoading: isLoadingMethods } = useQuery({
    queryKey: ['/api/shipping/methods'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/shipping/methods');
        if (!res.ok) {
          throw new Error('Failed to fetch shipping methods');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching shipping methods:', error);
        return [
          { id: 1, name: "Standard Shipping", price: 4000, estimatedDays: "3-5 business days", icon: "truck", isActive: true },
          { id: 2, name: "Express Shipping", price: 9000, estimatedDays: "1-2 business days", icon: "truck-fast", isActive: true },
          { id: 3, name: "Economy Shipping", price: 2900, estimatedDays: "5-8 business days", icon: "truck-slow", isActive: true },
        ];
      }
    }
  });

  // Fetch shipping zones
  const { data: shippingZones, isLoading: isLoadingZones } = useQuery({
    queryKey: ['/api/shipping/zones'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/shipping/zones');
        if (!res.ok) {
          throw new Error('Failed to fetch shipping zones');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching shipping zones:', error);
        return [
          { id: 1, name: "All India", description: "All regions across India", countries: "India", isActive: true },
          { id: 2, name: "North India", description: "Northern states of India", countries: "India", states: "Delhi,Haryana,Punjab,Uttar Pradesh,Himachal Pradesh", isActive: true },
          { id: 3, name: "South India", description: "Southern states of India", countries: "India", states: "Tamil Nadu,Kerala,Karnataka,Andhra Pradesh,Telangana", isActive: true },
          { id: 4, name: "Metro Cities", description: "Major metropolitan cities", countries: "India", cities: "Delhi,Mumbai,Chennai,Kolkata,Bangalore,Hyderabad", isActive: true },
        ];
      }
    }
  });

  // Fetch shipping rules
  const { data: shippingRules, isLoading: isLoadingRules } = useQuery({
    queryKey: ['/api/shipping/rules'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/shipping/rules');
        if (!res.ok) {
          throw new Error('Failed to fetch shipping rules');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching shipping rules:', error);
        return [
          { id: 1, zoneId: 1, methodId: 1, price: 4000, additionalDays: 0, isActive: true },
          { id: 2, zoneId: 1, methodId: 2, price: 9000, additionalDays: 0, isActive: true },
          { id: 3, zoneId: 2, methodId: 1, price: 4500, additionalDays: 1, isActive: true },
          { id: 4, zoneId: 3, methodId: 1, price: 4200, additionalDays: 1, isActive: true },
          { id: 5, zoneId: 4, methodId: 1, price: 3500, freeShippingThreshold: 50000, isActive: true },
        ];
      }
    }
  });

  // Form setup for shipping method
  const methodForm = useForm<z.infer<typeof shippingMethodSchema>>({
    resolver: zodResolver(shippingMethodSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      estimatedDays: "",
      isActive: true,
      icon: "",
    },
  });

  // Form setup for shipping zone
  const zoneForm = useForm<z.infer<typeof shippingZoneSchema>>({
    resolver: zodResolver(shippingZoneSchema),
    defaultValues: {
      name: "",
      description: "",
      countries: "India",
      states: "",
      cities: "",
      zipCodes: "",
      isActive: true,
    },
  });

  // Form setup for shipping rule
  const ruleForm = useForm<z.infer<typeof shippingRuleSchema>>({
    resolver: zodResolver(shippingRuleSchema),
    defaultValues: {
      zoneId: 0,
      methodId: 0,
      price: null,
      freeShippingThreshold: null,
      additionalDays: 0,
      isActive: true,
    },
  });

  // Update form values when editing an existing method
  React.useEffect(() => {
    if (selectedMethod) {
      methodForm.reset({
        id: selectedMethod.id,
        name: selectedMethod.name,
        description: selectedMethod.description || "",
        price: selectedMethod.price,
        estimatedDays: selectedMethod.estimatedDays,
        isActive: selectedMethod.isActive !== false,
        icon: selectedMethod.icon || "",
      });
    } else {
      methodForm.reset({
        name: "",
        description: "",
        price: 0,
        estimatedDays: "",
        isActive: true,
        icon: "",
      });
    }
  }, [selectedMethod, methodForm]);

  // Update form values when editing an existing zone
  React.useEffect(() => {
    if (selectedZone) {
      zoneForm.reset({
        id: selectedZone.id,
        name: selectedZone.name,
        description: selectedZone.description || "",
        countries: selectedZone.countries,
        states: selectedZone.states || "",
        cities: selectedZone.cities || "",
        zipCodes: selectedZone.zipCodes || "",
        isActive: selectedZone.isActive !== false,
      });
    } else {
      zoneForm.reset({
        name: "",
        description: "",
        countries: "India",
        states: "",
        cities: "",
        zipCodes: "",
        isActive: true,
      });
    }
  }, [selectedZone, zoneForm]);

  // Update form values when editing an existing rule
  React.useEffect(() => {
    if (selectedRule) {
      ruleForm.reset({
        id: selectedRule.id,
        zoneId: selectedRule.zoneId,
        methodId: selectedRule.methodId,
        price: selectedRule.price,
        freeShippingThreshold: selectedRule.freeShippingThreshold || null,
        additionalDays: selectedRule.additionalDays || 0,
        isActive: selectedRule.isActive !== false,
      });
    } else {
      ruleForm.reset({
        zoneId: 0,
        methodId: 0,
        price: null,
        freeShippingThreshold: null,
        additionalDays: 0,
        isActive: true,
      });
    }
  }, [selectedRule, ruleForm]);

  // Mutation for saving shipping method
  const saveMethodMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shippingMethodSchema>) => {
      const response = await fetch('/api/shipping/methods', {
        method: data.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save shipping method');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/methods'] });
      toast({
        title: "Success",
        description: "Shipping method saved successfully.",
      });
      setMethodDialogOpen(false);
      setSelectedMethod(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save shipping method: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for saving shipping zone
  const saveZoneMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shippingZoneSchema>) => {
      const response = await fetch('/api/shipping/zones', {
        method: data.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save shipping zone');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/zones'] });
      toast({
        title: "Success",
        description: "Shipping zone saved successfully.",
      });
      setZoneDialogOpen(false);
      setSelectedZone(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save shipping zone: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for saving shipping rule
  const saveRuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shippingRuleSchema>) => {
      const response = await fetch('/api/shipping/rules', {
        method: data.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save shipping rule');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/rules'] });
      toast({
        title: "Success",
        description: "Shipping rule saved successfully.",
      });
      setRuleDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save shipping rule: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting items
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const response = await fetch(`/api/shipping/${type}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/shipping/${variables.type}`] });
      toast({
        title: "Success",
        description: `Item deleted successfully.`,
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle method form submission
  const onSubmitMethod = (values: z.infer<typeof shippingMethodSchema>) => {
    saveMethodMutation.mutate(values);
  };

  // Handle zone form submission
  const onSubmitZone = (values: z.infer<typeof shippingZoneSchema>) => {
    saveZoneMutation.mutate(values);
  };

  // Handle rule form submission
  const onSubmitRule = (values: z.infer<typeof shippingRuleSchema>) => {
    saveRuleMutation.mutate(values);
  };

  // Handle delete confirmation
  const handleDelete = () => {
    if (itemToDelete.id) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  // Format price from paise/cents to rupees/dollars with currency symbol
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  // Find shipping method by ID
  const findShippingMethod = (methodId: number) => {
    return shippingMethods?.find((method: any) => method.id === methodId);
  };

  // Find shipping zone by ID
  const findShippingZone = (zoneId: number) => {
    return shippingZones?.find((zone: any) => zone.id === zoneId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Shipping Management</h1>
            <p className="text-muted-foreground">
              Configure global shipping methods, zones, and rules
            </p>
          </div>
        </div>

        <Tabs defaultValue="methods" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="methods">Methods</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          {/* Methods Tab */}
          <TabsContent value="methods">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Shipping Methods</CardTitle>
                  <CardDescription>
                    Configure available shipping methods across your platform
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedMethod(null);
                    setMethodDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Method
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingMethods ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Delivery Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shippingMethods?.map((method: any) => (
                            <TableRow key={method.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-primary" />
                                  {method.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                {method.description || <span className="text-muted-foreground italic">No description</span>}
                              </TableCell>
                              <TableCell>{formatPrice(method.price)}</TableCell>
                              <TableCell>{method.estimatedDays}</TableCell>
                              <TableCell>
                                {method.isActive !== false ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-gray-200">
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedMethod(method);
                                      setMethodDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500"
                                    onClick={() => {
                                      setItemToDelete({ type: 'methods', id: method.id });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {shippingMethods?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                No shipping methods found. Add your first shipping method.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-md p-4 flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-700">About Shipping Methods</h3>
                        <p className="mt-1 text-sm text-blue-600">
                          Shipping methods define the different delivery options available to customers during checkout.
                          You should provide a variety of shipping methods with different speeds and price points to
                          give customers flexibility in their delivery choices.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zones Tab */}
          <TabsContent value="zones">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Shipping Zones</CardTitle>
                  <CardDescription>
                    Define geographic regions for shipping calculation
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedZone(null);
                    setZoneDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Zone
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingZones ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Countries</TableHead>
                            <TableHead>States/Cities</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shippingZones?.map((zone: any) => (
                            <TableRow key={zone.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  {zone.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                {zone.description || <span className="text-muted-foreground italic">No description</span>}
                              </TableCell>
                              <TableCell>{zone.countries}</TableCell>
                              <TableCell>
                                {zone.states ? (
                                  <span className="text-xs">
                                    States: {zone.states}
                                    {zone.cities && <><br />Cities: {zone.cities}</>}
                                  </span>
                                ) : zone.cities ? (
                                  <span className="text-xs">Cities: {zone.cities}</span>
                                ) : (
                                  <span className="text-muted-foreground italic">All</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {zone.isActive !== false ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-gray-200">
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedZone(zone);
                                      setZoneDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500"
                                    onClick={() => {
                                      setItemToDelete({ type: 'zones', id: zone.id });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {shippingZones?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                No shipping zones found. Add your first shipping zone.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-md p-4 flex items-start gap-3">
                      <Globe className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-purple-700">About Shipping Zones</h3>
                        <p className="mt-1 text-sm text-purple-600">
                          Shipping zones allow you to define different shipping rates based on geographic regions.
                          You can create zones for different countries, states, or cities to provide accurate shipping
                          costs based on customer location. Start with broader zones and refine as needed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Shipping Rules</CardTitle>
                  <CardDescription>
                    Connect shipping methods to zones with specific pricing
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedRule(null);
                    setRuleDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRules || isLoadingMethods || isLoadingZones ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Zone</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Free Shipping Threshold</TableHead>
                            <TableHead>Additional Days</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shippingRules?.map((rule: any) => {
                            const method = findShippingMethod(rule.methodId);
                            const zone = findShippingZone(rule.zoneId);
                            
                            return (
                              <TableRow key={rule.id}>
                                <TableCell>
                                  {zone ? zone.name : `Zone #${rule.zoneId}`}
                                </TableCell>
                                <TableCell>
                                  {method ? method.name : `Method #${rule.methodId}`}
                                </TableCell>
                                <TableCell>
                                  {rule.price !== null ? formatPrice(rule.price) : "Default"}
                                </TableCell>
                                <TableCell>
                                  {rule.freeShippingThreshold ? (
                                    formatPrice(rule.freeShippingThreshold)
                                  ) : (
                                    <span className="text-muted-foreground">None</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {rule.additionalDays > 0 ? `+${rule.additionalDays} days` : "None"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedRule(rule);
                                        setRuleDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span className="sr-only">Edit</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-500"
                                      onClick={() => {
                                        setItemToDelete({ type: 'rules', id: rule.id });
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {shippingRules?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                No shipping rules found. Add your first shipping rule.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-md p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-700">About Shipping Rules</h3>
                        <p className="mt-1 text-sm text-amber-600">
                          Shipping rules connect shipping methods to specific zones, allowing you to override
                          the default pricing for each method based on the delivery location. You can also set
                          free shipping thresholds and additional delivery days for specific zone-method combinations.
                        </p>
                        <p className="mt-2 text-sm text-amber-600">
                          <strong>Note:</strong> You must create shipping methods and zones before creating rules.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Method Dialog */}
        <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedMethod ? "Edit Shipping Method" : "Add Shipping Method"}
              </DialogTitle>
              <DialogDescription>
                {selectedMethod
                  ? "Update the details of this shipping method"
                  : "Create a new shipping method for your platform"}
              </DialogDescription>
            </DialogHeader>
            <Form {...methodForm}>
              <form onSubmit={methodForm.handleSubmit(onSubmitMethod)} className="space-y-4">
                <FormField
                  control={methodForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Standard Shipping" />
                      </FormControl>
                      <FormDescription>
                        The name displayed to customers during checkout
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={methodForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., Regular delivery with tracking"
                          rows={2}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional information about this shipping method
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={methodForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price (₹ in paise/cents)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Base price in paise (1 rupee = 100 paise)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methodForm.control}
                    name="estimatedDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Delivery Time</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 3-5 business days" />
                        </FormControl>
                        <FormDescription>
                          Expected delivery timeframe
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={methodForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., truck, truck-fast" />
                      </FormControl>
                      <FormDescription>
                        Icon identifier (from Lucide icons)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={methodForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable this shipping method for customers
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMethodDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMethodMutation.isPending}
                  >
                    {saveMethodMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedMethod ? "Update Method" : "Add Method"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Zone Dialog */}
        <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedZone ? "Edit Shipping Zone" : "Add Shipping Zone"}
              </DialogTitle>
              <DialogDescription>
                {selectedZone
                  ? "Update the details of this shipping zone"
                  : "Create a new shipping zone for your platform"}
              </DialogDescription>
            </DialogHeader>
            <Form {...zoneForm}>
              <form onSubmit={zoneForm.handleSubmit(onSubmitZone)} className="space-y-4">
                <FormField
                  control={zoneForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., North India" />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this shipping zone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={zoneForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., Northern states of India"
                          rows={2}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional information about this zone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={zoneForm.control}
                  name="countries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Countries</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., India" />
                      </FormControl>
                      <FormDescription>
                        Countries included in this zone (comma-separated)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={zoneForm.control}
                    name="states"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>States (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Delhi,Maharashtra,Karnataka" />
                        </FormControl>
                        <FormDescription>
                          States included in this zone (comma-separated)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={zoneForm.control}
                    name="cities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cities (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Delhi,Mumbai,Bangalore" />
                        </FormControl>
                        <FormDescription>
                          Cities included in this zone (comma-separated)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={zoneForm.control}
                    name="zipCodes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP/Postal Codes (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 110001,400001,560001" />
                        </FormControl>
                        <FormDescription>
                          ZIP/Postal codes included in this zone (comma-separated)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={zoneForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable this shipping zone
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setZoneDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveZoneMutation.isPending}
                  >
                    {saveZoneMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedZone ? "Update Zone" : "Add Zone"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Rule Dialog */}
        <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedRule ? "Edit Shipping Rule" : "Add Shipping Rule"}
              </DialogTitle>
              <DialogDescription>
                {selectedRule
                  ? "Update the details of this shipping rule"
                  : "Create a new shipping rule for your platform"}
              </DialogDescription>
            </DialogHeader>
            <Form {...ruleForm}>
              <form onSubmit={ruleForm.handleSubmit(onSubmitRule)} className="space-y-4">
                <FormField
                  control={ruleForm.control}
                  name="zoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Zone</FormLabel>
                      <Select
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a shipping zone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingZones?.map((zone: any) => (
                            <SelectItem key={zone.id} value={zone.id.toString()}>
                              {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The shipping zone this rule applies to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="methodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Method</FormLabel>
                      <Select
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a shipping method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingMethods?.map((method: any) => (
                            <SelectItem key={method.id} value={method.id.toString()}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The shipping method this rule applies to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Price (₹ in paise/cents)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                          placeholder="Leave empty to use the method's default price"
                        />
                      </FormControl>
                      <FormDescription>
                        Override the default price for this zone-method combination
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="freeShippingThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Free Shipping Threshold (₹ in paise/cents)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                          placeholder="Leave empty for no free shipping threshold"
                        />
                      </FormControl>
                      <FormDescription>
                        Orders above this amount will qualify for free shipping
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="additionalDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Processing Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          min={0}
                        />
                      </FormControl>
                      <FormDescription>
                        Extra days needed for delivery to this zone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable this shipping rule
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRuleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveRuleMutation.isPending}
                  >
                    {saveRuleMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedRule ? "Update Rule" : "Add Rule"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected item.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}