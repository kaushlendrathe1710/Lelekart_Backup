import { useState, useEffect, useContext } from "react";
import { useAuth, AuthContext } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Upload, 
  Edit2, 
  FileText, 
  ChevronRight, 
  Building2, 
  CreditCard, 
  Shield, 
  TrendingUp,
  Clock,
  Award,
  Save,
  Calendar,
  Clipboard,
  Briefcase,
  Check,
  AlertCircle,
  FileUp,
  User,
  X
} from "lucide-react";
import { User as UserType } from "@shared/schema";
import { useLocation } from "wouter";

const SellerProfilePage = () => {
  // Auth-related setup
  const authContext = useContext(AuthContext);
  const [location, setLocation] = useLocation();
  
  // Get user data from direct API if context is not available
  const { data: apiUser, isLoading: apiLoading } = useQuery<UserType | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch('/api/user', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch user');
      }
      
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });
  
  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  const isLoadingUser = authContext ? authContext.isLoading : apiLoading;
  
  // UI state and utilities
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
  
  // Show loading state while fetching user data
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If no user (not authenticated) or wrong role, redirect to auth page
  if (!user || user.role !== 'seller') {
    setLocation('/auth');
    return null;
  }
  
  return (
    <SellerDashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header with profile summary */}
        <div className="bg-primary/5 border-b">
          <div className="container py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarImage src={user?.profileImage} alt={user?.username} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {user?.username?.charAt(0)?.toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">{user?.businessName || user?.username}</h1>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="text-sm">Member since April 2023</span>
                    {user?.isVerified && (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-1">
                  <User className="h-4 w-4" /> View Public Profile
                </Button>
              </div>
            </div>
            
            {/* Navigation tabs */}
            <div className="mt-6 flex space-x-1 overflow-x-auto pb-1">
              <Button 
                variant={activeTab === "business-details" ? "default" : "ghost"} 
                className="rounded-full gap-2 font-medium"
                onClick={() => setActiveTab("business-details")}
              >
                <Building2 className="h-4 w-4" />
                Business Details
              </Button>
              <Button 
                variant={activeTab === "banking" ? "default" : "ghost"} 
                className="rounded-full gap-2 font-medium"
                onClick={() => setActiveTab("banking")}
              >
                <CreditCard className="h-4 w-4" />
                Banking Information
              </Button>
              <Button 
                variant={activeTab === "documents" ? "default" : "ghost"} 
                className="rounded-full gap-2 font-medium"
                onClick={() => setActiveTab("documents")}
              >
                <FileText className="h-4 w-4" />
                Documents
              </Button>
              <Button 
                variant={activeTab === "performance" ? "default" : "ghost"} 
                className="rounded-full gap-2 font-medium"
                onClick={() => setActiveTab("performance")}
              >
                <TrendingUp className="h-4 w-4" />
                Performance
              </Button>
              <Button 
                variant={activeTab === "compliance" ? "default" : "ghost"} 
                className="rounded-full gap-2 font-medium"
                onClick={() => setActiveTab("compliance")}
              >
                <Shield className="h-4 w-4" />
                Compliance
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content area */}
        <div className="container py-8">
          {/* Business Details Section */}
          {activeTab === "business-details" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-primary" /> 
                    Business Details
                  </h2>
                  <p className="text-muted-foreground mt-1">Manage your business registration information</p>
                </div>
                <Button 
                  onClick={() => setIsEditBusinessOpen(true)} 
                  variant="outline" 
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" /> Edit Details
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Business Information</h3>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary">
                      Essential
                    </Badge>
                  </div>
                  
                  {isLoadingBusiness ? (
                    <div className="px-6 py-4 space-y-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                      </div>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-2/3"></div>
                      </div>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y">
                      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                          <p className="text-lg">{businessData?.businessName || "Not provided"}</p>
                        </div>
                      </div>
                      
                      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Business Type</p>
                          <p className="text-lg">{businessData?.businessType || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center">
                      <Clipboard className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Tax Information</h3>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary">
                      Required
                    </Badge>
                  </div>
                  
                  {isLoadingBusiness ? (
                    <div className="px-6 py-4 space-y-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                      </div>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-2/3"></div>
                      </div>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y">
                      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">GST Number</p>
                          <p className="text-lg">{businessData?.gstNumber || "Not provided"}</p>
                        </div>
                      </div>
                      
                      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">PAN Number</p>
                          <p className="text-lg">{businessData?.panNumber || "Not provided"}</p>
                        </div>
                      </div>
                      
                      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tax Registration Date</p>
                          <p className="text-lg">
                            {businessData?.taxRegistrationDate ? 
                             new Date(businessData.taxRegistrationDate).toLocaleDateString() : 
                             "Not provided"}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tax Filing Status</p>
                          {businessData?.taxFilingStatus ? (
                            <Badge className={`mt-1 ${businessData.taxFilingStatus === "Up to date" ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}`}>
                              {businessData.taxFilingStatus}
                            </Badge>
                          ) : "Not available"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Banking Information Section */}
          {activeTab === "banking" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" /> 
                    Banking Information
                  </h2>
                  <p className="text-muted-foreground mt-1">Manage your payment processing details</p>
                </div>
                <Button 
                  onClick={() => setIsEditBankingOpen(true)} 
                  variant="outline" 
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" /> Edit Details
                </Button>
              </div>
              
              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">Account Information</h3>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary">
                    Confidential
                  </Badge>
                </div>
                
                {isLoadingBanking ? (
                  <div className="px-6 py-4 space-y-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                    </div>
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-6 bg-muted rounded w-2/3"></div>
                    </div>
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-6 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Account Holder Name</p>
                        <p className="text-lg">{bankingData?.accountHolderName || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                        <p className="text-lg">{bankingData?.bankName || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                        <p className="text-lg">
                          {bankingData?.accountNumber ? 
                           `••••••••${bankingData.accountNumber.slice(-4)}` : 
                           "Not provided"}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">IFSC Code</p>
                        <p className="text-lg">{bankingData?.ifscCode || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Security Notice</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your banking information is encrypted and securely stored. We never share these details with third parties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Documents Section */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" /> 
                    Documents
                  </h2>
                  <p className="text-muted-foreground mt-1">Upload and manage verification documents</p>
                </div>
                <Button 
                  onClick={() => setIsUploadDocumentOpen(true)} 
                  variant="outline" 
                  className="gap-2"
                >
                  <FileUp className="h-4 w-4" /> Upload Document
                </Button>
              </div>
              
              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                {isLoadingDocuments ? (
                  <div className="p-6 space-y-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="divide-y">
                    {documents.map((doc: any, index: number) => (
                      <div key={doc.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.documentType}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={doc.status === "Verified" ? 
                                    "bg-green-100 text-green-800 hover:bg-green-100" : 
                                    "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
                              {doc.status || "Pending"}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-6 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Documents</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      You haven't uploaded any documents yet. Documents are required for seller verification.
                    </p>
                    <Button 
                      onClick={() => setIsUploadDocumentOpen(true)}
                      className="gap-2"
                    >
                      <FileUp className="h-4 w-4" /> Upload Your First Document
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Performance Section */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" /> 
                  Performance Analytics
                </h2>
                <p className="text-muted-foreground mt-1">View your seller performance metrics</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-6 py-4 border-b">
                    <h3 className="font-medium flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1.5 text-primary" /> Sales Overview
                    </h3>
                  </div>
                  <div className="divide-y">
                    <div className="px-6 py-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Total Sales</span>
                      <span className="font-medium">₹24,500</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Orders</span>
                      <span className="font-medium">43</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Return Rate</span>
                      <span className="font-medium">2.3%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-6 py-4 border-b">
                    <h3 className="font-medium flex items-center">
                      <Award className="h-4 w-4 mr-1.5 text-primary" /> Seller Rating
                    </h3>
                  </div>
                  <div className="divide-y">
                    <div className="px-6 py-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Overall Rating</span>
                      <span className="font-medium">4.7/5</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Reviews</span>
                      <span className="font-medium">32</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Response Rate</span>
                      <span className="font-medium">98%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-6 py-4 border-b">
                    <h3 className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1.5 text-primary" /> Processing Time
                    </h3>
                  </div>
                  <div className="divide-y">
                    <div className="px-6 py-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Order Processing</span>
                      <span className="font-medium">1.2 days</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Shipping Time</span>
                      <span className="font-medium">2.4 days</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Return Processing</span>
                      <span className="font-medium">1.8 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Compliance Section */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" /> 
                  Compliance Status
                </h2>
                <p className="text-muted-foreground mt-1">Your compliance with platform policies</p>
              </div>
              
              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="divide-y">
                  <div className="p-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Tax Compliance</p>
                        <p className="text-sm text-muted-foreground">
                          Valid through December 31, 2024
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Compliant
                    </Badge>
                  </div>
                  
                  <div className="p-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Seller Agreement</p>
                        <p className="text-sm text-muted-foreground">
                          Accepted on April 15, 2023
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Accepted
                    </Badge>
                  </div>
                  
                  <div className="p-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Product Quality Guidelines</p>
                        <p className="text-sm text-muted-foreground">
                          Last reviewed on January 10, 2024
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Compliant
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Upload Document Dialog */}
      <Dialog open={isUploadDocumentOpen} onOpenChange={setIsUploadDocumentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Verification Document</DialogTitle>
            <DialogDescription>
              Upload documents to verify your seller account. Verification typically takes 1-2 business days.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUploadDocument} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type*</Label>
              <Select value={documentType} onValueChange={setDocumentType} required>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GST Certificate">GST Certificate</SelectItem>
                  <SelectItem value="PAN Card">PAN Card</SelectItem>
                  <SelectItem value="Business License">Business License</SelectItem>
                  <SelectItem value="Bank Statement">Bank Statement</SelectItem>
                  <SelectItem value="Other">Other Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document">Upload File*</Label>
              <div className="border border-dashed rounded-lg p-4 text-center bg-muted/50">
                <Input 
                  id="document" 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="hidden"
                />
                <label htmlFor="document" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  {documentFile ? (
                    <p className="text-sm font-medium">{documentFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-1">Click to select a file</p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, JPEG, PNG (5MB max)</p>
                    </>
                  )}
                </label>
              </div>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsUploadDocumentOpen(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!documentFile || !documentType || uploadDocumentMutation.isPending}
                className="gap-2"
              >
                {uploadDocumentMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><FileUp className="h-4 w-4" /> Upload Document</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Business Details Dialog */}
      <Dialog open={isEditBusinessOpen} onOpenChange={setIsEditBusinessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Business Details</DialogTitle>
            <DialogDescription>
              Provide accurate information about your business to comply with regulations.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateBusinessDetails} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name*</Label>
              <Input 
                id="businessName"
                name="businessName"
                placeholder="Enter your official business name"
                value={businessDetails.businessName}
                onChange={handleBusinessInputChange}
                className="h-11"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select 
                value={businessDetails.businessType} 
                onValueChange={(value) => setBusinessDetails(prev => ({ ...prev, businessType: value }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select business structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Limited Liability Company">Limited Liability Company</SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input 
                  id="gstNumber"
                  name="gstNumber"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={businessDetails.gstNumber}
                  onChange={handleBusinessInputChange}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number</Label>
                <Input 
                  id="panNumber"
                  name="panNumber"
                  placeholder="e.g. ABCDE1234F"
                  value={businessDetails.panNumber}
                  onChange={handleBusinessInputChange}
                  className="h-11"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxRegistrationDate">Tax Registration Date</Label>
                <Input 
                  id="taxRegistrationDate"
                  name="taxRegistrationDate"
                  type="date"
                  value={businessDetails.taxRegistrationDate}
                  onChange={handleBusinessInputChange}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxFilingStatus">Tax Filing Status</Label>
                <Select 
                  value={businessDetails.taxFilingStatus} 
                  onValueChange={(value) => setBusinessDetails(prev => ({ ...prev, taxFilingStatus: value }))}
                >
                  <SelectTrigger className="h-11">
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
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditBusinessOpen(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!businessDetails.businessName || updateBusinessDetailsMutation.isPending}
                className="gap-2"
              >
                {updateBusinessDetailsMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save Changes</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Banking Information Dialog */}
      <Dialog open={isEditBankingOpen} onOpenChange={setIsEditBankingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Banking Information</DialogTitle>
            <DialogDescription>
              This information is used for payments and settlement of your sales.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateBankingInfo} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name*</Label>
              <Input 
                id="accountHolderName"
                name="accountHolderName"
                placeholder="Name as it appears on bank account"
                value={bankingInfo.accountHolderName}
                onChange={handleBankingInputChange}
                className="h-11"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name*</Label>
              <Input 
                id="bankName"
                name="bankName"
                placeholder="e.g. State Bank of India"
                value={bankingInfo.bankName}
                onChange={handleBankingInputChange}
                className="h-11"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number*</Label>
                <Input 
                  id="accountNumber"
                  name="accountNumber"
                  placeholder="Enter account number"
                  value={bankingInfo.accountNumber}
                  onChange={handleBankingInputChange}
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code*</Label>
                <Input 
                  id="ifscCode"
                  name="ifscCode"
                  placeholder="e.g. SBIN0000123"
                  value={bankingInfo.ifscCode}
                  onChange={handleBankingInputChange}
                  className="h-11"
                  required
                />
              </div>
            </div>
            
            <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm border border-amber-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>For security reasons, please verify that all banking details are accurate. Incorrect details may lead to payment failures.</p>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditBankingOpen(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Cancel
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
                className="gap-2"
              >
                {updateBankingInfoMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save Changes</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
};

export default SellerProfilePage;