import { apiRequest } from '@/lib/queryClient';

interface SearchResult {
  success: boolean;
  query: string;
  filters: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    brand?: string;
    color?: string;
    size?: string;
    sortBy?: string;
    keywords?: string[];
  };
  enhancedQuery: string;
  error?: string;
}

/**
 * AI-powered search service that uses the Gemini API
 * to process natural language search queries and convert
 * them into structured search parameters.
 */
export const AISearchService = {
  /**
   * Process a natural language search query and extract search parameters
   *
   * @param query The natural language search query (e.g., "Show me red dresses under $50")
   * @returns A promise that resolves to a SearchResult object
   */
  processQuery: async (query: string): Promise<SearchResult> => {
    try {
      const response = await apiRequest('POST', '/api/ai/search', { query });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process search query');
      }
      
      return data;
    } catch (error) {
      console.error('Error processing AI search query:', error);
      return {
        success: false,
        query,
        filters: {},
        enhancedQuery: query,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  
  /**
   * Build a search URL from filters
   *
   * @param filters The search filters extracted from the query
   * @returns A search URL with appropriate query parameters
   */
  buildSearchUrl: (filters: SearchResult['filters'], enhancedQuery: string): string => {
    const params = new URLSearchParams();
    
    // Add the main search query
    if (enhancedQuery) {
      params.append('q', enhancedQuery);
    }
    
    // Add filters as query parameters
    if (filters.category) {
      params.append('category', filters.category);
    }
    
    if (filters.priceMin !== undefined) {
      params.append('minPrice', filters.priceMin.toString());
    }
    
    if (filters.priceMax !== undefined) {
      params.append('maxPrice', filters.priceMax.toString());
    }
    
    if (filters.brand) {
      params.append('brand', filters.brand);
    }
    
    if (filters.color) {
      params.append('color', filters.color);
    }
    
    if (filters.size) {
      params.append('size', filters.size);
    }
    
    if (filters.sortBy) {
      params.append('sort', filters.sortBy);
    }
    
    return `/search?${params.toString()}`;
  }
};