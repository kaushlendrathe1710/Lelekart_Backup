import React, { useState, useEffect } from 'react';

interface ProductImageProps {
  product: {
    id: number;
    name: string;
    image_url?: string;
    image?: string;
    imageUrl?: string;
    category?: string;
  };
  className?: string;
}

export function ProductImage({ product, className = "" }: ProductImageProps) {
  // Default to category-specific placeholder or general placeholder
  const getCategoryImage = () => {
    if (product.category) {
      const category = product.category.toLowerCase();
      
      // For fashion items like shapewear, return a special fashion image
      if (category === 'fashion' && product.name?.toLowerCase().includes('shapewear')) {
        return `/images/categories/fashion.svg`;
      }
      
      // Check if category image exists by matching against known categories
      const knownCategories = ['electronics', 'fashion', 'mobiles', 'home', 'beauty', 'grocery', 'toys', 'appliances'];
      if (knownCategories.includes(category)) {
        return `/images/categories/${category}.svg`;
      }
    }
    return "/images/placeholder.svg";
  };

  // Determine if a URL should be skipped (known problematic domains)
  const shouldSkipUrl = (url: string) => {
    return !url || 
           url?.includes('placeholder.com') ||
           url?.includes('via.placeholder') ||
           url === 'null' ||
           url === 'undefined' ||
           url === '';
  };

  // Get the best image URL to use, prioritize local paths
  let initialSrc = "/images/placeholder.svg";
  const imageUrl = product.image_url || product.image || product.imageUrl;
  
  if (imageUrl && !shouldSkipUrl(imageUrl)) {
    if (imageUrl.startsWith('/')) {
      // Local path
      initialSrc = imageUrl;
    } else if (imageUrl.includes('flixcart.com') || imageUrl.includes('lelekart.com')) {
      // Use proxy for external domains that need it
      initialSrc = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}&category=${encodeURIComponent(product.category || '')}`;
    } else {
      // Check if it's a problematic fashion URL (Fashion products often have problematic URLs)
      if (product.category?.toLowerCase() === 'fashion' && 
          (imageUrl.includes('http://') || 
           !imageUrl.includes('https://') ||
           imageUrl.includes('bit.ly') ||
           imageUrl.includes('cdn.dummyjson.com') ||
           imageUrl.length < 15)) {
        // For fashion items with problematic URLs, use category image directly
        initialSrc = getCategoryImage();
      } else {
        // Try direct external URL as last resort
        initialSrc = imageUrl;
      }
    }
  } else {
    // Go to category-specific image
    initialSrc = getCategoryImage();
  }

  const [imageSrc, setImageSrc] = useState<string>(initialSrc);
  const [hasError, setHasError] = useState<boolean>(false);
  
  return (
    <img
      src={imageSrc}
      alt={product.name}
      className={`max-w-full max-h-full object-contain ${className}`}
      onError={(e) => {
        // Only try category-specific fallback if not already using it
        if (!hasError) {
          setHasError(true);
          const target = e.target as HTMLImageElement;
          target.onerror = null; // Prevent infinite loop
          setImageSrc(getCategoryImage());
        }
      }}
    />
  );
}