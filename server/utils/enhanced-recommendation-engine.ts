import { db } from "../db";
import { products } from "@shared/schema";
import { sql, desc, eq, and, or, inArray, like, ilike } from "drizzle-orm";
import { findSimilarProducts } from "./gemini-ai";

// Simple in-memory cache for AI recommendations (in production, use Redis)
const aiRecommendationCache = new Map<
  string,
  { products: any[]; timestamp: number }
>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Enhanced recommendation engine that provides product suggestions based on:
 * 1. AI-powered semantic similarity using Gemini
 * 2. User's purchase history
 * 3. User's browsing history (via view tracking)
 * 4. User's cart items
 * 5. Similar products in the same category and subcategory
 * 6. Popular products for new users
 */
export class EnhancedRecommendationEngine {
  /**
   * Get personalized product recommendations for a user
   * @param userId The user ID to get recommendations for, or null for anonymous users
   * @param limit The maximum number of recommendations to return
   * @returns Array of recommended products
   */
  static async getPersonalizedRecommendations(
    userId: number | null,
    limit: number = 10
  ): Promise<any[]> {
    // If user is logged in, get personalized recommendations
    if (userId) {
      return await this.getRecommendationsForUser(userId, limit);
    }

    // For anonymous users, return popular products
    return await this.getPopularProducts(limit);
  }

  /**
   * Get recommendations for a specific product (similar products) using AI
   * @param productId Product ID to get similar items for
   * @param limit Maximum number of similar products to return
   * @returns Array of similar products
   */
  static async getSimilarProducts(
    productId: number,
    limit: number = 6
  ): Promise<any[]> {
    try {
      // Get the product to find similar ones
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));

      if (!product) {
        return [];
      }

      // Check cache first
      const cacheKey = `similar_${productId}_${limit}`;
      const cached = aiRecommendationCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`Using cached AI recommendations for product ${productId}`);
        return cached.products;
      }

      // First, try to get AI-powered similar products
      const aiSimilarProducts = await this.getAISimilarProducts(product, limit);

      if (aiSimilarProducts.length >= limit) {
        // Cache the results
        aiRecommendationCache.set(cacheKey, {
          products: aiSimilarProducts,
          timestamp: Date.now(),
        });
        return aiSimilarProducts;
      }

      // If AI doesn't return enough products, fall back to traditional methods
      const fallbackProducts = await this.getFallbackSimilarProducts(
        product,
        limit - aiSimilarProducts.length
      );
      const allProducts = [...aiSimilarProducts, ...fallbackProducts];

      // Cache the results
      aiRecommendationCache.set(cacheKey, {
        products: allProducts,
        timestamp: Date.now(),
      });

      return allProducts;
    } catch (error) {
      console.error(
        "Error in AI similar products, falling back to traditional method:",
        error
      );
      return await this.getFallbackSimilarProducts(
        { id: productId, category: "", name: "", description: "" },
        limit
      );
    }
  }

  /**
   * Clear the recommendation cache (useful for testing or when products are updated)
   */
  static clearCache(): void {
    aiRecommendationCache.clear();
    console.log("AI recommendation cache cleared");
  }

  /**
   * Get AI-powered similar products using Gemini
   * @param product The product to find similar items for
   * @param limit Maximum number of similar products to return
   * @returns Array of similar products
   */
  private static async getAISimilarProducts(
    product: any,
    limit: number
  ): Promise<any[]> {
    try {
      // Guard against null/undefined product
      if (!product || typeof product !== 'object') {
        console.log("Invalid product for AI similar products, skipping");
        return [];
      }

      // First, get all available products in the same category for AI to choose from
      const availableProducts = await db
        .select({
          id: products.id,
          name: products.name,
          category: products.category,
          subcategory1: products.subcategory1,
          subcategory2: products.subcategory2,
          description: products.description,
          brand: products.brand,
          price: products.price,
        })
        .from(products)
        .where(
          and(
            eq(products.category, product.category),
            eq(products.approved, true),
            eq(products.deleted, false),
            sql`${products.id} != ${product.id}`
          )
        );

      if (availableProducts.length === 0) {
        return [];
      }

      // Use the enhanced AI function to find similar products
      const similarProductIds = await findSimilarProducts(
        {
          name: product.name,
          category: product.category,
          subcategory1: product.subcategory1,
          subcategory2: product.subcategory2,
          description: product.description,
          brand: product.brand,
          price: product.price,
        },
        availableProducts,
        limit
      );

      if (similarProductIds.length === 0) {
        return [];
      }

      // Fetch the actual products from database
      const similarProducts = await db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, similarProductIds),
            eq(products.approved, true),
            eq(products.deleted, false)
          )
        )
        .limit(limit);

      return similarProducts;
    } catch (error) {
      console.error("Error getting AI similar products:", error);
      return [];
    }
  }

  /**
   * Get fallback similar products using traditional methods
   * @param product The product to find similar items for
   * @param limit Maximum number of similar products to return
   * @returns Array of similar products
   */
  private static async getFallbackSimilarProducts(
    product: any,
    limit: number
  ): Promise<any[]> {
    try {
      let similarProducts: any[] = [];

      // Method 1: Same category and subcategory
      if (product.subcategory1 || product.subcategory2) {
        similarProducts = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.category, product.category),
              or(
                product.subcategory1
                  ? ilike(products.subcategory1, `%${product.subcategory1}%`)
                  : undefined,
                product.subcategory2
                  ? ilike(products.subcategory2, `%${product.subcategory2}%`)
                  : undefined
              ),
              eq(products.approved, true),
              eq(products.deleted, false),
              sql`${products.id} != ${product.id}`
            )
          )
          .limit(limit);
      }

      // Method 2: Same category with keyword matching in name/description
      if (similarProducts.length < limit) {
        const remainingLimit = limit - similarProducts.length;
        const existingIds = similarProducts.map((p) => p.id);

        const keywordProducts = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.category, product.category),
              eq(products.approved, true),
              eq(products.deleted, false),
              sql`${products.id} != ${product.id}`,
              existingIds.length > 0
                ? sql`${products.id} NOT IN (${sql.join(existingIds, sql`, `)})`
                : undefined,
              or(
                ilike(products.name, `%${this.extractKeywords(product.name)}%`),
                ilike(
                  products.description,
                  `%${this.extractKeywords(product.name)}%`
                )
              )
            )
          )
          .limit(remainingLimit);

        similarProducts = [...similarProducts, ...keywordProducts];
      }

      // Method 3: Same category only (fallback)
      if (similarProducts.length < limit) {
        const remainingLimit = limit - similarProducts.length;
        const existingIds = similarProducts.map((p) => p.id);

        const categoryProducts = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.category, product.category),
              eq(products.approved, true),
              eq(products.deleted, false),
              sql`${products.id} != ${product.id}`,
              existingIds.length > 0
                ? sql`${products.id} NOT IN (${sql.join(existingIds, sql`, `)})`
                : undefined
            )
          )
          .limit(remainingLimit);

        similarProducts = [...similarProducts, ...categoryProducts];
      }

      return similarProducts;
    } catch (error) {
      console.error("Error in fallback similar products:", error);
      return [];
    }
  }

  /**
   * Extract keywords from product name for better matching
   * @param productName The product name to extract keywords from
   * @returns Extracted keywords
   */
  private static extractKeywords(productName: string): string {
    if (!productName) return "";

    // Remove common words and extract meaningful keywords
    const commonWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ];
    const words = productName.toLowerCase().split(/\s+/);
    const keywords = words.filter(
      (word) =>
        word.length > 2 && !commonWords.includes(word) && !/^\d+$/.test(word)
    );

    return keywords.slice(0, 3).join(" "); // Return top 3 keywords
  }

  /**
   * Get personalized recommendations for a logged-in user
   * @param userId User ID to get recommendations for
   * @param limit Maximum number of recommendations
   * @returns Array of recommended products
   */
  private static async getRecommendationsForUser(
    userId: number,
    limit: number
  ): Promise<any[]> {
    // Step 1: Get products from user's past purchases
    const purchasedProductIds = await this.getPurchasedProductIds(userId);

    // Step 2: Get products from user's cart
    const cartProductIds = await this.getCartProductIds(userId);

    // Step 3: Get products from the same categories as user's purchases and cart items
    const userCategories = await this.getUserPreferredCategories(userId);

    // Get recommendations based on categories user is interested in
    let recommendations: any[] = [];

    if (userCategories.length > 0) {
      recommendations = await db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.category, userCategories),
            eq(products.approved, true),
            // Exclude products the user already purchased or has in cart
            purchasedProductIds.length > 0
              ? sql`${products.id} NOT IN (${sql.join(purchasedProductIds, sql`, `)})`
              : undefined,
            cartProductIds.length > 0
              ? sql`${products.id} NOT IN (${sql.join(cartProductIds, sql`, `)})`
              : undefined
          )
        )
        .orderBy(
          desc(products.id)
        ) /* Sort by newest (highest ID) instead of rating */
        .limit(limit);
    }

    // If we don't have enough recommendations, fill with popular products
    if (recommendations.length < limit) {
      const additionalCount = limit - recommendations.length;
      const existingIds = recommendations.map((p) => p.id);

      const popularProducts = await this.getPopularProducts(additionalCount, [
        ...purchasedProductIds,
        ...cartProductIds,
        ...existingIds,
      ]);

      recommendations = [...recommendations, ...popularProducts];
    }

    return recommendations;
  }

  /**
   * Get products that the user has purchased
   * @param userId User ID
   * @returns Array of product IDs
   */
  private static async getPurchasedProductIds(
    userId: number
  ): Promise<number[]> {
    const orderItemsResult = await db.execute(sql`
      SELECT DISTINCT oi.product_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ${userId}
    `);

    return orderItemsResult.rows.map((row: any) => row.product_id);
  }

  /**
   * Get products in the user's cart
   * @param userId User ID
   * @returns Array of product IDs
   */
  private static async getCartProductIds(userId: number): Promise<number[]> {
    const cartItems = await db.execute(sql`
      SELECT product_id FROM carts
      WHERE user_id = ${userId}
    `);

    return cartItems.rows.map((row: any) => row.product_id);
  }

  /**
   * Get categories the user has shown interest in
   * @param userId User ID
   * @returns Array of category names
   */
  private static async getUserPreferredCategories(
    userId: number
  ): Promise<string[]> {
    const categories = await db.execute(sql`
      SELECT DISTINCT p.category
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN carts c ON p.id = c.product_id
      WHERE (o.user_id = ${userId} OR c.user_id = ${userId})
        AND p.category IS NOT NULL
    `);

    return categories.rows
      .map((row: any) => row.category)
      .filter((category: string) => category);
  }

  /**
   * Get popular products based on order frequency
   * @param limit Maximum number of products to return
   * @param excludeIds Product IDs to exclude
   * @returns Array of popular products
   */
  private static async getPopularProducts(
    limit: number = 10,
    excludeIds: number[] = []
  ): Promise<any[]> {
    // If we have products to exclude
    const excludeCondition =
      excludeIds.length > 0
        ? sql`AND p.id NOT IN (${sql.join(excludeIds, sql`, `)})`
        : sql``;

    // Get products ordered by popularity (order count)
    // Only show approved products that aren't drafts and aren't deleted
    const popularQuery = sql`
      SELECT p.*, COUNT(oi.id) as order_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.approved = true
      AND (p.is_draft IS NULL OR p.is_draft = false)
      AND p.deleted = false
      ${excludeCondition}
      GROUP BY p.id
      ORDER BY order_count DESC, p.id DESC /* Sort by newest (highest ID) as secondary criteria */
      LIMIT ${limit}
    `;

    const popularProducts = await db.execute(popularQuery);

    // If we don't have enough popular products, get latest products
    if (popularProducts.rows.length < limit) {
      const additionalLimit = limit - popularProducts.rows.length;
      const existingIds = popularProducts.rows.map((row: any) => row.id);
      const allExcludeIds = [...excludeIds, ...existingIds];

      const excludeLatestCondition =
        allExcludeIds.length > 0
          ? sql`AND id NOT IN (${sql.join(allExcludeIds, sql`, `)})`
          : sql``;

      const latestQuery = sql`
        SELECT * FROM products
        WHERE approved = true
        AND (is_draft IS NULL OR is_draft = false)
        AND deleted = false
        ${excludeLatestCondition}
        ORDER BY id DESC
        LIMIT ${additionalLimit}
      `;

      const latestProducts = await db.execute(latestQuery);
      return [...popularProducts.rows, ...latestProducts.rows];
    }

    return popularProducts.rows;
  }
}
