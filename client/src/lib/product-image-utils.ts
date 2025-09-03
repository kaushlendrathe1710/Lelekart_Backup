/**
 * Utility functions for handling product images with variant support
 */

export interface Product {
  id: number;
  name: string;
  imageUrl?: string;
  image_url?: string;
  images?: string;
  [key: string]: any;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  color?: string;
  size?: string;
  price: number;
  mrp?: number;
  stock: number;
  images?: string;
  [key: string]: any;
}

export interface CartItem {
  id: number | string;
  quantity: number;
  product: Product;
  variant?: ProductVariant;
  [key: string]: any;
}

/**
 * Gets the best image URL for a product, prioritizing variant images when available
 * @param product - The product object
 * @param variant - Optional variant object
 * @returns The best image URL to display
 */
export function getProductImageUrl(
  product: Product,
  variant?: ProductVariant
): string {
  // First priority: variant images if variant exists and has images
  if (variant?.images) {
    try {
      const variantImages = JSON.parse(variant.images);
      if (Array.isArray(variantImages) && variantImages.length > 0) {
        return variantImages[0];
      }
    } catch {
      // If JSON parsing fails, try using variant.images directly
      if (typeof variant.images === "string" && variant.images.trim()) {
        return variant.images;
      }
    }
  }

  // Second priority: product.imageUrl
  if (product.imageUrl) {
    return product.imageUrl;
  }

  // Third priority: product.image_url
  if (product.image_url) {
    return product.image_url;
  }

  // Fourth priority: product.images JSON array
  if (product.images) {
    try {
      const imagesArray = JSON.parse(product.images);
      if (Array.isArray(imagesArray) && imagesArray.length > 0) {
        return imagesArray[0];
      }
    } catch {
      // If JSON parsing fails, try using it directly
      if (typeof product.images === "string" && product.images.trim()) {
        return product.images;
      }
    }
  }

  // Fallback to default placeholder
  return "https://placehold.co/100x100?text=No+Image";
}

/**
 * Gets the best image URL for a cart item, prioritizing variant images
 * @param cartItem - The cart item object
 * @returns The best image URL to display
 */
export function getCartItemImageUrl(cartItem: CartItem): string {
  return getProductImageUrl(cartItem.product, cartItem.variant);
}

/**
 * Gets the best image URL for an order item, prioritizing variant images
 * @param orderItem - The order item object
 * @returns The best image URL to display
 */
export function getOrderItemImageUrl(orderItem: {
  product: Product;
  variant?: ProductVariant;
}): string {
  return getProductImageUrl(orderItem.product, orderItem.variant);
}
