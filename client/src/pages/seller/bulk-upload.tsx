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
  
  // If line is empty, return empty array
  if (!line || line.trim() === '') {
    return [];
  }
  
  // Debug log
  console.log(`Parsing CSV line: ${line}`);
  
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
    
    // Check for problematic placeholder images
    if (product.imageUrl && (
      product.imageUrl.includes('placeholder.com') || 
      product.imageUrl.includes('placeholder.jpg') ||
      product.imageUrl.includes('dummyimage.com')
    )) {
      errors.push(`Please use actual product images instead of placeholder images`);
    }
    
    // Validate additional images if present
    if (product.images && Array.isArray(product.images)) {
      for (let i = 0; i < product.images.length; i++) {
        const imgUrl = product.images[i];
        if (!imgUrl.match(/^https?:\/\/.+/)) {
          errors.push(`Additional image ${i+1} must be a valid URL starting with http:// or https://`);
        }
      }
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
    // Handle different line endings (CRLF, LF)
    const normalizedCsv = csvData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedCsv.split('\n');
    
    if (lines.length < 2) {
      toast({
        title: "Invalid CSV format",
        description: "The CSV file appears to be empty or missing required rows.",
        variant: "destructive",
      });
      return;
    }
    
    // Log for debugging
    console.log(`Processing CSV with ${lines.length} lines`);
    console.log(`Headers: ${lines[0]}`);
    
    const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const previews: ProductPreview[] = [];
    const errors: UploadError[] = [];
    let validCount = 0;
    let invalidCount = 0;
    
    // Skip the header line and process each product line
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = parseCsvLine(lines[i]);
      console.log(`Processing line ${i}: ${lines[i]}`);
      console.log(`Parsed values:`, values);
      
      // Prepare the base product data with required fields
      const productData: Record<string, any> = {
        name: "",
        description: "",
        price: 0,
        category: "",
        imageUrl: "",
        stock: 0,
        sellerId: user?.id || 0 // Ensure we have a fallback
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
          // First image becomes the main imageUrl (use format matching database field 'image_url')
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
          // Only add valid image URLs (avoid placeholders)
          if (value && value.trim() !== '' && !value.includes('placeholder')) {
            productData.images.push(value);
          }
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
      description: "CSV template has been downloaded to your device.",
      variant: "default",
    });
  };

  // Function to submit products to server
  const submitProducts = async () => {
    if (previewProducts.length === 0 || validRows === 0) {
      toast({
        title: "No valid products to upload",
        description: "Please upload a valid CSV file with product data.",
        variant: "destructive",
      });
      return;
    }
    
    // Display upload size warning for large batches
    if (previewProducts.length > 100) {
      toast({
        title: "Large Upload Detected",
        description: `You're uploading ${previewProducts.length} products. This may take a few minutes to complete.`,
        variant: "default",
      });
    }
    
    // If there are validation errors, ask for confirmation
    if (invalidRows > 0) {
      const confirmResult = window.confirm(`${invalidRows} products have validation errors. Only ${validRows} valid products will be uploaded. Continue?`);
      if (!confirmResult) return;
    }

    setIsUploading(true);

    // Filter to only include valid products
    const validProducts = previewProducts.filter(p => p.isValid);
    
    try {
      // Show progress notification for large batches
      const largeUpload = validProducts.length > 50;
      
      if (largeUpload) {
        // Set initial progress notification
        toast({
          title: "Upload in Progress",
          description: `Starting upload of ${validProducts.length} products. This may take a few minutes.`,
          variant: "default",
        });
      }
      
      // Set a longer timeout for large uploads (5 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      const response = await fetch('/api/seller/products/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: validProducts }),
        signal: controller.signal,
        credentials: 'include' // Important: Include credentials for authentication
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Error uploading products');
      }
      
      setUploadSuccess(true);
      toast({
        title: "Upload successful",
        description: `${result.uploaded} products have been uploaded successfully.`,
        variant: "default",
      });
      
      // Reset form state and keep success message
      setFile(null);
      setShowPreview(false);
      setPreviewProducts([]);
      setUploadErrors([]);
      
      // Show upload stats
      setUploadStats({
        showResults: true,
        totalUploaded: result.uploaded,
        successful: result.successful || [],
        failed: result.failed || [],
      });
      
      // For large uploads, make data more manageable in the results view
      if (largeUpload && result.successful && result.successful.length > 100) {
        // Keep only essential data for display to prevent UI slowdown
        const trimmedSuccessful = result.successful.map((product: any) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price
        }));
        
        setUploadResult({
          success: true,
          uploadCount: result.uploaded,
          failCount: result.failed ? result.failed.length : 0,
          message: `Successfully uploaded ${result.uploaded} products. ${result.failed ? result.failed.length : 0} products failed.`,
          successful: trimmedSuccessful,
          failed: result.failed || []
        });
      } else {
        setUploadResult({
          success: true,
          uploadCount: result.uploaded,
          failCount: result.failed ? result.failed.length : 0,
          message: `Successfully uploaded ${result.uploaded} products. ${result.failed ? result.failed.length : 0} products failed.`,
          successful: result.successful || [],
          failed: result.failed || []
        });
      }
      
    } catch (error: any) {
      // Handle timeout error specifically
      if (error.name === 'AbortError') {
        toast({
          title: "Upload timeout",
          description: "The upload is taking longer than expected. Please try with fewer products or contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload failed",
          description: error.message || "There was an error uploading the products.",
          variant: "destructive",
        });
      }
      
      setUploadResult({
        success: false,
        uploadCount: 0,
        failCount: validProducts.length,
        message: error.message || "Upload failed due to a server error",
        successful: [],
        failed: validProducts.map((p, i) => ({
          name: p.name,
          errors: [error.message || "Server error"],
          rowIndex: i + 1
        }))
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Upload stats tracking
  const [uploadStats, setUploadStats] = useState({
    showResults: false,
    totalUploaded: 0,
    successful: [] as any[],
    failed: [] as any[],
  });
  
  // State for UI tabs
  const [activeTab, setActiveTab] = useState<'upload' | 'help'>('upload');
  
  // Format support state
  const [fileFormat, setFileFormat] = useState<'CSV' | 'Excel'>('CSV');
  
  // State for detailed upload results tracking
  const [uploadResult, setUploadResult] = useState({
    success: false,
    uploadCount: 0,
    failCount: 0,
    message: '',
    successful: [] as any[],
    failed: [] as any[]
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
                  
                  // Check file extension and handle accordingly
                  if (droppedFile.name.endsWith('.csv') || 
                      droppedFile.name.endsWith('.xlsx') || 
                      droppedFile.name.endsWith('.xls')) {
                    // Create a new event and pass it to the handler
                    const input = fileInputRef.current;
                    if (input) {
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(droppedFile);
                      input.files = dataTransfer.files;
                      
                      // Set file details and generate preview
                      handleFileSelect({ target: { files: dataTransfer.files }} as any);
                    }
                  } else {
                    toast({
                      title: "Invalid file format",
                      description: "Please upload a CSV or Excel file.",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              <div className="text-center">
                {uploadSuccess ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-2" />
                    <h3 className="text-xl font-medium">Upload Successful!</h3>
                    <p className="text-muted-foreground mt-2">Your products have been uploaded successfully.</p>
                    <Button
                      onClick={() => {
                        setFile(null);
                        setUploadSuccess(false);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="mt-4"
                      variant="outline"
                    >
                      Upload Another File
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      {file ? (
                        <div className="flex items-center justify-center mb-2">
                          <FileText className="h-12 w-12 text-blue-500" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center mb-2">
                          <Upload className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {file ? (
                      <div>
                        <h3 className="text-lg font-medium">{file.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <div className="flex items-center justify-center mt-4 gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                              setShowPreview(false);
                              setPreviewProducts([]);
                            }}
                            className="flex items-center gap-1"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                          
                          {!showPreview && (
                            <Button
                              size="sm"
                              onClick={() => {
                                if (file && file.name.endsWith('.csv')) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (!event.target?.result) return;
                                    processCSVForPreview(event.target.result as string);
                                  };
                                  reader.readAsText(file);
                                } else {
                                  // For Excel, we'd need SheetJS integration
                                  toast({
                                    title: "Excel processing",
                                    description: "Excel processing would need additional libraries.",
                                    variant: "default",
                                  });
                                }
                              }}
                              className="flex items-center gap-1"
                            >
                              Preview Products
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-medium">Drag & Drop your file here</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">or click to browse</p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Select File
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileSelect}
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      Supported formats: .CSV, .XLSX, .XLS (max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Preview Section */}
            {showPreview && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">Product Preview</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {totalRows} Products
                      </span>
                      <span className="text-sm bg-green-50 text-green-600 px-2 py-0.5 rounded">
                        {validRows} Valid
                      </span>
                      {invalidRows > 0 && (
                        <span className="text-sm bg-red-50 text-red-600 px-2 py-0.5 rounded">
                          {invalidRows} Invalid
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => submitProducts()}
                    disabled={validRows === 0 || isUploading}
                    className="flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Upload Products
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Product Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Stock</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {previewProducts.slice(0, 5).map((product, index) => (
                        <tr key={index} className={`${!product.isValid ? 'bg-red-50' : ''}`}>
                          <td className="px-4 py-3 text-sm">{product.rowIndex}</td>
                          <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{product.category}</td>
                          <td className="px-4 py-3 text-sm">${product.price}</td>
                          <td className="px-4 py-3 text-sm">{product.stock}</td>
                          <td className="px-4 py-3 text-sm">
                            {product.isValid ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                <Check className="mr-1 h-3 w-3" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Error
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {!product.isValid && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-7 text-xs"
                                  >
                                    View Errors
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Validation Errors</h4>
                                    <ul className="text-sm space-y-1 text-red-600">
                                      {product.errors?.map((err, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                          <span>{err}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </td>
                        </tr>
                      ))}
                      {previewProducts.length > 5 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-center text-muted-foreground">
                            And {previewProducts.length - 5} more products...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false);
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="text-sm flex items-center gap-1"
                  >
                    {showErrorDetails ? 'Hide Details' : 'Show Details'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${showErrorDetails ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
                
                {showErrorDetails && invalidRows > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Error Details</h4>
                    <div className="space-y-3">
                      {uploadErrors.map((error, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-100 rounded p-3">
                          <div className="flex justify-between">
                            <div className="font-medium text-red-800">
                              {error.productName}
                            </div>
                            <div className="text-sm text-red-600">
                              Row {error.rowIndex}
                            </div>
                          </div>
                          <div className="mt-2">
                            <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                              {error.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {invalidRows > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded text-sm flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5 mr-2" />
                    <div>
                      <p><strong>Note:</strong> Products with validation errors will be skipped during upload. Only valid products will be imported into your inventory.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Progress and Stats (when applicable) */}
            {uploadSuccess && uploadStats.showResults && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-xl font-semibold">Upload Results</h3>
                </div>

                <Card className="mb-4">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{totalRows}</div>
                        <div className="text-sm text-muted-foreground">Total Products</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{uploadStats.totalUploaded}</div>
                        <div className="text-sm text-muted-foreground">Successfully Uploaded</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">{uploadStats.failed.length}</div>
                        <div className="text-sm text-muted-foreground">Failed to Upload</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {uploadStats.failed.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Upload Failures</h4>
                    <div className="space-y-3">
                      {uploadStats.failed.map((error, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-100 rounded p-3">
                          <div className="flex justify-between">
                            <div className="font-medium text-red-800">
                              {error.name || `Product ${idx + 1}`}
                            </div>
                            <div className="text-sm text-red-600">
                              Row {error.rowIndex}
                            </div>
                          </div>
                          <div className="mt-2">
                            <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                              {error.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Template Download Section */}
            <div className="flex justify-between items-center mt-6">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-1">
                  <DownloadCloud className="h-4 w-4" />
                  Need a template?
                </h3>
                <p className="text-xs text-muted-foreground">Download our pre-configured product template</p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={downloadTemplate}
              >
                <DownloadCloud className="h-4 w-4 mr-1" />
                Download Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-md border p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Help & Guidelines</h2>
              </div>
              <p className="text-muted-foreground">Comprehensive guide to successfully uploading product data.</p>
            </div>
            
            <div className="space-y-8">
              {/* CSV Structure Section */}
              <div>
                <h3 className="text-lg font-medium mb-3">CSV File Structure</h3>
                <div className="bg-muted/30 border rounded-md p-4">
                  <p className="mb-3">Your CSV file should have the following column headers (fields marked with * are required):</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">name*</span>
                      <span className="text-xs text-muted-foreground">(Product Name)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">description*</span>
                      <span className="text-xs text-muted-foreground">(Product Description)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">price*</span>
                      <span className="text-xs text-muted-foreground">(Selling Price)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">category*</span>
                      <span className="text-xs text-muted-foreground">(Product Category)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">imageUrl1*</span>
                      <span className="text-xs text-muted-foreground">(Main Image URL)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">stock*</span>
                      <span className="text-xs text-muted-foreground">(Quantity Available)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">mrp</span>
                      <span className="text-xs text-muted-foreground">(Maximum Retail Price)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">purchasePrice</span>
                      <span className="text-xs text-muted-foreground">(Cost Price)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">sku</span>
                      <span className="text-xs text-muted-foreground">(Stock Keeping Unit)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">brand</span>
                      <span className="text-xs text-muted-foreground">(Brand Name)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">color</span>
                      <span className="text-xs text-muted-foreground">(Comma-separated values)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">size</span>
                      <span className="text-xs text-muted-foreground">(Comma-separated values)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Data Format Section */}
              <div>
                <h3 className="text-lg font-medium mb-3">Data Format Guidelines</h3>
                <div className="space-y-4">
                  {/* Colors and Sizes */}
                  <div className="bg-muted/30 border rounded-md p-4">
                    <h4 className="font-medium mb-2">Colors and Sizes</h4>
                    <p className="mb-2">Format these fields as comma-separated values without quotation marks:</p>
                    <div className="bg-white p-3 rounded border mb-2">
                      <div className="mb-2">
                        <span className="font-mono text-sm">color:</span>
                        <span className="font-mono text-sm ml-2 text-green-600">Red,Blue,Green</span>
                      </div>
                      <div>
                        <span className="font-mono text-sm">size:</span>
                        <span className="font-mono text-sm ml-2 text-green-600">S,M,L,XL</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Each color/size value will be displayed as a separate option to customers.</p>
                  </div>
                  
                  {/* Images */}
                  <div className="bg-muted/30 border rounded-md p-4">
                    <h4 className="font-medium mb-2">Product Images</h4>
                    <p className="mb-2">Use separate columns for additional product images:</p>
                    <div className="bg-white p-3 rounded border mb-2">
                      <div className="mb-2">
                        <span className="font-mono text-sm">imageUrl1:</span>
                        <span className="font-mono text-sm ml-2 text-green-600">https://example.com/images/product-front.jpg</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-mono text-sm">imageUrl2:</span>
                        <span className="font-mono text-sm ml-2 text-green-600">https://example.com/images/product-back.jpg</span>
                      </div>
                      <div>
                        <span className="font-mono text-sm">imageUrl3:</span>
                        <span className="font-mono text-sm ml-2 text-green-600">https://example.com/images/product-side.jpg</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">All images must be accessible public URLs. Do not use commas to separate multiple URLs in a single column.</p>
                  </div>
                  
                  {/* Dimensions and Measurements */}
                  <div className="bg-muted/30 border rounded-md p-4">
                    <h4 className="font-medium mb-2">Dimensions and Measurements</h4>
                    <p className="mb-2">Use consistent units for all measurements:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                      <div className="bg-white p-3 rounded border">
                        <div className="mb-1">
                          <span className="font-mono text-sm">weight:</span>
                          <span className="font-mono text-sm ml-2 text-green-600">500</span>
                          <span className="text-xs text-muted-foreground ml-1">(in grams)</span>
                        </div>
                        <div>
                          <span className="font-mono text-sm">warranty_months:</span>
                          <span className="font-mono text-sm ml-2 text-green-600">12</span>
                          <span className="text-xs text-muted-foreground ml-1">(1 year)</span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <div className="mb-1">
                          <span className="font-mono text-sm">length:</span>
                          <span className="font-mono text-sm ml-2 text-green-600">25</span>
                          <span className="text-xs text-muted-foreground ml-1">(in cm)</span>
                        </div>
                        <div>
                          <span className="font-mono text-sm">width:</span>
                          <span className="font-mono text-sm ml-2 text-green-600">15</span>
                          <span className="text-xs text-muted-foreground ml-1">(in cm)</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">All dimensions should be in centimeters, weight in grams, and warranty in months.</p>
                  </div>
                </div>
              </div>
              
              {/* Common Errors Section */}
              <div>
                <h3 className="text-lg font-medium mb-3">Common Errors and Solutions</h3>
                <div className="bg-muted/30 border rounded-md p-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Mismatched Categories</p>
                        <p className="text-sm text-muted-foreground">Ensure your category matches the available categories in your store. Typos or non-existent categories will cause validation errors.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Invalid Image URLs</p>
                        <p className="text-sm text-muted-foreground">All image URLs must start with http:// or https:// and point to publicly accessible images. Private URLs or incorrect formats will fail validation.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Price Logic Errors</p>
                        <p className="text-sm text-muted-foreground">The selling price cannot be greater than the MRP (Maximum Retail Price). This is a common validation error.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Incorrectly Formatted Colors/Sizes</p>
                        <p className="text-sm text-muted-foreground">Use comma-separated values without additional quotation marks or brackets. Example: Red,Blue,Green</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Template Button */}
              <div className="border-t pt-6">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <DownloadCloud className="h-4 w-4" />
                  Download CSV Template
                </Button>
                <p className="text-sm text-muted-foreground mt-2">Download our pre-configured template with all required fields and example data.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerDashboardLayout>
  );
}