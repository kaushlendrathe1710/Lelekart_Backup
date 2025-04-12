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
  Trash2
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
      price: "",
      mrp: "",
      sku: "",
      category: "",
      subcategory: "",
      brand: "",
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
        price: product.price?.toString() || "",
        mrp: (product.price * 1.2)?.toString() || "", // Simulating an MRP if not available
        sku: product.id?.toString() || "",
        category: product.category || "",
        subcategory: "",
        brand: "Brand", // Simulating a brand if not available
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
        price: parseInt(data.price), // Convert to number
        category: data.category,
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
      
      // Redirect to products page after a brief delay
      setTimeout(() => {
        window.location.href = '/seller/products';
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
      
      // Redirect to products page after a brief delay
      setTimeout(() => {
        window.location.href = '/seller/products';
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
              onClick={() => window.history.back()}
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
              onClick={() => window.location.href = `/seller/products/preview/${productId}`}
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
                                Include brand, model, color, and key features
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
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
                                  value={field.value}
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="subcategory"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Subcategory
                                </FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a subcategory" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Mobiles">Mobiles</SelectItem>
                                    <SelectItem value="Laptops">Laptops</SelectItem>
                                    <SelectItem value="Audio">Audio</SelectItem>
                                    <SelectItem value="Cameras">Cameras</SelectItem>
                                    <SelectItem value="Accessories">Accessories</SelectItem>
                                    <SelectItem value="Wearables">Wearables</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Brand <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Samsung, Apple, Sony" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Selling Price (₹) <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" step="0.01" placeholder="e.g. 24999" {...field} />
                                </FormControl>
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
                                  MRP (₹) <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" step="0.01" placeholder="e.g. 29999" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Maximum retail price
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
                                  GST/Tax (%) <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select tax rate" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0">GST 0%</SelectItem>
                                    <SelectItem value="5">GST 5%</SelectItem>
                                    <SelectItem value="12">GST 12%</SelectItem>
                                    <SelectItem value="18">GST 18%</SelectItem>
                                    <SelectItem value="28">GST 28%</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="hsn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                HSN Code
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 85171290" {...field} />
                              </FormControl>
                              <FormDescription>
                                Harmonized System Nomenclature code for your product
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Product Type & Policies</CardTitle>
                        <CardDescription>Specify important policy details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="productType"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>
                                Product Type <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
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
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
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
                                value={field.value}
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
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select warranty period" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">No Warranty</SelectItem>
                                  <SelectItem value="3">3 Months</SelectItem>
                                  <SelectItem value="6">6 Months</SelectItem>
                                  <SelectItem value="12">1 Year</SelectItem>
                                  <SelectItem value="24">2 Years</SelectItem>
                                  <SelectItem value="36">3 Years</SelectItem>
                                  <SelectItem value="60">5 Years</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                    <CardDescription>Detailed description of your product</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write a detailed description of your product, including features, benefits, and specifications..." 
                              className="min-h-[200px] resize-y"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 20 characters. Include key features and benefits to help customers make an informed decision.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-muted/50 p-4 rounded-md border border-dashed">
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Tips for writing a good description:
                      </h3>
                      <ul className="text-sm space-y-1 text-muted-foreground ml-6 list-disc">
                        <li>Include product dimensions, materials, and specifications</li>
                        <li>Highlight key features and benefits</li>
                        <li>Mention any unique selling points</li>
                        <li>Avoid excessive use of keywords or promotional language</li>
                        <li>Ensure information is accurate and honest</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                    <CardDescription>Upload high-quality images of your product</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center hover:bg-muted/25 transition-colors">
                      <div className="mb-4 flex justify-center">
                        <ImagePlus className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Drag images here or click to browse</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload up to 8 high-quality product images. First image will be used as the main product image.
                      </p>
                      <div className="relative">
                        <Input 
                          type="file" 
                          id="image-upload" 
                          accept="image/*" 
                          multiple
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 z-10 cursor-pointer h-full w-full"
                          disabled={isUploading}
                        />
                        <Button 
                          variant="outline" 
                          className="relative pointer-events-none"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Uploading... {uploadProgress}%
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Images
                            </>
                          )}
                        </Button>
                      </div>
                      {isUploading && (
                        <div className="mt-4">
                          <Progress value={uploadProgress} className="h-2 w-full" />
                        </div>
                      )}
                    </div>
                    
                    {uploadedImages.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Uploaded Images ({uploadedImages.length}/8)</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {uploadedImages.map((img, index) => (
                            <div key={index} className="relative group">
                              <div className="overflow-hidden rounded-md border aspect-square bg-muted">
                                <img
                                  src={img}
                                  alt={`Product image ${index + 1}`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 bg-black/50 group-hover:opacity-100 transition-opacity rounded-md">
                                <div className="flex gap-2">
                                  {index === 0 && (
                                    <Badge className="absolute top-2 left-2 bg-primary">Main Image</Badge>
                                  )}
                                  <Button 
                                    size="sm"
                                    variant="destructive" 
                                    onClick={() => handleRemoveImage(index)}
                                    className="z-10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Management</CardTitle>
                    <CardDescription>Manage stock and logistics details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              SKU (Stock Keeping Unit) <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. SMSG22U-256-BLK" {...field} />
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
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Stock Quantity <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="e.g. 100" {...field} />
                            </FormControl>
                            <FormDescription>
                              Available quantity in inventory
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-3">Dimensions & Weight</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight (g)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="e.g. 200" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Length (cm)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="e.g. 15" {...field} />
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
                              <FormLabel>Width (cm)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="e.g. 7" {...field} />
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
                              <FormLabel>Height (cm)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="e.g. 1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
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
                  <span className="text-sm">Approval Status:</span>
                  <Badge variant={product?.approved ? "default" : "outline"} className="capitalize">
                    {product?.approved ? "Approved" : "Pending Review"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Inventory:</span>
                  <Badge variant={parseInt(form.watch("stock")) > 0 ? "default" : "destructive"} className="capitalize">
                    {parseInt(form.watch("stock")) > 0 ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Updated:</span>
                  <span className="text-sm">{new Date().toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-md border aspect-square bg-muted">
                  <img
                    src={uploadedImages[0] || "https://placehold.co/600x400?text=No+Image"}
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium truncate">{form.watch("name") || "Product Name"}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">₹{form.watch("price") || "0"}</span>
                    {form.watch("mrp") && parseInt(form.watch("mrp")) > parseInt(form.watch("price")) && (
                      <>
                        <span className="text-sm text-muted-foreground line-through">₹{form.watch("mrp")}</span>
                        <span className="text-sm text-green-500">
                          {Math.round((1 - parseInt(form.watch("price")) / parseInt(form.watch("mrp"))) * 100)}% off
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {form.watch("description")?.slice(0, 100)}...
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tips & Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm">Improve your product visibility</AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground">
                      <ul className="space-y-1 list-disc pl-4">
                        <li>Use high-quality images from multiple angles</li>
                        <li>Include detailed specifications and features</li>
                        <li>Choose the most accurate category</li>
                        <li>Use relevant keywords in your title and description</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm">Pricing strategy</AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground">
                      <ul className="space-y-1 list-disc pl-4">
                        <li>Research competitive pricing in your category</li>
                        <li>Consider offering discounts on the MRP</li>
                        <li>Factor in shipping and platform fees</li>
                        <li>Set a price that allows for occasional promotions</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm">Inventory management</AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground">
                      <ul className="space-y-1 list-disc pl-4">
                        <li>Keep your stock levels updated to avoid overselling</li>
                        <li>Set low stock alerts when inventory falls below threshold</li>
                        <li>Consider offering pre-orders for popular items</li>
                        <li>Regularly audit your physical inventory against online records</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
}

export function Eye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}