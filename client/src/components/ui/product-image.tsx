import React, { useState } from 'react';

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
  const [imageSrc, setImageSrc] = useState<string>("/images/placeholder.svg");
  const [hasError, setHasError] = useState<boolean>(false);

  // Get the best available image URL
  const imageUrl = product.image_url || product.image || product.imageUrl;

  // If there's an image URL and we haven't had an error yet
  React.useEffect(() => {
    if (imageUrl && !hasError) {
      // For external images that might require a proxy
      if (imageUrl.includes('flixcart.com') || imageUrl.includes('lelekart.com')) {
        setImageSrc(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}&category=${encodeURIComponent(product.category || '')}`);
      } else if (!imageUrl.includes('placeholder.com')) {
        // For other images (excluding placeholder.com which often fails)
        setImageSrc(imageUrl);
      }
    }
  }, [imageUrl, product.category, hasError]);

  return (
    <img
      src={imageSrc}
      alt={product.name}
      className={`max-w-full max-h-full object-contain ${className}`}
      onError={() => {
        // Only handle errors once to avoid infinite loops
        if (!hasError) {
          setHasError(true);
          setImageSrc("/images/placeholder.svg");
        }
      }}
    />
  );
}