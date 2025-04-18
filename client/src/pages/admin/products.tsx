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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

export default function AdminProducts() {
  return <AdminProductsContent />;
}

function AdminProductsContent() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    productId: number | null;
    productName: string;
  }>({
    open: false,
    productId: null,
    productName: "",
  });

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

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  // Handle delete confirmation
  const handleDeleteClick = (product: Product) => {
    setDeleteConfirm({
      open: true,
      productId: product.id,
      productName: product.name,
    });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (deleteConfirm.productId) {
      await deleteMutation.mutateAsync(deleteConfirm.productId);
      setDeleteConfirm({
        open: false,
        productId: null,
        productName: "",
      });
    }
  };

  // Handle product approval
  const handleApproveProduct = async (product: Product) => {
    await approveMutation.mutateAsync(product.id);
  };
  
  // Handle product rejection
  const handleRejectProduct = async (product: Product) => {
    await rejectMutation.mutateAsync(product.id);
  };

  // Filter and sort products
  const filteredProducts = products
    ?.filter((product) => {
      // Text search
      const matchesSearch = !search
        ? true
        : product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description.toLowerCase().includes(search.toLowerCase());

      // Category filter
      const matchesCategory = !categoryFilter
        ? true
        : product.category === categoryFilter;

      // Approval filter
      const matchesApproval =
        approvalFilter === null
          ? true
          : approvalFilter === "approved"
          ? product.approved
          : approvalFilter === "rejected"
          ? product.rejected
          : !product.approved && !product.rejected; // pending products (not approved and not rejected)

      return matchesSearch && matchesCategory && matchesApproval;
    })
    .sort((a, b) => b.id - a.id); // Sort by newest first

  // Extract unique categories for filtering
  const categories = [
    ...new Set(products?.map((product) => product.category) || []),
  ];

  // Product counts for stats
  const totalProducts = products?.length || 0;
  const approvedProducts = products?.filter((p) => p.approved).length || 0;
  const rejectedProducts = products?.filter((p) => p.rejected).length || 0;
  const pendingProducts = products?.filter((p) => !p.approved && !p.rejected).length || 0;

  // Loading states
  const ProductStatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {["total", "approved", "pending", "rejected"].map((stat) => (
        <Card key={stat} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium capitalize">
              {stat} Products
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
            Product Management
          </h1>
          <p className="text-muted-foreground">
            Manage your store's products, approvals, and inventory
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
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingProducts}</div>
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
                placeholder="Search products..."
                className="pl-8 pr-24 w-full"
                disabled
                onClick={() => alert('Search functionality is being improved. Please check back later!')}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                Coming soon
              </span>
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {(approvalFilter || categoryFilter) && (
                    <Badge variant="secondary" className="ml-2 px-1">
                      {(approvalFilter ? 1 : 0) + (categoryFilter ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Filter Products</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-2">
                  <div className="mb-2 font-medium text-sm">Approval Status</div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant={approvalFilter === null ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setApprovalFilter(null)}
                      className="justify-start"
                    >
                      All
                    </Button>
                    <Button
                      variant={
                        approvalFilter === "approved" ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setApprovalFilter("approved")}
                      className="justify-start"
                    >
                      <Check className="mr-2 h-4 w-4" /> Approved
                    </Button>
                    <Button
                      variant={
                        approvalFilter === "pending" ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setApprovalFilter("pending")}
                      className="justify-start"
                    >
                      <Clock className="mr-2 h-4 w-4" /> Pending
                    </Button>
                    <Button
                      variant={
                        approvalFilter === "rejected" ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setApprovalFilter("rejected")}
                      className="justify-start"
                    >
                      <X className="mr-2 h-4 w-4" /> Rejected
                    </Button>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <div className="mb-2 font-medium text-sm">Categories</div>
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

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center cursor-pointer"
                  onClick={() => {
                    setApprovalFilter(null);
                    setCategoryFilter(null);
                    setSearch("");
                  }}
                >
                  Clear All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Action Buttons */}
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
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
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
                    <TableHead>Status</TableHead>
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
                        <Skeleton className="h-5 w-16 rounded-full" />
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
          ) : filteredProducts?.length ? (
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
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
                              
                              // If this is a Lelekart image, use our proxy
                              const useProxy = imageSrc && (imageSrc.includes('flixcart.com') || imageSrc.includes('lelekart.com'));
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
                        {product.approved !== undefined ? (
                          <Badge
                            className={
                              product.approved
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : product.rejected
                                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            }
                          >
                            {product.approved 
                              ? "Approved" 
                              : product.rejected 
                                ? "Rejected" 
                                : "Pending"}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{product.sellerName || `Seller #${product.sellerId}`}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setViewProduct(product)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                            {!product.approved && (
                              <DropdownMenuItem
                                onClick={() => handleApproveProduct(product)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve Product
                              </DropdownMenuItem>
                            )}
                            
                            {!product.approved && (
                              <DropdownMenuItem
                                onClick={() => handleRejectProduct(product)}
                                disabled={rejectMutation.isPending}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject Product
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(product)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border bg-white p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || categoryFilter || approvalFilter
                  ? "Try adjusting your search or filters."
                  : "Add your first product to get started."}
              </p>
              {search || categoryFilter || approvalFilter ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter(null);
                    setApprovalFilter(null);
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              )}
            </div>
          )}
          
          {filteredProducts?.length ? (
            <div className="text-xs text-muted-foreground text-right">
              Showing {filteredProducts.length} of {products?.length} products
            </div>
          ) : null}
        </div>
      </div>

      {/* Product Details Dialog */}
      <Dialog
        open={viewProduct !== null}
        onOpenChange={(open) => !open && setViewProduct(null)}
      >
        {viewProduct && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewProduct.name}</DialogTitle>
              <DialogDescription>
                Product ID: {viewProduct.id} | Added by {viewProduct.sellerName || `Seller #${viewProduct.sellerId}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {/* Product Images */}
              <div>
                <ProductImageGallery 
                  imageUrl={viewProduct.imageUrl}
                  additionalImages={viewProduct.images}
                  productName={viewProduct.name}
                />
              </div>
              
              {/* Product Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price</h3>
                  <p className="text-xl font-bold">₹{Number(viewProduct.price).toFixed(2)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p>{viewProduct.category}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <Badge
                    className={
                      viewProduct.approved
                        ? "bg-green-100 text-green-800"
                        : viewProduct.rejected
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {viewProduct.approved 
                      ? "Approved" 
                      : viewProduct.rejected 
                        ? "Rejected" 
                        : "Pending Approval"}
                  </Badge>
                </div>
                
                {viewProduct.stock !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Stock</h3>
                    <p>{viewProduct.stock} units</p>
                  </div>
                )}
                
                {viewProduct.brand && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                    <p>{viewProduct.brand}</p>
                  </div>
                )}
                
                {viewProduct.color && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Color</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline">{viewProduct.color}</Badge>
                    </div>
                  </div>
                )}
                
                {viewProduct.size && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Size</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline">{viewProduct.size}</Badge>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-sm whitespace-pre-line">{viewProduct.description}</p>
                </div>
                
                {viewProduct.specifications && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Specifications</h3>
                    <p className="text-sm whitespace-pre-line">{viewProduct.specifications}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setViewProduct(null)}
              >
                Close
              </Button>
              
              {/* Show approve/reject buttons only for pending products */}
              {viewProduct && !viewProduct.approved && (
                <>
                  <Button 
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      handleRejectProduct(viewProduct);
                      setViewProduct(null);
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Reject Product
                  </Button>
                  
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApproveProduct(viewProduct);
                      setViewProduct(null);
                    }}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Approve Product
                  </Button>
                </>
              )}
              
              <Button>Edit Product</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm({
              open: false,
              productId: null,
              productName: "",
            });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm.productName}&quot;?
              <br />
              <br />
              This action cannot be undone and will permanently remove the product
              from your store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}