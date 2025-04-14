import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Loader2,
  Package,
  X,
  Check,
  Filter,
  Clock,
} from "lucide-react";
import { ProductImageGallery } from "@/components/ui/product-image-gallery";

export default function ProductApproval() {
  return <ProductApprovalContent />;
}

function ProductApprovalContent() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [showRejectionDialog, setShowRejectionDialog] = useState<boolean>(false);
  const [productToReject, setProductToReject] = useState<Product | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "price-asc" | "price-desc">("newest");

  // Fetch products
  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/products"],
  });
  
  // Extract products array from response
  const products = productsData?.products || [];

  // Approve product mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/products/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product approved",
        description: "The product is now visible to buyers.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reject product mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/products/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product rejected",
        description: "The product will not be visible to buyers.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle product approval
  const handleApproveProduct = async (product: Product) => {
    await approveMutation.mutateAsync(product.id);
  };
  
  // Handle product rejection
  const handleRejectProduct = async (product: Product) => {
    await rejectMutation.mutateAsync(product.id);
  };

  // Filter for pending products only and sort by newest first
  const pendingProducts = products
    ?.filter((product) => {
      // Only include pending products (not approved and not rejected)
      const isPending = !product.approved && !product.rejected;
      
      // Text search
      const matchesSearch = !search
        ? true
        : product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description.toLowerCase().includes(search.toLowerCase());

      // Category filter
      const matchesCategory = !categoryFilter
        ? true
        : product.category === categoryFilter;

      return isPending && matchesSearch && matchesCategory;
    })
    .sort((a, b) => b.id - a.id); // Sort by newest first

  // Extract unique categories for filtering
  const categories = [
    ...new Set(pendingProducts?.map((product) => product.category) || []),
  ];

  // Product counts for stats
  const totalPendingProducts = pendingProducts?.length || 0;
  const totalProducts = products?.length || 0;
  const approvedProducts = products?.filter((p) => p.approved).length || 0;
  const rejectedProducts = products?.filter((p) => p.rejected).length || 0;

  // Loading states
  const ProductStatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {["total pending", "total", "approved", "rejected"].map((stat) => (
        <Card key={stat} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium capitalize">
              {stat === "total pending" ? "Pending Approval" : `${stat} Products`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Approval
          </h1>
          <p className="text-muted-foreground">
            Review and approve/reject products submitted by sellers
          </p>
        </div>

        {/* Products Stats */}
        {isLoading ? (
          <ProductStatsLoading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPendingProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Approved Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Rejected Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rejectedProducts}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Data Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search pending products..."
                className="pl-8 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            {categories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                    {categoryFilter && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <div className="flex flex-col space-y-2 max-h-48 overflow-y-auto">
                      <Button
                        variant={categoryFilter === null ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setCategoryFilter(null)}
                        className="justify-start"
                      >
                        All Categories
                      </Button>
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={
                            categoryFilter === category ? "secondary" : "outline"
                          }
                          size="sm"
                          onClick={() => setCategoryFilter(category)}
                          className="justify-start"
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : pendingProducts?.length ? (
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded bg-gray-100 relative overflow-hidden border">
                            {(() => {
                              // Determine which image source to use
                              let imageSrc = "";
                              
                              try {
                                // Check for image_url (snake_case) first - this is what's in our data
                                if ((product as any).image_url) {
                                  imageSrc = (product as any).image_url;
                                }
                                // Check for imageUrl (camelCase)
                                else if (product.imageUrl) {
                                  imageSrc = product.imageUrl;
                                } 
                                // Check for images array or string
                                else if (product.images) {
                                  // Handle array of images
                                  if (Array.isArray(product.images) && product.images.length > 0) {
                                    imageSrc = product.images[0];
                                  } 
                                  // Handle string (single image URL)
                                  else if (typeof product.images === 'string') {
                                    // Check if it's a JSON string
                                    if (product.images.startsWith('[') && product.images.includes(']')) {
                                      try {
                                        const parsedImages = JSON.parse(product.images);
                                        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                                          imageSrc = parsedImages[0];
                                        }
                                      } catch (e) {
                                        console.error('Failed to parse image JSON:', e);
                                      }
                                    } else {
                                      // It's a single URL
                                      imageSrc = product.images;
                                    }
                                  }
                                }
                              } catch (err) {
                                console.error("Error processing image:", err);
                              }
                              
                              // Always use category-specific fallback as default
                              const categoryImage = `../images/${(product.category || 'general').toLowerCase()}.svg`;
                              const genericFallback = "https://placehold.co/100?text=No+Image";
                              
                              // If this is a Flipkart image, use our proxy
                              const useProxy = imageSrc && (imageSrc.includes('flixcart.com') || imageSrc.includes('flipkart.com'));
                              const displaySrc = useProxy 
                                ? `/api/image-proxy?url=${encodeURIComponent(imageSrc)}&category=${encodeURIComponent(product.category || 'general')}`
                                : (imageSrc || categoryImage);
                              
                              return (
                                <img
                                  key={`product-image-${product.id}`}
                                  src={displaySrc}
                                  alt={product.name}
                                  className="object-contain h-full w-full"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.error("Failed to load image:", displaySrc);
                                    
                                    // If using proxy failed, try direct URL
                                    if (useProxy && imageSrc) {
                                      console.log("Proxy failed, trying direct URL:", imageSrc);
                                      (e.target as HTMLImageElement).src = imageSrc;
                                      return;
                                    }
                                    
                                    // Try category-specific fallback
                                    (e.target as HTMLImageElement).src = categoryImage;
                                    
                                    // Add a second error handler for the category fallback
                                    (e.target as HTMLImageElement).onerror = () => {
                                      (e.target as HTMLImageElement).src = genericFallback;
                                      (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                                    };
                                  }}
                                  style={{ 
                                    maxHeight: '48px',
                                    background: '#f9f9f9'
                                  }}
                                />
                              );
                            })()}
                          </div>
                          <div className="font-medium hover:text-primary cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap max-w-xs"
                               onClick={() => setViewProduct(product)}>
                            {product.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>₹{Number(product.price).toFixed(2)}</TableCell>
                      <TableCell>
                        {product.seller ? product.seller.username : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setViewProduct(product)}
                            title="View product details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApproveProduct(product)}
                            title="Approve product"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleRejectProduct(product)}
                            title="Reject product"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border bg-white p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-1">No pending products</h3>
              <p className="text-gray-500 mb-4">
                All products have been reviewed. Great job!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product View Dialog */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        {viewProduct && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Product Details</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Review the product information below
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Product Images */}
              <div className="flex flex-col gap-4">
                <div className="aspect-square bg-gray-100 rounded-md overflow-hidden relative">
                  <ProductImageGallery 
                    imageUrl={viewProduct.imageUrl || "/images/placeholder.svg"} 
                    additionalImages={
                      typeof viewProduct.images === 'string' 
                        ? viewProduct.images 
                        : JSON.stringify(viewProduct.images)
                    } 
                  />
                </div>
              </div>
              
              {/* Product Details */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{viewProduct.name}</h3>
                  <Badge variant="outline" className="mt-1">{viewProduct.category}</Badge>
                </div>
                
                <div className="text-lg font-semibold">₹{Number(viewProduct.price).toFixed(2)}</div>
                
                <div className="mt-1">
                  <div className="text-sm font-medium text-gray-500">Description</div>
                  <div className="mt-1">{viewProduct.description}</div>
                </div>
                
                {viewProduct.specifications && (
                  <div className="mt-1">
                    <div className="text-sm font-medium text-gray-500">Specifications</div>
                    <div className="mt-1 text-sm">{viewProduct.specifications}</div>
                  </div>
                )}
                
                <div className="mt-1">
                  <div className="text-sm font-medium text-gray-500">Inventory</div>
                  <div className="mt-1 text-sm">Stock: {viewProduct.stock || 'Not specified'}</div>
                </div>
                
                <div className="mt-1">
                  <div className="text-sm font-medium text-gray-500">Seller Information</div>
                  <div className="mt-1 text-sm">
                    {viewProduct.seller ? viewProduct.seller.username : 'Unknown Seller'}
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                    onClick={() => {
                      handleApproveProduct(viewProduct);
                      setViewProduct(null);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" /> Approve Product
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1" 
                    onClick={() => {
                      handleRejectProduct(viewProduct);
                      setViewProduct(null);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject Product
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AdminLayout>
  );
}