import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  images?: string | string[];
  category?: string;
}

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Setup keyboard shortcut to open search dialog
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Close on navigation
  const handleSelectProduct = (productId: number) => {
    console.log(`Navigating to product ${productId}`);
    
    // Close the search dialog and reset search term
    setOpen(false);
    setSearchTerm('');
    
    // Use direct window location instead of wouter navigate to ensure page refresh
    window.location.href = `/product/${productId}`;
  };

  // Use state for all products and search results
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch all products on component mount (only once)
  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoading(true);
      try {
        // Make a direct request to retrieve all products
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        console.log(`Loaded ${products.length} products for search:`, products);
        
        // Check if we have valid product data
        if (Array.isArray(products) && products.length > 0) {
          setAllProducts(products);
        } else {
          console.error('Invalid product data received:', products);
          setAllProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllProducts();
  }, []);
  
  // Filter products immediately when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      // When searchTerm is empty, show a few suggestions or nothing
      setSearchResults(allProducts.slice(0, 5));
      return;
    }
    
    // Filter products based on the current search term (not debounced)
    const term = searchTerm.toLowerCase();
    
    // Create a more intelligent filter that prioritizes matches at the start of words
    const filtered = allProducts.filter((product: Product) => {
      // Check if product name starts with search term (highest priority)
      if (product.name.toLowerCase().startsWith(term)) {
        return true;
      }
      
      // Check if any word in product name starts with search term (high priority)
      const nameWords = product.name.toLowerCase().split(/\s+/);
      if (nameWords.some(word => word.startsWith(term))) {
        return true;
      }
      
      // Check if product name contains search term (medium priority)
      if (product.name.toLowerCase().includes(term)) {
        return true;
      }
      
      // Check if category matches (lower priority)
      if (product.category && product.category.toLowerCase().includes(term)) {
        return true;
      }
      
      // Check if description contains search term (lowest priority)
      if (product.description && product.description.toLowerCase().includes(term)) {
        return true;
      }
      
      return false;
    });
    
    console.log(`Found ${filtered.length} instant results for "${term}"`);
    setSearchResults(filtered);
  }, [searchTerm, allProducts]);

  // Function to highlight the matched text in product names
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className="bg-primary/20 text-primary font-medium">{part}</span>
            : part
        )}
      </>
    );
  };
  
  return (
    <>
      <div className="relative w-full max-w-md">
        <Button 
          variant="outline" 
          className="relative h-10 w-full justify-start rounded-md px-3 text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80 border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 mr-2 text-primary" />
          <span className="hidden sm:inline-flex">Search products...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-[0.35rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search products..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          ref={inputRef}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? 'Loading suggestions...' : searchTerm.trim() ? 'No results found.' : 'Type to search...'}
          </CommandEmpty>
          
          {/* Show popular searches when search is empty */}
          {!searchTerm.trim() && !isLoading && allProducts.length > 0 && (
            <CommandGroup heading="Popular Categories">
              <CommandItem value="electronics" onSelect={() => setSearchTerm("electronics")}>
                Electronics
              </CommandItem>
              <CommandItem value="fashion" onSelect={() => setSearchTerm("fashion")}>
                Fashion
              </CommandItem>
              <CommandItem value="mobile" onSelect={() => setSearchTerm("mobile")}>
                Mobiles
              </CommandItem>
              <CommandItem value="padded" onSelect={() => setSearchTerm("padded")}>
                Padded Products
              </CommandItem>
            </CommandGroup>
          )}
          
          {searchResults.length > 0 && (
            <CommandGroup heading="Products">
              {searchResults.map((product) => {
                // Parse images if it's a string
                let imageUrl = product.imageUrl;
                if (!imageUrl && product.images) {
                  try {
                    const images = typeof product.images === 'string' 
                      ? JSON.parse(product.images) 
                      : product.images;
                    imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : null;
                  } catch (e) {
                    console.error('Error parsing images:', e);
                  }
                }

                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.id}-${product.name}`}
                    onSelect={() => handleSelectProduct(product.id)}
                    className="flex items-center gap-2 py-3"
                  >
                    <div className="w-10 h-10 rounded overflow-hidden bg-secondary flex-shrink-0">
                      {imageUrl ? (
                        <img 
                          src={imageUrl.startsWith('http') ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}` : imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-xs text-muted-foreground">No img</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {highlightMatch(product.name, searchTerm)}
                      </span>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground truncate max-w-[15rem]">
                          {product.category && (
                            <span className="mr-2 px-1.5 py-0.5 text-xs rounded bg-secondary">
                              {product.category.toLowerCase().includes(searchTerm.toLowerCase()) 
                                ? highlightMatch(product.category, searchTerm)
                                : product.category}
                            </span>
                          )}
                          <span className="font-medium">₹{product.price.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}