import { 
  users, User, InsertUser,
  products, Product, InsertProduct,
  carts, Cart, InsertCart,
  orders, Order, InsertOrder,
  orderItems, OrderItem, InsertOrderItem,
  categories, Category, InsertCategory,
  reviews, Review, InsertReview,
  reviewImages, ReviewImage, InsertReviewImage,
  reviewHelpful, ReviewHelpful, InsertReviewHelpful,
  wishlists, Wishlist, InsertWishlist,
  salesHistory, SalesHistory, InsertSalesHistory,
  demandForecasts, DemandForecast, InsertDemandForecast,
  priceOptimizations, PriceOptimization, InsertPriceOptimization,
  inventoryOptimizations, InventoryOptimization, InsertInventoryOptimization,
  aiGeneratedContent, AIGeneratedContent, InsertAIGeneratedContent
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { pool } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User>;
  getSellers(approved?: boolean, rejected?: boolean): Promise<User[]>;
  getPendingSellers(): Promise<User[]>;
  getApprovedSellers(): Promise<User[]>;
  getRejectedSellers(): Promise<User[]>;
  updateSellerApproval(id: number, approved: boolean, rejected?: boolean): Promise<User>;

  // Product operations
  getProducts(category?: string, sellerId?: number, approved?: boolean): Promise<Product[]>;
  getProductsCount(category?: string, sellerId?: number, approved?: boolean): Promise<number>;
  getProductsPaginated(category?: string, sellerId?: number, approved?: boolean, offset?: number, limit?: number): Promise<Product[]>;
  searchProducts(query: string, limit?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Cart operations
  getCartItems(userId: number): Promise<{id: number, quantity: number, product: Product, userId: number}[]>;
  getCartItem(id: number): Promise<Cart | undefined>;
  addToCart(cart: InsertCart): Promise<Cart>;
  updateCartItem(id: number, quantity: number): Promise<Cart>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: number): Promise<void>;

  // Order operations
  getOrders(userId?: number, sellerId?: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  orderHasSellerProducts(orderId: number, sellerId: number): Promise<boolean>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Review operations
  getProductReviews(productId: number): Promise<(Review & { user: User, images?: ReviewImage[] })[]>;
  getUserReviews(userId: number): Promise<(Review & { product: Product, images?: ReviewImage[] })[]>;
  getReview(id: number): Promise<(Review & { user: User, product: Product, images?: ReviewImage[] }) | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<Review>): Promise<Review>;
  deleteReview(id: number): Promise<void>;
  
  // Review Image operations
  addReviewImage(reviewImage: InsertReviewImage): Promise<ReviewImage>;
  deleteReviewImage(id: number): Promise<void>;
  
  // Review Helpful operations
  markReviewHelpful(reviewId: number, userId: number): Promise<ReviewHelpful>;
  unmarkReviewHelpful(reviewId: number, userId: number): Promise<void>;
  isReviewHelpfulByUser(reviewId: number, userId: number): Promise<boolean>;
  
  // Product Rating Summary
  getProductRatingSummary(productId: number): Promise<{ 
    averageRating: number, 
    totalReviews: number, 
    ratingCounts: { rating: number, count: number }[] 
  }>;
  
  // Check if user purchased product (for verified review status)
  hasUserPurchasedProduct(userId: number, productId: number): Promise<boolean>;
  
  // Wishlist operations
  getWishlistItems(userId: number): Promise<{id: number, product: Product, userId: number, dateAdded: Date}[]>;
  getWishlistItem(userId: number, productId: number): Promise<Wishlist | undefined>;
  addToWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: number, productId: number): Promise<void>;
  clearWishlist(userId: number): Promise<void>;
  isProductInWishlist(userId: number, productId: number): Promise<boolean>;

  // Smart Inventory & Price Management Features
  // Sales History
  getSalesHistory(productId: number, sellerId: number): Promise<SalesHistory[]>;
  createSalesRecord(salesData: InsertSalesHistory): Promise<SalesHistory>;
  
  // Demand Forecasts
  getDemandForecasts(productId: number, sellerId: number): Promise<DemandForecast[]>;
  getDemandForecast(id: number): Promise<DemandForecast | undefined>;
  createDemandForecast(forecastData: InsertDemandForecast): Promise<DemandForecast>;
  
  // Price Optimizations
  getPriceOptimizations(productId: number, sellerId: number): Promise<PriceOptimization[]>;
  getPriceOptimization(id: number): Promise<PriceOptimization | undefined>;
  createPriceOptimization(optimizationData: InsertPriceOptimization): Promise<PriceOptimization>;
  updatePriceOptimizationStatus(id: number, status: string, sellerId: number): Promise<PriceOptimization>;
  applyPriceOptimization(id: number, sellerId: number): Promise<Product>;
  
  // Inventory Optimizations
  getInventoryOptimizations(productId: number, sellerId: number): Promise<InventoryOptimization[]>;
  getInventoryOptimization(id: number): Promise<InventoryOptimization | undefined>;
  createInventoryOptimization(optimizationData: InsertInventoryOptimization): Promise<InventoryOptimization>;
  updateInventoryOptimizationStatus(id: number, status: string, sellerId: number): Promise<InventoryOptimization>;
  applyInventoryOptimization(id: number, sellerId: number): Promise<Product>;
  
  // AI Generated Content
  getAIGeneratedContents(productId: number, sellerId: number, contentType?: string): Promise<AIGeneratedContent[]>;
  getAIGeneratedContent(id: number): Promise<AIGeneratedContent | undefined>;
  createAIGeneratedContent(contentData: InsertAIGeneratedContent): Promise<AIGeneratedContent>;
  updateAIGeneratedContentStatus(id: number, status: string, sellerId: number): Promise<AIGeneratedContent>;
  applyAIGeneratedContent(id: number, sellerId: number): Promise<Product>;

  // Seller Approval Operations
  getSellers(): Promise<User[]>;
  updateSellerApprovalStatus(sellerId: number, status: boolean, isRejected?: boolean): Promise<User>;
  
  // Session store
  sessionStore: session.SessionStore;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async updateUserRole(id: number, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role: role as User["role"] })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async getSellers(approved?: boolean, rejected?: boolean): Promise<User[]> {
    try {
      let query = db.select().from(users).where(eq(users.role, 'seller'));
      
      if (approved !== undefined) {
        query = query.where(eq(users.approved, approved));
      }
      
      if (rejected !== undefined) {
        query = query.where(eq(users.rejected, rejected));
      }
      
      return await query;
    } catch (error) {
      console.error("Error in getSellers:", error);
      return [];
    }
  }
  
  // Get pending sellers (not approved, not rejected)
  async getPendingSellers(): Promise<User[]> {
    try {
      return await db.select()
        .from(users)
        .where(
          and(
            eq(users.role, "seller"),
            eq(users.approved, false),
            eq(users.rejected, false)
          )
        );
    } catch (error) {
      console.error("Error in getPendingSellers:", error);
      return [];
    }
  }
  
  // Get approved sellers
  async getApprovedSellers(): Promise<User[]> {
    try {
      return await db.select()
        .from(users)
        .where(
          and(
            eq(users.role, "seller"),
            eq(users.approved, true)
          )
        );
    } catch (error) {
      console.error("Error in getApprovedSellers:", error);
      return [];
    }
  }
  
  // Get rejected sellers
  async getRejectedSellers(): Promise<User[]> {
    try {
      return await db.select()
        .from(users)
        .where(
          and(
            eq(users.role, "seller"),
            eq(users.rejected, true)
          )
        );
    } catch (error) {
      console.error("Error in getRejectedSellers:", error);
      return [];
    }
  }
  
  // For interface compatibility
  async updateSellerApproval(id: number, approved: boolean, rejected: boolean = false): Promise<User> {
    return this.updateSellerApprovalStatus(id, approved, rejected);
  }
  
  async updateSellerApprovalStatus(id: number, status: boolean, isRejected: boolean = false): Promise<User> {
    const [seller] = await db.select().from(users).where(
      and(
        eq(users.id, id),
        eq(users.role, 'seller')
      )
    );
    
    if (!seller) {
      throw new Error(`Seller with ID ${id} not found`);
    }
    
    // When approving, clear the rejected flag
    // When rejecting, set the rejected flag and clear approved
    const [updatedSeller] = await db
      .update(users)
      .set({
        approved: status,
        rejected: isRejected
      })
      .where(eq(users.id, id))
      .returning();
      
    return updatedSeller;
  }

  async getProducts(category?: string, sellerId?: number, approved?: boolean): Promise<Product[]> {
    try {
      console.log('Getting products with filters:', { category, sellerId, approved });
      
      // Use SQL query for more flexibility with filtering
      let query = `
        SELECT * FROM products 
        WHERE 1=1
      `;
      const params: any[] = [];
      
      // Add category filter (case-insensitive)
      if (category) {
        query += ` AND LOWER(category) = LOWER($${params.length + 1})`;
        params.push(category);
      }
      
      // Add seller filter - NOTE: Use snake_case for database column names
      if (sellerId !== undefined) {
        query += ` AND seller_id = $${params.length + 1}`;
        params.push(sellerId);
      }
      
      // Add approved filter
      if (approved !== undefined) {
        query += ` AND approved = $${params.length + 1}`;
        params.push(approved);
      }
      
      console.log('Executing SQL query:', query, 'with params:', params);
      
      // Execute the query
      const { rows } = await pool.query(query, params);
      console.log(`Found ${rows.length} products`);
      return rows;
    } catch (error) {
      console.error("Error in getProducts:", error);
      return [];
    }
  }
  
  async getProductsCount(category?: string, sellerId?: number, approved?: boolean): Promise<number> {
    try {
      // Use SQL query for counting with filters
      let query = `
        SELECT COUNT(*) as count FROM products 
        WHERE 1=1
      `;
      const params: any[] = [];
      
      // Add category filter (case-insensitive)
      if (category) {
        query += ` AND LOWER(category) = LOWER($${params.length + 1})`;
        params.push(category);
      }
      
      // Add seller filter - NOTE: Use snake_case for database column names
      if (sellerId !== undefined) {
        query += ` AND seller_id = $${params.length + 1}`;
        params.push(sellerId);
      }
      
      // Add approved filter
      if (approved !== undefined) {
        query += ` AND approved = $${params.length + 1}`;
        params.push(approved);
      }
      
      // Execute the query
      const { rows } = await pool.query(query, params);
      return parseInt(rows[0].count || '0');
    } catch (error) {
      console.error("Error in getProductsCount:", error);
      return 0;
    }
  }
  
  async getProductsPaginated(
    category?: string, 
    sellerId?: number, 
    approved?: boolean, 
    offset: number = 0, 
    limit: number = 12
  ): Promise<Product[]> {
    try {
      // Use SQL query for pagination with filters
      let query = `
        SELECT * FROM products 
        WHERE 1=1
      `;
      const params: any[] = [];
      
      // Add category filter (case-insensitive)
      if (category) {
        query += ` AND LOWER(category) = LOWER($${params.length + 1})`;
        params.push(category);
      }
      
      // Add seller filter - NOTE: Use snake_case for database column names
      if (sellerId !== undefined) {
        query += ` AND seller_id = $${params.length + 1}`;
        params.push(sellerId);
      }
      
      // Add approved filter
      if (approved !== undefined) {
        query += ` AND approved = $${params.length + 1}`;
        params.push(approved);
      }
      
      // Add pagination
      query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      console.log('Executing paginated SQL query:', query, 'with params:', params);
      
      // Execute the query
      const { rows } = await pool.query(query, params);
      console.log(`Found ${rows.length} products (paginated)`);
      return rows;
    } catch (error) {
      console.error("Error in getProductsPaginated:", error);
      return [];
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    // Changed default to TRUE so products appear instantly without requiring admin approval
    const productToInsert = {
      ...insertProduct,
      approved: insertProduct.approved ?? true
    };
    
    console.log('Creating product with auto-approval:', productToInsert);
    
    const [product] = await db
      .insert(products)
      .values(productToInsert)
      .returning();
    
    return product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    
    if (!updatedProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    return updatedProduct;
  }
  
  // Get products that are pending approval (where approved=false)
  async getPendingProducts(): Promise<Product[]> {
    try {
      console.log('Getting pending products');
      const result = await db
        .select()
        .from(products)
        .where(eq(products.approved, false))
        .orderBy(desc(products.createdAt));
      
      console.log(`Found ${result.length} pending products`);
      return result;
    } catch (error) {
      console.error("Error in getPendingProducts:", error);
      return [];
    }
  }
  
  // Approve a product
  async approveProduct(id: number): Promise<Product> {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set({ 
          approved: true,
          rejected: false,
          rejectionReason: null
        })
        .where(eq(products.id, id))
        .returning();
      
      if (!updatedProduct) {
        throw new Error(`Product with ID ${id} not found`);
      }
      
      return updatedProduct;
    } catch (error) {
      console.error(`Error approving product ${id}:`, error);
      throw error;
    }
  }
  
  // Reject a product with optional reason
  async rejectProduct(id: number, rejectionReason?: string): Promise<Product> {
    try {
      // Now we mark it as rejected and store the reason if provided
      const [updatedProduct] = await db
        .update(products)
        .set({ 
          approved: false, 
          rejected: true,
          rejectionReason: rejectionReason || null
        })
        .where(eq(products.id, id))
        .returning();
      
      if (!updatedProduct) {
        throw new Error(`Product with ID ${id} not found`);
      }
      
      return updatedProduct;
    } catch (error) {
      console.error(`Error rejecting product ${id}:`, error);
      throw error;
    }
  }

  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    try {
      console.log('Searching products with query:', query);
      
      // Use SQL for flexible full-text search with ILIKE for case-insensitive search
      const searchQuery = `
        SELECT * FROM products 
        WHERE 
          name ILIKE $1 OR 
          description ILIKE $1 OR 
          category ILIKE $1 
        LIMIT $2
      `;
      
      const params = [`%${query}%`, limit];
      console.log('Executing search query:', searchQuery, 'with params:', params);
      
      // Execute the query
      const { rows } = await pool.query(searchQuery, params);
      console.log(`Found ${rows.length} products in search`);
      
      return rows;
    } catch (error) {
      console.error("Error in searchProducts:", error);
      return [];
    }
  }

  async deleteProduct(id: number): Promise<void> {
    const result = await db.delete(products).where(eq(products.id, id));
    
    if (!result) {
      throw new Error(`Product with ID ${id} not found`);
    }
  }

  async getCartItems(userId: number): Promise<{id: number, quantity: number, product: Product, userId: number}[]> {
    const cartWithProducts = await db
      .select({
        id: carts.id,
        quantity: carts.quantity,
        userId: carts.userId,
        product: products
      })
      .from(carts)
      .where(eq(carts.userId, userId))
      .innerJoin(products, eq(carts.productId, products.id));
    
    return cartWithProducts.map(item => ({
      id: item.id,
      quantity: item.quantity,
      userId: item.userId,
      product: item.product
    }));
  }

  async getCartItem(id: number): Promise<Cart | undefined> {
    const [cartItem] = await db.select().from(carts).where(eq(carts.id, id));
    return cartItem;
  }

  async addToCart(insertCart: InsertCart): Promise<Cart> {
    // First check if product already exists in cart
    const [existingCartItem] = await db
      .select()
      .from(carts)
      .where(
        and(
          eq(carts.userId, insertCart.userId),
          eq(carts.productId, insertCart.productId)
        )
      );
    
    // If exists, update quantity
    if (existingCartItem) {
      const [updatedCartItem] = await db
        .update(carts)
        .set({
          quantity: existingCartItem.quantity + insertCart.quantity
        })
        .where(eq(carts.id, existingCartItem.id))
        .returning();
      
      return updatedCartItem;
    }
    
    // Otherwise insert new cart item
    const [cartItem] = await db
      .insert(carts)
      .values(insertCart)
      .returning();
    
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<Cart> {
    const [updatedCartItem] = await db
      .update(carts)
      .set({ quantity })
      .where(eq(carts.id, id))
      .returning();
    
    if (!updatedCartItem) {
      throw new Error(`Cart item with ID ${id} not found`);
    }
    
    return updatedCartItem;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(carts).where(eq(carts.id, id));
  }

  async clearCart(userId: number): Promise<void> {
    await db.delete(carts).where(eq(carts.userId, userId));
  }

  async getOrders(userId?: number, sellerId?: number): Promise<Order[]> {
    let orderResults: Order[];
    
    if (userId) {
      orderResults = await db.select().from(orders).where(eq(orders.userId, userId));
    } else if (sellerId) {
      // This is more complex as we need to join with orderItems and products
      const sellerOrders = await db
        .select({ order: orders })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(products.sellerId, sellerId))
        .groupBy(orders.id);
      
      orderResults = sellerOrders.map(item => item.order);
    } else {
      orderResults = await db.select().from(orders);
    }
    
    // Parse shipping details for each order
    return orderResults.map(order => {
      if (order.shippingDetails && typeof order.shippingDetails === 'string') {
        try {
          order.shippingDetails = JSON.parse(order.shippingDetails);
        } catch (error) {
          console.error('Error parsing shippingDetails:', error);
        }
      }
      return order;
    });
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;
    
    // Parse shippingDetails from string to object if it exists
    if (order.shippingDetails && typeof order.shippingDetails === 'string') {
      try {
        order.shippingDetails = JSON.parse(order.shippingDetails);
      } catch (error) {
        console.error('Error parsing shippingDetails:', error);
      }
    }
    
    return order;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Handle shippingDetails - convert to string if provided as an object
    const orderToInsert = {
      ...insertOrder,
      status: insertOrder.status || "pending",
      date: insertOrder.date || new Date().toISOString()
    };
    
    // Convert shippingDetails to JSON string if it exists
    if (orderToInsert.shippingDetails && typeof orderToInsert.shippingDetails === 'object') {
      orderToInsert.shippingDetails = JSON.stringify(orderToInsert.shippingDetails);
    }
    
    // Add console logging for debugging
    console.log("Creating order with data:", orderToInsert);
    
    // Create a properly typed order object as an array with a single item
    const orderData = [{
      userId: orderToInsert.userId,
      status: orderToInsert.status,
      total: orderToInsert.total,
      date: typeof orderToInsert.date === 'string' ? new Date(orderToInsert.date) : orderToInsert.date,
      shippingDetails: orderToInsert.shippingDetails,
      paymentMethod: orderToInsert.paymentMethod || 'cod'
    }];
    
    const [order] = await db
      .insert(orders)
      .values(orderData)
      .returning();
    
    // Parse shippingDetails from string to object if it exists
    if (order.shippingDetails && typeof order.shippingDetails === 'string') {
      try {
        order.shippingDetails = JSON.parse(order.shippingDetails);
      } catch (error) {
        console.error('Error parsing shippingDetails:', error);
      }
    }
    
    return order;
  }

  async getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]> {
    const orderItemsWithProducts = await db
      .select({
        orderItem: orderItems,
        product: products
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .innerJoin(products, eq(orderItems.productId, products.id));
    
    return orderItemsWithProducts.map(item => ({
      ...item.orderItem,
      product: item.product
    }));
  }

  async createOrderItem(insertOrderItem: any): Promise<OrderItem> {
    console.log("Creating order item:", insertOrderItem);
    
    // Insert as an array with a single element to fix typing issues
    const [orderItem] = await db
      .insert(orderItems)
      .values([{
        orderId: insertOrderItem.orderId,
        productId: insertOrderItem.productId,
        quantity: insertOrderItem.quantity,
        price: insertOrderItem.price
      }])
      .returning();
    
    return orderItem;
  }

  async orderHasSellerProducts(orderId: number, sellerId: number): Promise<boolean> {
    const result = await db
      .select({ count: products.id })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orderItems.orderId, orderId),
          eq(products.sellerId, sellerId)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    
    if (!updatedOrder) {
      throw new Error(`Order with ID ${id} not found`);
    }
    
    // Parse shippingDetails if it's a string
    if (updatedOrder.shippingDetails && typeof updatedOrder.shippingDetails === 'string') {
      try {
        updatedOrder.shippingDetails = JSON.parse(updatedOrder.shippingDetails);
      } catch (error) {
        console.error('Error parsing shippingDetails:', error);
      }
    }
    
    return updatedOrder;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.displayOrder);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category> {
    // Always update the updatedAt timestamp
    const dataToUpdate = {
      ...categoryData,
      updatedAt: new Date()
    };

    const [updatedCategory] = await db
      .update(categories)
      .set(dataToUpdate)
      .where(eq(categories.id, id))
      .returning();
    
    if (!updatedCategory) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    
    if (!result) {
      throw new Error(`Category with ID ${id} not found`);
    }
  }

  // Review operations
  async getProductReviews(productId: number): Promise<(Review & { user: User, images?: ReviewImage[] })[]> {
    const reviewsWithUsers = await db
      .select({
        review: reviews,
        user: users
      })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .innerJoin(users, eq(reviews.userId, users.id))
      .orderBy(reviews.createdAt, 'desc'); // Latest reviews first
    
    // Get review images for each review
    const reviewsWithUsersAndImages = await Promise.all(
      reviewsWithUsers.map(async ({ review, user }) => {
        const images = await db
          .select()
          .from(reviewImages)
          .where(eq(reviewImages.reviewId, review.id));
        
        return {
          ...review,
          user,
          images: images.length > 0 ? images : undefined
        };
      })
    );
    
    return reviewsWithUsersAndImages;
  }
  
  async getUserReviews(userId: number): Promise<(Review & { product: Product, images?: ReviewImage[] })[]> {
    const reviewsWithProducts = await db
      .select({
        review: reviews,
        product: products
      })
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .innerJoin(products, eq(reviews.productId, products.id))
      .orderBy(reviews.createdAt, 'desc'); // Latest reviews first
    
    // Get review images for each review
    const reviewsWithProductsAndImages = await Promise.all(
      reviewsWithProducts.map(async ({ review, product }) => {
        const images = await db
          .select()
          .from(reviewImages)
          .where(eq(reviewImages.reviewId, review.id));
        
        return {
          ...review,
          product,
          images: images.length > 0 ? images : undefined
        };
      })
    );
    
    return reviewsWithProductsAndImages;
  }
  
  async getReview(id: number): Promise<(Review & { user: User, product: Product, images?: ReviewImage[] }) | undefined> {
    const [result] = await db
      .select({
        review: reviews,
        user: users,
        product: products
      })
      .from(reviews)
      .where(eq(reviews.id, id))
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(products, eq(reviews.productId, products.id));
    
    if (!result) return undefined;
    
    // Get review images
    const images = await db
      .select()
      .from(reviewImages)
      .where(eq(reviewImages.reviewId, id));
    
    return {
      ...result.review,
      user: result.user,
      product: result.product,
      images: images.length > 0 ? images : undefined
    };
  }
  
  async createReview(insertReview: InsertReview): Promise<Review> {
    // Check if user has already reviewed this product
    const existingReview = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, insertReview.userId),
          eq(reviews.productId, insertReview.productId)
        )
      );
    
    if (existingReview.length > 0) {
      throw new Error('You have already reviewed this product');
    }
    
    // If orderId is provided, verify that the user actually purchased the product
    if (insertReview.orderId) {
      const hasOrderItem = await db
        .select()
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, insertReview.orderId),
            eq(orderItems.productId, insertReview.productId)
          )
        );
      
      if (hasOrderItem.length > 0) {
        // Mark as verified purchase
        insertReview.verifiedPurchase = true;
      }
    }
    
    // Set timestamps
    const now = new Date();
    const reviewData = {
      ...insertReview,
      createdAt: now,
      updatedAt: now
    };
    
    const [review] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
    
    return review;
  }
  
  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review> {
    // Always update the updatedAt timestamp
    const dataToUpdate = {
      ...reviewData,
      updatedAt: new Date()
    };
    
    const [updatedReview] = await db
      .update(reviews)
      .set(dataToUpdate)
      .where(eq(reviews.id, id))
      .returning();
    
    if (!updatedReview) {
      throw new Error(`Review with ID ${id} not found`);
    }
    
    return updatedReview;
  }
  
  async deleteReview(id: number): Promise<void> {
    // First delete all associated images
    await db.delete(reviewImages).where(eq(reviewImages.reviewId, id));
    
    // Delete all helpful votes for this review
    await db.delete(reviewHelpful).where(eq(reviewHelpful.reviewId, id));
    
    // Then delete the review
    const result = await db.delete(reviews).where(eq(reviews.id, id));
    
    if (!result) {
      throw new Error(`Review with ID ${id} not found`);
    }
  }
  
  // Review Image operations
  async addReviewImage(insertReviewImage: InsertReviewImage): Promise<ReviewImage> {
    const [reviewImage] = await db
      .insert(reviewImages)
      .values(insertReviewImage)
      .returning();
    
    return reviewImage;
  }
  
  async deleteReviewImage(id: number): Promise<void> {
    await db.delete(reviewImages).where(eq(reviewImages.id, id));
  }
  
  // Review Helpful operations
  async markReviewHelpful(reviewId: number, userId: number): Promise<ReviewHelpful> {
    // Check if user has already marked this review as helpful
    const [existingVote] = await db
      .select()
      .from(reviewHelpful)
      .where(
        and(
          eq(reviewHelpful.reviewId, reviewId),
          eq(reviewHelpful.userId, userId)
        )
      );
    
    if (existingVote) {
      return existingVote; // User already marked this as helpful
    }
    
    // Create new helpful vote
    const [helpfulVote] = await db
      .insert(reviewHelpful)
      .values({
        reviewId,
        userId,
        createdAt: new Date()
      })
      .returning();
    
    // Update the helpfulCount in the review
    await db
      .update(reviews)
      .set({
        helpfulCount: (row) => `${row.helpfulCount} + 1`
      })
      .where(eq(reviews.id, reviewId));
    
    return helpfulVote;
  }
  
  async unmarkReviewHelpful(reviewId: number, userId: number): Promise<void> {
    // Delete the helpful vote
    await db
      .delete(reviewHelpful)
      .where(
        and(
          eq(reviewHelpful.reviewId, reviewId),
          eq(reviewHelpful.userId, userId)
        )
      );
    
    // Update the helpfulCount in the review (ensure it doesn't go below 0)
    await db
      .update(reviews)
      .set({
        helpfulCount: (row) => `GREATEST(${row.helpfulCount} - 1, 0)`
      })
      .where(eq(reviews.id, reviewId));
  }
  
  async isReviewHelpfulByUser(reviewId: number, userId: number): Promise<boolean> {
    const [helpfulVote] = await db
      .select()
      .from(reviewHelpful)
      .where(
        and(
          eq(reviewHelpful.reviewId, reviewId),
          eq(reviewHelpful.userId, userId)
        )
      );
    
    return !!helpfulVote;
  }
  
  // Product Rating Summary
  async getProductRatingSummary(productId: number): Promise<{
    averageRating: number,
    totalReviews: number,
    ratingCounts: { rating: number, count: number }[]
  }> {
    // Get all ratings for this product
    const productReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId));
    
    if (productReviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: [
          { rating: 5, count: 0 },
          { rating: 4, count: 0 },
          { rating: 3, count: 0 },
          { rating: 2, count: 0 },
          { rating: 1, count: 0 }
        ]
      };
    }
    
    // Calculate average rating
    const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / productReviews.length;
    
    // Count reviews for each rating
    const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: productReviews.filter(review => review.rating === rating).length
    }));
    
    return {
      averageRating,
      totalReviews: productReviews.length,
      ratingCounts
    };
  }
  
  // Check if user purchased product (for verified review status)
  async hasUserPurchasedProduct(userId: number, productId: number): Promise<boolean> {
    // Check if there's an order item with this product for any of the user's orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));
    
    if (userOrders.length === 0) return false;
    
    // Check if any of these orders contain the product
    for (const order of userOrders) {
      const orderItem = await db
        .select()
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, order.id),
            eq(orderItems.productId, productId)
          )
        );
      
      if (orderItem.length > 0) return true;
    }
    
    return false;
  }

  // Smart Inventory & Price Management Features

  // Sales History
  async getSalesHistory(productId: number, sellerId: number): Promise<SalesHistory[]> {
    try {
      return db
        .select()
        .from(salesHistory)
        .where(
          and(
            eq(salesHistory.productId, productId),
            eq(salesHistory.sellerId, sellerId)
          )
        )
        .orderBy(desc(salesHistory.date));
    } catch (error) {
      console.error('Error fetching sales history:', error);
      return [];
    }
  }

  async createSalesRecord(salesData: InsertSalesHistory): Promise<SalesHistory> {
    try {
      const [newRecord] = await db
        .insert(salesHistory)
        .values(salesData)
        .returning();
      return newRecord;
    } catch (error) {
      console.error('Error creating sales record:', error);
      throw error;
    }
  }

  // Demand Forecasts
  async getDemandForecasts(productId: number, sellerId: number): Promise<DemandForecast[]> {
    try {
      return db
        .select()
        .from(demandForecasts)
        .where(
          and(
            eq(demandForecasts.productId, productId),
            eq(demandForecasts.sellerId, sellerId)
          )
        )
        .orderBy(desc(demandForecasts.createdAt));
    } catch (error) {
      console.error('Error fetching demand forecasts:', error);
      return [];
    }
  }

  async getDemandForecast(id: number): Promise<DemandForecast | undefined> {
    try {
      const [forecast] = await db
        .select()
        .from(demandForecasts)
        .where(eq(demandForecasts.id, id));
      return forecast;
    } catch (error) {
      console.error('Error fetching demand forecast:', error);
      return undefined;
    }
  }

  async createDemandForecast(forecastData: InsertDemandForecast): Promise<DemandForecast> {
    try {
      const [newForecast] = await db
        .insert(demandForecasts)
        .values(forecastData)
        .returning();
      return newForecast;
    } catch (error) {
      console.error('Error creating demand forecast:', error);
      throw error;
    }
  }

  // Price Optimizations
  async getPriceOptimizations(productId: number, sellerId: number): Promise<PriceOptimization[]> {
    try {
      return db
        .select()
        .from(priceOptimizations)
        .where(
          and(
            eq(priceOptimizations.productId, productId),
            eq(priceOptimizations.sellerId, sellerId)
          )
        )
        .orderBy(desc(priceOptimizations.createdAt));
    } catch (error) {
      console.error('Error fetching price optimizations:', error);
      return [];
    }
  }

  async getPriceOptimization(id: number): Promise<PriceOptimization | undefined> {
    try {
      const [optimization] = await db
        .select()
        .from(priceOptimizations)
        .where(eq(priceOptimizations.id, id));
      return optimization;
    } catch (error) {
      console.error('Error fetching price optimization:', error);
      return undefined;
    }
  }

  async createPriceOptimization(optimizationData: InsertPriceOptimization): Promise<PriceOptimization> {
    try {
      const [newOptimization] = await db
        .insert(priceOptimizations)
        .values(optimizationData)
        .returning();
      return newOptimization;
    } catch (error) {
      console.error('Error creating price optimization:', error);
      throw error;
    }
  }

  async updatePriceOptimizationStatus(id: number, status: string, sellerId: number): Promise<PriceOptimization> {
    try {
      // First, verify seller owns this optimization
      const [existingOptimization] = await db
        .select()
        .from(priceOptimizations)
        .where(
          and(
            eq(priceOptimizations.id, id),
            eq(priceOptimizations.sellerId, sellerId)
          )
        );

      if (!existingOptimization) {
        throw new Error("Price optimization not found or not authorized");
      }

      // Update status
      const [updatedOptimization] = await db
        .update(priceOptimizations)
        .set({
          status,
          appliedAt: status === "applied" ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(priceOptimizations.id, id))
        .returning();

      return updatedOptimization;
    } catch (error) {
      console.error('Error updating price optimization status:', error);
      throw error;
    }
  }

  async applyPriceOptimization(id: number, sellerId: number): Promise<Product> {
    try {
      // First, verify and get the optimization
      const [optimization] = await db
        .select()
        .from(priceOptimizations)
        .where(
          and(
            eq(priceOptimizations.id, id),
            eq(priceOptimizations.sellerId, sellerId)
          )
        );

      if (!optimization) {
        throw new Error("Price optimization not found or not authorized");
      }

      // Update product price with the suggested price
      const [updatedProduct] = await db
        .update(products)
        .set({ price: optimization.suggestedPrice })
        .where(eq(products.id, optimization.productId))
        .returning();

      // Update optimization status to "applied"
      await db
        .update(priceOptimizations)
        .set({
          status: "applied",
          appliedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(priceOptimizations.id, id));

      return updatedProduct;
    } catch (error) {
      console.error('Error applying price optimization:', error);
      throw error;
    }
  }

  // Inventory Optimizations
  async getInventoryOptimizations(productId: number, sellerId: number): Promise<InventoryOptimization[]> {
    try {
      return db
        .select()
        .from(inventoryOptimizations)
        .where(
          and(
            eq(inventoryOptimizations.productId, productId),
            eq(inventoryOptimizations.sellerId, sellerId)
          )
        )
        .orderBy(desc(inventoryOptimizations.createdAt));
    } catch (error) {
      console.error('Error fetching inventory optimizations:', error);
      return [];
    }
  }

  async getInventoryOptimization(id: number): Promise<InventoryOptimization | undefined> {
    try {
      const [optimization] = await db
        .select()
        .from(inventoryOptimizations)
        .where(eq(inventoryOptimizations.id, id));
      return optimization;
    } catch (error) {
      console.error('Error fetching inventory optimization:', error);
      return undefined;
    }
  }

  async createInventoryOptimization(optimizationData: InsertInventoryOptimization): Promise<InventoryOptimization> {
    try {
      const [newOptimization] = await db
        .insert(inventoryOptimizations)
        .values(optimizationData)
        .returning();
      return newOptimization;
    } catch (error) {
      console.error('Error creating inventory optimization:', error);
      throw error;
    }
  }

  async updateInventoryOptimizationStatus(id: number, status: string, sellerId: number): Promise<InventoryOptimization> {
    try {
      // First, verify seller owns this optimization
      const [existingOptimization] = await db
        .select()
        .from(inventoryOptimizations)
        .where(
          and(
            eq(inventoryOptimizations.id, id),
            eq(inventoryOptimizations.sellerId, sellerId)
          )
        );

      if (!existingOptimization) {
        throw new Error("Inventory optimization not found or not authorized");
      }

      // Update status
      const [updatedOptimization] = await db
        .update(inventoryOptimizations)
        .set({
          status,
          appliedAt: status === "applied" ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(inventoryOptimizations.id, id))
        .returning();

      return updatedOptimization;
    } catch (error) {
      console.error('Error updating inventory optimization status:', error);
      throw error;
    }
  }

  async applyInventoryOptimization(id: number, sellerId: number): Promise<Product> {
    try {
      // First, verify and get the optimization
      const [optimization] = await db
        .select()
        .from(inventoryOptimizations)
        .where(
          and(
            eq(inventoryOptimizations.id, id),
            eq(inventoryOptimizations.sellerId, sellerId)
          )
        );

      if (!optimization) {
        throw new Error("Inventory optimization not found or not authorized");
      }

      // Update product stock with the recommended stock
      const [updatedProduct] = await db
        .update(products)
        .set({ stock: optimization.recommendedStock })
        .where(eq(products.id, optimization.productId))
        .returning();

      // Update optimization status to "applied"
      await db
        .update(inventoryOptimizations)
        .set({
          status: "applied",
          appliedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(inventoryOptimizations.id, id));

      return updatedProduct;
    } catch (error) {
      console.error('Error applying inventory optimization:', error);
      throw error;
    }
  }

  // AI Generated Content
  async getAIGeneratedContents(productId: number, sellerId: number, contentType?: string): Promise<AIGeneratedContent[]> {
    try {
      let query = db
        .select()
        .from(aiGeneratedContent)
        .where(
          and(
            eq(aiGeneratedContent.productId, productId),
            eq(aiGeneratedContent.sellerId, sellerId)
          )
        );

      // Add content type filter if provided
      if (contentType) {
        query = query.where(eq(aiGeneratedContent.contentType, contentType));
      }

      return query.orderBy(desc(aiGeneratedContent.createdAt));
    } catch (error) {
      console.error('Error fetching AI generated contents:', error);
      return [];
    }
  }

  async getAIGeneratedContent(id: number): Promise<AIGeneratedContent | undefined> {
    try {
      const [content] = await db
        .select()
        .from(aiGeneratedContent)
        .where(eq(aiGeneratedContent.id, id));
      return content;
    } catch (error) {
      console.error('Error fetching AI generated content:', error);
      return undefined;
    }
  }

  async createAIGeneratedContent(contentData: InsertAIGeneratedContent): Promise<AIGeneratedContent> {
    try {
      const [newContent] = await db
        .insert(aiGeneratedContent)
        .values(contentData)
        .returning();
      return newContent;
    } catch (error) {
      console.error('Error creating AI generated content:', error);
      throw error;
    }
  }

  async updateAIGeneratedContentStatus(id: number, status: string, sellerId: number): Promise<AIGeneratedContent> {
    try {
      // First, verify seller owns this content
      const [existingContent] = await db
        .select()
        .from(aiGeneratedContent)
        .where(
          and(
            eq(aiGeneratedContent.id, id),
            eq(aiGeneratedContent.sellerId, sellerId)
          )
        );

      if (!existingContent) {
        throw new Error("AI generated content not found or not authorized");
      }

      // Update status
      const [updatedContent] = await db
        .update(aiGeneratedContent)
        .set({
          status,
          appliedAt: status === "applied" ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(aiGeneratedContent.id, id))
        .returning();

      return updatedContent;
    } catch (error) {
      console.error('Error updating AI generated content status:', error);
      throw error;
    }
  }

  async applyAIGeneratedContent(id: number, sellerId: number): Promise<Product> {
    try {
      // First, verify and get the content
      const [content] = await db
        .select()
        .from(aiGeneratedContent)
        .where(
          and(
            eq(aiGeneratedContent.id, id),
            eq(aiGeneratedContent.sellerId, sellerId)
          )
        );

      if (!content) {
        throw new Error("AI generated content not found or not authorized");
      }

      // Prepare update data based on content type
      const updateData: any = {};
      
      switch (content.contentType) {
        case "description":
          updateData.description = content.generatedContent;
          break;
        case "specifications":
          updateData.specifications = content.generatedContent;
          break;
        case "features":
          updateData.features = content.generatedContent;
          break;
        default:
          console.warn(`Unhandled content type: ${content.contentType}`);
      }

      // Update product with the generated content
      const [updatedProduct] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, content.productId))
        .returning();

      // Update content status to "applied"
      await db
        .update(aiGeneratedContent)
        .set({
          status: "applied",
          appliedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(aiGeneratedContent.id, id));

      return updatedProduct;
    } catch (error) {
      console.error('Error applying AI generated content:', error);
      throw error;
    }
  }

  // Wishlist Operations
  async getWishlistItems(userId: number): Promise<{id: number, product: Product, userId: number, dateAdded: Date}[]> {
    try {
      console.log('Getting wishlist items for user:', userId);
      
      const wishlistWithProducts = await db
        .select({
          id: wishlists.id,
          userId: wishlists.userId,
          dateAdded: wishlists.dateAdded,
          product: products
        })
        .from(wishlists)
        .where(eq(wishlists.userId, userId))
        .innerJoin(products, eq(wishlists.productId, products.id));
      
      console.log(`Found ${wishlistWithProducts.length} items in wishlist`);
      
      return wishlistWithProducts.map(item => ({
        id: item.id,
        userId: item.userId,
        dateAdded: item.dateAdded,
        product: item.product
      }));
    } catch (error) {
      console.error("Error in getWishlistItems:", error);
      return [];
    }
  }

  async addToWishlist(insertWishlist: InsertWishlist): Promise<Wishlist> {
    try {
      console.log('Adding to wishlist:', insertWishlist);
      
      // First check if product already exists in wishlist
      const [existingWishlistItem] = await db
        .select()
        .from(wishlists)
        .where(
          and(
            eq(wishlists.userId, insertWishlist.userId),
            eq(wishlists.productId, insertWishlist.productId)
          )
        );
      
      // If it already exists, just return it
      if (existingWishlistItem) {
        console.log('Product already in wishlist');
        return existingWishlistItem;
      }
      
      // Otherwise insert new wishlist item
      const [wishlistItem] = await db
        .insert(wishlists)
        .values(insertWishlist)
        .returning();
      
      console.log('Added item to wishlist:', wishlistItem);
      return wishlistItem;
    } catch (error) {
      console.error("Error in addToWishlist:", error);
      throw error;
    }
  }

  async getWishlistItem(userId: number, productId: number): Promise<Wishlist | undefined> {
    try {
      console.log('Getting wishlist item:', { userId, productId });
      
      const [wishlistItem] = await db
        .select()
        .from(wishlists)
        .where(
          and(
            eq(wishlists.userId, userId),
            eq(wishlists.productId, productId)
          )
        );
      
      return wishlistItem;
    } catch (error) {
      console.error("Error in getWishlistItem:", error);
      throw error;
    }
  }

  async removeFromWishlist(userId: number, productId: number): Promise<void> {
    try {
      console.log('Removing item from wishlist:', { userId, productId });
      await db.delete(wishlists)
        .where(
          and(
            eq(wishlists.userId, userId),
            eq(wishlists.productId, productId)
          )
        );
      console.log('Removed item from wishlist');
    } catch (error) {
      console.error("Error in removeFromWishlist:", error);
      throw error;
    }
  }

  async clearWishlist(userId: number): Promise<void> {
    try {
      console.log('Clearing wishlist for user:', userId);
      await db.delete(wishlists).where(eq(wishlists.userId, userId));
      console.log('Cleared wishlist');
    } catch (error) {
      console.error("Error in clearWishlist:", error);
      throw error;
    }
  }

  async isProductInWishlist(userId: number, productId: number): Promise<boolean> {
    try {
      console.log('Checking if product is in wishlist:', { userId, productId });
      
      const [existingWishlistItem] = await db
        .select()
        .from(wishlists)
        .where(
          and(
            eq(wishlists.userId, userId),
            eq(wishlists.productId, productId)
          )
        );
      
      const result = !!existingWishlistItem;
      console.log('Product in wishlist:', result);
      return result;
    } catch (error) {
      console.error("Error in isProductInWishlist:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();