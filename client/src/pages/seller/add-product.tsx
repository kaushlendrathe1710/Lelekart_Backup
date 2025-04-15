import { useState } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ImagePlus, 
  Tag, 
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle,
  PackageCheck,
  Heading,
  ShieldCheck
} from "lucide-react";
import { useLocation } from "wouter";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileUpload } from "@/components/ui/file-upload";

// Form validation schema
const productSchema = z.object({
  name: z.string().min(5, "Product name must be at least 5 characters"),
  brand: z.string().min(2, "Brand name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
  price: z.coerce
    .number()
    .min(1, "Price must be greater than 0")
    .nonnegative("Price cannot be negative"),
  mrp: z.coerce
    .number()
    .min(1, "MRP must be greater than 0")
    .nonnegative("MRP cannot be negative")
    .optional()
    .nullable(),
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price cannot be negative")
    .optional()
    .nullable(),
  warranty: z.coerce
    .number()
    .min(0, "Warranty cannot be negative")
    .optional()
    .nullable(),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters"),
  specifications: z.string().optional().nullable(),
  sku: z
    .string()
    .min(3, "SKU must be at least 3 characters")
    .optional()
    .nullable(),
  stock: z.coerce
    .number()
    .min(0, "Stock cannot be negative")
    .nonnegative("Stock cannot be negative"),
  weight: z.coerce.number().optional().nullable(),
  length: z.coerce.number().optional().nullable(),
  width: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
});

// Main component
export default function AddProductPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Query to fetch categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    select: (data) => data.map((category: any) => category.name),
  });

  // Form setup with validation
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "",
      price: undefined,
      mrp: undefined,
      purchasePrice: undefined,
      warranty: undefined,
      description: "",
      specifications: "",
      sku: "",
      stock: undefined,
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      color: "",
      size: "",
    },
  });

  // Watch important fields to calculate completion
  const watchedFields = form.watch();
  
  // Calculate form completion status
  const getCompletionStatus = () => {
    const basicFields = ['name', 'brand', 'category', 'price'];
    const descriptionComplete = watchedFields.description && watchedFields.description.length >= 20;
    const inventoryFields = ['sku', 'stock'];
    
    const basicComplete = basicFields.every(field => 
      watchedFields[field as keyof typeof watchedFields]);
    const inventoryComplete = inventoryFields.every(field => 
      watchedFields[field as keyof typeof watchedFields]);
    const imagesComplete = uploadedImages.length > 0;
    
    const total = [basicComplete, descriptionComplete, inventoryComplete, imagesComplete].filter(Boolean).length;
    return {
      basicComplete,
      descriptionComplete,
      inventoryComplete,
      imagesComplete,
      percentage: Math.round((total / 4) * 100)
    };
  };
  
  const completionStatus = getCompletionStatus();

  // Handle file upload for product images
  const handleAddImage = (fileOrUrl: File | string) => {
    if (uploadedImages.length >= 8) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 8 images per product",
        variant: "destructive",
      });
      return;
    }

    if (typeof fileOrUrl === "string") {
      // Add URL directly
      setUploadedImages([...uploadedImages, fileOrUrl]);
      return;
    }

    // Create a preview URL for the file
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImages([...uploadedImages, reader.result as string]);
    };
    reader.readAsDataURL(fileOrUrl);
  };

  // Remove image at a given index
  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productSchema>) => {
      // Create a new FormData instance
      const formData = new FormData();

      // Append JSON data
      formData.append(
        "productData",
        JSON.stringify({
          ...data,
          images: uploadedImages,
        })
      );

      const response = await apiRequest("POST", "/api/products", formData, {
        isFormData: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product added successfully",
        description: "Your product has been submitted for approval.",
      });
      navigate("/seller/products");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: z.infer<typeof productSchema>) => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return;
    }

    createProductMutation.mutate(data);
  };

  return (
    <SellerDashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Add New Product</h1>
            <p className="text-muted-foreground">
              Create a new product listing for your store
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/seller/products")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProductMutation.isPending}
              onClick={form.handleSubmit(onSubmit)}
            >
              {createProductMutation.isPending ? "Submitting..." : "Add Product"}
            </Button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main form area - 3/4 width */}
          <div className="md:col-span-3 space-y-6">
            <Form {...form}>
              {/* Basic Information Section */}
              <Card>
                <CardHeader className="bg-slate-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      <CardTitle>Basic Information</CardTitle>
                    </div>
                    <Badge variant={completionStatus.basicComplete ? "success" : "outline"} className={completionStatus.basicComplete ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {completionStatus.basicComplete ? "Complete" : "Required"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Essential details about your product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Product Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Samsung Galaxy S22 Ultra 5G (Burgundy, 256 GB)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include brand, model, color, and key features (maximum 150 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              {categories?.map((category: string) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              )) || (
                                <SelectItem value="Electronics">
                                  Electronics
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Selling Price <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                ₹
                              </div>
                              <Input 
                                type="number" 
                                min="0" 
                                placeholder="e.g. 1299" 
                                className="pl-7" 
                                {...field} 
                              />
                            </div>
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
                            MRP (Maximum Retail Price)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                ₹
                              </div>
                              <Input 
                                type="number" 
                                min="0" 
                                placeholder="e.g. 1499" 
                                className="pl-7" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Original price before discount
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Purchase Price
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                ₹
                              </div>
                              <Input 
                                type="number" 
                                min="0" 
                                placeholder="e.g. 999" 
                                className="pl-7" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your cost price (not visible to customers)
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <ColorSelector
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                          <FormDescription>
                            Select or enter a color value
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. S, M, L, XL, 256GB, etc." {...field} />
                          </FormControl>
                          <FormDescription>
                            Product size, capacity, or dimensions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="warranty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Warranty Period
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  <Info className="h-4 w-4 text-blue-500" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Enter warranty duration in months, not years.</p>
                                <p className="mt-1">Examples: 12 months (1 year), 24 months (2 years), etc.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <div className="flex">
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="e.g. 12" 
                                type="number" 
                                className="pr-16" 
                                {...field} 
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                months
                              </div>
                            </div>
                          </FormControl>
                        </div>
                        <FormDescription className="text-amber-600 font-medium">
                          Important: Enter warranty period in months (e.g. 12 for 1 year, 24 for 2 years)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Product Description Section */}
              <Card>
                <CardHeader className="bg-slate-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Heading className="h-5 w-5 text-primary" />
                      <CardTitle>Product Description</CardTitle>
                    </div>
                    <Badge variant={completionStatus.descriptionComplete ? "success" : "outline"} className={completionStatus.descriptionComplete ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {completionStatus.descriptionComplete ? "Complete" : "Required"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Detailed information about your product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
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
                            placeholder="Describe your product in detail. Include features, benefits, materials, and any other relevant information."
                            className="min-h-[200px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 20 characters. Include key product features, benefits, materials, and usage instructions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                            className="min-h-[150px]"
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
                </CardContent>
                <CardFooter className="bg-blue-50 border-t border-blue-100">
                  <div className="w-full">
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
                </CardFooter>
              </Card>

              {/* Product Images Section */}
              <Card>
                <CardHeader className="bg-slate-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ImagePlus className="h-5 w-5 text-primary" />
                      <CardTitle>Product Images</CardTitle>
                    </div>
                    <Badge variant={completionStatus.imagesComplete ? "success" : "outline"} className={completionStatus.imagesComplete ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {completionStatus.imagesComplete ? "Complete" : "Required"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Upload high-quality images of your product (minimum 1 image required)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Upload Image</h3>
                        <FileUpload
                          onChange={handleAddImage}
                          label="Main Product Image"
                          accept="image/*"
                          maxSizeMB={5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium mb-2">Or Add Image URL</h3>
                        <div className="flex space-x-2">
                          <Input 
                            id="image-url-input"
                            placeholder="https://example.com/product-image.jpg"
                            className="flex-1"
                          />
                          <Button 
                            type="button"
                            onClick={() => {
                              const input = document.getElementById("image-url-input") as HTMLInputElement;
                              if (input && input.value) {
                                handleAddImage(input.value);
                                input.value = "";
                              } else {
                                toast({
                                  title: "URL required",
                                  description: "Please enter an image URL",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Add URL
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter a direct link to an image (JPG, PNG, GIF)
                        </p>
                      </div>
                    </div>
                    
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
                      <Separator />
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
                </CardContent>
                <CardFooter className="bg-amber-50 border-t border-amber-100">
                  <div className="w-full">
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
                </CardFooter>
              </Card>

              {/* Inventory Management Section */}
              <Card>
                <CardHeader className="bg-slate-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="h-5 w-5 text-primary" />
                      <CardTitle>Inventory Management</CardTitle>
                    </div>
                    <Badge variant={completionStatus.inventoryComplete ? "success" : "outline"} className={completionStatus.inventoryComplete ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {completionStatus.inventoryComplete ? "Complete" : "Required"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Set up inventory details and shipping information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
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
                          <FormDescription>
                            Number of units available for sale
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-medium">
                        Package Dimensions
                      </h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <Info className="h-4 w-4 text-blue-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Enter accurate product dimensions for proper shipping calculations and customer expectations.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-md mb-4 text-xs text-blue-700">
                      <p>Important: Provide package dimensions in centimeters (cm) and weight in kilograms (kg).</p>
                      <p className="mt-1">These values will be used for shipping calculations and should reflect the <strong>packaged</strong> product.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Weight
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="number" min="0" step="0.01" placeholder="e.g. 0.5" className="pr-12" {...field} />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                  kg
                                </div>
                              </div>
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
                              Length
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="number" min="0" step="0.1" placeholder="e.g. 15" className="pr-12" {...field} />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                  cm
                                </div>
                              </div>
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
                              Width
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="number" min="0" step="0.1" placeholder="e.g. 8" className="pr-12" {...field} />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                  cm
                                </div>
                              </div>
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
                              Height
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="number" min="0" step="0.1" placeholder="e.g. 2" className="pr-12" {...field} />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                  cm
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Form>
          </div>
          
          {/* Sidebar - 1/4 Width */}
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
                      {completionStatus.percentage}%
                    </span>
                  </div>
                  <Progress value={completionStatus.percentage} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {completionStatus.basicComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Basic information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.descriptionComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Product description</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.imagesComplete ? (
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
                    {completionStatus.inventoryComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Inventory details</span>
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
                <ShieldCheck className="h-4 w-4 mr-2" />
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