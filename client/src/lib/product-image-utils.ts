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
  images?: string | string[]; // Can be JSON string or parsed array
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
 * Parses variant images from various formats (JSON string, comma-separated, single URL)
 * @param images - The images string or array
 * @returns Array of image URLs
 */
function parseVariantImages(images: string | string[] | undefined): string[] {
  if (!images) return [];

  try {
    // If images is already an array, return it (server now sends parsed arrays)
    if (Array.isArray(images)) {
      return images.filter((img) => img && img.trim() !== "");
    }

    // If images is a string
    if (typeof images === "string") {
      // Empty string case
      if (images.trim() === "") {
        return [];
      }

      // Handle if images is already a direct URL
      if (
        images.startsWith("http") &&
        !images.startsWith("[") &&
        !images.startsWith("{")
      ) {
        return [images];
      }

      // Handle comma-separated URLs that aren't in JSON format
      if (
        images.includes(",") &&
        !images.startsWith("[") &&
        !images.startsWith("{")
      ) {
        const urls = images
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url !== "");
        return urls;
      }

      // Try to parse as JSON
      if (images.startsWith("[") || images.startsWith("{")) {
        try {
          const parsedImages = JSON.parse(images);

          // If it's an array of strings, use directly
          if (Array.isArray(parsedImages)) {
            const validImages = parsedImages
              .map((img) =>
                typeof img === "string" ? img : img?.url || img?.imageUrl || ""
              )
              .filter((url) => url && url.trim() !== "");
            return validImages;
          }

          // If it's an object with url/imageUrl property
          if (typeof parsedImages === "object") {
            const url = parsedImages.url || parsedImages.imageUrl;
            return url ? [url] : [];
          }

          return [];
        } catch (parseError) {
          // Use as plain string if parsing fails, but only if it looks like a URL
          return images.includes("http") ? [images] : [];
        }
      }

      // If not a valid JSON string, treat as a single URL if it looks like one
      if (images.includes("http")) {
        return [images];
      }

      return [];
    }
  } catch (error) {
    console.error("Error processing variant images:", error);
  }

  return [];
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
    const variantImages = parseVariantImages(variant.images);
    if (variantImages.length > 0) {
      return variantImages[0];
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
    const productImages = parseVariantImages(product.images);
    if (productImages.length > 0) {
      return productImages[0];
    }
  }

  // Fallback to default placeholder
  return "https://placehold.co/100x100?text=No+Image";
}

/**
 * Gets all variant images for a product variant
 * @param variant - The variant object
 * @returns Array of image URLs
 */
export function getVariantImages(variant?: ProductVariant): string[] {
  if (!variant?.images) return [];
  return parseVariantImages(variant.images);
}

/**
 * Gets the best image URL for a cart item with enhanced variant support
 * This function prioritizes variant images and provides better debugging
 * @param cartItem - The cart item object
 * @returns The best image URL to display
 */
export function getCartItemImageUrlEnhanced(cartItem: CartItem): string {
  return getCartItemImageUrl(cartItem);
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

/**
 * Enhanced version of getOrderItemImageUrl with detailed debugging
 * @param orderItem - The order item object
 * @returns The best image URL to display
 */
export function getOrderItemImageUrlEnhanced(orderItem: {
  product: Product;
  variant?: ProductVariant;
}): string {
  return getProductImageUrl(orderItem.product, orderItem.variant);
}
