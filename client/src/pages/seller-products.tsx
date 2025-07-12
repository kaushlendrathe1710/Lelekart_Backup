import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/ui/product-card";
import { Loader2 } from "lucide-react";
import { CartProvider } from "@/context/cart-context";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import {
  LayoutGrid,
  List,
  Table,
  AppWindow,
  Grid,
  Rows,
  Columns,
  Square,
  SquareStack,
  AlignJustify,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  price: number;
  sku?: string;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  images?: string;
  description: string;
  category: string;
  subcategory?: string;
  subcategory1?: string;
  subcategory2?: string;
  sellerId: number;
  approved: boolean;
  createdAt: string;
  specifications?: string | null;
  purchasePrice?: number | null;
  color?: string | null;
  size?: string | null;
  stock?: number;
}

export default function SellerProductsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // View mode state
  const VIEW_MODES = [
    { key: "xlarge", label: "Extra Large Icons", icon: SquareStack },
    { key: "large", label: "Large Icons", icon: Square },
    { key: "medium", label: "Medium", icon: Grid },
    { key: "small", label: "Small", icon: Columns },
    { key: "tiles", label: "Tiles", icon: LayoutGrid },
    { key: "list", label: "List", icon: List },
    { key: "details", label: "Details", icon: Table },
    { key: "continue", label: "Continue", icon: AppWindow },
    { key: "all", label: "All", icon: Rows },
  ];
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("sellerProductsViewMode") || "medium";
  });
  useEffect(() => {
    localStorage.setItem("sellerProductsViewMode", viewMode);
  }, [viewMode]);

  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Function to get product image URL
  const getProductImageUrl = (product: Product): string => {
    if (product.imageUrl) {
      return product.imageUrl;
    }
    if (product.image_url) {
      return product.image_url;
    }
    if (product.images) {
      try {
        if (typeof product.images === "string") {
          const parsedImages = JSON.parse(product.images);
          if (
            parsedImages &&
            Array.isArray(parsedImages) &&
            parsedImages.length > 0
          ) {
            return parsedImages[0];
          }
        }
      } catch (error) {
        console.error("Failed to parse product images:", error);
      }
    }
    return "https://via.placeholder.com/300x300?text=Product";
  };

  // Helper to get subcategory display value
  const getSubcategoryDisplay = (product: Product): string => {
    return (
      product.subcategory1 || product.subcategory2 || product.subcategory || "-"
    );
  };

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Fetch subcategories
  const { data: subcategoriesData } = useQuery({
    queryKey: ["/api/subcategories/all"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories/all");
      if (!res.ok) throw new Error("Failed to fetch subcategories");
      return res.json();
    },
  });

  // Fetch products for this seller
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "/api/seller/products",
      user?.id,
      {
        page: currentPage,
        limit: pageSize,
        search,
        category,
        subcategory,
        stockFilter,
      },
    ],
    enabled: !!user?.id,
    queryFn: async () => {
      let url = `/api/seller/products?page=${currentPage}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category && category !== "all")
        url += `&category=${encodeURIComponent(category)}`;
      if (subcategory && subcategory !== "all")
        url += `&subcategory=${encodeURIComponent(subcategory)}`;
      if (stockFilter && stockFilter !== "all")
        url += `&stock=${encodeURIComponent(stockFilter)}`;
      url += `&sellerId=${user.id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  useEffect(() => {
    if (productsData && productsData.totalPages) {
      setTotalPages(productsData.totalPages);
    }
  }, [productsData]);

  // Delete product handler
  const handleDeleteProduct = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    )
      return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      toast({
        title: "Product deleted",
        description: "The product was deleted successfully.",
      });
      // Refetch products (react-query will do this automatically if you use invalidateQueries, but here just reload)
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete product.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SellerDashboardLayout>
      <CartProvider>
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Products</h1>
          </div>
          {/* VIEW MODE SWITCHER */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <span className="text-sm font-medium mr-2">View:</span>
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.key}
                  variant={viewMode === mode.key ? "default" : "outline"}
                  size="icon"
                  className={
                    viewMode === mode.key ? "bg-primary text-white" : ""
                  }
                  title={mode.label}
                  onClick={() => setViewMode(mode.key)}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              );
            })}
            <span className="ml-4 text-xs text-muted-foreground">
              ({VIEW_MODES.find((m) => m.key === viewMode)?.label})
            </span>
          </div>
          <div className="flex gap-4 mb-6">
            <input
              className="border px-3 py-2 rounded w-full"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setSubcategory("all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesData?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={subcategory}
              onValueChange={(value) => {
                setSubcategory(value);
                setCurrentPage(1);
              }}
              disabled={category === "all"}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subcategoriesData
                  ?.filter((sub: any) => {
                    if (category === "all") return true;
                    const catObj = categoriesData?.find(
                      (c: any) => c.name === category
                    );
                    return sub.categoryId === catObj?.id;
                  })
                  .map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.name}>
                      {sub.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="p-6 text-center">
              <p className="text-red-500 mb-4">
                Error loading products. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            </Card>
          ) : productsData &&
            productsData.products &&
            productsData.products.length > 0 ? (
            <>
              {(() => {
                const products = productsData.products;
                // Extra Large Icons
                if (viewMode === "xlarge") {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-2">
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-lg border mb-2"
                          />
                          <div className="mt-2 text-center font-bold text-lg">
                            {product.name}
                          </div>
                          <div className="flex justify-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Large Icons
                if (viewMode === "large") {
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-2">
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-full h-40 object-cover rounded-md border mb-1"
                          />
                          <div className="mt-1 text-center font-semibold">
                            {product.name}
                          </div>
                          <div className="flex justify-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Medium
                if (viewMode === "medium") {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {products.map((product: Product, colIndex: number) => (
                        <div key={product.id} className="flex flex-col h-full">
                          <div className="flex-1">
                            <ProductCard
                              product={
                                {
                                  ...product,
                                  imageUrl: getProductImageUrl(product),
                                } as any
                              }
                              showAddToCart={false}
                              priority={colIndex === 0}
                            />
                          </div>
                          <div className="flex flex-col items-center mt-2">
                            {product.approved ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 hover:bg-green-200 mb-1"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-800 hover:bg-amber-200 mb-1"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2 mt-1"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Small
                if (viewMode === "small") {
                  return (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-1">
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <div className="flex flex-col items-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Tiles
                if (viewMode === "tiles") {
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-2">
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded border mb-1"
                          />
                          <div className="mt-1 text-center font-medium">
                            {product.name}
                          </div>
                          <div className="text-xs text-center text-muted-foreground">
                            {product.category}
                          </div>
                          <div className="flex justify-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // List
                if (viewMode === "list") {
                  return (
                    <div className="divide-y border rounded-md">
                      {products.map((product: Product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-3 hover:bg-muted/30"
                        >
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </div>
                          </div>
                          <div className="text-right font-bold">
                            ₹{product.price.toLocaleString()}
                          </div>
                          <div className="ml-4">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Details
                if (viewMode === "details") {
                  return (
                    <div className="divide-y border rounded-md">
                      {products.map((product: Product) => (
                        <div
                          key={product.id}
                          className="flex flex-col md:flex-row gap-2 p-3 hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Category: {product.category}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Subcategory: {getSubcategoryDisplay(product)}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between mt-2 md:mt-0">
                            <div className="text-right font-bold">
                              ₹{product.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Stock: {product.stock}
                            </div>
                          </div>
                          <div className="ml-4 mt-2 md:mt-0 flex md:block">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Continue (show as a simple grid, can be customized)
                if (viewMode === "continue") {
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-2">
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded border mb-1"
                          />
                          <div className="mt-1 text-center">{product.name}</div>
                          <div className="flex justify-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // All (show all info in a table)
                if (viewMode === "all") {
                  return (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="border px-2 py-1">Image</th>
                            <th className="border px-2 py-1">Name</th>
                            <th className="border px-2 py-1">SKU</th>
                            <th className="border px-2 py-1">Price</th>
                            <th className="border px-2 py-1">Stock</th>
                            <th className="border px-2 py-1">Category</th>
                            <th className="border px-2 py-1">Subcategory</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product: Product) => (
                            <tr key={product.id}>
                              <td className="border px-2 py-1">
                                <img
                                  src={getProductImageUrl(product)}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded border"
                                />
                              </td>
                              <td className="border px-2 py-1">
                                {product.name}
                              </td>
                              <td className="border px-2 py-1">
                                {product.sku}
                              </td>
                              <td className="border px-2 py-1">
                                ₹{product.price.toLocaleString()}
                              </td>
                              <td className="border px-2 py-1">
                                {product.stock}
                              </td>
                              <td className="border px-2 py-1">
                                {product.category}
                              </td>
                              <td className="border px-2 py-1">
                                {getSubcategoryDisplay(product)}
                              </td>
                              <td className="border px-2 py-1">
                                <Link
                                  href={`/seller/products/edit/${product.id}`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 ml-1"
                                  onClick={() =>
                                    handleDeleteProduct(product.id)
                                  }
                                  disabled={deletingId === product.id}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                // Default fallback
                return null;
              })()}
              <div className="mt-8 flex justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
              <div className="text-sm text-gray-500 text-center mt-4">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, productsData.products.length)}{" "}
                of {productsData.products.length} products
              </div>
            </>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No products found.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/")}
              >
                Go to Home
              </Button>
            </Card>
          )}
        </div>
      </CartProvider>
    </SellerDashboardLayout>
  );
}
