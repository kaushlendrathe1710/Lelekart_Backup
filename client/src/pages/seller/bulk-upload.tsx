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
const EXAMPLE_CSV = `name,description,price,purchasePrice,mrp,category,subcategory,brand,color,size,imageUrl1,imageUrl2,imageUrl3,imageUrl4,stock,sku,hsn,weight,length,width,height,warranty,returnPolicy,tax,specifications,productType
Samsung Galaxy S21,Latest flagship smartphone with high-performance features,99999,89999,109999,Electronics,Mobiles,Samsung,Black,6.5 inch,https://example.com/smartphone.jpg,https://example.com/smartphone-back.jpg,https://example.com/smartphone-side.jpg,https://example.com/smartphone-box.jpg,100,SM-G991,85171290,180,150,72,8,12,15,18,"Display: AMOLED|RAM: 8GB|Storage: 128GB|Battery: 5000mAh",physical
Apple AirPods Pro,Wireless earbuds with active noise cancellation,29999,19999,34999,Electronics,Audio,Apple,White,One Size,https://example.com/earbuds.jpg,https://example.com/earbuds-case.jpg,https://example.com/earbuds-open.jpg,https://example.com/earbuds-charging.jpg,200,APP-123,85183000,50,52,48,23,12,7,18,"Battery Life: 6 hours|Water Resistant: Yes|ANC: Yes|Wireless Charging: Yes",physical
Nike Air Zoom,Comfortable sports shoes for daily runners,4999,3999,5999,Fashion,Footwear,Nike,Blue,"UK 9, US 10",https://example.com/shoes.jpg,https://example.com/shoes-side.jpg,https://example.com/shoes-sole.jpg,https://example.com/shoes-box.jpg,50,NK-AZ-10,64021990,290,285,105,110,6,30,12,"Material: Mesh|Sole: Rubber|Weight: 290g|Cushioning: React Foam",physical`;

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

export default function BulkUploadPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Try to use context first if available
  const authContext = useContext(AuthContext);
  
  // Get user data from direct API if context is not available
  const { data: apiUser, isLoading: isUserLoading } = useQuery<any>({
    queryKey: ['/api/user'],
    enabled: !authContext?.user,
  });
  
  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;

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

  // Handle the upload process
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create form data to send file
      const formData = new FormData();
      formData.append('file', file);

      // Send to API
      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // Parse the CSV file client-side to add products directly
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target?.result) return;
        
        const csvData = event.target.result as string;
        const lines = csvData.split('\n');
        const headers = parseCsvLine(lines[0]).map(h => h.trim());
        
        // Track successful uploads and errors
        let successCount = 0;
        let errorCount = 0;
        
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
            stock: 0
          };
          
          // Map CSV values to product schema fields
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            if (!value) return; // Skip empty values
            
            // Handle numeric fields
            if (['price', 'purchasePrice', 'stock', 'mrp', 'weight', 'length', 'width', 'height', 'warranty', 'returnPolicy', 'tax'].includes(header)) {
              productData[header] = parseInt(value, 10);
            } 
            // Handle boolean fields
            else if (header === 'approved') {
              productData[header] = value.toLowerCase() === 'true';
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
            // Handle product metadata fields that should be combined into a metadata object
            else if (['subcategory', 'brand', 'sku', 'hsn', 'productType'].includes(header)) {
              if (!productData.metadata) {
                productData.metadata = {};
              }
              productData.metadata[header] = value;
            }
            // All other fields
            else {
              productData[header] = value;
            }
          });
          
          // Convert images array to JSON string
          if (productData.images && Array.isArray(productData.images)) {
            productData.images = JSON.stringify(productData.images);
          }
          
          // Convert metadata object to JSON string if it exists
          if (productData.metadata) {
            productData.metadata = JSON.stringify(productData.metadata);
          }
          
          // Ensure we have all required fields
          if (!productData.name || !productData.description || !productData.price || 
              !productData.category || !productData.imageUrl) {
            console.error(`Row ${i} is missing required fields`);
            errorCount++;
            continue;
          }
          
          // Create each product via API - use the current user's ID
          try {
            // Add the current user's ID to each product
            if (user?.id) {
              productData.sellerId = user.id;
            }
            
            const createResponse = await fetch('/api/products', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(productData),
              credentials: 'include'
            });
            
            if (createResponse.ok) {
              successCount++;
            } else {
              const errorData = await createResponse.json();
              console.error(`Error creating product (row ${i}):`, errorData);
              errorCount++;
            }
          } catch (error) {
            console.error(`Error creating product (row ${i}):`, error);
            errorCount++;
          }
        }
        
        setIsUploading(false);
        setUploadSuccess(true);
        
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
            description: `${successCount} products uploaded successfully. ${errorCount} products failed. Check console for details.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Upload successful",
            description: `${successCount} products have been uploaded and are pending approval.`,
          });
        }
      };
      
      reader.readAsText(file);
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
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Process Upload
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
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