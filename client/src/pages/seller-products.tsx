import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
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
  const params = useParams();
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Get sellerId from route params and sellerName from query param
  const sellerId = params.sellerId;
  const [sellerName, setSellerName] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setSellerName(searchParams.get("sellerName"));
  }, []);

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

  // Fetch products for this seller
  const LARGE_POOL_SIZE = 100;
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['/api/products', { page: 1, limit: LARGE_POOL_SIZE, sellerId }],
    queryFn: async () => {
      let url = `/api/products?page=1&limit=${LARGE_POOL_SIZE}`;
      if (sellerId) {
        url += `&sellerId=${sellerId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
  });

  // Update total pages when data is loaded
  useEffect(() => {
    if (productsData && productsData.pagination) {
      setTotalPages(productsData.pagination.totalPages);
    }
  }, [productsData]);

  return (
    <CartProvider>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {sellerName ? `Products by ${sellerName}` : "Seller's Products"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="text-sm mr-2">Show:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
              {productsData.products.slice((currentPage-1)*pageSize, currentPage*pageSize).map((product: Product, colIndex: number) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    imageUrl: getProductImageUrl(product),
                  } as any}
                  priority={colIndex === 0}
                />
              ))}
            </div>
            <div className="mt-8">
              <Pagination 
                currentPage={currentPage}
                totalPages={Math.ceil((productsData.products.length || 1) / pageSize)}
                onPageChange={(page) => setCurrentPage(page)}
              />
              <div className="text-sm text-gray-500 text-center mt-4">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, productsData.products.length)} of {productsData.products.length} products
              </div>
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
  );
} 