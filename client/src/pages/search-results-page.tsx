import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@shared/schema';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProductCard } from '@/components/ui/product-card';
import { Skeleton } from '@/components/ui/skeleton';
// Import icons
import { Search, AlertTriangle, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceSearchDialog } from '@/components/search/voice-search-dialog';
import { AISearchService } from '@/services/ai-search-service';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function SearchResultsPage() {
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const brandParam = searchParams.get('brand');
  const colorParam = searchParams.get('color');
  const sizeParam = searchParams.get('size');
  const sortParam = searchParams.get('sort');
  
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [debouncedQuery, setDebouncedQuery] = useState(queryParam);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const { toast } = useToast();
  
  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);
  
  // Fetch search results
  const { data: results, isLoading, isError } = useQuery<Product[]>({
    queryKey: ['/api/search', debouncedQuery, categoryParam, minPriceParam, maxPriceParam, brandParam, colorParam, sizeParam, sortParam],
    queryFn: async () => {
      if (!debouncedQuery.trim() && !categoryParam && !brandParam && !colorParam && !sizeParam) {
        return [];
      }
      
      // Build query string with all parameters
      const params = new URLSearchParams();
      if (debouncedQuery.trim()) params.append('q', debouncedQuery.trim());
      if (categoryParam) params.append('category', categoryParam);
      if (minPriceParam) params.append('minPrice', minPriceParam);
      if (maxPriceParam) params.append('maxPrice', maxPriceParam);
      if (brandParam) params.append('brand', brandParam);
      if (colorParam) params.append('color', colorParam);
      if (sizeParam) params.append('size', sizeParam);
      if (sortParam) params.append('sort', sortParam);
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      return await response.json();
    },
    enabled: Boolean(debouncedQuery.trim() || categoryParam || brandParam || colorParam || sizeParam),
  });
  
  // Handle voice search
  const handleVoiceSearch = async (voiceQuery: string) => {
    if (!voiceQuery.trim()) return;
    
    setIsVoiceSearching(true);
    
    try {
      // Process the query using AI to extract structured search parameters
      const result = await AISearchService.processQuery(voiceQuery);
      
      if (result.success) {
        // Build a search URL from the extracted parameters
        const searchUrl = AISearchService.buildSearchUrl(result.filters, result.enhancedQuery);
        
        // Navigate to the search page
        navigate(searchUrl);
        
        toast({
          title: 'Voice Search',
          description: `Searching for "${result.enhancedQuery}"`,
          duration: 3000
        });
        
        // Update search query for display
        setSearchQuery(result.enhancedQuery);
      } else {
        throw new Error(result.error || 'Failed to process search query');
      }
    } catch (error) {
      console.error('Error processing voice search:', error);
      
      toast({
        title: 'Voice Search Error',
        description: error instanceof Error ? error.message : 'Failed to process your search',
        variant: 'destructive'
      });
      
      // Fall back to simple search with the original voice query
      navigate(`/search?q=${encodeURIComponent(voiceQuery.trim())}`);
      setSearchQuery(voiceQuery.trim());
    } finally {
      setIsVoiceSearching(false);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    console.log('Search form submitted with query:', searchQuery);
    
    try {
      // Process the query using AI to extract structured search parameters
      // This makes normal search consistent with voice search
      const result = await AISearchService.processQuery(searchQuery);
      
      if (result.success) {
        console.log('AI search successful, using result:', result);
        
        // Build a search URL from the extracted parameters
        const searchUrl = AISearchService.buildSearchUrl(result.filters, result.enhancedQuery);
        
        // Navigate to the search page
        navigate(searchUrl);
        
        toast({
          title: 'Search',
          description: `Searching for "${result.enhancedQuery}"`,
          duration: 3000
        });
      } else {
        throw new Error(result.error || 'Failed to process search query');
      }
    } catch (error) {
      console.error('Error processing search:', error);
      
      toast({
        title: 'Search',
        description: 'Using basic search instead',
        duration: 3000
      });
      
      // Fall back to simple search with the original query
      setDebouncedQuery(searchQuery);
      
      // Update URL with new search query
      const newParams = new URLSearchParams(searchParams);
      newParams.set('q', searchQuery);
      navigate(`/search?${newParams.toString()}`);
    }
  };
  
  // Build page title based on search query
  let pageTitle = queryParam 
    ? `Search results for "${queryParam}"` 
    : 'Product Search';
    
  // If we have structured filters, make a more descriptive title
  if (categoryParam || brandParam || colorParam || sizeParam) {
    const filters = [];
    if (colorParam) filters.push(`${colorParam}`);
    if (sizeParam) filters.push(`size ${sizeParam}`);
    if (brandParam) filters.push(`${brandParam}`);
    if (categoryParam) filters.push(`in ${categoryParam}`);
    
    if (filters.length > 0) {
      pageTitle = `Search results for ${filters.join(' ')}`;
      if (queryParam) pageTitle += ` matching "${queryParam}"`;
    }
  }
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-md overflow-hidden shadow-sm">
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (isError) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">
            We couldn't process your search request. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      );
    }
    
    if (!results || results.length === 0) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-10 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No results found</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any products matching "{debouncedQuery}".
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Try checking your spelling or using more general terms.
          </p>
          <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">{pageTitle}</h1>
          
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  disabled={isVoiceSearching}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
              <VoiceSearchDialog 
                buttonVariant="secondary"
                buttonSize="default"
                buttonText="Voice Search"
                showIcon={true}
                onSearch={handleVoiceSearch}
              />
              <Button type="submit" disabled={isVoiceSearching}>Search</Button>
            </form>
            
            {/* Display active filters */}
            {(categoryParam || minPriceParam || maxPriceParam || brandParam || colorParam || sizeParam) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 pt-1">Active filters:</span>
                {categoryParam && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-1 px-3 flex items-center">
                      <span className="text-sm">Category: {categoryParam}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-1 text-gray-500"
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.delete('category');
                          navigate(`/search?${newParams.toString()}`);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {colorParam && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-1 px-3 flex items-center">
                      <span className="text-sm">Color: {colorParam}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-1 text-gray-500"
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.delete('color');
                          navigate(`/search?${newParams.toString()}`);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {brandParam && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-1 px-3 flex items-center">
                      <span className="text-sm">Brand: {brandParam}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-1 text-gray-500"
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.delete('brand');
                          navigate(`/search?${newParams.toString()}`);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {(minPriceParam || maxPriceParam) && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-1 px-3 flex items-center">
                      <span className="text-sm">
                        Price: {minPriceParam ? `₹${minPriceParam}` : ''}
                        {minPriceParam && maxPriceParam ? ' - ' : ''}
                        {maxPriceParam ? `₹${maxPriceParam}` : ''}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-1 text-gray-500"
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.delete('minPrice');
                          newParams.delete('maxPrice');
                          navigate(`/search?${newParams.toString()}`);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
          
          {results && results.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              
              {/* Sort options */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select 
                  className="text-sm border rounded px-2 py-1"
                  value={sortParam || 'relevance'}
                  onChange={(e) => {
                    const newParams = new URLSearchParams(searchParams);
                    if (e.target.value === 'relevance') {
                      newParams.delete('sort');
                    } else {
                      newParams.set('sort', e.target.value);
                    }
                    navigate(`/search?${newParams.toString()}`);
                  }}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}