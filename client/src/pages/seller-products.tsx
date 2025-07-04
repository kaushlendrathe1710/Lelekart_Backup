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
import { CheckCircle2, AlertTriangle, Edit } from "lucide-react";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  images?: string;
  description: string;
  category: string;
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

  if (!user) {
    return <div className="flex justify-center items-center h-60"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
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
          if (parsedImages && Array.isArray(parsedImages) && parsedImages.length > 0) {
            return parsedImages[0];
          }
        }
      } catch (error) {
        console.error("Failed to parse product images:", error);
      }
    }
    return 'https://via.placeholder.com/300x300?text=Product';
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
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: [
      "/api/seller/products",
      user?.id,
      { page: currentPage, limit: pageSize, search, category, subcategory, stockFilter },
    ],
    enabled: !!user?.id,
    queryFn: async () => {
      let url = `/api/seller/products?page=${currentPage}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category && category !== "all") url += `&category=${encodeURIComponent(category)}`;
      if (subcategory && subcategory !== "all") url += `&subcategory=${encodeURIComponent(subcategory)}`;
      if (stockFilter && stockFilter !== "all") url += `&stock=${encodeURIComponent(stockFilter)}`;
      url += `&sellerId=${user.id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  useEffect(() => {
    if (productsData && productsData.totalPages) {
      setTotalPages(productsData.totalPages);
    }
  }, [productsData]);

  return (
    <SellerDashboardLayout>
      <CartProvider>
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Products</h1>
          </div>
          <div className="flex gap-4 mb-6">
            <input
              className="border px-3 py-2 rounded w-full"
              placeholder="Search products..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              value={category}
              onValueChange={value => {
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
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={subcategory}
              onValueChange={value => {
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
                {subcategoriesData?.filter((sub: any) => {
                  if (category === "all") return true;
                  const catObj = categoriesData?.find((c: any) => c.name === category);
                  return sub.categoryId === catObj?.id;
                }).map((sub: any) => (
                  <SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>
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
              <p className="text-red-500 mb-4">Error loading products. Please try again.</p>
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            </Card>
          ) : productsData && productsData.products && productsData.products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {productsData.products.map((product: Product, colIndex: number) => (
                  <div key={product.id} className="flex flex-col h-full">
                    <div className="flex-1">
                      <ProductCard
                        product={{
                          ...product,
                          imageUrl: getProductImageUrl(product),
                        } as any}
                        priority={colIndex === 0}
                      />
                    </div>
                    <div className="flex flex-col items-center mt-2">
                      {product.approved ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 mb-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      <Link href={`/seller/products/edit/${product.id}`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs h-7 px-2 mt-1">
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
              <div className="text-sm text-gray-500 text-center mt-4">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, productsData.products.length)} of {productsData.products.length} products
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