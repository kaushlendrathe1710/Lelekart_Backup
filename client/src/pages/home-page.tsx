import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CategoryNav } from "@/components/layout/category-nav";
import { HeroSlider } from "@/components/ui/hero-slider";
import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [location] = useLocation();
  const [category, setCategory] = useState<string | null>(null);

  // Extract category from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const categoryParam = searchParams.get('category');
    setCategory(categoryParam);
  }, [location]);

  // Fetch products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { category }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, { category: string | null }];
      const url = `/api/products${params.category ? `?category=${params.category}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  // Organize products by category
  const featuredProducts = products?.slice(0, 5) || [];
  const electronicsProducts = products?.filter(p => p.category === 'Electronics').slice(0, 6) || [];
  const fashionProducts = products?.filter(p => p.category === 'Fashion').slice(0, 6) || [];
  const homeProducts = products?.filter(p => p.category === 'Home').slice(0, 6) || [];

  // Hero slider images with product links
  const heroImages = [
    { 
      url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80", 
      alt: "Electronics Sale",
      productId: 1 // Link to Smartphone X
    },
    { 
      url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80", 
      alt: "Fashion Sale",
      productId: 11 // Link to Padded Panty 1 
    },
    { 
      url: "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80", 
      alt: "Festival Sale",
      productId: 8 // Link to Coffee Maker
    }
  ];

  // Loading states for product sections
  const ProductsLoading = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <Skeleton className="h-40 w-32 mb-3" />
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );

  const CategoryProductsLoading = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <Skeleton className="h-32 w-28 mb-2" />
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <CategoryNav />
      
      {/* Hero Slider */}
      <HeroSlider images={heroImages} />

      {/* Featured Deals */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-medium mb-4">Featured Deals</h2>
        <div className="bg-white p-4 rounded shadow-sm">
          {isLoading ? (
            <ProductsLoading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} featured={true} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category-wise Products - Electronics */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Top Electronics</h2>
            <a href="/?category=electronics" className="text-primary hover:underline">View All</a>
          </div>
          {isLoading ? (
            <CategoryProductsLoading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {electronicsProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category-wise Products - Fashion */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Fashion Bestsellers</h2>
            <a href="/?category=fashion" className="text-primary hover:underline">View All</a>
          </div>
          {isLoading ? (
            <CategoryProductsLoading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {fashionProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category-wise Products - Home */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Home Essentials</h2>
            <a href="/?category=home" className="text-primary hover:underline">View All</a>
          </div>
          {isLoading ? (
            <CategoryProductsLoading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {homeProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
