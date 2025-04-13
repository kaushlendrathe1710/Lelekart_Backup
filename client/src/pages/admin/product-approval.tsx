import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackageCheck, CheckCircle, XCircle, AlertTriangle, Trash2, ImageOff, Image } from "lucide-react";
import { Product, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Extended Product interface with seller info
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/products/approval?status=all");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        
        const data = await response.json();
        
        // Separate products by approval status
        setPendingProducts(data.filter((product: ProductWithSeller) => 
          !product.approved || product.approved === false
        ));
        
        setApprovedProducts(data.filter((product: ProductWithSeller) => 
          product.approved === true
        ));
        
        setRejectedProducts(data.filter((product: ProductWithSeller) => 
          product.approved === null // Using null to indicate rejected products for now
        ));
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error fetching products",
          description: "There was a problem loading the product data.",
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
        description: "The product has been approved and will now be visible in the store.",
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
      const response = await apiRequest("POST", `/api/admin/products/${productId}/reject`);
      
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
        description: "The product has been rejected and will not be visible in the store.",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/approval"] });
      
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
  };
  
  // Parse additional images
  const getProductImages = (product: ProductWithSeller) => {
    const images = [product.imageUrl]; // Start with the main image
    
    if (product.images) {
      try {
        // Try to parse the additional images
        const additionalImages = JSON.parse(product.images);
        if (Array.isArray(additionalImages)) {
          images.push(...additionalImages);
        }
      } catch (error) {
        console.error("Error parsing product images:", error);
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
                  <PackageCheck className="h-12 w-12 text-muted-foreground mb-4" />
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
                        <TableHead>Seller</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-md bg-gray-100">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                    <ImageOff className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <span className="line-clamp-1">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.seller?.username || "Unknown Seller"}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.category}</TableCell>
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
                                onClick={() => handleRejectProduct(product.id)}
                                disabled={isRejecting}
                              >
                                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
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
                  <PackageCheck className="h-12 w-12 text-muted-foreground mb-4" />
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
                    All products that have been approved and are visible in the store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-md bg-gray-100">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                    <ImageOff className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <span className="line-clamp-1">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.seller?.username || "Unknown Seller"}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.category}</TableCell>
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
                                View Details
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRejectProduct(product.id)}
                              >
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
                    All products that have been rejected and are not visible in the store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-md bg-gray-100">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                    <ImageOff className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <span className="line-clamp-1">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.seller?.username || "Unknown Seller"}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.category}</TableCell>
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
                                Details
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveProduct(product.id)}
                              >
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
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
              <DialogDescription>
                Detailed information about the product
              </DialogDescription>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{selectedProduct.name}</h3>
                    <div className="mb-3">
                      {!selectedProduct.approved ? (
                        <Badge className="bg-orange-500">Pending Approval</Badge>
                      ) : selectedProduct.approved === true ? (
                        <Badge className="bg-green-500">Approved</Badge>
                      ) : (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Price</h4>
                        <p className="text-lg font-bold">{formatCurrency(selectedProduct.price)}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                        <p>{selectedProduct.category}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Seller</h4>
                        <p>{selectedProduct.seller?.username || "Unknown Seller"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Stock</h4>
                        <p>{selectedProduct.stock} units</p>
                      </div>
                      
                      {selectedProduct.color && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Color</h4>
                          <p>{selectedProduct.color}</p>
                        </div>
                      )}
                      
                      {selectedProduct.size && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Size</h4>
                          <p>{selectedProduct.size}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Product Images</h4>
                      <div className="border rounded-md overflow-hidden">
                        {getProductImages(selectedProduct).length > 0 ? (
                          <Carousel>
                            <CarouselContent>
                              {getProductImages(selectedProduct).map((image, index) => (
                                <CarouselItem key={index}>
                                  <AspectRatio ratio={1 / 1}>
                                    <img
                                      src={image}
                                      alt={`${selectedProduct.name} - Image ${index + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </AspectRatio>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                          </Carousel>
                        ) : (
                          <div className="flex h-48 w-full items-center justify-center bg-gray-100">
                            <div className="flex flex-col items-center">
                              <ImageOff className="h-10 w-10 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">No product images</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Product Description</h4>
                  <div className="prose prose-sm max-w-none">
                    <p>{selectedProduct.description}</p>
                  </div>
                </div>
                
                {selectedProduct.specifications && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Technical Specifications</h4>
                    <div className="prose prose-sm max-w-none">
                      <p>{selectedProduct.specifications}</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Approval Status</h4>
                  <div className="flex items-start gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <p className="text-sm">
                      {!selectedProduct.approved 
                        ? "This product is awaiting approval. It will not be visible in the store until approved."
                        : selectedProduct.approved === true
                          ? "This product has been approved and is visible in the store."
                          : "This product has been rejected and is not visible in the store."}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedProduct && (!selectedProduct.approved || selectedProduct.approved === null) && (
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveProduct(selectedProduct.id)}
                  disabled={isApproving}
                >
                  {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve Product
                </Button>
              )}
              
              {selectedProduct && (selectedProduct.approved !== null) && (
                <Button 
                  variant="destructive"
                  onClick={() => handleRejectProduct(selectedProduct.id)}
                  disabled={isRejecting}
                >
                  {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject Product
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