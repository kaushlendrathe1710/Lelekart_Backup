import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Pagination } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Layers, 
  Search, 
  Plus, 
  Filter, 
  Edit,
  Trash,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Trash2
} from "lucide-react";
import { useContext, useState } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product as SchemaProduct } from "@shared/schema";

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

import { useToast } from "@/hooks/use-toast";

// Define a ProductWithSKU interface that extends the base Product type
interface Product extends SchemaProduct {
  sku?: string;
  image?: string;
  image_url?: string; // Add snake_case version from API
}
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SellerProductsPage() {
  // State for deletion dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Try to use context first if available
  const authContext = useContext(AuthContext);
  
  // Get user data from direct API if context is not available
  const { data: apiUser } = useQuery<any>({
    queryKey: ['/api/user'],
    enabled: !authContext?.user,
  });
  
  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Changed default to 10 for page size selector

  // Fetch products for the logged-in seller with pagination
  const { data, isLoading } = useQuery({
    queryKey: ['/api/products', { sellerId: user?.id, page: currentPage, limit: itemsPerPage }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, { sellerId?: number, page: number, limit: number }];
      const res = await fetch(`/api/products?sellerId=${params.sellerId || ''}&page=${params.page}&limit=${params.limit}`); 
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Extract products and pagination from response
  const fetchedProducts = data?.products || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, total: 0 };
  
  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "The product has been removed from your inventory.",
      });
      
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const response = await fetch(`/api/products/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete products');
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Products deleted",
        description: `${selectedProducts.length} products have been removed from your inventory.`,
      });
      
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsBulkDeleteDialogOpen(false);
      setSelectedProducts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete products",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle delete confirmation
  const handleDeleteProduct = () => {
    if (selectedProductId) {
      deleteMutation.mutate(selectedProductId);
    }
  };
  
  // Handle bulk delete confirmation
  const handleBulkDeleteProducts = () => {
    if (selectedProducts.length > 0) {
      bulkDeleteMutation.mutate(selectedProducts);
    }
  };
  
  // Open delete confirmation dialog
  const confirmDelete = (productId: number) => {
    setSelectedProductId(productId);
    setIsDeleteDialogOpen(true);
  };
  
  // Open bulk delete confirmation dialog
  const confirmBulkDelete = () => {
    if (selectedProducts.length > 0) {
      setIsBulkDeleteDialogOpen(true);
    } else {
      toast({
        title: "No products selected",
        description: "Please select at least one product to delete.",
        variant: "destructive",
      });
    }
  };
  
  // Always use real fetched products
  const products = fetchedProducts;
  
  return (
    <SellerDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">Manage your product listings</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              asChild
            >
              <Link href="/seller/products/bulk-upload">
                <Upload className="h-4 w-4" />
                Bulk Upload
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              className="flex items-center gap-2"
              asChild
            >
              <Link href="/seller/products/add">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              You have {products.length} products in your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-8 pr-24" 
                  disabled
                  onClick={() => alert('Search functionality is being improved. Please check back later!')}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  Coming soon
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={confirmBulkDelete}
                  disabled={selectedProducts.length === 0 || bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                  {selectedProducts.length > 0 && ` (${selectedProducts.length})`}
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={products.length > 0 && selectedProducts.length === products.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Select all products
                            setSelectedProducts(products.map(p => p.id));
                          } else {
                            // Deselect all products
                            setSelectedProducts([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts([...selectedProducts, product.id]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <img 
                          src={
                            // Check for image_url (snake_case) first, as it contains the actual URL from API
                            // Then fall back to other properties
                            (product.image_url || product.image || product.imageUrl) && 
                            ((product.image_url || product.image || product.imageUrl)?.includes('flixcart.com') || 
                             (product.image_url || product.image || product.imageUrl)?.includes('flipkart.com'))
                              ? `/api/image-proxy?url=${encodeURIComponent(product.image_url || product.image || product.imageUrl || '')}&category=${encodeURIComponent(product.category || '')}`
                              : (product.image_url || product.image || product.imageUrl)
                          } 
                          alt={product.name} 
                          className="w-10 h-10 rounded-md object-cover"
                          onError={(e) => {
                            // Use a fallback image on error
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            
                            console.log('Image load error for product:', product.name, 'URLs:', {
                              image_url: product.image_url,
                              image: product.image,
                              imageUrl: product.imageUrl
                            });
                            
                            // Use category-specific placeholder or default placeholder
                            if (product.category) {
                              // Convert to lowercase for category-specific image
                              const categoryLower = product.category.toLowerCase();
                              target.src = `../images/${categoryLower}.svg`;
                            } else {
                              target.src = "../images/placeholder.svg";
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>₹{product.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={product.stock < 20 ? "text-red-500 font-medium" : ""}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        {product.approved ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            asChild
                          >
                            <Link href={`/seller/products/preview/${product.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Preview</span>
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            asChild
                          >
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => confirmDelete(product.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-6">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{((pagination.currentPage - 1) * itemsPerPage) + 1}-{Math.min(pagination.currentPage * itemsPerPage, pagination.total)}</strong> of <strong>{pagination.total}</strong> products
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    // Reset to page 1 when changing items per page
                    setCurrentPage(1);
                    setItemsPerPage(parseInt(value));
                    // Scroll to top of page
                    window.scrollTo(0, 0);
                  }}
                >
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Only show pagination if there are multiple pages */}
            {pagination && pagination.totalPages > 1 ? (
              <Pagination 
                currentPage={pagination.currentPage} 
                totalPages={pagination.totalPages} 
                onPageChange={(page) => {
                  setCurrentPage(page);
                  // Scroll to top of page when changing pages
                  window.scrollTo(0, 0);
                }} 
              />
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedProducts.length} products?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected products and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDeleteProducts} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SellerDashboardLayout>
  );
}