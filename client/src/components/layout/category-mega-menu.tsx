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
  parentId?: number | null;
  description?: string;
  displayOrder: number;
  active: boolean;
  featured: boolean;
};

export function CategoryMegaMenu() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState<number | null>(null);
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch all subcategories
  const { data: subcategories, isLoading: subcategoriesLoading } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories/all"],
  });
  
  // Get subcategories by category ID (only top-level, i.e., parentId is null/undefined)
  const getSubcategoriesForCategory = (categoryId: number): Subcategory[] => {
    if (!subcategories) return [];
    return subcategories.filter(subcategory => subcategory.categoryId === categoryId && subcategory.active && (!subcategory.parentId || subcategory.parentId === 0));
  };
  
  // Get subcategory2 (children) for a given subcategory
  const getSubcategory2ForSubcategory = (subcategoryId: number): Subcategory[] => {
    if (!subcategories) return [];
    return subcategories.filter(subcategory => subcategory.parentId === subcategoryId && subcategory.active);
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
          <div className="flex flex-wrap gap-2 py-2">
            {/* Categories with subcategories - shown as dropdowns */}
            {categoriesWithSubcategories.map(category => (
              <DropdownMenu key={category.id}>
                <DropdownMenuTrigger className="px-4 py-2 text-base font-bold bg-white hover:bg-gray-50 hover:text-primary rounded-lg shadow-sm flex items-center transition-colors duration-150 border border-gray-200">
                  {category.name}
                  <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 mt-2">
                  {getSubcategoriesForCategory(category.id).map(subcategory => {
                    const subcategory2List = getSubcategory2ForSubcategory(subcategory.id);
                    return (
                      <div key={subcategory.id} className="relative group">
                        <div className={cn(
                          "flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-150 cursor-pointer group-hover:bg-gray-50",
                          expandedSubcategory === subcategory.id ? "bg-gray-50" : ""
                        )}>
                          <span
                            className="flex-1 font-medium text-gray-900"
                            onClick={() => {
                              window.location.assign(`/category/${category.slug}?subcategory=${subcategory.slug}`);
                            }}
                          >
                            {subcategory.name}
                            {subcategory.featured && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] leading-none bg-yellow-100 text-yellow-800 rounded-full">
                                Featured
                              </span>
                            )}
                          </span>
                          {subcategory2List.length > 0 && (
                            <span
                              onClick={e => {
                                e.stopPropagation();
                                setExpandedSubcategory(
                                  expandedSubcategory === subcategory.id ? null : subcategory.id
                                );
                              }}
                              className={cn(
                                "ml-2 flex items-center cursor-pointer transition-transform duration-200",
                                expandedSubcategory === subcategory.id ? "rotate-180 text-primary" : "text-gray-400"
                              )}
                              tabIndex={0}
                              role="button"
                              aria-label="Show subcategories"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        {/* Inline subcategory2 list, with vertical line and animation */}
                        {subcategory2List.length > 0 && expandedSubcategory === subcategory.id && (
                          <div className="pl-7 border-l-2 border-gray-200 ml-2 mt-1 space-y-1 transition-all duration-200">
                            {subcategory2List.map(sub2 => (
                              <div
                                key={sub2.id}
                                className="flex items-center px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors duration-100"
                                onClick={e => {
                                  e.stopPropagation();
                                  window.location.assign(`/category/${category.slug}?subcategory=${subcategory.slug}&subcategory2=${sub2.slug}`);
                                }}
                              >
                                <span className="flex-1">{sub2.name}</span>
                                {sub2.featured && (
                                  <span className="ml-2 px-1 py-0.5 text-[10px] leading-none bg-yellow-100 text-yellow-800 rounded-full">
                                    Featured
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="my-2 border-t border-gray-100" />
                  <DropdownMenuItem asChild>
                    <div 
                      onClick={() => {
                        window.location.href = `/category/${category.slug}`;
                      }}
                      className="cursor-pointer w-full text-center text-primary font-semibold text-base py-2 hover:bg-gray-50 rounded-lg"
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
                className="px-4 py-2 text-base font-bold bg-white hover:bg-gray-50 hover:text-primary rounded-lg shadow-sm flex items-center border border-gray-200"
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