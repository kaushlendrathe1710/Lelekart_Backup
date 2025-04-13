import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoryNav() {
  const [, navigate] = useLocation();
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const handleCategoryClick = (category: string) => {
    // Use direct location change to ensure proper page loading
    window.location.href = `/category/${encodeURIComponent(category)}`;
  };
  
  if (isLoading) {
    return (
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex overflow-x-auto justify-center pb-2">
            <div className="flex space-x-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center flex-shrink-0">
                  <Skeleton className="h-12 w-12 rounded-full mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex overflow-x-auto justify-center pb-2">
          <div className="flex space-x-8">
            {categories?.map((category) => (
              <div 
                key={category.id} 
                className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:text-blue-600"
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="h-10 w-10 object-contain"
                      onError={(e) => {
                        // Use a fallback image on error
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = "https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/placeholder_9951d0.svg";
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                      {category.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}