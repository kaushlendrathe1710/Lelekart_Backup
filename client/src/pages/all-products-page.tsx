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
import { Loader2, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { CartProvider } from "@/context/cart-context";
import { Pagination } from "@/components/ui/pagination";

// Define an interface that matches the ExtendedProduct in product-card.tsx
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

export default function AllProductsPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = useState<number>(parseInt(params.page || "1"));
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Function to get product image URL
  const getProductImageUrl = (product: Product): string => {
    // First try to use imageUrl (camelCase)
    if (product.imageUrl) {
      return product.imageUrl;
    }
    
    // Then try image_url (snake_case)
    if (product.image_url) {
      return product.image_url;
    }
    
    // Then try to parse images JSON array and get first image
    if (product.images) {
      try {
        // If it's already a string, parse it
        if (typeof product.images === 'string') {
          const parsedImages = JSON.parse(product.images);
          if (parsedImages && Array.isArray(parsedImages) && parsedImages.length > 0) {
            return parsedImages[0];
          }
        }
      } catch (error) {
        console.error("Failed to parse product images:", error);
      }
    }
    
    // Fallback to placeholder
    return 'https://via.placeholder.com/300x300?text=Product';
  };

  // Get sellerId from URL query parameters if available
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const sellerId = searchParams.get('sellerId');
  const sellerName = searchParams.get('sellerName');

  // Fetch products with pagination and optional sellerId filter
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['/api/products', { page: currentPage, limit: pageSize, sellerId }],
    queryFn: async () => {
      let url = `/api/products?page=${currentPage}&limit=${pageSize}`;
      
      // Add sellerId filter if provided
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

  // Update URL when page changes
  useEffect(() => {
    navigate(`/products/page/${currentPage}`);
  }, [currentPage, navigate]);

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
            {sellerName ? `Products by ${sellerName}` : "All Products"}
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="text-sm mr-2">Show:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1); // Reset to first page when changing page size
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
              {productsData.products.map((product: Product) => (
                <ProductCard 
                  key={product.id}
                  product={{
                    ...product,
                    imageUrl: getProductImageUrl(product),
                  }}
                />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="mt-8">
              <Pagination 
                currentPage={productsData.pagination?.currentPage || currentPage}
                totalPages={productsData.pagination?.totalPages || totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                siblingCount={2}
              />
              
              {/* Results count */}
              <div className="text-sm text-gray-500 text-center mt-4">
                Showing {((productsData.pagination?.currentPage - 1) * pageSize) + 1} to {Math.min(productsData.pagination?.currentPage * pageSize, productsData.pagination?.total)} of {productsData.pagination?.total} products
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