import { useState, useRef } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Upload,
  ArrowLeft,
  DownloadCloud,
  CheckCircle,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

// Complete template with all possible product fields
const EXAMPLE_CSV = `name,description,price,purchasePrice,mrp,category,subcategory,brand,color,size,imageUrl,imageUrl1,imageUrl2,imageUrl3,stock,sku,hsn,weight,length,width,height,warranty,returnPolicy,tax,specifications,productType
Test Smartphone,Smartphone with high-performance features,999.99,899.99,1099.99,Electronics,Mobiles,Samsung,Black,6.5 inch,https://example.com/smartphone.jpg,https://example.com/smartphone-back.jpg,https://example.com/smartphone-side.jpg,https://example.com/smartphone-box.jpg,100,PHONE-123,85171290,0.5,15.5,7.2,0.8,12,15,18,"Display: AMOLED|RAM: 8GB|Storage: 128GB|Battery: 5000mAh",physical
Test Earbuds,Wireless earbuds with noise cancellation,399.99,299.99,499.99,Electronics,Audio,Apple,White,One Size,https://example.com/earbuds.jpg,https://example.com/earbuds-case.jpg,https://example.com/earbuds-open.jpg,https://example.com/earbuds-charging.jpg,200,EARBUDS-456,85183000,0.5,5.2,4.8,2.3,12,7,18,"Battery Life: 6 hours|Water Resistant: Yes|ANC: Yes|Wireless Charging: Yes",physical`;

export default function BulkUploadPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsUploading(false);
    setUploadSuccess(true);
    
    toast({
      title: "Upload successful",
      description: "Your products have been successfully uploaded.",
    });
  };

  // Reset the upload process
  const resetUpload = () => {
    setFile(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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