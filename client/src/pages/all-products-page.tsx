import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/product/product-card";
import { Loader2 } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  image_url?: string;
  images?: string;
  description: string;
  category: string;
  sellerId: number;
  approved: boolean;
  createdAt: string;
  specifications?: string;
  purchasePrice?: number;
  color?: string;
  size?: string;
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

  // Fetch products with pagination
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['/api/products', { page: currentPage, limit: pageSize }],
    queryFn: async () => {
      const response = await fetch(`/api/products?page=${currentPage}&limit=${pageSize}`);
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
    if (productsData && productsData.totalPages) {
      setTotalPages(productsData.totalPages);
    }
  }, [productsData]);

  // Function to generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtonsToShow = 5;
    
    // Calculate the range of pages to display
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);
    
    // Adjust if we're at the end
    if (endPage - startPage + 1 < maxButtonsToShow) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }
    
    // Add first page button if not in range
    if (startPage > 1) {
      buttons.push(
        <Button 
          key="first" 
          variant="outline" 
          size="sm"
          onClick={() => setCurrentPage(1)}
        >
          1
        </Button>
      );
      
      // Add ellipsis if there's a gap
      if (startPage > 2) {
        buttons.push(
          <Button 
            key="ellipsis1" 
            variant="outline" 
            size="sm"
            disabled
          >
            ...
          </Button>
        );
      }
    }
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button 
          key={i} 
          variant={i === currentPage ? "default" : "outline"} 
          size="sm"
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      );
    }
    
    // Add last page button if not in range
    if (endPage < totalPages) {
      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        buttons.push(
          <Button 
            key="ellipsis2" 
            variant="outline" 
            size="sm"
            disabled
          >
            ...
          </Button>
        );
      }
      
      buttons.push(
        <Button 
          key="last" 
          variant="outline" 
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }
    
    return buttons;
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">All Products</h1>
          
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
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={getProductImageUrl(product)}
                  category={product.category}
                />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex justify-center mt-8 space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              
              {renderPaginationButtons()}
              
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
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
    </Layout>
  );
}