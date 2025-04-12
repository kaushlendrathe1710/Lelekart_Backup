import { useState, useEffect, useRef } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  Upload,
  FileText,
  HelpCircle,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast, useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Mock example data with all possible product fields
const EXAMPLE_CSV = `name,description,price,mrp,category,subcategory,brand,imageUrl,imageUrl1,imageUrl2,imageUrl3,stock,sku,hsn,weight,length,width,height,warranty,returnPolicy,tax,productType
Smartphone X Pro,Flagship smartphone with high-performance processor and excellent camera,49999,59999,Electronics,Mobiles,TechBrand,https://example.com/smartphone-x.jpg,https://example.com/smartphone-x2.jpg,https://example.com/smartphone-x3.jpg,,100,SM-X-PRO-256-BLK,85171290,0.25,15.5,7.2,0.8,12,15,18,physical
Wireless Earbuds Pro,True wireless earbuds with active noise cancellation,7999,9999,Electronics,Audio,SoundTech,https://example.com/earbuds.jpg,https://example.com/earbuds2.jpg,https://example.com/earbuds3.jpg,,200,EB-PRO-BLK,85183000,0.05,5.2,4.8,2.3,12,7,18,physical
Smart Watch Elite,Fitness tracking and notification smart watch,12999,14999,Electronics,Wearables,FitTech,https://example.com/smartwatch.jpg,https://example.com/smartwatch2.jpg,,,150,SW-ELITE-BLK,91029900,0.07,4.5,4.5,1.2,12,7,18,physical
Laptop Ultra,Ultra-thin laptop with powerful specifications,89999,99999,Electronics,Laptops,TechPro,https://example.com/laptop.jpg,https://example.com/laptop2.jpg,https://example.com/laptop3.jpg,https://example.com/laptop4.jpg,50,LT-ULTRA-i7-512,84713000,1.5,35.2,24.5,1.8,24,15,18,physical
Gaming Console X,Next-generation gaming console with 4K support,45999,49999,Electronics,Gaming,GameTech,https://example.com/console.jpg,https://example.com/console2.jpg,https://example.com/console3.jpg,,75,GC-X-1TB-BLK,95045000,3.2,30.5,25.8,7.5,12,15,18,physical`;

// Sample validation rules for all fields
const VALIDATION_RULES = [
  { field: 'name', rule: 'Must be between 3-150 characters' },
  { field: 'description', rule: 'Must be between 20-5000 characters' },
  { field: 'price', rule: 'Must be a positive number' },
  { field: 'mrp', rule: 'Must be a positive number and >= price' },
  { field: 'category', rule: 'Must be a valid category' },
  { field: 'subcategory', rule: 'Must be a valid subcategory for the selected category' },
  { field: 'brand', rule: 'Must be between 2-50 characters' },
  { field: 'imageUrl', rule: 'Required. Main product image URL' },
  { field: 'imageUrl1', rule: 'Optional. Additional product image URL #1' },
  { field: 'imageUrl2', rule: 'Optional. Additional product image URL #2' },
  { field: 'imageUrl3', rule: 'Optional. Additional product image URL #3' },
  { field: 'stock', rule: 'Must be a non-negative integer' },
  { field: 'sku', rule: 'Optional. Unique identifier for your product' },
  { field: 'hsn', rule: 'Optional. Valid HSN code for your product category' },
  { field: 'weight', rule: 'Optional. Weight in kg (decimal allowed)' },
  { field: 'length', rule: 'Optional. Length in cm (decimal allowed)' },
  { field: 'width', rule: 'Optional. Width in cm (decimal allowed)' },
  { field: 'height', rule: 'Optional. Height in cm (decimal allowed)' },
  { field: 'warranty', rule: 'Optional. Warranty period in months' },
  { field: 'returnPolicy', rule: 'Optional. Return period in days' },
  { field: 'tax', rule: 'Optional. GST/Tax percentage (0, 5, 12, 18, or 28)' },
  { field: 'productType', rule: 'Optional. "physical" or "digital"' }
];

// Status enum for product upload results
enum UploadStatus {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// Product upload result type
type UploadResult = {
  row: number;
  product: {
    name: string;
    price: string;
    category: string;
  };
  status: UploadStatus;
  message: string;
}

// UploadStage tracker for the step-by-step process
enum UploadStage {
  SELECT_FILE = 'select_file',
  VALIDATION = 'validation',
  PREVIEW = 'preview',
  UPLOADING = 'uploading',
  RESULTS = 'results'
}

export default function BulkUploadPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<UploadStage>(UploadStage.SELECT_FILE);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a CSV file
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  // Function to parse CSV file
  const parseCSV = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(header => header.trim());
        
        const data = [];
        
        // Skip the header row and process each data row
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].trim() === '') continue; // Skip empty rows
          
          const values = rows[i].split(',').map(value => value.trim());
          
          // Create an object with headers as keys and values
          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          
          data.push(rowData);
        }
        
        // Basic validation
        const errors = validateData(data);
        setValidationErrors(errors);
        
        if (errors.length === 0) {
          setParsedData(data);
          setUploadStage(UploadStage.PREVIEW);
        } else {
          setUploadStage(UploadStage.VALIDATION);
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast({
          title: "Error parsing file",
          description: "The CSV file format is invalid. Please check the file and try again.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  };

  // Function to validate parsed data
  const validateData = (data: any[]): string[] => {
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because row 1 is header, and we're 0-indexed
      
      // Required fields check
      const requiredFields = ['name', 'description', 'price', 'category', 'stock'];
      
      for (const field of requiredFields) {
        if (!row[field] || row[field].trim() === '') {
          errors.push(`Row ${rowNum}: Missing required field '${field}'`);
        }
      }
      
      // Name length check
      if (row.name && (row.name.length < 3 || row.name.length > 150)) {
        errors.push(`Row ${rowNum}: Product name must be between 3 and 150 characters`);
      }
      
      // Description length check
      if (row.description && (row.description.length < 20 || row.description.length > 5000)) {
        errors.push(`Row ${rowNum}: Product description must be between 20 and 5000 characters`);
      }
      
      // Price check
      const price = parseFloat(row.price);
      if (row.price && (isNaN(price) || price <= 0)) {
        errors.push(`Row ${rowNum}: Price must be a positive number`);
      }
      
      // MRP check
      const mrp = parseFloat(row.mrp);
      if (row.mrp) {
        if (isNaN(mrp) || mrp <= 0) {
          errors.push(`Row ${rowNum}: MRP must be a positive number`);
        } else if (price && mrp < price) {
          errors.push(`Row ${rowNum}: MRP must be greater than or equal to selling price`);
        }
      }
      
      // Brand check
      if (row.brand && (row.brand.length < 2 || row.brand.length > 50)) {
        errors.push(`Row ${rowNum}: Brand name must be between 2 and 50 characters`);
      }
      
      // Stock check
      if (row.stock && (isNaN(parseInt(row.stock)) || parseInt(row.stock) < 0)) {
        errors.push(`Row ${rowNum}: Stock must be a non-negative integer`);
      }
      
      // Dimension checks
      ['weight', 'length', 'width', 'height'].forEach(dim => {
        if (row[dim] && (isNaN(parseFloat(row[dim])) || parseFloat(row[dim]) < 0)) {
          errors.push(`Row ${rowNum}: ${dim} must be a positive number`);
        }
      });
      
      // Tax check
      if (row.tax) {
        const validTaxRates = ['0', '5', '12', '18', '28'];
        if (!validTaxRates.includes(row.tax)) {
          errors.push(`Row ${rowNum}: Tax must be one of ${validTaxRates.join(', ')}`);
        }
      }
      
      // Product type check
      if (row.productType && !['physical', 'digital'].includes(row.productType)) {
        errors.push(`Row ${rowNum}: Product type must be "physical" or "digital"`);
      }
      
      // Warranty and Return Policy checks
      ['warranty', 'returnPolicy'].forEach(field => {
        if (row[field] && (isNaN(parseInt(row[field])) || parseInt(row[field]) < 0)) {
          errors.push(`Row ${rowNum}: ${field} must be a non-negative integer`);
        }
      });
      
      // Main image URL check (required)
      if (!row.imageUrl || row.imageUrl.trim() === '') {
        errors.push(`Row ${rowNum}: Main product image URL (imageUrl) is required`);
      } else if (!row.imageUrl.match(/^https?:\/\/.+\..+/)) {
        errors.push(`Row ${rowNum}: imageUrl must be a valid URL starting with http:// or https://`);
      }
      
      // Additional image URL checks
      ['imageUrl1', 'imageUrl2', 'imageUrl3'].forEach(field => {
        if (row[field] && !row[field].match(/^https?:\/\/.+\..+/)) {
          errors.push(`Row ${rowNum}: ${field} must be a valid URL starting with http:// or https://`);
        }
      });
    });
    
    return errors;
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

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (data: any[]) => {
      // Simulate a network request with progress
      let progress = 0;
      setUploadProgress(progress);
      
      const results: UploadResult[] = [];
      
      for (let i = 0; i < data.length; i++) {
        // Update progress
        progress = Math.round(((i + 1) / data.length) * 100);
        setUploadProgress(progress);
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulated delay
        
        // Simulate random success/warning/error for demo
        const status = Math.random() < 0.7 ? 
          UploadStatus.SUCCESS : 
          (Math.random() < 0.5 ? UploadStatus.WARNING : UploadStatus.ERROR);
        
        let message = '';
        switch (status) {
          case UploadStatus.SUCCESS:
            message = 'Product added successfully';
            break;
          case UploadStatus.WARNING:
            message = 'Product added but requires admin approval';
            break;
          case UploadStatus.ERROR:
            message = 'Failed to add product - validation error';
            break;
        }
        
        results.push({
          row: i + 2, // +2 because row 1 is header, and we're 0-indexed
          product: {
            name: data[i].name,
            price: data[i].price,
            category: data[i].category
          },
          status,
          message
        });
      }
      
      // In a real implementation, you would call your API here
      /* 
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload products');
      }
      
      return await response.json();
      */
      
      return results;
    },
    onSuccess: (data) => {
      setUploadResults(data);
      setUploadStage(UploadStage.RESULTS);
      
      const successCount = data.filter(item => item.status === UploadStatus.SUCCESS).length;
      
      toast({
        title: "Bulk upload completed",
        description: `Successfully added ${successCount} out of ${data.length} products.`,
      });
      
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      
      setUploadStage(UploadStage.SELECT_FILE);
    }
  });

  // Handle the upload process
  const handleUpload = () => {
    setUploadStage(UploadStage.UPLOADING);
    bulkUploadMutation.mutate(parsedData);
  };

  // Reset the upload process
  const resetUpload = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setUploadResults([]);
    setUploadProgress(0);
    setUploadStage(UploadStage.SELECT_FILE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Summary statistics for results page
  const getResultSummary = () => {
    const total = uploadResults.length;
    const success = uploadResults.filter(r => r.status === UploadStatus.SUCCESS).length;
    const warnings = uploadResults.filter(r => r.status === UploadStatus.WARNING).length;
    const errors = uploadResults.filter(r => r.status === UploadStatus.ERROR).length;
    
    return { total, success, warnings, errors };
  };

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
              <h1 className="text-2xl font-bold">Bulk Product Upload</h1>
              <p className="text-muted-foreground">Upload multiple products at once using a CSV file</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {uploadStage !== UploadStage.SELECT_FILE && (
              <Button 
                variant="outline" 
                onClick={resetUpload}
              >
                Reset
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <DownloadCloud className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </div>
        
        {/* Upload Steps Indicator */}
        <div className="relative">
          {/* Progress Bar */}
          <div className="hidden sm:block h-1 bg-border absolute top-5 left-0 right-0 z-0">
            <div 
              className="h-1 bg-primary transition-all duration-500"
              style={{ 
                width: uploadStage === UploadStage.SELECT_FILE ? '0%' : 
                        uploadStage === UploadStage.VALIDATION ? '25%' :
                        uploadStage === UploadStage.PREVIEW ? '50%' :
                        uploadStage === UploadStage.UPLOADING ? '75%' : '100%'
              }}
            ></div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between relative z-10">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                uploadStage === UploadStage.SELECT_FILE ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'
              }`}>
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Select File</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                uploadStage === UploadStage.VALIDATION ? 'bg-primary text-primary-foreground' : 
                uploadStage === UploadStage.SELECT_FILE ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
              }`}>
                <HelpCircle className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Validation</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                uploadStage === UploadStage.PREVIEW ? 'bg-primary text-primary-foreground' : 
                uploadStage === UploadStage.SELECT_FILE || uploadStage === UploadStage.VALIDATION ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
              }`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Preview</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                uploadStage === UploadStage.UPLOADING ? 'bg-primary text-primary-foreground' : 
                uploadStage === UploadStage.RESULTS ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Upload</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                uploadStage === UploadStage.RESULTS ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Results</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Main Content - 2/3 Width */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Selection Stage */}
            {uploadStage === UploadStage.SELECT_FILE && (
              <Card>
                <CardHeader>
                  <CardTitle>Select CSV File</CardTitle>
                  <CardDescription>Upload a CSV file containing product information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-10 text-center hover:bg-muted/25 transition-colors">
                    <div className="mb-4 flex justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Drag CSV file here or click to browse</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a CSV file with product details. Make sure it follows the required format.
                    </p>
                    <div className="relative">
                      <input 
                        type="file" 
                        id="file-upload" 
                        accept=".csv" 
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 z-10 cursor-pointer h-full w-full"
                      />
                      <Button 
                        variant="outline" 
                        className="relative pointer-events-none"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select CSV File
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Validation Stage */}
            {uploadStage === UploadStage.VALIDATION && (
              <Card>
                <CardHeader>
                  <CardTitle>Validation Issues</CardTitle>
                  <CardDescription>
                    Please fix the following issues in your CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-destructive">Validation Failed</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your CSV file has {validationErrors.length} validation errors that must be fixed before uploading.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Line</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationErrors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {error.split(':')[0]}
                            </TableCell>
                            <TableCell>
                              {error.split(':').slice(1).join(':')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={resetUpload}>
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <DownloadCloud className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Preview Stage */}
            {uploadStage === UploadStage.PREVIEW && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview Products</CardTitle>
                  <CardDescription>
                    Review your products before uploading
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-green-800">Validation Successful</h3>
                        <p className="text-sm text-green-700 mt-1">
                          Your CSV file is valid. {parsedData.length} products are ready to be uploaded.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto border rounded-md">
                    <div className="flex items-center justify-end mb-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const detailsEls = document.querySelectorAll(".product-details");
                          detailsEls.forEach(el => el.classList.toggle("hidden"));
                        }}
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Toggle Full Details
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.map((product, index) => (
                          <>
                            <TableRow key={index}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>
                                <div className="font-medium truncate max-w-[200px]">{product.name}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {product.description?.substring(0, 50)}...
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>₹{parseInt(product.price).toLocaleString()}</div>
                                {product.mrp && (
                                  <div className="text-xs text-muted-foreground line-through">
                                    MRP: ₹{parseInt(product.mrp).toLocaleString()}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div>{product.category}</div>
                                {product.subcategory && (
                                  <div className="text-xs text-muted-foreground">
                                    {product.subcategory}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{product.stock}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => {
                                    const row = (e.target as HTMLElement).closest('tr');
                                    const detailsRow = row?.nextElementSibling;
                                    detailsRow?.classList.toggle('hidden');
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            <TableRow key={`details-${index}`} className="product-details hidden">
                              <TableCell colSpan={6} className="bg-muted/30">
                                <div className="p-2 grid grid-cols-3 md:grid-cols-4 gap-2 text-sm">
                                  {product.brand && (
                                    <div>
                                      <div className="font-medium">Brand</div>
                                      <div>{product.brand}</div>
                                    </div>
                                  )}
                                  
                                  {product.sku && (
                                    <div>
                                      <div className="font-medium">SKU</div>
                                      <div>{product.sku}</div>
                                    </div>
                                  )}
                                  
                                  {product.hsn && (
                                    <div>
                                      <div className="font-medium">HSN Code</div>
                                      <div>{product.hsn}</div>
                                    </div>
                                  )}
                                  
                                  {product.tax && (
                                    <div>
                                      <div className="font-medium">Tax Rate</div>
                                      <div>{product.tax}%</div>
                                    </div>
                                  )}
                                  
                                  {(product.weight || product.length || product.width || product.height) && (
                                    <div>
                                      <div className="font-medium">Dimensions</div>
                                      <div>
                                        {product.weight ? `${product.weight}kg` : ""}
                                        {product.weight && (product.length || product.width || product.height) ? " | " : ""}
                                        {(product.length && product.width && product.height) ? 
                                          `${product.length} × ${product.width} × ${product.height} cm` : ""}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {product.warranty && (
                                    <div>
                                      <div className="font-medium">Warranty</div>
                                      <div>{product.warranty} months</div>
                                    </div>
                                  )}
                                  
                                  {product.returnPolicy && (
                                    <div>
                                      <div className="font-medium">Return Period</div>
                                      <div>{product.returnPolicy} days</div>
                                    </div>
                                  )}
                                  
                                  {product.productType && (
                                    <div>
                                      <div className="font-medium">Product Type</div>
                                      <div className="capitalize">{product.productType}</div>
                                    </div>
                                  )}
                                  
                                  {product.imageUrl && (
                                    <div className="col-span-full">
                                      <div className="font-medium">Main Image</div>
                                      <div className="truncate">{product.imageUrl}</div>
                                    </div>
                                  )}
                                  
                                  {product.imageUrl1 && (
                                    <div className="col-span-full">
                                      <div className="font-medium">Additional Image 1</div>
                                      <div className="truncate">{product.imageUrl1}</div>
                                    </div>
                                  )}
                                  
                                  {product.imageUrl2 && (
                                    <div className="col-span-full">
                                      <div className="font-medium">Additional Image 2</div>
                                      <div className="truncate">{product.imageUrl2}</div>
                                    </div>
                                  )}
                                  
                                  {product.imageUrl3 && (
                                    <div className="col-span-full">
                                      <div className="font-medium">Additional Image 3</div>
                                      <div className="truncate">{product.imageUrl3}</div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={resetUpload}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload}>
                    Upload {parsedData.length} Products
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Uploading Stage */}
            {uploadStage === UploadStage.UPLOADING && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploading Products</CardTitle>
                  <CardDescription>
                    Please wait while your products are being processed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Processing {parsedData.length} products</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      This may take a few minutes depending on the number of products
                    </p>
                    <div className="w-full max-w-md">
                      <Progress value={uploadProgress} className="h-2" />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>{uploadProgress}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Results Stage */}
            {uploadStage === UploadStage.RESULTS && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Results</CardTitle>
                  <CardDescription>
                    Summary of your product upload
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{getResultSummary().total}</div>
                        <div className="text-sm text-muted-foreground">Total Products</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-700">{getResultSummary().success}</div>
                        <div className="text-sm text-green-600">Successful</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-50">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-700">{getResultSummary().warnings}</div>
                        <div className="text-sm text-yellow-600">Warnings</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-700">{getResultSummary().errors}</div>
                        <div className="text-sm text-red-600">Failed</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Tabs defaultValue="all">
                    <TabsList>
                      <TabsTrigger value="all">
                        All ({getResultSummary().total})
                      </TabsTrigger>
                      <TabsTrigger value="success">
                        Success ({getResultSummary().success})
                      </TabsTrigger>
                      <TabsTrigger value="warning">
                        Warnings ({getResultSummary().warnings})
                      </TabsTrigger>
                      <TabsTrigger value="error">
                        Failed ({getResultSummary().errors})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all">
                      <div className="border rounded-md overflow-hidden mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Row</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploadResults.map((result, index) => (
                              <TableRow key={index}>
                                <TableCell>{result.row}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{result.product.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {result.product.category} • ₹{parseInt(result.product.price).toLocaleString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    result.status === UploadStatus.SUCCESS ? "default" : 
                                    result.status === UploadStatus.WARNING ? "outline" : "destructive"
                                  }>
                                    {result.status === UploadStatus.SUCCESS ? "Success" : 
                                     result.status === UploadStatus.WARNING ? "Warning" : "Failed"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{result.message}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    <TabsContent value="success">
                      <div className="border rounded-md overflow-hidden mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Row</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploadResults.filter(r => r.status === UploadStatus.SUCCESS).map((result, index) => (
                              <TableRow key={index}>
                                <TableCell>{result.row}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{result.product.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {result.product.category} • ₹{parseInt(result.product.price).toLocaleString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="default">Success</Badge>
                                </TableCell>
                                <TableCell>{result.message}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    <TabsContent value="warning">
                      <div className="border rounded-md overflow-hidden mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Row</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploadResults.filter(r => r.status === UploadStatus.WARNING).map((result, index) => (
                              <TableRow key={index}>
                                <TableCell>{result.row}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{result.product.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {result.product.category} • ₹{parseInt(result.product.price).toLocaleString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">Warning</Badge>
                                </TableCell>
                                <TableCell>{result.message}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    <TabsContent value="error">
                      <div className="border rounded-md overflow-hidden mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Row</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploadResults.filter(r => r.status === UploadStatus.ERROR).map((result, index) => (
                              <TableRow key={index}>
                                <TableCell>{result.row}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{result.product.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {result.product.category} • ₹{parseInt(result.product.price).toLocaleString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="destructive">Failed</Badge>
                                </TableCell>
                                <TableCell>{result.message}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => window.history.back()}>
                    Go to Products
                  </Button>
                  <Button onClick={resetUpload}>
                    Upload More Products
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
          
          {/* Sidebar - 1/3 Width */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm">CSV File Format</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p className="mb-2">Your CSV file should include the following columns:</p>
                      <ul className="space-y-1 list-disc pl-4">
                        {VALIDATION_RULES.map((rule, index) => (
                          <li key={index}>
                            <span className="font-medium">{rule.field}</span> - {rule.rule}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm">Product Requirements</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p className="mb-2">Each product must comply with the following requirements:</p>
                      <ul className="space-y-1 list-disc pl-4">
                        <li><span className="font-medium">Required Fields:</span> name, description, price, category, stock.</li>
                        <li><span className="font-medium">Images:</span> Main image URL is required, additional image URLs are optional.</li>
                        <li><span className="font-medium">Categories:</span> Must match one of the predefined categories.</li>
                        <li><span className="font-medium">Price:</span> Must be a positive number and less than or equal to MRP.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm">Tips for Success</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <ul className="space-y-1 list-disc pl-4">
                        <li>Start with our template by clicking "Download Template".</li>
                        <li>Keep product descriptions detailed but concise.</li>
                        <li>Use high-quality image URLs for better conversions.</li>
                        <li>Double-check pricing and stock numbers before uploading.</li>
                        <li>Make sure URLs are accessible and not behind a login.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>File Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">File Format</span>
                    <span className="text-sm font-medium">CSV</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maximum File Size</span>
                    <span className="text-sm font-medium">5MB</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maximum Products</span>
                    <span className="text-sm font-medium">500</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encoding</span>
                    <span className="text-sm font-medium">UTF-8</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Required Columns</span>
                    <span className="text-sm font-medium">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  If you're having trouble with bulk upload, check our documentation or contact support for assistance.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="outline" 
                    className="justify-start" 
                    onClick={() => window.open('https://example.com/help', '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Read Documentation
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start" 
                    onClick={() => window.open('https://example.com/videos', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch Tutorial Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
}