import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { ProductCard } from "@/components/ui/product-card";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SearchResultsPage() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState("all");
  
  // Parse the URL query parameters
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('q') || "";
    if (query) {
      setSearchQuery(query);
      fetchSearchResults(query);
    } else {
      setLoading(false);
      setProducts([]);
    }
  }, [location]);
  
  // Function to fetch search results
  const fetchSearchResults = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/lelekart-search?q=${encodeURIComponent(query)}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error("Search failed:", await response.text());
        toast({
          title: "Search failed",
          description: "Unable to fetch search results. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during search:", error);
      toast({
        title: "Search error",
        description: "An error occurred while fetching results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      fetchSearchResults(searchQuery);
    }
  };
  
  // Filter and sort products
  const getFilteredAndSortedProducts = () => {
    // First filter by price range
    let filteredProducts = [...products];
    
    if (priceRange !== "all") {
      switch (priceRange) {
        case "under500":
          filteredProducts = filteredProducts.filter(p => p.price < 500);
          break;
        case "500to1000":
          filteredProducts = filteredProducts.filter(p => p.price >= 500 && p.price <= 1000);
          break;
        case "1000to5000":
          filteredProducts = filteredProducts.filter(p => p.price > 1000 && p.price <= 5000);
          break;
        case "over5000":
          filteredProducts = filteredProducts.filter(p => p.price > 5000);
          break;
      }
    }
    
    // Then sort by selected sort option
    switch (sortBy) {
      case "priceLowToHigh":
        return filteredProducts.sort((a, b) => a.price - b.price);
      case "priceHighToLow":
        return filteredProducts.sort((a, b) => b.price - a.price);
      case "newest":
        return filteredProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      default:
        // relevance is the default sorting, which is the order returned by the API
        return filteredProducts;
    }
  };
  
  const filteredAndSortedProducts = getFilteredAndSortedProducts();
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for products, brands and more"
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {filteredAndSortedProducts.length > 0 
                ? `${filteredAndSortedProducts.length} results for "${searchQuery}"` 
                : `No results found for "${searchQuery}"`}
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-auto">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="priceLowToHigh">Price: Low to High</SelectItem>
                    <SelectItem value="priceHighToLow">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-auto">
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under500">Under ₹500</SelectItem>
                    <SelectItem value="500to1000">₹500 - ₹1,000</SelectItem>
                    <SelectItem value="1000to5000">₹1,000 - ₹5,000</SelectItem>
                    <SelectItem value="over5000">Over ₹5,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredAndSortedProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  featured={false}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="mb-4">
                  <Search className="h-12 w-12 mx-auto text-gray-400" />
                </div>
                <h2 className="text-xl font-medium mb-2">No products found</h2>
                <p className="text-gray-500 mb-6">
                  We couldn't find any products matching "{searchQuery}".
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Try:</p>
                  <ul className="text-sm text-gray-500 list-disc pl-4 inline-block text-left">
                    <li>Checking your spelling</li>
                    <li>Using more general terms</li>
                    <li>Searching for a different product</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}