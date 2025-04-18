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
  X,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { AuthContext } from "@/hooks/use-auth";
import { FlipkartImage } from "@/components/ui/flipkart-image";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Complete template with all possible product fields - matches the exact schema requirements
const EXAMPLE_CSV = `name,description,price,purchasePrice,mrp,category,brand,color,size,imageUrl1,imageUrl2,imageUrl3,imageUrl4,stock,sku,hsn,weight,length,width,height,warranty_months,returnPolicy,tax,specifications,productType
Premium T-Shirt,High quality cotton t-shirt for daily wear,499,350,599,Fashion,FashionBrand,"Black, White, Blue","S, M, L, XL",https://example.com/images/tshirt-front.jpg,https://example.com/images/tshirt-back.jpg,https://example.com/images/tshirt-detail.jpg,,100,TS-001,6109,200,60,45,3,12,15,5,"100% cotton with premium stitching, Soft touch fabric",Apparel
Wireless Headphones,Bluetooth 5.0 noise-cancelling headphones with 20h battery life,2999,2200,3499,Electronics,AudioTech,"Black, Silver",Universal,https://example.com/images/headphones-1.jpg,https://example.com/images/headphones-2.jpg,https://example.com/images/headphones-3.jpg,,50,HP-100,8518,300,18,8,7,24,30,18,"Active noise cancellation with 30dB reduction, Bluetooth 5.0, 20 hours battery life",Electronics`;

// Helper function to parse CSV lines, properly handling quoted fields with special characters
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let previousChar = '';
  let quoteCount = 0;
  
  // If line is empty, return empty array
  if (!line || line.trim() === '') {
    return [];
  }
  
  // Debug log with max length to prevent huge logs
  const displayLine = line.length > 100 ? line.substring(0, 100) + '...' : line;
  // console.log(`Processing line: ${displayLine}`);
  
  try {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      // Count consecutive quotes for handling complex cases
      if (char === '"') {
        quoteCount++;
      } else {
        quoteCount = 0;
      }
      
      // Handle escape sequences - double quotes in quoted fields are represented as two consecutive quotes
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // This is an escaped quote inside a quoted field (i.e., "")
          current += '"';
          i++; // Skip the next quote character
        } else {
          // Toggle the in-quotes flag when we see a quote
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // If we're not in quotes and see a comma, end the current field
        result.push(current);
        current = '';
      } else {
        // Otherwise add the character to the current field
        current += char;
      }
      
      previousChar = char;
    }
    
    // Add the last field
    result.push(current);
    
    // Clean up fields (remove surrounding quotes but preserve internal ones)
    const cleanedResult = result.map(field => {
      // Trim whitespace first
      let trimmed = field.trim();
      
      // Handle special case of triple quotes (often in messy data)
      if (trimmed.startsWith('"""') && trimmed.endsWith('"""')) {
        return trimmed.substring(3, trimmed.length - 3);
      }
      
      // Remove surrounding quotes if they exist
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        // Remove the surrounding quotes
        trimmed = trimmed.substring(1, trimmed.length - 1);
        
        // Replace any remaining double quotes with a single quote
        return trimmed.replace(/""/g, '"');
      }
      
      return trimmed;
    });
    
    // console.log(`Parsed ${cleanedResult.length} fields`);
    return cleanedResult;
  } catch (error) {
    console.error("Error parsing CSV line:", error, "Line:", displayLine);
    // Return the best we could do if there was an error
    return line.split(',').map(item => item.trim());
  }
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
    
    // Log for debugging
    console.log(`Validating product at row ${rowIndex}:`, product);
    
    // Required fields with more flexible validation
    if (!product.name && product.name !== 0) errors.push(`Name is required`);
    if (!product.description && product.description !== 0) errors.push(`Description is required`);
    if (!product.price && product.price !== 0) errors.push(`Price is required`);
    if (!product.category && product.category !== 0) errors.push(`Category is required`);
    
    // Special handling for imageUrl field - check imageurl1 as a fallback
    if (!product.imageUrl && product.imageUrl !== 0) {
      // Look for alternate image field names (like imageurl1)
      if (product.imageurl1) {
        product.imageUrl = product.imageurl1;
        console.log(`Using imageurl1 as the main image URL: ${product.imageUrl}`);
      } else {
        errors.push(`Image URL is required`);
      }
    }
    
    if (product.stock === undefined && product.stock !== 0) errors.push(`Stock quantity is required`);
    
    // Validate numeric fields - be more flexible with type conversion
    if (product.price !== undefined && isNaN(Number(product.price))) errors.push(`Price must be a number`);
    if (product.stock !== undefined && isNaN(Number(product.stock))) errors.push(`Stock must be a number`);
    if (product.mrp !== undefined && product.mrp !== "" && isNaN(Number(product.mrp))) errors.push(`MRP must be a number`);
    if (product.purchasePrice !== undefined && product.purchasePrice !== "" && isNaN(Number(product.purchasePrice))) errors.push(`Purchase price must be a number`);
    if (product.warranty_months !== undefined && product.warranty_months !== "" && isNaN(Number(product.warranty_months))) errors.push(`Warranty period must be a number (in months)`);
    if (product.weight !== undefined && product.weight !== "" && isNaN(Number(product.weight))) errors.push(`Weight must be a number`);
    if (product.length !== undefined && product.length !== "" && isNaN(Number(product.length))) errors.push(`Length must be a number`);
    if (product.width !== undefined && product.width !== "" && isNaN(Number(product.width))) errors.push(`Width must be a number`);
    if (product.height !== undefined && product.height !== "" && isNaN(Number(product.height))) errors.push(`Height must be a number`);

    // Validate price logic with more flexible handling
    if (product.price !== undefined && product.mrp !== undefined && 
        !isNaN(Number(product.price)) && !isNaN(Number(product.mrp)) && 
        Number(product.price) > Number(product.mrp) && Number(product.mrp) > 0) {
      errors.push(`Selling price (${product.price}) cannot be greater than MRP (${product.mrp})`);
    }
    
    // Validate URLs in image fields - more permissive for Flipkart URLs and image fields
    // Special fallback - copy from imageurl1 if available and imageUrl is empty (due to case sensitivity issues)
    if (!product.imageUrl && product.imageurl1) {
      product.imageUrl = product.imageurl1;
      console.log(`Fixed missing imageUrl using imageurl1: ${product.imageUrl}`);
    }
    
    // Only validate if imageUrl exists and is non-empty
    if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '' && 
        !product.imageUrl.match(/^https?:\/\/.+/) && 
        !product.imageUrl.includes('fkcdn.com')) {  // Allow Flipkart CDN URLs even without protocol
      errors.push(`Main image URL must be a valid URL starting with http:// or https://`);
    }
    
    // Check for problematic placeholder images - be specific
    if (product.imageUrl && typeof product.imageUrl === 'string' && (
      product.imageUrl.includes('placeholder.com/') || 
      product.imageUrl.includes('placeholder.jpg') ||
      product.imageUrl.includes('dummyimage.com/')
    )) {
      errors.push(`Please use actual product images instead of placeholder images`);
    }
    
    // Validate additional images if present - more permissive for Flipkart URLs
    if (product.images && Array.isArray(product.images)) {
      for (let i = 0; i < product.images.length; i++) {
        const imgUrl = product.images[i];
        if (typeof imgUrl === 'string' && !imgUrl.match(/^https?:\/\/.+/) && !imgUrl.includes('fkcdn.com')) {
          errors.push(`Additional image ${i+1} must be a valid URL starting with http:// or https://`);
        }
      }
    }
    
    // If colors or sizes are provided, check if they are in the correct format, but be more permissive
    if (product.color && typeof product.color === 'string') {
      const colors = product.color.split(',').map((c: string) => c.trim()).filter(Boolean);
      if (colors.length === 0 && product.color.trim() !== '') {
        // Only flag as an error if it's clearly an invalid format, not just a single color
        if (product.color.includes(',,') || product.color.trim().endsWith(',')) {
          errors.push(`Color format appears invalid: "${product.color}". Use comma-separated values like "Red, Blue, Green"`);
        }
      }
    }
    
    if (product.size && typeof product.size === 'string') {
      const sizes = product.size.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (sizes.length === 0 && product.size.trim() !== '') {
        // Only flag as an error if it's clearly an invalid format, not just a single size
        if (product.size.includes(',,') || product.size.trim().endsWith(',')) {
          errors.push(`Size format appears invalid: "${product.size}". Use comma-separated values like "S, M, L, XL"`);
        }
      }
    }
    
    // For products with many errors, limit to top 5 to avoid overwhelming the UI
    if (errors.length > 5) {
      const truncatedErrors = errors.slice(0, 5);
      truncatedErrors.push(`... and ${errors.length - 5} more errors (fix these first)`);
      return { isValid: false, errors: truncatedErrors };
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
      
      // Map CSV values to product schema fields with improved handling
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (value === undefined || value === null) return; // Skip empty values
        
        // Handle numeric fields - use parseFloat to handle decimal values properly
        if (['price', 'purchasePrice', 'stock', 'mrp', 'weight', 'length', 'width', 'height', 'warranty_months', 'returnPolicy', 'tax'].includes(header)) {
          // Check if it's actually a number
          const parsedValue = parseFloat(value);
          if (!isNaN(parsedValue)) {
            productData[header] = parsedValue;
          } else {
            // If not a valid number, still keep the original value for validation to catch
            productData[header] = value;
          }
        } 
        // Handle boolean fields
        else if (header === 'approved') {
          productData[header] = value.toLowerCase() === 'true';
        }
        // Handle product name field with special sanitization
        else if (header === 'name') {
          // Clean up product names with nested quotes and special characters
          let cleanName = value;
          
          // Handle different types of quote issues in product names
          if (value.includes('"')) {
            // Replace triple or more consecutive quotes with a single quote
            cleanName = value.replace(/"{3,}/g, '"');
            // Replace any remaining double quotes with a single quote
            cleanName = cleanName.replace(/""/g, '"');
            
            // Remove any surrounding quotes that might still be present
            if (cleanName.startsWith('"') && cleanName.endsWith('"')) {
              cleanName = cleanName.substring(1, cleanName.length - 1);
            }
            
            console.log(`Sanitized product name: ${cleanName}`);
          }
          
          // Handle special characters like curly quotes, em-dashes, etc.
          cleanName = cleanName.replace(/['']/g, "'")  // Normalize single quotes
                              .replace(/[""]/g, '"')   // Normalize double quotes
                              .replace(/—/g, '-')      // Replace em dashes
                              .replace(/–/g, '-');     // Replace en dashes
          
          productData.name = cleanName;
        }
        // Handle description field with special sanitization
        else if (header === 'description') {
          // Clean up descriptions with quote issues and special characters
          let cleanDesc = value;
          
          // Handle different types of quote issues in descriptions
          if (value.includes('"')) {
            // Replace triple or more consecutive quotes with a single quote
            cleanDesc = value.replace(/"{3,}/g, '"');
            // Replace any remaining double quotes with a single quote
            cleanDesc = cleanDesc.replace(/""/g, '"');
            
            // Remove any surrounding quotes that might still be present
            if (cleanDesc.startsWith('"') && cleanDesc.endsWith('"')) {
              cleanDesc = cleanDesc.substring(1, cleanDesc.length - 1);
            }
          }
          
          // Handle special characters like curly quotes, em-dashes, etc.
          cleanDesc = cleanDesc.replace(/['']/g, "'")  // Normalize single quotes
                              .replace(/[""]/g, '"')   // Normalize double quotes
                              .replace(/—/g, '-')      // Replace em dashes
                              .replace(/–/g, '-')      // Replace en dashes
                              .replace(/�/g, '');      // Remove replacement characters
          
          productData.description = cleanDesc;
        }
        // Handle color field with more robust parsing
        else if (header === 'color') {
          if (value.startsWith('"') && value.endsWith('"')) {
            // This is likely a JSON array format from the CSV - handle it specially
            try {
              // Try to parse it as JSON
              const parsedValue = JSON.parse(value);
              if (Array.isArray(parsedValue)) {
                productData.color = parsedValue.join(', ');
              } else {
                productData.color = value;
              }
            } catch (e) {
              // If parsing fails, handle as a regular string
              const colors = value
                .replace(/^"/, '')
                .replace(/"$/, '')
                .split(',')
                .map(c => c.trim())
                .filter(Boolean);
              productData.color = colors.join(', ');
            }
          } else {
            // Regular comma-separated string
            const colors = value.split(',').map(c => c.trim()).filter(Boolean);
            productData.color = colors.join(', ');
          }
        }
        // Handle size field with more robust parsing
        else if (header === 'size') {
          if (value.startsWith('"') && value.endsWith('"')) {
            // This is likely a JSON array format from the CSV - handle it specially
            try {
              // Try to parse it as JSON
              const parsedValue = JSON.parse(value);
              if (Array.isArray(parsedValue)) {
                productData.size = parsedValue.join(', ');
              } else {
                productData.size = value;
              }
            } catch (e) {
              // If parsing fails, handle as a regular string
              const sizes = value
                .replace(/^"/, '')
                .replace(/"$/, '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
              productData.size = sizes.join(', ');
            }
          } else {
            // Regular comma-separated string
            const sizes = value.split(',').map(s => s.trim()).filter(Boolean);
            productData.size = sizes.join(', ');
          }
        }
        // Handle image fields mapping - use the first one as the main image
        else if (header === 'imageurl1' || header === 'imageUrl1') {
          // Make sure the URL is properly formatted (some URLs might be missing the http:// prefix)
          let imageUrl = value;
          
          // Handle Flipkart CDN URLs specifically
          if (imageUrl.includes('fkcdn.com') && !imageUrl.startsWith('http')) {
            imageUrl = 'https://' + imageUrl;
          }
          
          // First image becomes the main imageUrl (use format matching database field 'image_url')
          productData.imageUrl = imageUrl;
          
          // Start the additional images array
          if (!productData.images) {
            productData.images = [];
          }
        }
        // Handle additional image fields - check for both lowercase and uppercase field names
        else if (['imageUrl2', 'imageUrl3', 'imageUrl4', 'imageurl2', 'imageurl3', 'imageurl4'].includes(header) && value) {
          if (!productData.images) {
            productData.images = [];
          }
          
          // Make sure the URL is properly formatted (some URLs might be missing the http:// prefix)
          let imageUrl = value;
          
          // Handle Flipkart CDN URLs specifically
          if (imageUrl.includes('fkcdn.com') && !imageUrl.startsWith('http')) {
            imageUrl = 'https://' + imageUrl;
          }
          
          // Only add valid image URLs (avoid placeholders)
          if (imageUrl && imageUrl.trim() !== '' && !imageUrl.includes('placeholder')) {
            productData.images.push(imageUrl);
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
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const selectedFile = event.target.files[0];
    
    if (selectedFile.type !== 'text/csv' && 
        !selectedFile.name.endsWith('.csv') && 
        !selectedFile.name.endsWith('.xlsx') && 
        !selectedFile.name.endsWith('.xls')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
      return;
    }
    
    // Reset previous upload state
    setFile(selectedFile);
    setShowPreview(false);
    setPreviewProducts([]);
    setUploadErrors([]);
    setUploadSuccess(false);
    
    // Detect file format for better guidance
    if (selectedFile.name.endsWith('.csv')) {
      setFileFormat('CSV');
    } else {
      setFileFormat('Excel');
    }
    
    toast({
      title: "File selected",
      description: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`,
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
    
    // Log the number of valid products being sent
    console.log(`Submitting ${validProducts.length} valid products to server`);
    console.log('First product example:', validProducts[0]);
    
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
      
      // Prepare products for sending - Make sure all numeric values are numbers, not strings
      const productsToSend = validProducts.map(product => {
        // Create a clean copy of the product
        const cleanProduct = { ...product };
        
        // Handle images field (make sure it's a proper array or string)
        if (cleanProduct.images) {
          // If it's already a JSON string, leave it as is
          if (typeof cleanProduct.images === 'string' && 
            (cleanProduct.images.startsWith('[') || cleanProduct.images.startsWith('"'))) {
            // Already formatted correctly
          } 
          // If it's an array, stringify it
          else if (Array.isArray(cleanProduct.images)) {
            cleanProduct.images = JSON.stringify(cleanProduct.images);
          }
          // If it's a single string that's not JSON formatted, make it an array
          else if (typeof cleanProduct.images === 'string') {
            cleanProduct.images = JSON.stringify([cleanProduct.images]);
          }
        }
        
        // Ensure numeric fields are actually numbers
        if (cleanProduct.price) cleanProduct.price = Number(cleanProduct.price);
        if (cleanProduct.stock) cleanProduct.stock = Number(cleanProduct.stock);
        if (cleanProduct.mrp) cleanProduct.mrp = Number(cleanProduct.mrp);
        if (cleanProduct.purchasePrice) cleanProduct.purchasePrice = Number(cleanProduct.purchasePrice);
        
        return cleanProduct;
      });
      
      // Prepare the data that will be sent to the server
      const requestData = { products: productsToSend };
      
      // Debug log
      console.log(`Sending request to /api/seller/products/bulk-upload with ${productsToSend.length} products`);
      
      // Set a longer timeout for large uploads (5 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      // If the request is very large, process in batches
      let result;
      
      if (productsToSend.length > 100) {
        // Process in batches of 50 products
        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < productsToSend.length; i += BATCH_SIZE) {
          batches.push(productsToSend.slice(i, i + BATCH_SIZE));
        }
        
        console.log(`Processing ${productsToSend.length} products in ${batches.length} batches`);
        
        // Track successful and failed products
        const successful = [];
        const failed = [];
        
        // Process batches sequentially
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const batchBody = JSON.stringify({ products: batch });
          
          toast({
            title: `Processing batch ${i + 1} of ${batches.length}`,
            description: `Uploading ${batch.length} products...`,
            variant: "default",
          });
          
          try {
            const batchResponse = await fetch('/api/seller/products/bulk-upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: batchBody,
              credentials: 'include'
            });
            
            if (!batchResponse.ok) {
              const batchResult = await batchResponse.json();
              console.error(`Error in batch ${i + 1}:`, batchResult);
              throw new Error(`Error in batch ${i + 1}: ${batchResult.error || batchResult.details || 'Unknown error'}`);
            }
            
            const batchResult = await batchResponse.json();
            console.log(`Batch ${i + 1} result:`, batchResult);
            
            // Add successful products to the overall successful list
            if (batchResult.successful && Array.isArray(batchResult.successful)) {
              successful.push(...batchResult.successful);
            }
            
            // Add failed products to the overall failed list
            if (batchResult.failed && Array.isArray(batchResult.failed)) {
              failed.push(...batchResult.failed);
            }
          } catch (error) {
            console.error(`Error processing batch ${i + 1}:`, error);
            // Mark all products in this batch as failed
            failed.push(...batch.map((product: any) => ({
              name: product.name,
              errors: [error.message || 'Batch processing error']
            })));
          }
        }
        
        // Create a combined result
        result = {
          uploaded: successful.length,
          successful,
          failed
        };
      } else {
        // For smaller uploads, process normally
        const requestBody = JSON.stringify(requestData);
        
        const response = await fetch('/api/seller/products/bulk-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
          signal: controller.signal,
          credentials: 'include' // Include credentials for authentication
        });
        
        console.log(`Upload response status: ${response.status} ${response.statusText}`);
        
        result = await response.json();
        console.log("Upload response:", result);
        
        if (!response.ok) {
          throw new Error(result.error || result.details || 'Error uploading products');
        }
      }
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
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

  const downloadSampleCSV = () => {
    // Create a Blob with the CSV content
    const blob = new Blob([EXAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Sample CSV downloaded",
      description: "You can use this template to prepare your product data for upload.",
      variant: "default",
    });
  };

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
              <p className="text-muted-foreground">Import multiple products at once using a CSV file.</p>
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
                  if (droppedFile.name.endsWith('.csv')) {
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
                      description: "Please upload a CSV file.",
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
                        >
                          Browse Files
                        </Button>
                        <input 
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept=".csv"
                          onChange={handleFileSelect}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Download Sample Template Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <div className="flex items-start gap-3">
                <DownloadCloud className="h-5 w-5 mt-1 text-blue-500" />
                <div>
                  <h3 className="text-base font-medium">Need a template?</h3>
                  <p className="text-sm text-muted-foreground mb-2">Download our sample CSV template with properly formatted product data.</p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={downloadSampleCSV}
                    className="flex items-center gap-1"
                  >
                    <DownloadCloud className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Product Preview Section */}
            {showPreview && previewProducts.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Preview Products</h3>
                    <p className="text-muted-foreground">
                      {validRows} valid products ready to upload. {invalidRows > 0 ? `${invalidRows} products have errors.` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPreview(false);
                        setPreviewProducts([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitProducts}
                      disabled={isUploading || validRows === 0}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>Upload {validRows} Products</>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Total Products</div>
                      <div className="text-2xl font-bold">{totalRows}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Valid Products</div>
                      <div className="text-2xl font-bold text-green-600">{validRows}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Products with Errors</div>
                      <div className="text-2xl font-bold text-red-600">{invalidRows}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Estimated Upload Time</div>
                      <div className="text-2xl font-bold">
                        {validRows > 100 ? '2-5 min' : validRows > 50 ? '1-2 min' : '< 1 min'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Error Summary */}
                {invalidRows > 0 && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-1 text-red-500" />
                      <div>
                        <h3 className="text-base font-medium text-red-700">Products with Validation Errors</h3>
                        <p className="text-sm text-red-600 mb-2">
                          {invalidRows} products cannot be uploaded due to validation errors. You can still upload the {validRows} valid products.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowErrorDetails(!showErrorDetails)}
                          className="flex items-center gap-1"
                        >
                          {showErrorDetails ? 'Hide Error Details' : 'Show Error Details'}
                          <ChevronDown className={`h-4 w-4 transition-transform ${showErrorDetails ? 'rotate-180' : ''}`} />
                        </Button>
                        
                        {showErrorDetails && (
                          <div className="mt-4 max-h-60 overflow-y-auto border rounded-md">
                            <div className="divide-y">
                              {uploadErrors.map((error, index) => (
                                <div key={index} className="p-3 text-sm">
                                  <div className="font-medium">{error.productName || `Row ${error.rowIndex}`}</div>
                                  <ul className="list-disc list-inside mt-1 text-red-600">
                                    {error.errors.map((err, i) => (
                                      <li key={i}>{err}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Preview Table */}
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewProducts.slice(0, 10).map((product, index) => (
                          <tr key={index} className={!product.isValid ? 'bg-red-50' : ''}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {product.isValid ? (
                                <div className="flex items-center">
                                  <Check className="h-4 w-4 text-green-500 mr-1" />
                                  <span className="text-xs text-green-700">Valid</span>
                                </div>
                              ) : (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="flex items-center cursor-pointer">
                                      <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                                      <span className="text-xs text-red-700">Errors</span>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-0">
                                    <div className="p-4">
                                      <h4 className="font-medium text-sm">Validation Errors</h4>
                                      <ul className="mt-2 text-xs text-red-600 space-y-1">
                                        {product.errors?.map((error, i) => (
                                          <li key={i} className="flex items-start gap-1">
                                            <span className="text-red-500 mt-0.5">•</span>
                                            <span>{error}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                {product.imageUrl ? (
                                  <FlipkartImage 
                                    url={product.imageUrl} 
                                    alt={product.name || "Product image"} 
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium">{product.name || "—"}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {product.description ? (
                                  product.description.length > 60 
                                    ? product.description.slice(0, 60) + '...' 
                                    : product.description
                                ) : "—"}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {product.category || "—"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              ₹{product.price || 0}{product.mrp ? ` (MRP: ₹${product.mrp})` : ''}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {product.stock !== undefined ? product.stock : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {previewProducts.length > 10 && (
                    <div className="py-2 px-4 bg-gray-50 text-sm text-center text-gray-500">
                      Showing 10 of {previewProducts.length} products
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false);
                      setPreviewProducts([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitProducts}
                    disabled={isUploading || validRows === 0}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>Upload {validRows} Products</>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Upload Results Section */}
            {uploadStats.showResults && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-xl font-semibold">Upload Complete</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Products Uploaded</div>
                      <div className="text-2xl font-bold text-green-600">{uploadStats.totalUploaded}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Successful</div>
                      <div className="text-2xl font-bold text-green-600">{uploadStats.successful.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Failed</div>
                      <div className="text-2xl font-bold text-red-600">{uploadStats.failed.length}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <Button 
                  onClick={() => {
                    setUploadStats({
                      showResults: false,
                      totalUploaded: 0,
                      successful: [],
                      failed: []
                    });
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="mt-2"
                >
                  Upload More Products
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Help & Guidelines Tab */
          <div className="bg-white rounded-md border p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Help & Guidelines</h2>
              </div>
              <p className="text-muted-foreground">Learn how to format your CSV file correctly for product uploads.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Preparing Your CSV File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your CSV file should contain one product per row, with the first row containing column headers.
                  Make sure to include at least the required fields for each product.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center gap-1">
                    <InfoIcon className="h-4 w-4 text-blue-500" />
                    Required Fields
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-2">
                    <li><span className="font-medium">name</span> - Product name (text)</li>
                    <li><span className="font-medium">description</span> - Product description (text)</li>
                    <li><span className="font-medium">price</span> - Selling price (number)</li>
                    <li><span className="font-medium">category</span> - Product category (text)</li>
                    <li><span className="font-medium">imageUrl1</span> - Main product image URL (URL starting with http:// or https://)</li>
                    <li><span className="font-medium">stock</span> - Available quantity (number)</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Recommended Fields</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These additional fields are not required but highly recommended for better product listings.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <ul className="list-disc list-inside text-sm space-y-2">
                    <li><span className="font-medium">mrp</span> - Maximum Retail Price (number)</li>
                    <li><span className="font-medium">brand</span> - Product brand name (text)</li>
                    <li><span className="font-medium">color</span> - Color options, comma-separated (e.g., "Red, Blue, Green")</li>
                    <li><span className="font-medium">size</span> - Size options, comma-separated (e.g., "S, M, L, XL")</li>
                    <li><span className="font-medium">imageUrl2, imageUrl3, imageUrl4</span> - Additional image URLs</li>
                    <li><span className="font-medium">sku</span> - Stock Keeping Unit code, unique identifier (text)</li>
                    <li><span className="font-medium">purchasePrice</span> - Your purchase price (number)</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">CSV Formatting Tips</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <ul className="list-disc list-inside text-sm space-y-2">
                    <li>If a field contains commas, enclose it in double quotes (e.g., <code>"This, that, and the other"</code>)</li>
                    <li>If a field contains quotes, use two double quotes to escape them (e.g., <code>"This ""quoted"" text"</code>)</li>
                    <li>Make sure image URLs are complete and start with http:// or https://</li>
                    <li>For better results, limit your uploads to 500 products at a time</li>
                    <li>Always use the UTF-8 encoding when saving your CSV files</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleCSV}
                  className="flex items-center gap-1"
                >
                  <DownloadCloud className="h-4 w-4" />
                  Download Sample Template
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerDashboardLayout>
  );
}