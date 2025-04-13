import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

// Helper function to safely extract product image URL
function getProductImage(product) {
  // Handle case where product has imageUrl property directly
  if (product.imageUrl) {
    return product.imageUrl.startsWith('http') 
      ? `/api/image-proxy?url=${encodeURIComponent(product.imageUrl)}`
      : product.imageUrl;
  }
  
  // Handle images in string format that needs parsing
  if (product.images) {
    try {
      // If images is a JSON string, parse it
      if (typeof product.images === 'string') {
        if (product.images.startsWith('[')) {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const imageUrl = parsed[0];
            return imageUrl?.startsWith('http') 
              ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
              : imageUrl;
          }
        } else {
          // Single image URL as string
          return product.images.startsWith('http') 
            ? `/api/image-proxy?url=${encodeURIComponent(product.images)}`
            : product.images;
        }
      } 
      // If images is already an array
      else if (Array.isArray(product.images) && product.images.length > 0) {
        const imageUrl = product.images[0];
        return imageUrl?.startsWith('http') 
          ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
          : imageUrl;
      }
    } catch (e) {
      console.error('Error parsing product images:', e);
    }
  }
  
  // Default placeholder
  return "/images/placeholder.svg";
}

export function BasicSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const searchRef = useRef(null);
  
  // Fetch products on mount
  useEffect(() => {
    // Define function to fetch products with additional debugging
    const fetchProducts = async () => {
      try {
        console.log("🔍 DEBUG: Fetching products for search...");
        
        // Add timestamp to bypass cache
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/products?_=${timestamp}`);
        
        console.log("🔍 DEBUG: Products API response status:", response.status);
        
        if (!response.ok) {
          console.error(`🚨 Product fetch failed with status: ${response.status}`);
          return;
        }
        
        const data = await response.json();
        console.log(`🔍 DEBUG: Fetched ${data.length} products for search:`, data);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log("✅ Product data successfully loaded");
          setProducts(data);
          
          // Log a sample product to verify structure
          console.log("🔍 DEBUG: Sample product data:", data[0]);
        } else {
          console.error('🚨 Invalid product data received (empty or not an array)');
        }
      } catch (error) {
        console.error('🚨 Error fetching products:', error);
      }
    };
    
    // Execute fetch function
    fetchProducts();
    
    // Set up a fallback timer to retry if no products are loaded
    const fallbackTimer = setTimeout(() => {
      if (products.length === 0) {
        console.log("🔄 No products loaded after timeout, retrying...");
        fetchProducts();
      }
    }, 3000);
    
    return () => clearTimeout(fallbackTimer);
  }, [products.length]);
  
  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filter products based on search term
  useEffect(() => {
    // When search term is empty, show nothing or popular products
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
      return;
    }
    
    if (!Array.isArray(products) || products.length === 0) {
      console.log('🔍 DEBUG: No products available to search');
      return;
    }
    
    console.log('🔍 DEBUG: Searching for:', searchTerm);
    const term = searchTerm.toLowerCase();
    
    try {
      // Create a more robust filter that can handle potentially missing fields
      const filtered = products.filter(product => {
        if (!product) {
          console.log('🔍 DEBUG: Found null/undefined product in array');
          return false;
        }
        
        // Log each product we're evaluating to see its actual structure
        if (term.length > 3) {
          console.log('🔍 DEBUG: Checking product:', product);
        }
        
        // Check name (highest priority)
        if (product.name && product.name.toLowerCase().includes(term)) {
          console.log(`✅ MATCH: Name match for "${term}" in "${product.name}"`);
          return true;
        }
        
        // Check category (medium priority)
        if (product.category && product.category.toLowerCase().includes(term)) {
          console.log(`✅ MATCH: Category match for "${term}" in "${product.category}"`);
          return true;
        }
        
        // Check description (lower priority)
        if (product.description && product.description.toLowerCase().includes(term)) {
          console.log(`✅ MATCH: Description match for "${term}" in first 20 chars: "${product.description.substring(0, 20)}..."`);
          return true;
        }
        
        return false;
      });
      
      console.log(`🔍 DEBUG: Found ${filtered.length} products matching "${term}" out of ${products.length} total products`);
      
      // Show all results when there are only a few filtered products
      if (filtered.length > 0 && filtered.length <= 5) {
        console.log('🔍 DEBUG: All matches:', filtered);
      }
      
      setFilteredProducts(filtered);
      
      // Auto-open dropdown when results are found
      if (filtered.length > 0) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error('🚨 Error during search filtering:', error);
    }
  }, [searchTerm, products]);
  
  // Handle clicking on a product
  const handleProductClick = (productId) => {
    window.location.href = `/product/${productId}`;
  };
  
  // Open search on click
  const handleSearchClick = () => {
    setIsOpen(true);
  };
  
  // Check if search is ready to use
  const isSearchReady = Array.isArray(products) && products.length > 0;
  
  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input Box */}
      <div className={`flex items-center border rounded-md px-3 py-2 w-full md:w-80 transition-all ${
        isSearchReady ? 'border-gray-300 focus-within:border-blue-500' : 'border-red-300'
      }`}>
        <Search className={`h-4 w-4 mr-2 ${isSearchReady ? 'text-gray-500' : 'text-red-500'}`} />
        <input
          type="text"
          placeholder={isSearchReady ? "Search products..." : "Loading products..."}
          className="flex-1 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={handleSearchClick}
          disabled={!isSearchReady}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="ml-1 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Status Message */}
      {!isSearchReady && (
        <div className="text-xs text-red-500 mt-1">
          Loading product data... Search will be available soon.
        </div>
      )}
      
      {/* No Results Message */}
      {isOpen && searchTerm && isSearchReady && filteredProducts.length === 0 && (
        <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md p-3 z-10 border text-center">
          No products found matching "{searchTerm}"
        </div>
      )}
      
      {/* Search Results Dropdown */}
      {isOpen && filteredProducts.length > 0 && (
        <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden z-10 border">
          <div className="p-2 bg-gray-50 text-xs font-medium text-gray-500 border-b">
            Found {filteredProducts.length} results for "{searchTerm}"
          </div>
          <ul className="max-h-60 overflow-auto">
            {filteredProducts.map(product => (
              <li 
                key={product.id} 
                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="w-10 h-10 bg-gray-200 rounded mr-2 flex-shrink-0">
                  {/* Complex image rendering logic with proper error handling */}
                  <img 
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder.svg";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{product.name}</div>
                  <div className="text-sm text-gray-600 flex items-center">
                    {product.category && (
                      <span className="mr-2 px-1.5 py-0.5 text-xs rounded bg-gray-100 truncate max-w-[100px]">
                        {product.category}
                      </span>
                    )}
                    <span className="font-medium">₹{product.price}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}