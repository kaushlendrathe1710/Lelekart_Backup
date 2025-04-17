import { useState, useEffect } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  ArrowLeft, 
  ImagePlus, 
  Tag, 
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle,
  Upload,
  Trash2,
  Eye
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast, useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// Form validation schema
const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters").max(150, "Name too long"),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000, "Description too long"),
  specifications: z.string().optional(),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Price must be a positive number",
  }),
  mrp: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "MRP must be a positive number",
  }),
  sku: z.string().min(2, "SKU is required"),
  category: z.string().min(1, "Please select a category"),
  subcategory: z.string().optional(),
  brand: z.string().min(2, "Brand name is required"),
  stock: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: "Stock must be a non-negative number",
  }),
  weight: z.string().optional(),
  height: z.string().optional(),
  width: z.string().optional(),
  length: z.string().optional(),
  warranty: z.string().optional(),
  hsn: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  tax: z.string().min(1, "Please select a tax bracket"),
  productType: z.string().min(1, "Please select a product type"),
  returnPolicy: z.string().min(1, "Please select a return policy"),
}).refine((data) => parseFloat(data.mrp) >= parseFloat(data.price), {
  message: "MRP must be greater than or equal to the selling price",
  path: ["mrp"],
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [, params] = useRoute('/seller/products/edit/:id');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const productId = params?.id ? parseInt(params.id) : 0;

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) {
        throw new Error('Failed to fetch categories');
      }
      return res.json();
    },
  });

  // Fetch product data
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch product');
      }
      return res.json();
    },
    enabled: !!productId,
  });

  // Form setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      specifications: "",
      price: "",
      mrp: "",
      sku: "",
      category: "",
      subcategory: "",
      brand: "",
      color: "",
      size: "",
      stock: "1",
      weight: "",
      height: "",
      width: "",
      length: "",
      warranty: "",
      hsn: "",
      tax: "18",
      productType: "physical",
      returnPolicy: "7"
    },
  });

  // Update form values when product data is loaded
  useEffect(() => {
    if (product) {
      setUploadedImages(product.imageUrl ? [product.imageUrl] : []);
      
      form.reset({
        name: product.name || "",
        description: product.description || "",
        specifications: product.specifications || "",
        price: product.price?.toString() || "",
        mrp: (product.price * 1.2)?.toString() || "", // Simulating an MRP if not available
        sku: product.id?.toString() || "",
        category: product.category || "",
        subcategory: "",
        brand: "Brand", // Simulating a brand if not available
        color: product.color || "",
        size: product.size || "",
        stock: product.stock?.toString() || "1",
        weight: "",
        height: "",
        width: "",
        length: "",
        warranty: "",
        hsn: "",
        tax: "18",
        productType: "physical",
        returnPolicy: "7"
      });
    }
  }, [product, form]);

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Simulate upload process
    setIsUploading(true);
    setUploadProgress(0);

    // Fake progress updates
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // After "upload" completes
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(100);
      
      // Add placeholder URL for uploaded images
      const newImages = Array.from(files).map((_, index) => 
        `https://placehold.co/600x400?text=Product+Image+${uploadedImages.length + index + 1}`
      );
      
      setUploadedImages([...uploadedImages, ...newImages]);
      
      toast({
        title: "Images uploaded",
        description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully.`,
      });
      
      // Reset the input
      e.target.value = '';
    }, 3000);
  };

  // Remove image handler
  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      // First, we'd upload the images to storage (simulated here)
      let imageUrl = "https://placehold.co/600x400?text=Product+Image";
      
      if (uploadedImages.length > 0) {
        imageUrl = uploadedImages[0]; // Use the first image as the primary image
      }
      
      // Prepare the data for the API
      const productData = {
        name: data.name,
        description: data.description,
        specifications: data.specifications,
        price: parseInt(data.price), // Convert to number
        category: data.category,
        color: data.color,
        size: data.size,
        imageUrl: imageUrl,
        stock: parseInt(data.stock), // Convert to number
      };
      
      // Send the data to the API
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Product updated successfully",
        description: `Your product has been updated and is pending review.`,
      });
      
      // Redirect to products page after a brief delay using wouter
      setTimeout(() => {
        setLocation('/seller/products');
      }, 1500);
      
      // Invalidate the products query to refresh the products list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Product deleted successfully",
        description: "Your product has been removed from the marketplace.",
      });
      
      // Redirect to products page after a brief delay using wouter
      setTimeout(() => {
        setLocation('/seller/products');
      }, 1500);
      
      // Invalidate the products query to refresh the products list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one product image.",
        variant: "destructive",
      });
      return;
    }
    
    // We only need to pass the form data to the mutation
    // The mutation will extract what it needs to match our database schema
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  if (isProductLoading) {
    return (
      <SellerDashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2 text-xl">Loading product data...</p>
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setLocation('/seller/products')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Product</h1>
              <p className="text-muted-foreground">Update your product details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Product
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the product and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/seller/products/preview/${productId}`)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={updateMutation.isPending}
              className="min-w-[100px]"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {updateMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 Width */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>
              
              {/* Basic Details Tab */}
              <TabsContent value="basic" className="space-y-4 mt-6">
                <Form {...form}>
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Product Information</CardTitle>
                        <CardDescription>Basic details about your product</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Product Name <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Samsung Galaxy S22 Ultra (Phantom Black, 256 GB)" {...field} />
                              </FormControl>
                              <FormDescription>
                                Include key features, color, and model in the title
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  SKU <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. SM-S22U-BLK-256" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Unique identifier for your product
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Brand <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Samsung" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Brand or manufacturer name
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => {
                              const [colorTags, setColorTags] = useState<string[]>(
                                field.value ? field.value.split(/,\s*/).filter(Boolean) : []
                              );
                              
                              const handleColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                                // Add tag on Enter or comma
                                if (e.key === 'Enter' || e.key === ',') {
                                  e.preventDefault();
                                  const inputValue = (e.target as HTMLInputElement).value.trim();
                                  
                                  if (inputValue) {
                                    // Check if input contains multiple colors (comma-separated)
                                    const colorValues = inputValue.split(',').map(c => c.trim()).filter(Boolean);
                                    
                                    if (colorValues.length > 0) {
                                      // Add multiple colors at once
                                      const newTags = [...colorTags];
                                      colorValues.forEach(color => {
                                        if (!newTags.includes(color)) {
                                          newTags.push(color);
                                        }
                                      });
                                      setColorTags(newTags);
                                      field.onChange(newTags.join(', '));
                                    }
                                    
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              };
                              
                              const handleColorBlur = (e: React.FocusEvent<HTMLInputElement>) => {
                                const inputValue = e.target.value.trim();
                                if (inputValue) {
                                  // Check if input contains multiple colors (comma-separated)
                                  const colorValues = inputValue.split(',').map(c => c.trim()).filter(Boolean);
                                  
                                  if (colorValues.length > 0) {
                                    // Add multiple colors at once
                                    const newTags = [...colorTags];
                                    colorValues.forEach(color => {
                                      if (!newTags.includes(color)) {
                                        newTags.push(color);
                                      }
                                    });
                                    setColorTags(newTags);
                                    field.onChange(newTags.join(', '));
                                  }
                                  
                                  e.target.value = '';
                                }
                              };
                              
                              const removeColorTag = (index: number) => {
                                const newTags = [...colorTags];
                                newTags.splice(index, 1);
                                setColorTags(newTags);
                                field.onChange(newTags.join(', '));
                              };
                              
                              return (
                                <FormItem>
                                  <FormLabel>
                                    Color
                                  </FormLabel>
                                  <div className="space-y-2">
                                    <FormControl>
                                      <Input 
                                        placeholder="Add color (press Enter or comma after each)" 
                                        onKeyDown={handleColorKeyDown}
                                        onBlur={handleColorBlur}
                                      />
                                    </FormControl>
                                    {colorTags.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {colorTags.map((tag, i) => (
                                          <Badge key={i} className="px-3 py-1 flex items-center gap-1">
                                            {tag}
                                            <span 
                                              className="cursor-pointer hover:text-destructive" 
                                              onClick={() => removeColorTag(i)}
                                            >
                                              ×
                                            </span>
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <FormDescription>
                                    Main color or color variants
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )
                            }}
                          />
                          
                          <FormField
                            control={form.control}
                            name="size"
                            render={({ field }) => {
                              const [sizeTags, setSizeTags] = useState<string[]>(
                                field.value ? field.value.split(/,\s*/).filter(Boolean) : []
                              );
                              
                              const handleSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                                // Add tag on Enter or comma
                                if (e.key === 'Enter' || e.key === ',') {
                                  e.preventDefault();
                                  const inputValue = (e.target as HTMLInputElement).value.trim();
                                  
                                  if (inputValue) {
                                    // Check if input contains multiple sizes (comma-separated)
                                    const sizeValues = inputValue.split(',').map(s => s.trim()).filter(Boolean);
                                    
                                    if (sizeValues.length > 0) {
                                      // Add multiple sizes at once
                                      const newTags = [...sizeTags];
                                      sizeValues.forEach(size => {
                                        if (!newTags.includes(size)) {
                                          newTags.push(size);
                                        }
                                      });
                                      setSizeTags(newTags);
                                      field.onChange(newTags.join(', '));
                                    }
                                    
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              };
                              
                              const handleSizeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
                                const inputValue = e.target.value.trim();
                                if (inputValue) {
                                  // Check if input contains multiple sizes (comma-separated)
                                  const sizeValues = inputValue.split(',').map(s => s.trim()).filter(Boolean);
                                  
                                  if (sizeValues.length > 0) {
                                    // Add multiple sizes at once
                                    const newTags = [...sizeTags];
                                    sizeValues.forEach(size => {
                                      if (!newTags.includes(size)) {
                                        newTags.push(size);
                                      }
                                    });
                                    setSizeTags(newTags);
                                    field.onChange(newTags.join(', '));
                                  }
                                  
                                  e.target.value = '';
                                }
                              };
                              
                              const removeSizeTag = (index: number) => {
                                const newTags = [...sizeTags];
                                newTags.splice(index, 1);
                                setSizeTags(newTags);
                                field.onChange(newTags.join(', '));
                              };
                              
                              return (
                                <FormItem>
                                  <FormLabel>
                                    Size
                                  </FormLabel>
                                  <div className="space-y-2">
                                    <FormControl>
                                      <Input 
                                        placeholder="Add size (press Enter or comma after each)" 
                                        onKeyDown={handleSizeKeyDown}
                                        onBlur={handleSizeBlur}
                                      />
                                    </FormControl>
                                    {sizeTags.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {sizeTags.map((tag, i) => (
                                          <Badge key={i} className="px-3 py-1 flex items-center gap-1">
                                            {tag}
                                            <span 
                                              className="cursor-pointer hover:text-destructive" 
                                              onClick={() => removeSizeTag(i)}
                                            >
                                              ×
                                            </span>
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <FormDescription>
                                    Size, dimensions, or variants
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )
                            }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Selling Price <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" placeholder="e.g. 999" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Your selling price (before taxes)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="mrp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  MRP <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" placeholder="e.g. 1299" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Maximum retail price (must be ≥ selling price)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Category <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category: any) => (
                                      <SelectItem key={category.id} value={category.name}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Choose the most appropriate category
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Tax Rate <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select tax rate" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0">0% GST</SelectItem>
                                    <SelectItem value="5">5% GST</SelectItem>
                                    <SelectItem value="12">12% GST</SelectItem>
                                    <SelectItem value="18">18% GST</SelectItem>
                                    <SelectItem value="28">28% GST</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Select applicable tax rate
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </Form>
              </TabsContent>
              
              {/* Description Tab */}
              <TabsContent value="description" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Description</CardTitle>
                    <CardDescription>Provide detailed information about your product</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Description <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your product in detail. Include features, benefits, materials, and usage instructions." 
                                className="min-h-[300px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum 20 characters. Use paragraphs and bullet points for better readability.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="h-6"></div>
                      
                      <FormField
                        control={form.control}
                        name="specifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Product Specifications
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter technical specifications of your product. Include dimensions, materials, technical details, and compatibility information."
                                className="min-h-[200px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Add detailed technical specifications in structured format. Good for SEO and helps customers make informed decisions.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                    <CardDescription>Upload high-quality images of your product (min 1, max 8)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Label htmlFor="upload-image" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <ImagePlus className="h-10 w-10 text-gray-400" />
                          <h3 className="text-lg font-medium">Upload Images</h3>
                          <p className="text-sm text-gray-500">
                            Drag and drop or click to upload (max 5MB each)
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            className="mt-2"
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Select Files
                              </>
                            )}
                          </Button>
                          {isUploading && (
                            <div className="w-full mt-2">
                              <Progress value={uploadProgress} className="h-2 w-full" />
                              <p className="text-xs text-right mt-1">{uploadProgress}%</p>
                            </div>
                          )}
                        </div>
                        <Input
                          id="upload-image"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isUploading || uploadedImages.length >= 8}
                        />
                      </Label>
                    </div>
                    
                    {uploadedImages.length > 0 && (
                      <div>
                        <h3 className="text-md font-medium mb-3">Uploaded Images</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image}
                                alt={`Product image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-md border"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleRemoveImage(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {index === 0 && (
                                <Badge variant="secondary" className="absolute top-2 left-2">
                                  Primary
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex">
                        <Info className="h-5 w-5 text-yellow-500 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Image Guidelines</h4>
                          <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
                            <li>Minimum 1 image is required</li>
                            <li>Images should be on white background</li>
                            <li>Each image should be less than 5MB</li>
                            <li>Recommended size: 2000 x 2000 pixels</li>
                            <li>Supported formats: JPG, PNG, WEBP</li>
                            <li>First image will be displayed as the primary image</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory & Shipping</CardTitle>
                    <CardDescription>Manage stock and shipping details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Form {...form}>
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Stock Quantity <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  placeholder="e.g. 100" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Current available quantity
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Weight (g)
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    placeholder="e.g. 250" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Product weight in grams
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="hsn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  HSN Code
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. 85171290" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Harmonized System of Nomenclature code
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="length"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Length (cm)
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    placeholder="e.g. 15" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="width"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Width (cm)
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    placeholder="e.g. 10" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="height"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Height (cm)
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    placeholder="e.g. 5" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="returnPolicy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Return Policy <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select return policy" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0">No Returns</SelectItem>
                                    <SelectItem value="7">7 Days</SelectItem>
                                    <SelectItem value="10">10 Days</SelectItem>
                                    <SelectItem value="15">15 Days</SelectItem>
                                    <SelectItem value="30">30 Days</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Select return period
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="warranty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Warranty Period
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. 12 (warranty in months)" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Enter warranty period in months (e.g. 12 for 1 year)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="productType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Product Type <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="physical" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Physical Product
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="digital" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Digital Product
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="service" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Service
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar - 1/3 Width */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Approval Status:</span>
                  <Badge variant={product?.approved ? "default" : "secondary"} className={product?.approved ? "bg-green-100 text-green-800" : ""}>
                    {product?.approved ? "Approved" : "Pending Approval"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Listing Status:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                    Active
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-3">Checklist</h4>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      <span className="text-sm">Basic information provided</span>
                    </div>
                    <div className="flex items-start">
                      {uploadedImages.length > 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
                      )}
                      <span className="text-sm">Product images uploaded</span>
                    </div>
                    <div className="flex items-start">
                      {form.getValues().description.length >= 20 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
                      )}
                      <span className="text-sm">Detailed description added</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Help & Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Product Image Tips
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use high-resolution images on white background</li>
                        <li>Show product from multiple angles</li>
                        <li>Include size reference when applicable</li>
                        <li>Avoid text overlays on images</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Description Writing Guide
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Start with a compelling product summary</li>
                        <li>List all key features and specifications</li>
                        <li>Include dimensions, materials, and care instructions</li>
                        <li>Mention warranty information if applicable</li>
                        <li>Use bullet points for easy scanning</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Pricing Strategy
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Research competitor pricing</li>
                        <li>Consider offering promotional discounts</li>
                        <li>Set MRP slightly higher than your selling price</li>
                        <li>Factor in all costs including shipping and taxes</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Need Help?</h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Contact our seller support team at <span className="font-medium">seller-support@example.com</span> for assistance with your product listings.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
}

// Eye component is imported from lucide-react at the top of the file