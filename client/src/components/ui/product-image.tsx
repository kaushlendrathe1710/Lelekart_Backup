import React, { useState, useEffect } from 'react';

interface ProductImageProps {
  product: {
    id: number;
    name: string;
    image_url?: string;
    image?: string;
    imageUrl?: string | null; // Allow null for imageUrl
    category?: string;
    hasVariants?: boolean;
    variants?: any[];
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

  // Determine if a URL should be skipped (only clearly invalid URLs)
  const shouldSkipUrl = (url: string) => {
    return !url || 
           url === 'null' ||
           url === 'undefined' ||
           url === '' ||
           // Only skip obvious placeholder URLs
           url?.includes('placeholder.com/50') ||
           url?.includes('via.placeholder.com/100') ||
           // Skip URL shorteners that frequently expire
           url.includes('bit.ly');
  };

  // Get the best image URL to use, prioritize local paths
  let initialSrc = "/images/placeholder.svg";
  const imageUrl = product.image_url || product.image || product.imageUrl;
  
  if (imageUrl && !shouldSkipUrl(imageUrl)) {
    if (imageUrl.startsWith('/')) {
      // Local path - always use directly
      initialSrc = imageUrl;
    } else if (imageUrl.includes('lelekart.com')) {
      // Use proxy for our own domain
      initialSrc = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}&category=${encodeURIComponent(product.category || '')}`;
    } else if (imageUrl.startsWith('http://')) {
      // Convert http URLs to https where possible
      initialSrc = imageUrl.replace('http://', 'https://');
    } else if (imageUrl.includes('amazonaws.com') || imageUrl.includes('s3.') || 
              (imageUrl.startsWith('https://') && imageUrl.length > 20)) {
      // Always use S3 and other HTTPS URLs directly
      initialSrc = imageUrl;
    } else if (imageUrl.includes('chunumunu')) {
      // Direct use of our S3 bucket images
      initialSrc = imageUrl;
    } else {
      // For problematic sources, check if the URL seems legitimate
      const hasValidPath = imageUrl.includes('/') && imageUrl.lastIndexOf('.') > imageUrl.lastIndexOf('/');
      if (hasValidPath) {
        initialSrc = imageUrl; // Try using the original URL
      } else {
        initialSrc = getCategoryImage(); // Fall back to category image
      }
    }
  } else {
    // Go to category-specific image
    initialSrc = getCategoryImage();
  }

  const [imageSrc, setImageSrc] = useState<string>(initialSrc);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // Preload the fallback image to ensure it's in browser cache
  useEffect(() => {
    const fallbackImg = new Image();
    fallbackImg.src = getCategoryImage();
  }, []);
  
  return (
    <img
      src={imageSrc}
      alt={product.name || "Product image"}
      className={`max-w-full max-h-full object-contain ${className}`}
      loading="lazy" // Add lazy loading
      onError={(e) => {
        // Only try category-specific fallback if not already using it
        if (!hasError) {
          setHasError(true);
          const target = e.target as HTMLImageElement;
          target.onerror = null; // Prevent infinite loop
          const fallbackSrc = getCategoryImage();
          console.log(`Image load failed for product ${product.id}, using fallback: ${fallbackSrc}`);
          setImageSrc(fallbackSrc);
        }
      }}
    />
  );
}