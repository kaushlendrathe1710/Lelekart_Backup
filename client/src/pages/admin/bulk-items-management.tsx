import { useState, useEffect, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  Plus,
  Package,
  Check,
  ChevronsUpDown,
  Loader2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as bulkOrdersService from "@/services/bulk-orders";
import { useDebounce } from "@/hooks/use-debounce";

// Memoized table component to prevent unnecessary re-renders
const BulkItemsTable = memo(
  ({
    items,
    onEdit,
    onDelete,
  }: {
    items: any[];
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
  }) => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Regular Price</TableHead>
            <TableHead>Bulk Selling Price</TableHead>
            <TableHead>Order by Pieces</TableHead>
            <TableHead>Order by Sets</TableHead>
            <TableHead>Pieces per Set</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: any) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <span>{item.productName}</span>
                </div>
              </TableCell>
              <TableCell>{item.productSku || "—"}</TableCell>
              <TableCell>₹{item.productPrice}</TableCell>
              <TableCell>
                <span className="font-semibold text-green-700">
                  ₹{item.sellingPrice || "—"}
                </span>
              </TableCell>
              <TableCell>
                {item.allowPieces ? (
                  <span className="text-green-600 font-medium">✓ Yes</span>
                ) : (
                  <span className="text-gray-400">✗ No</span>
                )}
              </TableCell>
              <TableCell>
                {item.allowSets ? (
                  <span className="text-green-600 font-medium">✓ Yes</span>
                ) : (
                  <span className="text-gray-400">✗ No</span>
                )}
              </TableCell>
              <TableCell>{item.piecesPerSet || "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
);

BulkItemsTable.displayName = "BulkItemsTable";

export default function BulkItemsManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductName, setSelectedProductName] = useState("");
  const [allowPieces, setAllowPieces] = useState(true);
  const [allowSets, setAllowSets] = useState(false);
  const [piecesPerSet, setPiecesPerSet] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // State for table search and pagination
  const [tableSearchInput, setTableSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const debouncedTableSearch = useDebounce(tableSearchInput, 300);

  // Fetch products with search and pagination
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-search", debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "100",
      });
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      const res = await fetch(
        `/api/admin/bulk-items/search-products?${params}`,
      );
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: isDialogOpen && !editingItem,
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination;

  // Fetch bulk items with server-side search and pagination
  const { data: bulkItemsData, isLoading } = useQuery({
    queryKey: [
      "bulk-items-admin",
      currentPage,
      itemsPerPage,
      debouncedTableSearch,
    ],
    queryFn: async () => {
      let url = `/api/admin/bulk-items?page=${currentPage}&limit=${itemsPerPage}`;
      if (debouncedTableSearch) {
        url += `&search=${encodeURIComponent(debouncedTableSearch)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch bulk items");
      return response.json();
    },
  });

  const bulkItems = bulkItemsData?.items || [];
  const bulkItemsPagination = bulkItemsData?.pagination || {
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: itemsPerPage,
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedTableSearch]);

  // Invalidate all pages when data changes
  const invalidateBulkItems = () => {
    queryClient.invalidateQueries({ queryKey: ["bulk-items-admin"] });
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) => bulkOrdersService.createBulkItem(data),
    onSuccess: () => {
      invalidateBulkItems();
      toast({
        title: "Success",
        description: "Bulk item configuration saved successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save bulk item",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => bulkOrdersService.deleteBulkItem(id),
    onSuccess: () => {
      invalidateBulkItems();
      toast({
        title: "Success",
        description: "Bulk item deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to delete bulk item",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setSelectedProductId(item.productId.toString());
      setSelectedProductName(item.productName || "");
      setAllowPieces(item.allowPieces);
      setAllowSets(item.allowSets);
      setPiecesPerSet(item.piecesPerSet?.toString() || "");
      setSellingPrice(item.sellingPrice?.toString() || "");
    } else {
      setEditingItem(null);
      setSelectedProductId("");
      setSelectedProductName("");
      setAllowPieces(true);
      setAllowSets(false);
      setPiecesPerSet("");
      setSellingPrice("");
      setSearchQuery("");
      setPage(1);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setSelectedProductId("");
    setSelectedProductName("");
    setAllowPieces(true);
    setAllowSets(false);
    setPiecesPerSet("");
    setSellingPrice("");
    setSearchQuery("");
    setPage(1);
    setOpen(false);
  };

  const handleSave = () => {
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    if (!allowPieces && !allowSets) {
      toast({
        title: "Error",
        description: "Please enable at least one order type",
        variant: "destructive",
      });
      return;
    }

    if (allowSets && !piecesPerSet) {
      toast({
        title: "Error",
        description: "Please specify pieces per set",
        variant: "destructive",
      });
      return;
    }

    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      toast({
        title: "Error",
        description: "Please specify a valid selling price",
        variant: "destructive",
      });
      return;
    }

    const data = {
      productId: parseInt(selectedProductId),
      allowPieces,
      allowSets,
      piecesPerSet:
        allowSets && piecesPerSet ? parseInt(piecesPerSet) : undefined,
      sellingPrice: sellingPrice, // Send as string for Drizzle decimal type
    };

    saveMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    if (
      confirm("Are you sure you want to delete this bulk item configuration?")
    ) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6" />
                Bulk Order Items Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Configure which products are available for bulk ordering and set
                ordering rules
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name, SKU, or price..."
                  value={tableSearchInput}
                  onChange={(e) => setTableSearchInput(e.target.value)}
                  className="pl-10 pr-10"
                />
                {tableSearchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTableSearchInput("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {debouncedTableSearch && (
                <p className="text-sm text-muted-foreground mt-2">
                  Found {bulkItemsPagination.total} item(s) matching "
                  {debouncedTableSearch}"
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : bulkItems && bulkItems.length > 0 ? (
              <BulkItemsTable
                items={bulkItems}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {debouncedTableSearch ? (
                  <div className="space-y-2">
                    <p>No products found matching "{debouncedTableSearch}"</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTableSearchInput("")}
                    >
                      Clear search
                    </Button>
                  </div>
                ) : (
                  'No products configured for bulk ordering yet. Click "Add Product" to get started.'
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {bulkItems && bulkItems.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    bulkItemsPagination.total,
                  )}{" "}
                  of {bulkItemsPagination.total} items
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {bulkItemsPagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(bulkItemsPagination.totalPages, p + 1),
                      )
                    }
                    disabled={
                      currentPage >= bulkItemsPagination.totalPages || isLoading
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit" : "Add"} Bulk Order Item
              </DialogTitle>
              <DialogDescription>
                Configure which product is available for bulk ordering and set
                ordering rules
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                {editingItem ? (
                  <div>
                    <Input
                      value={selectedProductName}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Product cannot be changed after creation
                    </p>
                  </div>
                ) : (
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedProductId
                          ? products.find(
                              (p: any) => p.id.toString() === selectedProductId,
                            )?.name || "Select product..."
                          : "Select product..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search products..."
                          value={searchQuery}
                          onValueChange={(value) => {
                            setSearchQuery(value);
                            setPage(1);
                          }}
                        />
                        <CommandList>
                          {productsLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : products.length === 0 ? (
                            <CommandEmpty>No products found.</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {products.map((product: any) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.id.toString()}
                                  onSelect={() => {
                                    setSelectedProductId(product.id.toString());
                                    setSelectedProductName(product.name);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedProductId ===
                                        product.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {product.name}{" "}
                                  {product.sku ? `(${product.sku})` : ""}
                                </CommandItem>
                              ))}
                              {pagination &&
                                pagination.page < pagination.totalPages && (
                                  <div className="p-2 border-t">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => setPage((p) => p + 1)}
                                      disabled={productsLoading}
                                    >
                                      {productsLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      Load more ({pagination.page} of{" "}
                                      {pagination.totalPages})
                                    </Button>
                                  </div>
                                )}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="space-y-3">
                <Label>Order Types</Label>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowPieces"
                    checked={allowPieces}
                    onCheckedChange={(checked) =>
                      setAllowPieces(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="allowPieces"
                    className="font-normal cursor-pointer"
                  >
                    Allow ordering by pieces
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowSets"
                    checked={allowSets}
                    onCheckedChange={(checked) =>
                      setAllowSets(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="allowSets"
                    className="font-normal cursor-pointer"
                  >
                    Allow ordering by sets
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="piecesPerSet">Pieces per Set</Label>
                <Input
                  id="piecesPerSet"
                  type="number"
                  min="1"
                  placeholder="e.g., 12"
                  value={piecesPerSet}
                  onChange={(e) => setPiecesPerSet(e.target.value)}
                  disabled={!allowSets}
                />
                <p className="text-xs text-muted-foreground">
                  {allowSets
                    ? "How many individual pieces are in one set?"
                    : "Enable 'Allow ordering by sets' to configure pieces per set"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Bulk Selling Price (₹)</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 299.99"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Special price for bulk orders (can be different from regular
                  product price)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
