import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Share2, 
  Upload, 
  Edit, 
  FileText, 
  RefreshCw, 
  Building, 
  CreditCard, 
  Shield, 
  TrendingUp,
  Clock,
  Award
} from "lucide-react";

const SellerProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("business-details");
  
  // Modal states
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [isEditBusinessOpen, setIsEditBusinessOpen] = useState(false);
  const [isEditBankingOpen, setIsEditBankingOpen] = useState(false);
  
  // Form states
  const [documentType, setDocumentType] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  
  const [businessDetails, setBusinessDetails] = useState({
    businessName: "",
    gstNumber: "",
    panNumber: "",
    businessType: "",
    taxRegistrationDate: "",
    taxFilingStatus: ""
  });
  
  const [bankingInfo, setBankingInfo] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: ""
  });
  
  // Query for seller documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/seller/documents'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/seller/documents');
      return await res.json();
    }
  });
  
  // Query for business details
  const { data: businessData, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ['/api/seller/business-details'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/seller/business-details');
      return await res.json();
    }
  });
  
  // Query for banking information
  const { data: bankingData, isLoading: isLoadingBanking } = useQuery({
    queryKey: ['/api/seller/banking-information'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/seller/banking-information');
      return await res.json();
    }
  });
  
  // Update useEffect to populate form states when data is loaded
  useEffect(() => {
    if (businessData) {
      setBusinessDetails({
        businessName: businessData.businessName || "",
        gstNumber: businessData.gstNumber || "",
        panNumber: businessData.panNumber || "",
        businessType: businessData.businessType || "",
        taxRegistrationDate: businessData.taxRegistrationDate ? 
          new Date(businessData.taxRegistrationDate).toISOString().split('T')[0] : "",
        taxFilingStatus: businessData.taxFilingStatus || ""
      });
    }
  }, [businessData]);
  
  useEffect(() => {
    if (bankingData) {
      setBankingInfo({
        accountHolderName: bankingData.accountHolderName || "",
        accountNumber: bankingData.accountNumber || "",
        bankName: bankingData.bankName || "",
        ifscCode: bankingData.ifscCode || ""
      });
    }
  }, [bankingData]);
  
  // Mutations
  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!documentFile || !documentType) {
        throw new Error("Missing document file or type");
      }
      
      const formData = new FormData();
      formData.append("document", documentFile);
      formData.append("documentType", documentType);
      
      const res = await fetch('/api/seller/documents', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload document");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/documents'] });
      setIsUploadDocumentOpen(false);
      setDocumentFile(null);
      setDocumentType("");
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateBusinessDetailsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', '/api/seller/business-details', businessDetails);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update business details");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Business Details Updated",
        description: "Your business details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/business-details'] });
      setIsEditBusinessOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateBankingInfoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', '/api/seller/banking-information', bankingInfo);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update banking information");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Banking Information Updated",
        description: "Your banking information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/banking-information'] });
      setIsEditBankingOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocumentFile(e.target.files[0]);
    }
  };
  
  const handleBusinessInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusinessDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBankingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBankingInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    uploadDocumentMutation.mutate();
  };
  
  const handleUpdateBusinessDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessDetailsMutation.mutate();
  };
  
  const handleUpdateBankingInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateBankingInfoMutation.mutate();
  };
  
  return (
    <SellerDashboardLayout>
      <div className="container py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Seller Profile</h1>
          <p className="text-muted-foreground">Member since April 2023</p>
        </header>
        
        <Tabs defaultValue="business-details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="business-details">Business Details</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="business-details">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Building className="mr-2 h-5 w-5" /> Business Details
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setIsEditBusinessOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </CardTitle>
                  <CardDescription>Your business registration information</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingBusiness ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  ) : (
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">GST Number</dt>
                        <dd className="text-base">{businessData?.gstNumber || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">PAN Number</dt>
                        <dd className="text-base">{businessData?.panNumber || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Business Type</dt>
                        <dd className="text-base">{businessData?.businessType || "Not specified"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Tax Registration Date</dt>
                        <dd className="text-base">
                          {businessData?.taxRegistrationDate ? 
                           new Date(businessData.taxRegistrationDate).toLocaleDateString() : 
                           "Not provided"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Tax Filing Status</dt>
                        <dd className="text-base">
                          {businessData?.taxFilingStatus ? (
                            <Badge variant={businessData.taxFilingStatus === "Up to date" ? "default" : "secondary"}>
                              {businessData.taxFilingStatus}
                            </Badge>
                          ) : "Not available"}
                        </dd>
                      </div>
                    </dl>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="flex items-center">
                      <CreditCard className="mr-2 h-5 w-5" /> Banking Information
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setIsEditBankingOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </CardTitle>
                  <CardDescription>Your payment processing details</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingBanking ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  ) : (
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Bank Account</dt>
                        <dd className="text-base">
                          {bankingData?.accountNumber ? 
                           `XXXX XXXX XXXX ${bankingData.accountNumber.slice(-4)}` : 
                           "Not provided"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Bank Name</dt>
                        <dd className="text-base">{bankingData?.bankName || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">IFSC Code</dt>
                        <dd className="text-base">{bankingData?.ifscCode || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Account Holder Name</dt>
                        <dd className="text-base">{bankingData?.accountHolderName || "Not provided"}</dd>
                      </div>
                    </dl>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" /> Sales Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">₹3,21,450</div>
                      <p className="text-sm text-muted-foreground">Total Sales (Last 30 days)</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold">432</div>
                      <p className="text-sm text-muted-foreground">Orders Fulfilled</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">+15.3%</div>
                      <p className="text-sm text-muted-foreground">Growth Rate (vs. Last Month)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <RefreshCw className="mr-2 h-5 w-5" /> Return Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">3.2%</div>
                      <p className="text-sm text-muted-foreground">Return Rate</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold">21</div>
                      <p className="text-sm text-muted-foreground">Pending Returns</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold">92%</div>
                      <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5" /> Seller Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">4.7/5.0</div>
                      <p className="text-sm text-muted-foreground">Overall Rating</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold">356</div>
                      <p className="text-sm text-muted-foreground">Total Reviews</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">A+</div>
                      <p className="text-sm text-muted-foreground">Seller Performance Grade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="documents">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 border-b pb-4">
                <Button variant="outline" className="bg-primary text-primary-foreground">
                  Business Info
                </Button>
                <Button variant="outline">
                  Address
                </Button>
                <Button variant="outline">
                  Banking Details
                </Button>
                <Button variant="outline">
                  Documents
                </Button>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Verification Documents</h2>
                <p className="text-muted-foreground">Upload documents to verify your business. These documents will be reviewed by our team as part of the verification process.</p>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  {/* GST Certificate Card */}
                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">GST Certificate</h3>
                      <p className="text-sm text-muted-foreground mt-1">Upload your GST Certificate for tax verification</p>
                    </div>
                    
                    <div className="p-8 flex flex-col items-center justify-center">
                      <div className="h-12 w-12 flex items-center justify-center rounded-full border-2 border-blue-500 mb-4">
                        <Upload className="h-6 w-6 text-blue-500" />
                      </div>
                      <Button 
                        variant="link" 
                        className="text-blue-500 font-medium p-0 h-auto"
                        onClick={() => {
                          setDocumentType("GST Certificate");
                          setIsUploadDocumentOpen(true);
                        }}
                      >
                        Click to upload
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG or PNG (max. 5MB)</p>
                    </div>
                  </div>
                  
                  {/* PAN Card */}
                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">PAN Card</h3>
                      <p className="text-sm text-muted-foreground mt-1">Upload your PAN Card for identity verification</p>
                    </div>
                    
                    <div className="p-8 flex flex-col items-center justify-center">
                      <div className="h-12 w-12 flex items-center justify-center rounded-full border-2 border-blue-500 mb-4">
                        <Upload className="h-6 w-6 text-blue-500" />
                      </div>
                      <Button 
                        variant="link" 
                        className="text-blue-500 font-medium p-0 h-auto"
                        onClick={() => {
                          setDocumentType("PAN Card");
                          setIsUploadDocumentOpen(true);
                        }}
                      >
                        Click to upload
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG or PNG (max. 5MB)</p>
                    </div>
                  </div>
                  
                  {/* Address Proof */}
                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">Address Proof</h3>
                      <p className="text-sm text-muted-foreground mt-1">Upload a document as proof of your business address</p>
                    </div>
                    
                    <div className="p-8 flex flex-col items-center justify-center">
                      <div className="h-12 w-12 flex items-center justify-center rounded-full border-2 border-blue-500 mb-4">
                        <Upload className="h-6 w-6 text-blue-500" />
                      </div>
                      <Button 
                        variant="link" 
                        className="text-blue-500 font-medium p-0 h-auto"
                        onClick={() => {
                          setDocumentType("Address Proof");
                          setIsUploadDocumentOpen(true);
                        }}
                      >
                        Click to upload
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG or PNG (max. 5MB)</p>
                    </div>
                  </div>
                  
                  {/* Letter of Incorporation */}
                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">Letter of Incorporation</h3>
                      <p className="text-sm text-muted-foreground mt-1">Upload your company's Letter of Incorporation (Optional)</p>
                    </div>
                    
                    <div className="p-8 flex flex-col items-center justify-center">
                      <div className="h-12 w-12 flex items-center justify-center rounded-full border-2 border-blue-500 mb-4">
                        <Upload className="h-6 w-6 text-blue-500" />
                      </div>
                      <Button 
                        variant="link" 
                        className="text-blue-500 font-medium p-0 h-auto"
                        onClick={() => {
                          setDocumentType("Letter of Incorporation");
                          setIsUploadDocumentOpen(true);
                        }}
                      >
                        Click to upload
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG or PNG (max. 5MB)</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-8">
                  <Button variant="outline" className="px-6">Cancel</Button>
                  <Button variant="default" className="bg-blue-500 hover:bg-blue-600 px-6">Save Profile</Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="payments">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" /> Payment Information
                  </CardTitle>
                  <CardDescription>Your banking and payment details</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Bank Account</dt>
                      <dd className="text-base">
                        {bankingData?.accountNumber ? 
                         `XXXX XXXX XXXX ${bankingData.accountNumber.slice(-4)}` : 
                         "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Bank Name</dt>
                      <dd className="text-base">{bankingData?.bankName || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">IFSC Code</dt>
                      <dd className="text-base">{bankingData?.ifscCode || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Account Holder Name</dt>
                      <dd className="text-base">{bankingData?.accountHolderName || "Not provided"}</dd>
                    </div>
                    
                    <div className="pt-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditBankingOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" /> Update Banking Information
                      </Button>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" /> Payment Statistics
                  </CardTitle>
                  <CardDescription>Your payment processing metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-blue-600 text-sm font-medium mb-1">PENDING</div>
                      <div className="text-2xl font-bold">₹48,550</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-green-600 text-sm font-medium mb-1">PROCESSED</div>
                      <div className="text-2xl font-bold">₹2,35,640</div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <div className="text-amber-600 text-sm font-medium mb-1">ON HOLD</div>
                      <div className="text-2xl font-bold">₹12,500</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-purple-600 text-sm font-medium mb-1">NEXT PAYOUT</div>
                      <div className="text-2xl font-bold">Apr 18</div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    View Payment History
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="compliance">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" /> Compliance Status
                  </CardTitle>
                  <CardDescription>Your account compliance details</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Seller Verification</dt>
                      <dd className="flex items-center">
                        <Badge variant="default" className="mr-2">Complete</Badge>
                        <span className="text-sm text-muted-foreground">Verified on Apr 12, 2023</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">GST Compliance</dt>
                      <dd className="flex items-center">
                        <Badge variant="default" className="mr-2">Complete</Badge>
                        <span className="text-sm text-muted-foreground">Last updated Jan 15, 2024</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Tax Filing Status</dt>
                      <dd className="flex items-center">
                        <Badge variant="default" className="mr-2">Current</Badge>
                        <span className="text-sm text-muted-foreground">Next due Jun 30, 2024</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Policy Agreement</dt>
                      <dd className="flex items-center">
                        <Badge variant="default" className="mr-2">Accepted</Badge>
                        <span className="text-sm text-muted-foreground">Seller Policy v3.2</span>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <RefreshCw className="mr-2 h-5 w-5" /> Compliance Requirements
                  </CardTitle>
                  <CardDescription>Required actions and documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Document Requirements</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">✓</div>
                          GST Certificate
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">✓</div>
                          PAN Card
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">✓</div>
                          Business Registration
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">✓</div>
                          Bank Statement
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">✓</div>
                          Address Proof
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Policy Compliance</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">✓</div>
                          Seller Policy Agreement
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">✓</div>
                          Return & Refund Policy
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">✓</div>
                          Shipping & Delivery Terms
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Upload Document Dialog */}
      <Dialog open={isUploadDocumentOpen} onOpenChange={setIsUploadDocumentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadDocument} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select 
                value={documentType} 
                onValueChange={setDocumentType}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GST Certificate">GST Certificate</SelectItem>
                  <SelectItem value="PAN Card">PAN Card</SelectItem>
                  <SelectItem value="Business Registration">Business Registration</SelectItem>
                  <SelectItem value="Bank Statement">Bank Statement</SelectItem>
                  <SelectItem value="Address Proof">Address Proof</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document">Document File</Label>
              <div className="border-dashed border-2 rounded-md p-4 text-center cursor-pointer" onClick={() => document.getElementById('document')?.click()}>
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, PNG, JPG up to 10MB
                </p>
                <input
                  id="document"
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  required
                />
              </div>
              {documentFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {documentFile.name}
                </p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadDocumentOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!documentFile || !documentType || uploadDocumentMutation.isPending}
              >
                {uploadDocumentMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Upload Document
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Business Details Dialog */}
      <Dialog open={isEditBusinessOpen} onOpenChange={setIsEditBusinessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Business Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateBusinessDetails} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name*</Label>
              <Input 
                id="businessName"
                name="businessName"
                value={businessDetails.businessName}
                onChange={handleBusinessInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input 
                id="gstNumber"
                name="gstNumber"
                value={businessDetails.gstNumber}
                onChange={handleBusinessInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input 
                id="panNumber"
                name="panNumber"
                value={businessDetails.panNumber}
                onChange={handleBusinessInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select 
                value={businessDetails.businessType} 
                onValueChange={(value) => setBusinessDetails(prev => ({ ...prev, businessType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Private Limited Company">Private Limited Company</SelectItem>
                  <SelectItem value="Limited Liability Partnership">Limited Liability Partnership</SelectItem>
                  <SelectItem value="Public Limited Company">Public Limited Company</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taxRegistrationDate">Tax Registration Date</Label>
              <Input 
                id="taxRegistrationDate"
                name="taxRegistrationDate"
                type="date"
                value={businessDetails.taxRegistrationDate}
                onChange={handleBusinessInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taxFilingStatus">Tax Filing Status</Label>
              <Select 
                value={businessDetails.taxFilingStatus} 
                onValueChange={(value) => setBusinessDetails(prev => ({ ...prev, taxFilingStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Up to date">Up to date</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Exempt">Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditBusinessOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!businessDetails.businessName || updateBusinessDetailsMutation.isPending}
              >
                {updateBusinessDetailsMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Banking Information Dialog */}
      <Dialog open={isEditBankingOpen} onOpenChange={setIsEditBankingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Banking Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateBankingInfo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name*</Label>
              <Input 
                id="accountHolderName"
                name="accountHolderName"
                value={bankingInfo.accountHolderName}
                onChange={handleBankingInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number*</Label>
              <Input 
                id="accountNumber"
                name="accountNumber"
                value={bankingInfo.accountNumber}
                onChange={handleBankingInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name*</Label>
              <Input 
                id="bankName"
                name="bankName"
                value={bankingInfo.bankName}
                onChange={handleBankingInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code*</Label>
              <Input 
                id="ifscCode"
                name="ifscCode"
                value={bankingInfo.ifscCode}
                onChange={handleBankingInputChange}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditBankingOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  !bankingInfo.accountHolderName || 
                  !bankingInfo.accountNumber || 
                  !bankingInfo.bankName || 
                  !bankingInfo.ifscCode ||
                  updateBankingInfoMutation.isPending
                }
              >
                {updateBankingInfoMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
};

export default SellerProfilePage;