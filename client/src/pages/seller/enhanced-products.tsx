import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SellerLayout } from "@/components/layout/seller-layout";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
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
  ChevronLeft,
  ChevronRight,
  UploadCloud,
} from "lucide-react";
import { ProductImageGallery } from "@/components/ui/product-image-gallery";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function SellerProducts() {
  return <SellerProductsContent />;
}

function SellerProductsContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    productId: number | null;
    productName: string;
  }>({
    open: false,
    productId: null,
    productName: "",
  });

  // Pagination options
  const pageSizeOptions = [10, 50, 100, 500];

  // Fetch products
  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<{ products: Product[]; pagination: any }>({
    queryKey: ["/api/products", { sellerId: user?.id, page: currentPage, limit: pageSize }],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/products?sellerId=${user?.id}&page=${currentPage}&limit=${pageSize}`
      );
      return res.json();
    },
    enabled: !!user?.id
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  };

  // Reset selected products when page changes
  useEffect(() => {
    setSelectedProducts([]);
    setSelectAll(false);
  }, [currentPage, pageSize]);

  // Track selectAll state changes
  useEffect(() => {
    if (selectAll) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  }, [selectAll, products]);

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

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      // Use Promise.all to delete multiple products
      return apiRequest("POST", `/api/products/bulk-delete`, { productIds: ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Products deleted",
        description: `${selectedProducts.length} products have been successfully deleted.`,
      });
      setSelectedProducts([]);
      setBulkDeleteConfirm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete products",
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

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    if (selectedProducts.length > 0) {
      await bulkDeleteMutation.mutateAsync(selectedProducts);
    }
  };

  // Handle checkbox toggle for a single product
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        // If already selected, remove it
        return prev.filter(id => id !== productId);
      } else {
        // Otherwise add it
        return [...prev, productId];
      }
    });
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
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
          : !product.approved;

      return matchesSearch && matchesCategory && matchesApproval;
    })
    .sort((a, b) => b.id - a.id); // Sort by newest first

  // Extract unique categories for filtering
  const categories = [
    ...new Set(products?.map((product) => product.category) || []),
  ];

  // Product counts for stats
  const totalProducts = pagination?.total || 0;
  const approvedProducts = products?.filter((p) => p.approved).length || 0;
  const pendingProducts = products?.filter((p) => !p.approved).length || 0;

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    const totalPages = pagination.totalPages || 1;

    // If small number of pages, show all
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      return items;
    }

    // Complex pagination with ellipsis
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Calculate start and end of the middle section
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Ensure we show 3 pages in the middle
    if (endPage - startPage < 2) {
      if (startPage === 2) {
        endPage = Math.min(4, totalPages - 1);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
    }

    // Show ellipsis before middle section if needed
    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationLink disabled>...</PaginationLink>
        </PaginationItem>
      );
    }

    // Middle section
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Show ellipsis after middle section if needed
    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationLink disabled>...</PaginationLink>
        </PaginationItem>
      );
    }

    // Last page
    items.push(
      <PaginationItem key={totalPages}>
        <PaginationLink
          onClick={() => setCurrentPage(totalPages)}
          isActive={currentPage === totalPages}
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );

    return items;
  };

  // Loading states
  const ProductStatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {["total", "approved", "pending"].map((stat) => (
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
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Products</h1>
          <p className="text-muted-foreground">
            Manage your products, inventory, and track approval status
          </p>
        </div>

        {/* Products Stats */}
        {isLoading ? (
          <ProductStatsLoading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="pl-8 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                      <X className="mr-2 h-4 w-4" /> Pending
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
            
            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => setBulkDeleteConfirm(true)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedProducts.length})
              </Button>
            )}
            
            <Link href="/seller/add-product">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>

            <Link href="/seller/bulk-upload">
              <Button variant="outline" className="w-full sm:w-auto">
                <UploadCloud className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
            </Link>
          </div>
          
          {/* Page Size Selector */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select value={pageSize.toString()} onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1); // Reset to first page when changing page size
              }}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map(size => (
                    <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
            
            {selectedProducts.length > 0 && (
              <span className="text-sm">{selectedProducts.length} of {filteredProducts?.length || 0} selected</span>
            )}
          </div>

          {isLoading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox disabled />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
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
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectAll} 
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all products"
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
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
                                // Check for imageUrl (camelCase) next - this is what's in our schema
                                else if (product.imageUrl) {
                                  imageSrc = product.imageUrl;
                                }
                                // If we have an array of images, use the first one
                                else if (product.images && product.images.length > 0) {
                                  imageSrc = product.images[0];
                                }
                                // Default to a placeholder if no image is found
                                else {
                                  console.log("Image load error for product:", product.name, "URLs:", { image_url: (product as any).image_url, imageUrl: product.imageUrl });
                                  imageSrc = "/images/placeholder.svg";
                                }

                                return <img 
                                  src={imageSrc} 
                                  alt={product.name} 
                                  className="object-cover w-full h-full"
                                  onError={(e) => {
                                    console.log("Failed to load image:", imageSrc);
                                    // @ts-ignore
                                    e.target.src = "/images/placeholder.svg";
                                  }}
                                />;
                              } catch (error) {
                                console.error("Error loading product image:", error);
                                return <div className="flex items-center justify-center w-full h-full text-gray-400">
                                  <Package className="w-6 h-6" />
                                </div>;
                              }
                            })()}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500">
                              ID: {product.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={product.approved ? "success" : "secondary"}
                        >
                          {product.approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.stock} units</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
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
                            <DropdownMenuItem 
                              onClick={() => {
                                // Navigate to edit page
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(product)}
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
            <div className="rounded-md border py-12 text-center bg-white">
              <Package className="h-10 w-10 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No products found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {search || categoryFilter || approvalFilter
                  ? "Try changing your filters or search terms."
                  : "Start by adding products to your store."}
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Link href="/seller/add-product">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
                <Link href="/seller/bulk-upload">
                  <Button variant="outline">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Bulk Upload
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {generatePaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    className={currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>

        {/* View Product Dialog */}
        {viewProduct && (
          <Dialog open={!!viewProduct} onOpenChange={() => setViewProduct(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {viewProduct.name}
                  <Badge
                    variant={viewProduct.approved ? "success" : "secondary"}
                    className="ml-2"
                  >
                    {viewProduct.approved ? "Approved" : "Pending"}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {viewProduct.category} • ID: {viewProduct.id}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <div className="aspect-square rounded-md bg-gray-100 relative overflow-hidden border mb-4">
                    {/* Main product image */}
                    {viewProduct.images && viewProduct.images.length > 0 ? (
                      <img
                        src={viewProduct.images[0]}
                        alt={viewProduct.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // @ts-ignore
                          e.target.src = "/images/placeholder.svg";
                        }}
                      />
                    ) : viewProduct.imageUrl ? (
                      <img
                        src={viewProduct.imageUrl}
                        alt={viewProduct.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // @ts-ignore
                          e.target.src = "/images/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-400">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Image gallery if multiple images */}
                  {viewProduct.images && viewProduct.images.length > 1 && (
                    <div>
                      <ProductImageGallery images={viewProduct.images} />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Description</h4>
                    <p className="text-sm text-gray-600">
                      {viewProduct.description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Price</h4>
                      <p className="text-lg">₹{viewProduct.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Stock</h4>
                      <p className="text-lg">{viewProduct.stock} units</p>
                    </div>
                  </div>

                  {viewProduct.specifications && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Specifications
                      </h4>
                      <div className="text-sm text-gray-600">
                        {viewProduct.specifications}
                      </div>
                    </div>
                  )}

                  {viewProduct.color && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Color</h4>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{
                            backgroundColor: viewProduct.color,
                          }}
                        />
                        <span className="text-sm">{viewProduct.color}</span>
                      </div>
                    </div>
                  )}

                  {viewProduct.size && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Size</h4>
                      <p className="text-sm">{viewProduct.size}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewProduct(null);
                        /* Navigate to edit page */
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleDeleteClick(viewProduct);
                        setViewProduct(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

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
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirm.productName}"?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog
          open={bulkDeleteConfirm}
          onOpenChange={(open) => {
            if (!open) {
              setBulkDeleteConfirm(false);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedProducts.length} selected products?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBulkDelete}>
                {bulkDeleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete {selectedProducts.length} Products
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SellerLayout>
  );
}