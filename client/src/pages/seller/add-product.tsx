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
import { FileUpload } from "@/components/ui/file-upload";
import { 
  Loader2, 
  ArrowLeft, 
  ImagePlus, 
  Tag, 
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle,
  Upload 
} from "lucide-react";
import { Link, useLocation } from "wouter";
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

export default function AddProductPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const queryClient = useQueryClient();

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

  // Handle adding a new image to our collection
  const handleAddImage = (url: string) => {
    if (!url) return;
    
    // Check if we already have 8 images
    if (uploadedImages.length >= 8) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 8 images for a product.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicate images
    if (uploadedImages.includes(url)) {
      toast({
        title: "Duplicate image",
        description: "This image is already in your collection.",
        variant: "destructive",
      });
      return;
    }
    
    // Add the new image
    setUploadedImages([...uploadedImages, url]);
    
    // Show success toast
    toast({
      title: "Image added",
      description: `Image ${uploadedImages.length + 1} added successfully.`,
    });
  };

  // Remove image handler
  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    const removedImage = newImages.splice(index, 1);
    setUploadedImages(newImages);
    
    // Show notification
    toast({
      title: "Image removed",
      description: index === 0 ? "Cover image has been removed. The next image will become the cover." : `Image ${index + 1} has been removed.`,
    });
  };

  // Submit handler
  const submitMutation = useMutation({
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
        imageUrl: imageUrl, // Main image (first in the array)
        image: imageUrl, // For compatibility with schema
        images: uploadedImages.length > 1 ? JSON.stringify(uploadedImages) : undefined, // Additional images as JSON string
        stock: parseInt(data.stock), // Convert to number
        approved: false, // New products require approval
      };
      
      // Send the data to the API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Product added successfully",
        description: `Your product has been submitted for review and will be listed soon.`,
      });
      
      form.reset();
      setUploadedImages([]);
      
      // Redirect to products page after a brief delay
      setTimeout(() => {
        setLocation('/seller/products');
      }, 1500);
      
      // Invalidate the products query to refresh the products list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add product",
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
    submitMutation.mutate(data);
  };

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
              <h1 className="text-2xl font-bold">Add New Product</h1>
              <p className="text-muted-foreground">Create a new product listing</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => form.reset()}
            >
              Reset Form
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={submitMutation.isPending}
              className="min-w-[100px]"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {submitMutation.isPending ? "Submitting..." : "Add Product"}
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
                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                    <SelectItem value="Fashion">Fashion</SelectItem>
                                    <SelectItem value="Home">Home & Furniture</SelectItem>
                                    <SelectItem value="Beauty">Beauty & Personal Care</SelectItem>
                                    <SelectItem value="Toys">Toys & Baby Products</SelectItem>
                                    <SelectItem value="Sports">Sports & Fitness</SelectItem>
                                    <SelectItem value="Books">Books & Media</SelectItem>
                                    <SelectItem value="Grocery">Grocery</SelectItem>
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
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select return policy" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">No Returns</SelectItem>
                                  <SelectItem value="7">7 Days Return</SelectItem>
                                  <SelectItem value="10">10 Days Return</SelectItem>
                                  <SelectItem value="15">15 Days Return</SelectItem>
                                  <SelectItem value="30">30 Days Return</SelectItem>
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
                              <FormControl>
                                <Input placeholder="e.g. 1 Year Manufacturer Warranty" {...field} />
                              </FormControl>
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
                    <CardDescription>
                      Detailed information about your product
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Form {...form}>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Product Description <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your product in detail. Include features, specifications, materials, and any other relevant information."
                                className="min-h-[200px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum 20 characters. Include key product features, specifications, materials, and usage instructions.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Form>
                    
                    <div className="p-4 bg-blue-50 rounded-md">
                      <h3 className="flex items-center text-sm font-semibold text-blue-700 mb-2">
                        <Info className="h-4 w-4 mr-2" />
                        Tips for a Great Product Description
                      </h3>
                      <ul className="text-xs text-blue-700 space-y-1 ml-6 list-disc">
                        <li>Highlight key features and benefits</li>
                        <li>Include detailed specifications</li>
                        <li>Mention materials, dimensions, and compatibility</li>
                        <li>Add usage instructions and care guidelines</li>
                        <li>Explain what makes your product unique</li>
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
                    <CardDescription>
                      Upload high-quality images of your product (minimum 1 image required)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <FileUpload
                        onChange={handleAddImage}
                        label="Main Product Image"
                        accept="image/*"
                        maxSizeMB={5}
                      />
                      
                      {uploadedImages.length > 0 && uploadedImages.length < 8 && (
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-center gap-2"
                          onClick={() => document.getElementById("add-another-image")?.click()}
                        >
                          <ImagePlus className="h-4 w-4" />
                          Add Another Image
                          <FileUpload
                            id="add-another-image"
                            onChange={handleAddImage}
                            className="hidden"
                            accept="image/*"
                            maxSizeMB={5}
                          />
                        </Button>
                      )}
                    </div>
                    
                    {uploadedImages.length > 0 && (
                      <>
                        <h3 className="text-sm font-medium">Uploaded Images ({uploadedImages.length})</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={image} 
                                alt={`Product image ${index + 1}`} 
                                className="h-24 w-full object-cover rounded-md border" 
                              />
                              <div className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleRemoveImage(index)}
                                  className="h-8 text-xs"
                                >
                                  Remove
                                </Button>
                              </div>
                              {index === 0 && (
                                <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-xs">
                                  Cover
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    
                    <div className="p-4 bg-amber-50 rounded-md">
                      <h3 className="flex items-center text-sm font-semibold text-amber-700 mb-2">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Image Guidelines
                      </h3>
                      <ul className="text-xs text-amber-700 space-y-1 ml-6 list-disc">
                        <li>Upload at least 1 image, up to 8 images allowed</li>
                        <li>Recommended size: 1000 x 1000 pixels or larger</li>
                        <li>First image will be the cover image shown in search results</li>
                        <li>Use well-lit, clear images on a white background</li>
                        <li>Show the product from multiple angles</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Management</CardTitle>
                    <CardDescription>
                      Set up inventory details and shipping information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Form {...form}>
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
                                <Input placeholder="e.g. SM-S22U-256-BLK" {...field} />
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
                                <Input type="number" min="0" placeholder="e.g. 50" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="text-sm font-medium mb-3">
                          Package Dimensions
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Weight (kg)
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" step="0.01" placeholder="e.g. 0.5" {...field} />
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
                                <FormLabel>
                                  Length (cm)
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" step="0.1" placeholder="e.g. 15" {...field} />
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
                                  <Input type="number" min="0" step="0.1" placeholder="e.g. 8" {...field} />
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
                                  <Input type="number" min="0" step="0.1" placeholder="e.g. 2" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
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
                <CardTitle>Submission Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Form Completion</span>
                    <span className="text-sm font-medium text-blue-600">
                      {uploadedImages.length > 0 ? "75%" : "50%"}
                    </span>
                  </div>
                  <Progress value={uploadedImages.length > 0 ? 75 : 50} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Basic information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Pricing details</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedImages.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">
                      {uploadedImages.length > 0 
                        ? `Images (${uploadedImages.length} uploaded)` 
                        : "Images required"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Description needed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Listing Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        Product Title Tips
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>Include brand, model number, and key attributes</li>
                        <li>Mention color, size, and quantity if applicable</li>
                        <li>Keep it under 150 characters</li>
                        <li>Don't use ALL CAPS or excessive punctuation!!!</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        Pricing Strategy
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>Set competitive prices to match market rates</li>
                        <li>MRP must be equal to or higher than selling price</li>
                        <li>Consider shipping costs when setting prices</li>
                        <li>Flipkart charges commission based on category</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        Image Requirements
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>Minimum 1 image, maximum 8 images</li>
                        <li>White background preferred</li>
                        <li>No watermarks or text overlays allowed</li>
                        <li>First image is the main product image</li>
                        <li>Include images from different angles</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        Approval Process
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>Products go through quality check before listing</li>
                        <li>Approval typically takes 24-48 hours</li>
                        <li>Ensure all mandatory fields are filled correctly</li>
                        <li>Products failing quality check will need revision</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="flex items-center text-sm font-semibold text-green-700 mb-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                Boost Your Sales
              </h3>
              <ul className="text-xs text-green-700 space-y-1 ml-6 list-disc">
                <li>Complete all product information for better visibility</li>
                <li>High-quality images improve conversion rates</li>
                <li>Detailed descriptions help customers make decisions</li>
                <li>Keep inventory updated to avoid stockouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
}