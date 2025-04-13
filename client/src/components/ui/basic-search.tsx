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
    const fetchProducts = async () => {
      try {
        console.log("Fetching products for search...");
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          console.error(`Product fetch failed with status: ${response.status}`);
          return;
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.length} products for search:`, data);
        
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          console.log("Product data successfully loaded");
        } else {
          console.error('Invalid product data received (empty or not an array)');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, []);
  
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
      console.log('No products available to search');
      return;
    }
    
    console.log('Search for:', searchTerm);
    const term = searchTerm.toLowerCase();
    
    // Create a more robust filter that can handle potentially missing fields
    const filtered = products.filter(product => {
      if (!product) return false;
      
      // Check name (highest priority)
      if (product.name && product.name.toLowerCase().includes(term)) {
        return true;
      }
      
      // Check category (medium priority)
      if (product.category && product.category.toLowerCase().includes(term)) {
        return true;
      }
      
      // Check description (lower priority)
      if (product.description && product.description.toLowerCase().includes(term)) {
        return true;
      }
      
      return false;
    });
    
    console.log(`Found ${filtered.length} products matching "${term}"`);
    setFilteredProducts(filtered);
  }, [searchTerm, products]);
  
  // Handle clicking on a product
  const handleProductClick = (productId) => {
    window.location.href = `/product/${productId}`;
  };
  
  // Open search on click
  const handleSearchClick = () => {
    setIsOpen(true);
  };
  
  return (
    <div className="relative" ref={searchRef}>
      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-blue-500 w-full md:w-80">
        <Search className="h-4 w-4 mr-2 text-gray-500" />
        <input
          type="text"
          placeholder="Search products..."
          className="flex-1 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={handleSearchClick}
        />
      </div>
      
      {isOpen && filteredProducts.length > 0 && (
        <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden z-10 border">
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
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">₹{product.price}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}