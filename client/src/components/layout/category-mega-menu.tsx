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
import { useCategoryProducts } from "@/hooks/use-infinite-products";

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
  
  // Fetch one product per category for images
  const { data: categoryImagesData } = useQuery({
    queryKey: ["category-menu-images"],
    queryFn: async () => {
      // Fetch all categories
      const categoriesRes = await fetch("/api/categories");
      const categories = await categoriesRes.json();
      // For each category, fetch one product
      const imageMap: Record<string, string> = {};
      await Promise.all(
        categories.map(async (cat: any) => {
          const res = await fetch(`/api/products?category=${encodeURIComponent(cat.name)}&limit=1&approved=true&status=approved`);
          const data = await res.json();
          const product = data.products?.[0];
          let imageUrl = "";
          if (product?.imageUrl) imageUrl = product.imageUrl;
          else if (product?.images) {
            try {
              const imgs = JSON.parse(product.images);
              if (Array.isArray(imgs) && imgs[0]) imageUrl = imgs[0];
            } catch {}
          }
          if (!imageUrl) imageUrl = "/attached_assets/image_1744428587586.png";
          imageMap[cat.name] = imageUrl;
        })
      );
      return imageMap;
    },
    staleTime: 10 * 60 * 1000,
  });
  
  // Add a loading state for category images
  const imagesLoading = !categoryImagesData;

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
    <div className="w-full bg-[#F8F5E4] border-b border-[#EADDCB]">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="flex flex-nowrap gap-2 py-2 overflow-x-auto scrollbar-hide">
            {/* Categories with subcategories - shown as dropdowns */}
            {categoriesWithSubcategories.map(category => (
              <DropdownMenu key={category.id}>
                <DropdownMenuTrigger className="px-4 py-2 text-base font-bold bg-[#F8F5E4] text-black hover:bg-[#EADDCB] rounded-lg shadow-sm flex flex-col items-center transition-colors duration-150 border border-[#EADDCB] min-w-[120px]">
                  {/* Category image above name with skeleton loader */}
                  <div className="flex flex-col items-center mb-1">
                    {imagesLoading ? (
                      <Skeleton className="w-12 h-12 rounded-full mb-1" />
                    ) : (
                      <img
                        src={categoryImagesData?.[category.name] || "/attached_assets/image_1744428587586.png"}
                        alt={category.name}
                        className="w-12 h-12 object-cover rounded-full border border-[#e0c9a6] shadow-sm mb-1 bg-white transition-opacity duration-300"
                        style={{ opacity: imagesLoading ? 0.5 : 1 }}
                      />
                    )}
                    <span>{category.name}</span>
                  </div>
                  <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 text-black" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-[#F8F5E4] text-black border border-[#EADDCB] rounded-xl shadow-2xl p-2 mt-2 z-50">
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
                className="px-4 py-2 text-base font-bold bg-[#F8F5E4] text-black hover:bg-[#EADDCB] rounded-lg shadow-sm flex flex-col items-center border border-[#EADDCB] min-w-[120px]"
              >
                {/* Category image above name with skeleton loader */}
                <div className="flex flex-col items-center mb-1">
                  {imagesLoading ? (
                    <Skeleton className="w-12 h-12 rounded-full mb-1" />
                  ) : (
                    <img
                      src={categoryImagesData?.[category.name] || "/attached_assets/image_1744428587586.png"}
                      alt={category.name}
                      className="w-12 h-12 object-cover rounded-full border border-[#e0c9a6] shadow-sm mb-1 bg-white transition-opacity duration-300"
                      style={{ opacity: imagesLoading ? 0.5 : 1 }}
                    />
                  )}
                  <span>{category.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}