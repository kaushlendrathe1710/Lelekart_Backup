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
      console.log('Processing AI search query:', query);
      const response = await apiRequest('POST', '/api/ai/search', { query });
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw AI search response:', responseText);
      
      // Parse the response text to JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
        throw new Error('Failed to parse search response');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process search query');
      }
      
      // Ensure all required fields are present
      return {
        success: data.success || false,
        query: data.query || query,
        filters: data.filters || {},
        enhancedQuery: data.enhancedQuery || query,
        error: data.error
      };
    } catch (error) {
      console.error('Error processing AI search query:', error);
      
      // Return a default search result that will still work
      return {
        success: false,
        query,
        filters: {
          keywords: query.split(' ')
        },
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
    
    // Add the main search query with validation
    if (enhancedQuery && typeof enhancedQuery === 'string') {
      params.append('q', enhancedQuery);
    }
    
    // Add filters as query parameters
    if (filters.category && typeof filters.category === 'string') {
      params.append('category', filters.category);
    }
    
    if (filters.priceMin !== undefined && filters.priceMin !== null) {
      params.append('minPrice', String(filters.priceMin));
    }
    
    if (filters.priceMax !== undefined && filters.priceMax !== null) {
      params.append('maxPrice', String(filters.priceMax));
    }
    
    if (filters.brand && typeof filters.brand === 'string') {
      params.append('brand', filters.brand);
    }
    
    if (filters.color && typeof filters.color === 'string') {
      params.append('color', filters.color);
    }
    
    if (filters.size && typeof filters.size === 'string') {
      params.append('size', filters.size);
    }
    
    if (filters.sortBy && typeof filters.sortBy === 'string') {
      params.append('sort', filters.sortBy);
    }
    
    return `/search?${params.toString()}`;
  }
};