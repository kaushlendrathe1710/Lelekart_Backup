import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: number;
  name: string;
  image: string;
}

export function CategoryNav() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
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
    <div className="bg-white shadow-sm">
      <div className="container mx-auto">
        <div className="flex overflow-x-auto py-2 px-4 md:px-0 md:justify-between">
          {categories?.map((category) => (
            <Link 
              key={category.id}
              href={`/?category=${category.name.toLowerCase()}`}
              className="flex flex-col items-center px-4 py-1 hover:text-primary flex-shrink-0"
            >
              <img 
                src={category.image} 
                alt={category.name} 
                className="w-16 h-16 object-contain" 
              />
              <span className="text-xs font-medium mt-1">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
