import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Trash2, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Product, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ProductWithSeller extends Product {
  seller?: User;
}

export default function AdminProductApproval() {
  const [pendingProducts, setPendingProducts] = useState<ProductWithSeller[]>([]);
  const [approvedProducts, setApprovedProducts] = useState<ProductWithSeller[]>([]);
  const [rejectedProducts, setRejectedProducts] = useState<ProductWithSeller[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSeller | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch the products for approval directly - authorization is handled by middleware
        const response = await fetch("/api/admin/products/approval", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in as an admin to access this page.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (response.status === 403) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch product data");
        }
        
        const data = await response.json();
        console.log("Fetched products data:", data);
        
        if (!Array.isArray(data)) {
          console.error("Expected array of products but got:", data);
          throw new Error("Invalid data format received from server");
        }
        
        // Separate products by approval status
        setPendingProducts(data.filter((product: ProductWithSeller) => 
          product.approvalStatus === "pending" || !product.approvalStatus
        ));
        
        setApprovedProducts(data.filter((product: ProductWithSeller) => 
          product.approvalStatus === "approved"
        ));
        
        setRejectedProducts(data.filter((product: ProductWithSeller) => 
          product.approvalStatus === "rejected"
        ));
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error fetching products",
          description: "There was a problem loading the product data. Please make sure you're logged in as an admin.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [toast]);
  
  const handleApproveProduct = async (productId: number) => {
    setIsApproving(true);
    try {
      const response = await apiRequest("POST", `/api/admin/products/${productId}/approve`);
      
      if (!response.ok) {
        throw new Error("Failed to approve product");
      }
      
      // Update the local state
      const updatedProduct = await response.json();
      
      // Remove from pending and add to approved
      setPendingProducts(prev => prev.filter(product => product.id !== productId));
      setApprovedProducts(prev => [...prev, updatedProduct]);
      
      // If this was the selected product, update it
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(updatedProduct);
      }
      
      toast({
        title: "Product approved",
        description: "The product has been approved and is now visible on the store.",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
    } catch (error) {
      console.error("Error approving product:", error);
      toast({
        title: "Error approving product",
        description: "There was a problem approving the product.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleRejectProduct = async (productId: number) => {
    setIsRejecting(true);
    try {
      const response = await apiRequest("POST", `/api/admin/products/${productId}/reject`, {
        reason: rejectionReason || "Product does not meet store requirements"
      });
      
      if (!response.ok) {
        throw new Error("Failed to reject product");
      }
      
      // Update the local state
      const updatedProduct = await response.json();
      
      // Remove from pending and add to rejected
      setPendingProducts(prev => prev.filter(product => product.id !== productId));
      setRejectedProducts(prev => [...prev, updatedProduct]);
      
      // If this was the selected product, update it
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(updatedProduct);
      }
      
      toast({
        title: "Product rejected",
        description: "The product has been rejected and will not be visible on the store.",
      });
      
      // Clear the rejection reason for next use
      setRejectionReason("");
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
    } catch (error) {
      console.error("Error rejecting product:", error);
      toast({
        title: "Error rejecting product",
        description: "There was a problem rejecting the product.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };
  
  const openProductDetails = (product: ProductWithSeller) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
    // Reset rejection reason when opening details
    setRejectionReason("");
  };
  
  const getProductImages = (product: ProductWithSeller) => {
    const images = [];
    
    // Add the primary image
    if (product.imageUrl) {
      images.push(product.imageUrl);
    }
    
    // Parse and add additional images if available
    if (product.images) {
      try {
        const additionalImages = JSON.parse(product.images);
        if (Array.isArray(additionalImages)) {
          images.push(...additionalImages.filter(Boolean));
        }
      } catch (error) {
        console.error("Failed to parse additional images:", error);
      }
    }
    
    return images;
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Product Approval</h1>
            <p className="text-muted-foreground">Manage and approve products before they appear on the store</p>
          </div>
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="relative">
              Pending Approval
              {pendingProducts.length > 0 && (
                <Badge className="ml-2 bg-orange-500" variant="outline">
                  {pendingProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved Products
              {approvedProducts.length > 0 && (
                <Badge className="ml-2 bg-green-500" variant="outline">
                  {approvedProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected Products
              {rejectedProducts.length > 0 && (
                <Badge className="ml-2 bg-red-500" variant="outline">
                  {rejectedProducts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {pendingProducts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No pending product approvals</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All products have been reviewed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Product Approvals</CardTitle>
                  <CardDescription>
                    Review and approve products before they appear on the store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                                  }}
                                />
                              </div>
                              <span className="truncate max-w-[150px]" title={product.name}>
                                {product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            {product.seller ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>
                                    {(product.seller.name || product.seller.username)?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{product.seller.name || product.seller.username}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-orange-500">Pending</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openProductDetails(product)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveProduct(product.id)}
                                disabled={isApproving}
                              >
                                {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                Approve
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => openProductDetails(product)}
                                disabled={isRejecting}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="approved">
            {approvedProducts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No approved products yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Products that are approved will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Approved Products</CardTitle>
                  <CardDescription>
                    All products that have been approved and are visible on the store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                                  }}
                                />
                              </div>
                              <span className="truncate max-w-[150px]" title={product.name}>
                                {product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            {product.seller ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>
                                    {(product.seller.name || product.seller.username)?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{product.seller.name || product.seller.username}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">Approved</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openProductDetails(product)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => openProductDetails(product)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="rejected">
            {rejectedProducts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No rejected products</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Products that are rejected will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Rejected Products</CardTitle>
                  <CardDescription>
                    All products that have been rejected and are not visible on the store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                                  }}
                                />
                              </div>
                              <span className="truncate max-w-[150px]" title={product.name}>
                                {product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            {product.seller ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>
                                    {(product.seller.name || product.seller.username)?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{product.seller.name || product.seller.username}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">Rejected</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openProductDetails(product)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveProduct(product.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Product Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
              <DialogDescription>
                Detailed information about the product
              </DialogDescription>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Images */}
                  <div className="flex flex-col">
                    <div className="bg-gray-100 rounded-lg mb-3">
                      <div className="aspect-square overflow-hidden rounded-lg">
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="h-full w-full object-cover object-center"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Additional Images Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {getProductImages(selectedProduct).map((imgUrl, idx) => (
                        <div 
                          key={idx} 
                          className="aspect-square rounded overflow-hidden border hover:border-primary transition-colors"
                        >
                          <img 
                            src={imgUrl} 
                            alt={`${selectedProduct.name} - Image ${idx + 1}`} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedProduct.name}</h2>
                      
                      <div className="mt-1">
                        {selectedProduct.approvalStatus === "pending" || !selectedProduct.approvalStatus ? (
                          <Badge className="bg-orange-500">Pending Approval</Badge>
                        ) : selectedProduct.approvalStatus === "approved" ? (
                          <Badge className="bg-green-500">Approved</Badge>
                        ) : (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </div>
                      
                      <div className="mt-3 text-xl font-bold text-primary">
                        {formatCurrency(selectedProduct.price)}
                      </div>
                      
                      {selectedProduct.purchasePrice && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          Purchase Price: {formatCurrency(selectedProduct.purchasePrice)}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                      <p>{selectedProduct.category}</p>
                    </div>
                    
                    {selectedProduct.seller && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Seller Information</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {(selectedProduct.seller.name || selectedProduct.seller.username)?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{selectedProduct.seller.name || selectedProduct.seller.username}</div>
                            <div className="text-xs text-muted-foreground">{selectedProduct.seller.email}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Stock</h3>
                      <p>{selectedProduct.stock} units</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                      <p className="whitespace-pre-line text-sm">{selectedProduct.description}</p>
                    </div>
                    
                    {selectedProduct.specifications && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Specifications</h3>
                        <p className="whitespace-pre-line text-sm">{selectedProduct.specifications}</p>
                      </div>
                    )}
                    
                    {selectedProduct.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <h3 className="text-sm font-medium text-red-500">Rejection Reason</h3>
                        <p className="text-sm text-red-700">{selectedProduct.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Rejection reason input - show only for pending products or when approving rejected products */}
                {(selectedProduct.approvalStatus === "pending" || !selectedProduct.approvalStatus) && (
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Rejection Reason (only needed if rejecting)</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Provide a reason for rejection"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedProduct && (selectedProduct.approvalStatus === "pending" || !selectedProduct.approvalStatus) && (
                <>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveProduct(selectedProduct.id)}
                    disabled={isApproving}
                  >
                    {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Approve Product
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleRejectProduct(selectedProduct.id)}
                    disabled={isRejecting || !rejectionReason.trim()}
                  >
                    {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Reject Product
                  </Button>
                </>
              )}
              
              {selectedProduct && selectedProduct.approvalStatus === "approved" && (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (rejectionReason.trim()) {
                      handleRejectProduct(selectedProduct.id);
                    } else {
                      toast({
                        title: "Rejection reason required",
                        description: "Please provide a reason for rejecting this product.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={isRejecting}
                >
                  {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject Product
                </Button>
              )}
              
              {selectedProduct && selectedProduct.approvalStatus === "rejected" && (
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveProduct(selectedProduct.id)}
                  disabled={isApproving}
                >
                  {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve Product
                </Button>
              )}
              
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}