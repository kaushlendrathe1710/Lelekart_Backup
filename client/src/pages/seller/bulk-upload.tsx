import { useState, useRef, useContext } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Upload,
  ArrowLeft,
  DownloadCloud,
  CheckCircle,
  FileText,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  HelpCircle,
  Info as InfoIcon,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Complete template with all possible product fields - matches the exact schema requirements
const EXAMPLE_CSV = `name,description,price,purchasePrice,mrp,category,brand,color,size,imageUrl1,imageUrl2,imageUrl3,imageUrl4,stock,sku,hsn,weight,length,width,height,warranty_months,returnPolicy,tax,specifications,productType
Premium T-Shirt,High quality cotton t-shirt for daily wear,499,350,599,Fashion,FashionBrand,"Black, White, Blue","S, M, L, XL",https://example.com/images/tshirt-front.jpg,https://example.com/images/tshirt-back.jpg,https://example.com/images/tshirt-detail.jpg,,100,TS-001,6109,200,60,45,3,12,15,5,"100% cotton with premium stitching, Soft touch fabric",Apparel
Wireless Headphones,Bluetooth 5.0 noise-cancelling headphones with 20h battery life,2999,2200,3499,Electronics,AudioTech,"Black, Silver",Universal,https://example.com/images/headphones-1.jpg,https://example.com/images/headphones-2.jpg,https://example.com/images/headphones-3.jpg,,50,HP-100,8518,300,18,8,7,24,30,18,"Active noise cancellation with 30dB reduction, Bluetooth 5.0, 20 hours battery life",Electronics
Kitchen Knife Set,Professional 5-piece stainless steel knife set with ergonomic handles,1499,1100,1999,Home,HomeChef,"Silver, Black","Standard, Professional",https://example.com/images/knives-set.jpg,https://example.com/images/knife-detail.jpg,https://example.com/images/knife-block.jpg,,30,KS-200,8211,1200,35,25,10,24,30,12,"5-piece set with wooden storage block, High-carbon stainless steel, Ergonomic handles",Kitchenware
Samsung Galaxy S21,Latest flagship smartphone with high-performance features and premium camera,99999,89999,109999,Electronics,Samsung,"Black, White, Phantom Gray","128GB, 256GB",https://example.com/smartphone.jpg,https://example.com/smartphone-back.jpg,https://example.com/smartphone-side.jpg,https://example.com/smartphone-box.jpg,100,SM-G991,85171290,180,150,72,8,12,15,18,"Display: 6.2-inch Dynamic AMOLED 2X, RAM: 8GB, Storage: 128GB/256GB, Battery: 4000mAh, Camera: 12MP+12MP+64MP",physical
Apple AirPods Pro,Wireless earbuds with active noise cancellation and transparency mode,29999,19999,34999,Electronics,Apple,White,One Size,https://example.com/earbuds.jpg,https://example.com/earbuds-case.jpg,https://example.com/earbuds-open.jpg,https://example.com/earbuds-charging.jpg,200,APP-123,85183000,50,52,48,23,12,7,18,"Battery Life: 6 hours, Water Resistant: Yes, ANC: Yes, Wireless Charging: Yes, Transparency mode, Adaptive EQ",physical
Nike Air Zoom,Comfortable sports shoes for daily runners with responsive cushioning,4999,3999,5999,Fashion,Nike,"Blue, Black, Red","UK 7, UK 8, UK 9, UK 10",https://example.com/shoes.jpg,https://example.com/shoes-side.jpg,https://example.com/shoes-sole.jpg,https://example.com/shoes-box.jpg,50,NK-AZ-10,64021990,290,285,105,110,6,30,12,"Material: Breathable mesh, Sole: Rubber, Weight: 290g, Cushioning: React Foam, Responsive Zoom Air unit",physical`;

// Helper function to parse CSV lines, properly handling quoted fields
// This handles fields with commas inside quoted strings
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Toggle the in-quotes flag when we see a quote
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // If we're not in quotes and see a comma, end the current field
      result.push(current);
      current = '';
    } else {
      // Otherwise add the character to the current field
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  // Remove quotes from fields that were quoted
  return result.map(field => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.substring(1, field.length - 1);
    }
    return field;
  });
}

// Type for product preview data
interface ProductPreview {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  sku?: string;
  mrp?: number;
  purchasePrice?: number;
  color?: string;
  size?: string;
  sellerId: number;
  isValid: boolean;
  errors?: string[];
  rowIndex: number;
  images?: string[] | string; // Can be an array or a JSON string
}

// Type for upload error reporting
interface UploadError {
  rowIndex: number;
  errors: string[];
  productName?: string;
}

export default function BulkUploadPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Preview state for two-step upload process
  const [showPreview, setShowPreview] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<ProductPreview[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [validRows, setValidRows] = useState(0);
  const [invalidRows, setInvalidRows] = useState(0);
  
  // Detailed error tracking
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  
  // Try to use context first if available
  const authContext = useContext(AuthContext);
  
  // Get user data from direct API if context is not available
  const { data: apiUser, isLoading: isUserLoading } = useQuery<any>({
    queryKey: ['/api/user'],
    enabled: !authContext?.user,
  });
  
  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;

  // Function to validate a product record
  const validateProduct = (product: Record<string, any>, rowIndex: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Required fields
    if (!product.name) errors.push(`Name is required`);
    if (!product.description) errors.push(`Description is required`);
    if (!product.price) errors.push(`Price is required`);
    if (!product.category) errors.push(`Category is required`);
    if (!product.imageUrl) errors.push(`Image URL is required`);
    if (!product.stock && product.stock !== 0) errors.push(`Stock quantity is required`);
    
    // Validate numeric fields
    if (product.price && isNaN(Number(product.price))) errors.push(`Price must be a number`);
    if (product.stock && isNaN(Number(product.stock))) errors.push(`Stock must be a number`);
    if (product.mrp && isNaN(Number(product.mrp))) errors.push(`MRP must be a number`);
    if (product.purchasePrice && isNaN(Number(product.purchasePrice))) errors.push(`Purchase price must be a number`);
    if (product.warranty_months && isNaN(Number(product.warranty_months))) errors.push(`Warranty period must be a number (in months)`);
    if (product.weight && isNaN(Number(product.weight))) errors.push(`Weight must be a number`);
    if (product.length && isNaN(Number(product.length))) errors.push(`Length must be a number`);
    if (product.width && isNaN(Number(product.width))) errors.push(`Width must be a number`);
    if (product.height && isNaN(Number(product.height))) errors.push(`Height must be a number`);

    // Validate price logic
    if (product.price && product.mrp && Number(product.price) > Number(product.mrp)) {
      errors.push(`Selling price (${product.price}) cannot be greater than MRP (${product.mrp})`);
    }
    
    // Validate URLs in image fields
    if (product.imageUrl && !product.imageUrl.match(/^https?:\/\/.+/)) {
      errors.push(`Main image URL must be a valid URL starting with http:// or https://`);
    }
    
    // If colors or sizes are provided, check if they are in the correct format
    if (product.color && typeof product.color === 'string') {
      const colors = product.color.split(',').map((c: string) => c.trim()).filter(Boolean);
      if (colors.length === 0 && product.color.trim() !== '') {
        errors.push(`Color format is invalid. Use comma-separated values like "Red, Blue, Green"`);
      }
    }
    
    if (product.size && typeof product.size === 'string') {
      const sizes = product.size.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (sizes.length === 0 && product.size.trim() !== '') {
        errors.push(`Size format is invalid. Use comma-separated values like "S, M, L, XL"`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Function to process CSV data and generate preview
  const processCSVForPreview = (csvData: string) => {
    const lines = csvData.split('\n');
    if (lines.length < 2) {
      toast({
        title: "Invalid CSV format",
        description: "The CSV file appears to be empty or missing required rows.",
        variant: "destructive",
      });
      return;
    }
    
    const headers = parseCsvLine(lines[0]).map(h => h.trim());
    const previews: ProductPreview[] = [];
    const errors: UploadError[] = [];
    let validCount = 0;
    let invalidCount = 0;
    
    // Skip the header line and process each product line
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = parseCsvLine(lines[i]);
      
      // Prepare the base product data with required fields
      const productData: Record<string, any> = {
        name: "",
        description: "",
        price: 0,
        category: "",
        imageUrl: "",
        stock: 0,
        sellerId: user?.id
      };
      
      // Map CSV values to product schema fields
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (!value) return; // Skip empty values
        
        // Handle numeric fields
        if (['price', 'purchasePrice', 'stock', 'mrp', 'weight', 'length', 'width', 'height', 'warranty_months', 'returnPolicy', 'tax'].includes(header)) {
          productData[header] = parseInt(value, 10);
        } 
        // Handle boolean fields
        else if (header === 'approved') {
          productData[header] = value.toLowerCase() === 'true';
        }
        // Handle color field - convert to array for database but keep as string for display
        else if (header === 'color') {
          // Split by comma and trim each value
          const colors = value.split(',').map(c => c.trim()).filter(Boolean);
          productData.color = colors.join(', ');
        }
        // Handle size field - convert to array for database but keep as string for display
        else if (header === 'size') {
          // Split by comma and trim each value
          const sizes = value.split(',').map(s => s.trim()).filter(Boolean);
          productData.size = sizes.join(', ');
        }
        // Handle image fields mapping - use the first one as the main image
        else if (header === 'imageUrl1') {
          // First image becomes the main imageUrl
          productData.imageUrl = value;
          
          // Start the additional images array
          if (!productData.images) {
            productData.images = [];
          }
        }
        // Handle additional image fields
        else if (['imageUrl2', 'imageUrl3', 'imageUrl4'].includes(header) && value) {
          if (!productData.images) {
            productData.images = [];
          }
          productData.images.push(value);
        }
        // Handle SKU directly (don't put in metadata)
        else if (header === 'sku') {
          productData.sku = value;
        }
        // All other fields
        else {
          productData[header] = value;
        }
      });
      
      // Validate the product
      const { isValid, errors: validationErrors } = validateProduct(productData, i);
      
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
        errors.push({
          rowIndex: i,
          productName: productData.name || `Row ${i}`,
          errors: validationErrors
        });
      }
      
      // Convert images array to JSON string for storage
      const imagesForPreview = productData.images ? [...productData.images] : [];
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = JSON.stringify(productData.images);
      }
      
      // Add to preview list
      previews.push({
        ...productData,
        isValid,
        errors: validationErrors,
        rowIndex: i,
        images: imagesForPreview
      } as any); // TypeScript workaround for dynamic properties
    }
    
    setPreviewProducts(previews);
    setTotalRows(previews.length);
    setValidRows(validCount);
    setInvalidRows(invalidCount);
    setUploadErrors(errors);
    setShowPreview(true);
    
    if (invalidCount > 0) {
      toast({
        title: "Warning: Some products have errors",
        description: `${invalidCount} out of ${previews.length} products have validation errors that need to be fixed.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Preview ready",
        description: `${validCount} products validated successfully and ready for upload.`,
        variant: "default",
      });
    }
  };

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a CSV or Excel file
      if (!selectedFile.name.endsWith('.csv') && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.xls')) {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV or Excel file.",
          variant: "destructive",
        });
        return;
      }
      
      // Update file format based on extension
      if (selectedFile.name.endsWith('.csv')) {
        setFileFormat('CSV');
      } else {
        setFileFormat('Excel');
      }
      
      setFile(selectedFile);
      
      // Reset preview state
      setShowPreview(false);
      setPreviewProducts([]);
      setUploadErrors([]);
      
      // For CSV files, we can generate preview immediately
      if (selectedFile.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (!event.target?.result) return;
          processCSVForPreview(event.target.result as string);
        };
        reader.readAsText(selectedFile);
      } else {
        // For Excel files, we would need a library like SheetJS/xlsx
        // This is a simplified version that just acknowledges the file
        toast({
          title: "Excel file selected",
          description: "Please click 'Preview Products' to process the file.",
          variant: "default",
        });
      }
    }
  };

  // Function to download template CSV
  const downloadTemplate = () => {
    const element = document.createElement('a');
    const file = new Blob([EXAMPLE_CSV], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = 'product_upload_template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Template downloaded",
      description: "CSV template has been downloaded successfully.",
    });
  };

  // Handle the preview process
  const handlePreviewAction = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    // Reset states
    setShowPreview(false);
    setPreviewProducts([]);
    setUploadErrors([]);
    
    // First notify server about preview mode (for logging/analytics purposes)
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Use query parameter to indicate preview mode
      await fetch('/api/products/bulk-upload?preview=true', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
    } catch (error) {
      // Just log the error but continue with local processing
      console.error("Error notifying server about preview mode:", error);
    }
    
    // Process the file for preview locally
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      processCSVForPreview(event.target.result as string);
    };
    reader.readAsText(file);
    
    toast({
      title: "Generating preview",
      description: "Analyzing your data to check for any issues...",
    });
  };

  // Handle the upload process with previously validated preview data
  const handleUpload = async () => {
    if (!file || !showPreview) {
      toast({
        title: "No preview available",
        description: "Please select a file and generate a preview before uploading.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if there are invalid products
    if (invalidRows > 0) {
      toast({
        title: "Cannot upload with errors",
        description: `There are ${invalidRows} products with validation errors. Please fix them before uploading.`,
        variant: "destructive",
      });
      // Show error details automatically if there are errors
      setShowErrorDetails(true);
      return;
    }

    setIsUploading(true);

    try {
      // Track successful uploads and errors
      let successCount = 0;
      let errorCount = 0;
      const currentErrors: UploadError[] = [];
      
      // Upload each valid product from the preview
      for (const product of previewProducts) {
        if (!product.isValid) {
          errorCount++;
          continue;
        }
        
        try {
          // Prepare product data for API
          const productData = { ...product };
          
          // Ensure we have seller ID
          if (!productData.sellerId && user?.id) {
            productData.sellerId = user.id;
          }
          
          // Handle color field - ensure it's properly formatted
          if (productData.color && typeof productData.color === 'string') {
            // Keep as comma-separated string for database storage
            productData.color = productData.color.split(',').map(c => c.trim()).filter(Boolean).join(', ');
          }
          
          // Handle size field - ensure it's properly formatted
          if (productData.size && typeof productData.size === 'string') {
            // Keep as comma-separated string for database storage
            productData.size = productData.size.split(',').map(s => s.trim()).filter(Boolean).join(', ');
          }
          
          // Convert any array properties to JSON strings
          if (productData.images && Array.isArray(productData.images)) {
            productData.images = JSON.stringify(productData.images);
          }
          
          // Remove preview-specific properties that shouldn't be sent to API
          const { isValid, errors, rowIndex, ...apiProductData } = productData;
          
          const createResponse = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiProductData),
            credentials: 'include'
          });
          
          if (createResponse.ok) {
            successCount++;
          } else {
            const errorData = await createResponse.json();
            errorCount++;
            currentErrors.push({
              rowIndex: product.rowIndex,
              productName: product.name,
              errors: [errorData.error || 'API error']
            });
            console.error(`Error creating product (row ${product.rowIndex}):`, errorData);
          }
        } catch (error: any) {
          errorCount++;
          currentErrors.push({
            rowIndex: product.rowIndex,
            productName: product.name,
            errors: [error.message || 'Unknown error']
          });
          console.error(`Error creating product (row ${product.rowIndex}):`, error);
        }
      }
      
      setIsUploading(false);
      setUploadSuccess(true);
      
      // Update the upload errors for detailed reporting
      if (currentErrors.length > 0) {
        setUploadErrors(currentErrors);
        setShowErrorDetails(true);
      }
      
      // Update the upload stats for displaying results
      setUploadStats({
        total: successCount + errorCount,
        success: successCount,
        failed: errorCount,
        showResults: true
      });
      
      if (errorCount > 0) {
        toast({
          title: "Upload partially successful",
          description: `${successCount} products uploaded successfully. ${errorCount} products failed.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Upload successful",
          description: `${successCount} products have been uploaded and are pending approval.`,
        });
      }
    } catch (error: any) {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload products. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset the upload process
  const resetUpload = () => {
    setFile(null);
    setUploadSuccess(false);
    setShowPreview(false);
    setPreviewProducts([]);
    setTotalRows(0);
    setValidRows(0);
    setInvalidRows(0);
    setUploadErrors([]);
    setShowErrorDetails(false);
    setUploadStats({
      total: 0,
      success: 0,
      failed: 0,
      showResults: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Show loading state while fetching user data
  if (authContext?.isLoading || isUserLoading) {
    return (
      <SellerDashboardLayout>
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading user data...</span>
        </div>
      </SellerDashboardLayout>
    );
  }
  
  // If no user is found, show error
  if (!user) {
    return (
      <SellerDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <div className="text-destructive mb-4">
            <span className="text-lg font-medium">Authentication required</span>
          </div>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            You need to be logged in to upload products.
          </p>
        </div>
      </SellerDashboardLayout>
    );
  }

  // State for UI tabs
  const [activeTab, setActiveTab] = useState<'upload' | 'help'>('upload');
  
  // Format support state
  const [fileFormat, setFileFormat] = useState<'CSV' | 'Excel'>('CSV');
  
  // Dummy state for upload results tracking
  const [uploadStats, setUploadStats] = useState<{
    total: number;
    success: number;
    failed: number;
    showResults: boolean;
  }>({
    total: 0,
    success: 0,
    failed: 0,
    showResults: false
  });
  
  return (
    <SellerDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bulk Product Upload</h1>
          <p className="text-muted-foreground">Import multiple products at once via CSV or Excel</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b">
          <div 
            className={`px-6 py-3 cursor-pointer ${activeTab === 'upload' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Products
          </div>
          <div 
            className={`px-6 py-3 cursor-pointer ${activeTab === 'help' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('help')}
          >
            Help & Guidelines
          </div>
        </div>
        
        {activeTab === 'upload' ? (
          <div className="bg-white rounded-md border p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Upload Your Product Data</h2>
              </div>
              <p className="text-muted-foreground">Import multiple products at once using a CSV or Excel file.</p>
            </div>
            
            {/* File Upload Area with Drag & Drop */}
            <div 
              className={`border-2 border-dashed rounded-md p-10 ${file ? 'bg-blue-50' : ''} ${uploadSuccess ? 'bg-green-50' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const droppedFile = e.dataTransfer.files[0];
                  
                  // Check if it's a CSV or Excel file
                  if (!droppedFile.name.endsWith('.csv') && 
                      !droppedFile.name.endsWith('.xlsx') && 
                      !droppedFile.name.endsWith('.xls')) {
                    toast({
                      title: "Invalid file format",
                      description: "Please upload a CSV or Excel file.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Update file format based on extension
                  if (droppedFile.name.endsWith('.csv')) {
                    setFileFormat('CSV');
                  } else {
                    setFileFormat('Excel');
                  }
                  
                  setFile(droppedFile);
                }
              }}
            >
              {!file && !uploadSuccess ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="text-gray-400 mb-4">
                    <FileText className="h-16 w-16" />
                  </div>
                  <h3 className="text-lg font-medium mb-3">Drag & drop your file here or click to browse</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Supports CSV and Excel formats only (max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Select File
                  </Button>
                </div>
              ) : uploadSuccess && uploadStats.showResults ? (
                // Show results after upload
                <div className="flex flex-col items-center">
                  <div className="text-green-500 mb-4">
                    <CheckCircle className="h-16 w-16" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">File selected: {file?.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {file ? `${(file.size / 1024).toFixed(2)} KB` : ""}
                    </p>
                    <div className="flex gap-3 mb-6">
                      <Button 
                        variant="outline" 
                        onClick={resetUpload}
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                      <Button
                        onClick={resetUpload}
                        variant="outline"
                      >
                        Upload Another File
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Show file selected before processing upload
                <div className="flex flex-col items-center">
                  <div className="text-green-500 mb-4">
                    <CheckCircle className="h-16 w-16" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">File selected: {file?.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {file ? `${(file.size / 1024).toFixed(2)} KB` : ""}
                    </p>
                    <div className="flex gap-3 mb-6">
                      <Button 
                        variant="outline" 
                        onClick={resetUpload}
                        disabled={isUploading}
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                      <Button
                        onClick={showPreview ? handleUpload : handlePreviewAction}
                        disabled={isUploading}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : showPreview ? (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Confirm & Upload
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Preview Products
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Preview Section */}
            {showPreview && previewProducts.length > 0 && (
              <div className="mt-6 border rounded-md p-4">
                <h3 className="font-medium text-lg mb-4">Product Preview</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 border border-green-100 rounded-md p-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <div className="text-green-600 font-medium">Valid Products</div>
                      <div className="text-xl font-bold text-green-700">{validRows}</div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-100 rounded-md p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <div className="text-red-600 font-medium">Products with Errors</div>
                      <div className="text-xl font-bold text-red-700">{invalidRows}</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-4 flex items-center">
                    <InfoIcon className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <div className="text-blue-600 font-medium">Total Products</div>
                      <div className="text-xl font-bold text-blue-700">{totalRows}</div>
                    </div>
                  </div>
                </div>
                
                {/* Preview Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-auto">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-4 py-2 text-left">Row</th>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">MRP</th>
                        <th className="px-4 py-2 text-center">Stock</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewProducts.slice(0, 5).map((product) => (
                        <tr 
                          key={product.rowIndex} 
                          className={`border-b ${product.isValid ? '' : 'bg-red-50'}`}
                        >
                          <td className="px-4 py-3">{product.rowIndex}</td>
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3">{product.category}</td>
                          <td className="px-4 py-3 text-right">₹{product.price?.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right">{product.mrp ? `₹${product.mrp?.toLocaleString('en-IN')}` : '-'}</td>
                          <td className="px-4 py-3 text-center">{product.stock}</td>
                          <td className="px-4 py-3 text-center">
                            {product.isValid ? (
                              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                <Check className="h-3 w-3 mr-1" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                <X className="h-3 w-3 mr-1" />
                                Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {previewProducts.length > 5 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-center text-muted-foreground">
                            Showing 5 of {previewProducts.length} products...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Error Details Section */}
                {invalidRows > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-lg">Error Details</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="text-sm flex items-center gap-1"
                      >
                        {showErrorDetails ? 'Hide Details' : 'Show Details'}
                        {showErrorDetails ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4 transform -rotate-90" />
                        )}
                      </Button>
                    </div>
                    
                    {showErrorDetails && (
                      <div className="border rounded-md overflow-hidden">
                        {uploadErrors.map((error, index) => (
                          <div 
                            key={index} 
                            className={`border-b last:border-0 p-3 ${index % 2 === 0 ? 'bg-muted/20' : ''}`}
                          >
                            <div className="flex items-start">
                              <div className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded mr-2">
                                Row {error.rowIndex}
                              </div>
                              <div>
                                <div className="font-medium">{error.productName || `Row ${error.rowIndex}`}</div>
                                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                                  {error.errors.map((err, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="text-red-500 mr-1">•</span> {err}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {invalidRows > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded text-sm flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Action Required:</span> Please fix the errors in your CSV file and reupload. 
                      Products with errors will not be included in the upload.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Progress and Stats (when applicable) */}
            {uploadSuccess && uploadStats.showResults && (
              <div className="mt-6">
                <div className="mb-2 flex justify-between items-center">
                  <div>Upload Progress</div>
                  <div>{uploadStats.total} of {uploadStats.total} products</div>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2.5 mb-4">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-100 rounded-md p-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <div className="text-green-600 font-medium">Successfully Processed</div>
                      <div className="text-xl font-bold text-green-700">{uploadStats.success}</div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-100 rounded-md p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <div className="text-red-600 font-medium">Failed Records</div>
                      <div className="text-xl font-bold text-red-700">{uploadStats.failed}</div>
                    </div>
                  </div>
                </div>
                
                {/* Error Details */}
                {uploadStats.failed > 0 && uploadErrors.length > 0 && (
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowErrorDetails(!showErrorDetails)} 
                      className="flex items-center"
                    >
                      {showErrorDetails ? 'Hide Error Details' : 'Show Error Details'}
                      <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showErrorDetails ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    {showErrorDetails && (
                      <div className="mt-3 border rounded-md">
                        {uploadErrors.map((error, index) => (
                          <div 
                            key={index} 
                            className={`border-t first:border-t-0 p-3 ${index % 2 === 0 ? 'bg-muted/20' : ''}`}
                          >
                            <div className="flex items-start">
                              <div className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded mr-2">
                                Row {error.rowIndex}
                              </div>
                              <div>
                                <div className="font-medium">{error.productName || `Row ${error.rowIndex}`}</div>
                                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                                  {error.errors.map((err, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="text-red-500 mr-1">•</span> {err}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Template Download Section */}
            <div className="flex justify-between items-center mt-6">
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <DownloadCloud className="h-4 w-4" />
                Download Template
              </Button>
              
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      {fileFormat}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-0">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start rounded-none px-4 py-2"
                        onClick={() => setFileFormat('CSV')}
                      >
                        {fileFormat === 'CSV' && <Check className="h-4 w-4 mr-2" />}
                        CSV
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start rounded-none px-4 py-2"
                        onClick={() => setFileFormat('Excel')}
                      >
                        {fileFormat === 'Excel' && <Check className="h-4 w-4 mr-2" />}
                        Excel
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-md border p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-5 w-5" />
                <h2 className="text-xl font-semibold">How to Use Bulk Upload</h2>
              </div>
              <p className="text-muted-foreground mb-6">Step-by-step instructions to prepare and upload your product data.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Step 1: Prepare Your Data</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Download our product template using the "Download Template" button</li>
                  <li>Fill in your product details in the spreadsheet</li>
                  <li>Required fields: name, description, price, category</li>
                  <li>Save your file as CSV or Excel format</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Step 2: Upload Your File</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Click on the upload area to select your file</li>
                  <li>Verify that your file appears with a green checkmark</li>
                  <li>Click "Process Upload" to begin importing</li>
                  <li>Wait for the upload to complete</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Step 3: Review Results</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Check the number of successfully imported products</li>
                  <li>Review any errors that occurred during import</li>
                  <li>Go to your Products page to see the newly added items</li>
                </ul>
              </div>
              
              <div className="bg-muted/30 border rounded-md p-4">
                <h4 className="flex items-center gap-2 font-medium mb-3">
                  <InfoIcon className="h-5 w-5" />
                  Tips for Success
                </h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Ensure your category values match existing categories in your store</li>
                  <li>For image URLs, use publicly accessible links</li>
                  <li>Use the <span className="font-semibold">imageUrl1</span>, <span className="font-semibold">imageUrl2</span>, and <span className="font-semibold">imageUrl3</span> fields to add additional product images</li>
                  <li>Each image URL should be placed in its own column - do not use commas to separate them</li>
                  <li>Format <span className="font-semibold">colors</span> and <span className="font-semibold">sizes</span> as comma-separated values (Example: Red,Blue,Green)</li>
                  <li>Use consistent formatting for prices (numbers only, no currency symbols)</li>
                  <li>The <span className="font-semibold">warranty_months</span> field should specify warranty duration in months (Example: 12 for 1 year, 24 for 2 years)</li>
                  <li>Maximum file size is 10MB</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerDashboardLayout>
  );
}