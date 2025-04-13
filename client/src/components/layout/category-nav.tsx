import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: number;
  name: string;
  image: string;
}

export function CategoryNav() {
  const [location] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Detect active category from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const categoryParam = searchParams.get('category');
    setActiveCategory(categoryParam);
  }, [location]);
  
  // Fetch categories from API
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 300000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto py-2 px-4 md:px-0 md:justify-between">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center px-4 py-1 flex-shrink-0">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-3 w-16 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md">
      <div className="container mx-auto">
        <div className="flex overflow-x-auto py-3 justify-center">
          <div className="flex space-x-4 px-4 md:px-0">
            {/* Show "All Categories" option */}
            <Link 
              href="/"
              className={`flex flex-col items-center px-3 py-1 ${
                !activeCategory ? 'text-primary font-medium' : 'hover:text-primary'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all transform hover:scale-105 ${
                !activeCategory ? 'border-primary shadow-md' : 'border-gray-200 hover:border-primary/50'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </div>
              <span className="text-xs font-medium mt-2">All Products</span>
            </Link>
            
            {/* Map through all categories */}
            {categories?.map((category) => {
              const categorySlug = category.name.toLowerCase();
              const isActive = activeCategory === categorySlug;
              
              return (
                <Link 
                  key={category.id}
                  href={`/?category=${categorySlug}`}
                  className={`flex flex-col items-center px-3 py-1 ${
                    isActive ? 'text-primary font-medium' : 'hover:text-primary'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all transform hover:scale-105 ${
                    isActive ? 'border-primary shadow-md' : 'border-gray-200 hover:border-primary/50'
                  }`}>
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="w-12 h-12 object-contain" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/placeholder.svg';
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium mt-2">{category.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
