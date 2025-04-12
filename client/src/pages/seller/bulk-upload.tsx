import { useState, useRef, useContext } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Upload,
  ArrowLeft,
  DownloadCloud,
  CheckCircle,
  FileText,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

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
            {(file || uploadSuccess) && (
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
        
        <Card>
          <CardContent className="pt-6">
            {!file && !uploadSuccess ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Select a CSV file containing your product data. Make sure it follows the template format.
                </p>
                <div className="flex flex-col gap-4 w-full max-w-sm">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Select CSV File
                  </Button>
                </div>
              </div>
            ) : uploadSuccess ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-green-100 text-green-800 rounded-full p-4 mb-4">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">Upload Successful!</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Your products have been successfully uploaded. They may require approval before appearing in the store.
                </p>
                <div className="flex gap-4">
                  <Button onClick={resetUpload} variant="outline">
                    Upload More Products
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">File Selected</h3>
                <p className="text-muted-foreground text-center mb-2">
                  {file?.name}
                </p>
                <p className="text-muted-foreground text-center mb-6 text-sm">
                  {file ? `${(file.size / 1024).toFixed(2)} KB` : ""}
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="min-w-[120px]"
                  >
                    {isUploading ? "Uploading..." : "Upload Products"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetUpload}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SellerDashboardLayout>
  );
}