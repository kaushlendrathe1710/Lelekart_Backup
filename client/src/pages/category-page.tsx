import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function CategoryPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Extract the category from the URL path
  const urlParts = location.split('/');
  const categoryName = decodeURIComponent(urlParts[urlParts.length - 1]);
  
  // State for sorting and filtering
  const [sortOrder, setSortOrder] = useState<string>("featured");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Fetch products for the specific category
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['/api/products', categoryName],
    queryFn: async () => {
      const response = await fetch(`/api/products?category=${encodeURIComponent(categoryName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
  });

  // Extract available distinct values from the products to act as "brands"
  useEffect(() => {
    if (products && products.length > 0) {
      // Use seller names as "brands" since our schema doesn't have a separate brand field
      const distinctNames: string[] = [];
      products.forEach((product: Product) => {
        // Extract brand-like identifier from product name
        const nameParts = product.name.split(' ');
        if (nameParts.length > 0) {
          const potentialBrand = nameParts[0]; // Use first word of product name as brand
          if (potentialBrand && !distinctNames.includes(potentialBrand)) {
            distinctNames.push(potentialBrand);
          }
        }
      });
      setAvailableBrands(distinctNames);
    }
  }, [products]);

  // Filter and sort products
  const filteredProducts = [...products]
    .filter((product: Product) => {
      // Filter by price range
      const price = Number(product.price);
      const inPriceRange = price >= priceRange[0] && price <= priceRange[1];
      
      // Filter by selected brands (if any)
      // Using the first word of product name as a substitute for brand
      const nameParts = product.name.split(' ');
      const firstWord = nameParts.length > 0 ? nameParts[0] : '';
      const matchesBrand = selectedBrands.length === 0 || 
        (firstWord && selectedBrands.includes(firstWord));
      
      return inPriceRange && matchesBrand;
    })
    .sort((a: Product, b: Product) => {
      // Sort by the selected order
      switch (sortOrder) {
        case "price-low-high":
          return Number(a.price) - Number(b.price);
        case "price-high-low":
          return Number(b.price) - Number(a.price);
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default: // "featured" or any other default
          return 0; // Keep original order
      }
    });

  // Handle brand selection changes
  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
    setSortOrder("featured");
    
    toast({
      title: "Filters cleared",
      description: "All filters have been reset to default values.",
    });
  };

  // Handle price range changes
  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600">Error Loading Products</h2>
            <p className="mt-2 text-gray-600">
              We couldn't load products for this category. Please try again later.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setLocation('/')}
            >
              Return to Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        {/* Header section with category title and filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{categoryName}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={sortOrder}
              onValueChange={setSortOrder}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                  <SheetDescription>
                    Narrow down products based on your preferences.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Price Range Filter */}
                  <div>
                    <h3 className="font-medium mb-3">Price Range</h3>
                    <div className="space-y-4">
                      <Slider
                        min={0}
                        max={100000}
                        step={1000}
                        value={[priceRange[0], priceRange[1]]}
                        onValueChange={handlePriceRangeChange}
                        className="mt-6"
                      />
                      <div className="flex items-center justify-between">
                        <span>₹{priceRange[0].toLocaleString()}</span>
                        <span>₹{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Brand Filter */}
                  {availableBrands.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Brand</h3>
                      <div className="space-y-2">
                        {availableBrands.map((brand) => (
                          <div key={brand} className="flex items-center space-x-2">
                            <Checkbox
                              id={`brand-${brand}`}
                              checked={selectedBrands.includes(brand)}
                              onCheckedChange={() => handleBrandChange(brand)}
                            />
                            <Label
                              htmlFor={`brand-${brand}`}
                              className="text-sm cursor-pointer"
                            >
                              {brand}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleClearFilters}
                      variant="outline" 
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">No Products Found</h2>
            <p className="mt-2 text-gray-600">
              We couldn't find any products matching your criteria.
            </p>
            {(selectedBrands.length > 0 || priceRange[0] > 0 || priceRange[1] < 100000) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}