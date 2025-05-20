import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  featured: boolean;
};

type Subcategory = {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  description?: string;
  displayOrder: number;
  active: boolean;
  featured: boolean;
};

export function CategoryMegaMenu() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch all subcategories
  const { data: subcategories, isLoading: subcategoriesLoading } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories/all"],
  });
  
  // Get subcategories by category ID
  const getSubcategoriesForCategory = (categoryId: number): Subcategory[] => {
    if (!subcategories) return [];
    return subcategories.filter(subcategory => subcategory.categoryId === categoryId && subcategory.active);
  };
  
  // Check if a category has any active subcategories
  const hasSubcategories = (categoryId: number): boolean => {
    if (!subcategories) return false;
    return subcategories.some(subcategory => subcategory.categoryId === categoryId && subcategory.active);
  };
  
  // Loading state
  if (categoriesLoading || subcategoriesLoading) {
    return (
      <div className="w-full bg-primary-foreground/20 h-10 flex justify-center items-center">
        <div className="flex space-x-8">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-20" />
          ))}
        </div>
      </div>
    );
  }
  
  // No categories to display
  if (!categories || categories.length === 0) {
    return null;
  }
  
  // If there are categories without subcategories, they should be shown as direct links
  const categoriesWithoutSubcategories = categories.filter(category => 
    category.active && !hasSubcategories(category.id)
  );
  
  // Categories with subcategories should be dropdown menus
  const categoriesWithSubcategories = categories.filter(category => 
    category.active && hasSubcategories(category.id)
  );
  
  return (
    <div className="w-full bg-primary-foreground/20 border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="flex space-x-2 py-2">
            {/* Categories with subcategories - shown as dropdowns */}
            {categoriesWithSubcategories.map(category => (
              <DropdownMenu key={category.id}>
                <DropdownMenuTrigger className="px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md flex items-center">
                  {category.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  {getSubcategoriesForCategory(category.id).map(subcategory => (
                    <DropdownMenuItem key={subcategory.id} asChild>
                      <div
                        onClick={() => {
                          // Use window.location.assign instead of directly setting href
                          // This ensures full page reload with the new parameter
                          window.location.assign(`/category/${category.slug}?subcategory=${subcategory.slug}`);
                        }}
                        className="cursor-pointer w-full"
                      >
                        <div className="flex items-center w-full">
                          <span className="flex-1">
                            {subcategory.name}
                            {subcategory.featured && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] leading-none bg-yellow-100 text-yellow-800 rounded-full">
                                Featured
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem asChild className="mt-1 pt-1 border-t">
                    <div 
                      onClick={() => {
                        // Direct to category page instead of subcategories listing
                        window.location.href = `/category/${category.slug}`;
                      }}
                      className="cursor-pointer w-full text-center text-primary font-medium text-sm"
                    >
                      View All {category.name}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
            
            {/* Categories without subcategories - shown as simple links */}
            {categoriesWithoutSubcategories.map(category => (
              <Link 
                key={category.id} 
                href={`/category/${category.slug}`}
                className="px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md flex items-center"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}