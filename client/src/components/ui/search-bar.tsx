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
    navigate(`/product/${productId}`);
    setOpen(false);
    setSearchTerm('');
  };

  // Use state for search results to avoid routing issues
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use effect to fetch search results
  useEffect(() => {
    // Define the search function
    const searchProducts = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsLoading(true);
      console.log('Searching for:', debouncedSearchTerm);
      
      try {
        // Make a direct request to retrieve products
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Search failed');
        }
        
        const allProducts = await response.json();
        
        // Filter products on the client side
        const filteredResults = allProducts.filter((product: Product) => 
          product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
          (product.category && product.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        );
        
        console.log(`Found ${filteredResults.length} results for "${debouncedSearchTerm}"`);
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Execute search when debounced term changes
    if (debouncedSearchTerm.length >= 2) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  return (
    <>
      <div className="relative w-full max-w-md">
        <Button 
          variant="outline" 
          className="relative h-9 w-full justify-start rounded-md px-3 text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 mr-2" />
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
            {isLoading ? 'Searching...' : 'No results found.'}
          </CommandEmpty>
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
                      <span className="font-medium">{product.name}</span>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground truncate max-w-[15rem]">
                          {product.category && <span className="mr-2 px-1.5 py-0.5 text-xs rounded bg-secondary">{product.category}</span>}
                          ₹{product.price}
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