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
  userAddresses, UserAddress, InsertUserAddress,
  salesHistory, SalesHistory, InsertSalesHistory,
  demandForecasts, DemandForecast, InsertDemandForecast,
  priceOptimizations, PriceOptimization, InsertPriceOptimization,
  inventoryOptimizations, InventoryOptimization, InsertInventoryOptimization,
  aiGeneratedContent, AIGeneratedContent, InsertAIGeneratedContent,
  sellerDocuments, SellerDocument, InsertSellerDocument,
  businessDetails, BusinessDetails, InsertBusinessDetails,
  bankingInformation, BankingInformation, InsertBankingInformation,
  banners, Banner, InsertBanner,
  footerContent, FooterContent, InsertFooterContent
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { and, eq, desc } from "drizzle-orm";
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
  deleteUser(id: number): Promise<void>;
  getSellers(approved?: boolean, rejected?: boolean): Promise<User[]>;
  getPendingSellers(): Promise<User[]>;
  getApprovedSellers(): Promise<User[]>;
  getRejectedSellers(): Promise<User[]>;
  updateSellerApproval(id: number, approved: boolean, rejected?: boolean): Promise<User>;
  updateSellerProfile(id: number, profileData: Partial<User>): Promise<User>;
  
  // Co-Admin Management
  getCoAdmins(): Promise<User[]>;
  getCoAdminById(id: number): Promise<User | undefined>;
  updateCoAdminPermissions(id: number, permissions: any): Promise<User | undefined>;
  deleteCoAdmin(id: number): Promise<void>;
  
  // Seller Document operations
  getSellerDocuments(sellerId: number): Promise<SellerDocument[]>;
  getSellerDocumentById(id: number): Promise<SellerDocument | undefined>;
  createSellerDocument(document: InsertSellerDocument): Promise<SellerDocument>;
  updateSellerDocument(id: number, verified: boolean): Promise<SellerDocument>;
  deleteSellerDocument(id: number): Promise<void>;
  
  // Business Details operations
  getBusinessDetails(sellerId: number): Promise<BusinessDetails | undefined>;
  createBusinessDetails(details: InsertBusinessDetails): Promise<BusinessDetails>;
  updateBusinessDetails(sellerId: number, details: Partial<BusinessDetails>): Promise<BusinessDetails>;
  
  // Banking Information operations
  getBankingInformation(sellerId: number): Promise<BankingInformation | undefined>;
  createBankingInformation(info: InsertBankingInformation): Promise<BankingInformation>;
  updateBankingInformation(sellerId: number, info: Partial<BankingInformation>): Promise<BankingInformation>;
  // User Address operations
  getUserAddresses(userId: number): Promise<UserAddress[]>;
  getUserAddressById(id: number): Promise<UserAddress | undefined>;
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(id: number, address: Partial<UserAddress>): Promise<UserAddress>;
  deleteUserAddress(id: number): Promise<void>;
  setDefaultAddress(userId: number, addressId: number): Promise<void>;
  getDefaultAddress(userId: number): Promise<UserAddress | undefined>;

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
  
  // Banner operations
  getBanners(active?: boolean): Promise<Banner[]>;
  getBanner(id: number): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<Banner>): Promise<Banner>;
  deleteBanner(id: number): Promise<void>;
  updateBannerPosition(id: number, position: number): Promise<Banner>;
  toggleBannerActive(id: number): Promise<Banner>;
  
  // Footer Content operations
  getFooterContents(section?: string, isActive?: boolean): Promise<FooterContent[]>;
  getFooterContentById(id: number): Promise<FooterContent | undefined>;
  createFooterContent(content: InsertFooterContent): Promise<FooterContent>;
  updateFooterContent(id: number, content: Partial<FooterContent>): Promise<FooterContent>;
  deleteFooterContent(id: number): Promise<void>;
  toggleFooterContentActive(id: number): Promise<FooterContent>;
  updateFooterContentOrder(id: number, order: number): Promise<FooterContent>;
  
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
  
  // Seller Document methods
  async getSellerDocuments(sellerId: number): Promise<SellerDocument[]> {
    try {
      return await db.select()
        .from(sellerDocuments)
        .where(eq(sellerDocuments.sellerId, sellerId));
    } catch (error) {
      console.error(`Error getting seller documents for seller ID ${sellerId}:`, error);
      return [];
    }
  }
  
  async getSellerDocumentById(id: number): Promise<SellerDocument | undefined> {
    try {
      const [document] = await db.select()
        .from(sellerDocuments)
        .where(eq(sellerDocuments.id, id));
      return document;
    } catch (error) {
      console.error(`Error getting seller document with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createSellerDocument(document: InsertSellerDocument): Promise<SellerDocument> {
    try {
      const [newDocument] = await db.insert(sellerDocuments)
        .values(document)
        .returning();
      return newDocument;
    } catch (error) {
      console.error("Error creating seller document:", error);
      throw new Error("Failed to create seller document");
    }
  }
  
  async updateSellerDocument(id: number, verified: boolean): Promise<SellerDocument> {
    try {
      const [document] = await db.update(sellerDocuments)
        .set({ 
          verified,
          verifiedAt: verified ? new Date() : null 
        })
        .where(eq(sellerDocuments.id, id))
        .returning();
      
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      return document;
    } catch (error) {
      console.error(`Error updating seller document ${id}:`, error);
      throw new Error("Failed to update seller document");
    }
  }
  
  async deleteSellerDocument(id: number): Promise<void> {
    try {
      await db.delete(sellerDocuments)
        .where(eq(sellerDocuments.id, id));
    } catch (error) {
      console.error(`Error deleting seller document ${id}:`, error);
      throw new Error("Failed to delete seller document");
    }
  }
  
  // Business Details methods
  async getBusinessDetails(sellerId: number): Promise<BusinessDetails | undefined> {
    try {
      const [details] = await db.select()
        .from(businessDetails)
        .where(eq(businessDetails.sellerId, sellerId));
      return details;
    } catch (error) {
      console.error(`Error getting business details for seller ID ${sellerId}:`, error);
      return undefined;
    }
  }
  
  async createBusinessDetails(details: InsertBusinessDetails): Promise<BusinessDetails> {
    try {
      const [newDetails] = await db.insert(businessDetails)
        .values(details)
        .returning();
      return newDetails;
    } catch (error) {
      console.error("Error creating business details:", error);
      throw new Error("Failed to create business details");
    }
  }
  
  async updateBusinessDetails(sellerId: number, details: Partial<BusinessDetails>): Promise<BusinessDetails> {
    try {
      // Check if business details exist for this seller
      const existingDetails = await this.getBusinessDetails(sellerId);
      
      if (existingDetails) {
        // Update existing details
        const [updatedDetails] = await db.update(businessDetails)
          .set({
            ...details,
            updatedAt: new Date()
          })
          .where(eq(businessDetails.sellerId, sellerId))
          .returning();
        
        return updatedDetails;
      } else {
        // Create new business details
        return await this.createBusinessDetails({
          sellerId,
          businessName: details.businessName || "Default Business Name", // Required field
          gstNumber: details.gstNumber,
          panNumber: details.panNumber,
          businessType: details.businessType,
          taxRegistrationDate: details.taxRegistrationDate,
          taxFilingStatus: details.taxFilingStatus
        });
      }
    } catch (error) {
      console.error(`Error updating business details for seller ID ${sellerId}:`, error);
      throw new Error("Failed to update business details");
    }
  }
  
  // Banking Information methods
  async getBankingInformation(sellerId: number): Promise<BankingInformation | undefined> {
    try {
      const [info] = await db.select()
        .from(bankingInformation)
        .where(eq(bankingInformation.sellerId, sellerId));
      return info;
    } catch (error) {
      console.error(`Error getting banking information for seller ID ${sellerId}:`, error);
      return undefined;
    }
  }
  
  async createBankingInformation(info: InsertBankingInformation): Promise<BankingInformation> {
    try {
      const [newInfo] = await db.insert(bankingInformation)
        .values(info)
        .returning();
      return newInfo;
    } catch (error) {
      console.error("Error creating banking information:", error);
      throw new Error("Failed to create banking information");
    }
  }
  
  async updateBankingInformation(sellerId: number, info: Partial<BankingInformation>): Promise<BankingInformation> {
    try {
      // Check if banking information exists for this seller
      const existingInfo = await this.getBankingInformation(sellerId);
      
      if (existingInfo) {
        // Update existing information
        const [updatedInfo] = await db.update(bankingInformation)
          .set({
            ...info,
            updatedAt: new Date()
          })
          .where(eq(bankingInformation.sellerId, sellerId))
          .returning();
        
        return updatedInfo;
      } else {
        // Create new banking information
        return await this.createBankingInformation({
          sellerId,
          accountHolderName: info.accountHolderName || "Account Holder", // Required field
          accountNumber: info.accountNumber || "0000000000000", // Required field
          bankName: info.bankName || "Bank Name", // Required field
          ifscCode: info.ifscCode || "XXXX0000000" // Required field
        });
      }
    } catch (error) {
      console.error(`Error updating banking information for seller ID ${sellerId}:`, error);
      throw new Error("Failed to update banking information");
    }
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
  
  async deleteUser(id: number): Promise<void> {
    try {
      // Check for special admin user that cannot be deleted
      const user = await this.getUser(id);
      
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      // Special admin with email kaushlendra.k12@fms.edu cannot be deleted
      if (user.email === 'kaushlendra.k12@fms.edu') {
        throw new Error('This is a special admin user that cannot be deleted');
      }
      
      // Helper function to safely delete records from a table
      const safeDelete = async (tableName: string, action: () => Promise<any>) => {
        try {
          await action();
        } catch (error) {
          // If the table doesn't exist, log it but continue
          if ((error as any).code === '42P01') {
            console.log(`Table ${tableName} doesn't exist, skipping deletion`);
          } else {
            // For other errors, log but continue with the deletion process
            console.error(`Error deleting from ${tableName}:`, error);
          }
        }
      };
      
      // Handle foreign key constraints by checking if tables exist and then deleting records
      try {
        // First, directly check if products table exists and if user has products
        const productQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'products'
          ) as exists
        `;
        const { rows: tableExists } = await pool.query(productQuery);
        
        if (tableExists[0].exists) {
          // If products table exists, check if user has products
          const { rows: productCount } = await pool.query(
            `SELECT COUNT(*) FROM products WHERE seller_id = $1`, 
            [id]
          );
          
          if (parseInt(productCount[0].count) > 0) {
            // User has products - we need to handle this first
            await pool.query(
              `DELETE FROM products WHERE seller_id = $1`,
              [id]
            );
          }
        }
      } catch (error) {
        console.error("Error checking for products:", error);
        // Continue with deletion anyway
      }
      
      // Try a direct SQL approach for cart deletion to avoid Drizzle issues
      try {
        await pool.query(
          `DELETE FROM carts WHERE user_id = $1`,
          [id]
        );
      } catch (error) {
        // If table doesn't exist, just continue
        console.log("Carts might not exist, skipping cart deletion");
      }
      
      // 3. Delete user's orders and order items
      try {
        // Check if orders table exists
        const { rows: orderExists } = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'orders'
          ) as exists
        `);
        
        if (orderExists[0].exists) {
          // Get all orders for the user
          const { rows: userOrders } = await pool.query(
            `SELECT id FROM orders WHERE user_id = $1`,
            [id]
          );
          
          // Delete order items first if they exist
          const { rows: orderItemsExist } = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'order_items'
            ) as exists
          `);
          
          if (orderItemsExist[0].exists && userOrders.length > 0) {
            for (const order of userOrders) {
              await pool.query(
                `DELETE FROM order_items WHERE order_id = $1`,
                [order.id]
              );
            }
          }
          
          // Then delete the orders
          await pool.query(
            `DELETE FROM orders WHERE user_id = $1`,
            [id]
          );
        }
      } catch (error) {
        console.log('Error handling orders:', error);
      }
      
      // 4. Delete user's reviews and related data - similar approach with direct SQL
      try {
        // Check if reviews table exists
        const { rows: reviewsExist } = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
          ) as exists
        `);
        
        if (reviewsExist[0].exists) {
          // Get all reviews for the user
          const { rows: userReviews } = await pool.query(
            `SELECT id FROM reviews WHERE user_id = $1`,
            [id]
          );
          
          if (userReviews.length > 0) {
            // Check and delete review images if they exist
            try {
              const { rows: imagesExist } = await pool.query(`
                SELECT EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'review_images'
                ) as exists
              `);
              
              if (imagesExist[0].exists) {
                for (const review of userReviews) {
                  await pool.query(
                    `DELETE FROM review_images WHERE review_id = $1`,
                    [review.id]
                  );
                }
              }
            } catch (error) {
              console.log('Review images table might not exist');
            }
            
            // Check and delete review helpful marks if they exist
            try {
              const { rows: helpfulExist } = await pool.query(`
                SELECT EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'review_helpful'
                ) as exists
              `);
              
              if (helpfulExist[0].exists) {
                for (const review of userReviews) {
                  await pool.query(
                    `DELETE FROM review_helpful WHERE review_id = $1`,
                    [review.id]
                  );
                }
              }
            } catch (error) {
              console.log('Review helpful table might not exist');
            }
          }
          
          // Then delete the reviews
          await pool.query(
            `DELETE FROM reviews WHERE user_id = $1`,
            [id]
          );
        }
      } catch (error) {
        console.log('Error handling reviews:', error);
      }
      
      // 5. Delete user's addresses with direct SQL
      try {
        await pool.query(
          `DELETE FROM user_addresses WHERE user_id = $1`,
          [id]
        );
      } catch (error) {
        console.log('User addresses table might not exist');
      }
      
      // 6. Delete seller-specific data if user is a seller
      if (user.role === 'seller') {
        const sellerTables = [
          'sales_history',
          'demand_forecasts',
          'price_optimizations',
          'inventory_optimizations',
          'seller_documents',
          'business_details',
          'banking_information'
        ];
        
        for (const table of sellerTables) {
          try {
            // Check if table exists
            const { rows: tableExists } = await pool.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
              ) as exists
            `, [table]);
            
            if (tableExists[0].exists) {
              await pool.query(
                `DELETE FROM ${table} WHERE seller_id = $1`,
                [id]
              );
            }
          } catch (error) {
            console.log(`${table} might not exist or can't be deleted`);
          }
        }
      }
      
      // 7. Delete AI-generated content with direct SQL
      try {
        await pool.query(
          `DELETE FROM ai_generated_content WHERE user_id = $1`,
          [id]
        );
      } catch (error) {
        console.log('AI-generated content table might not exist');
      }
      
      // Finally, delete the user
      await pool.query(
        `DELETE FROM users WHERE id = $1`,
        [id]
      );
      
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw new Error(`Failed to delete user: ${(error as Error).message}`);
    }
  }
  
  // Co-Admin Management Methods
  async getCoAdmins(): Promise<User[]> {
    try {
      const coAdmins = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.role, 'admin'),
            eq(users.isCoAdmin, true)
          )
        );
      
      return coAdmins;
    } catch (error) {
      console.error('Error fetching co-admins:', error);
      return [];
    }
  }
  
  async getCoAdminById(id: number): Promise<User | undefined> {
    try {
      const [coAdmin] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, id),
            eq(users.role, 'admin'),
            eq(users.isCoAdmin, true)
          )
        );
      
      return coAdmin;
    } catch (error) {
      console.error(`Error fetching co-admin with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async updateCoAdminPermissions(id: number, permissions: any): Promise<User | undefined> {
    try {
      // First check if the user is a co-admin
      const coAdmin = await this.getCoAdminById(id);
      
      if (!coAdmin) {
        return undefined;
      }
      
      // Update permissions
      const [updatedCoAdmin] = await db
        .update(users)
        .set({ permissions })
        .where(eq(users.id, id))
        .returning();
      
      return updatedCoAdmin;
    } catch (error) {
      console.error(`Error updating co-admin permissions for ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteCoAdmin(id: number): Promise<void> {
    try {
      // Verify that the user is a co-admin before deletion
      const coAdmin = await this.getCoAdminById(id);
      
      if (!coAdmin) {
        throw new Error(`Co-admin with ID ${id} not found`);
      }
      
      await db
        .delete(users)
        .where(eq(users.id, id));
    } catch (error) {
      console.error(`Error deleting co-admin with ID ${id}:`, error);
      throw new Error(`Failed to delete co-admin: ${(error as Error).message}`);
    }
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
  
  async updateSellerProfile(id: number, profileData: Partial<User>): Promise<User> {
    try {
      // First check if user exists and is a seller
      const [seller] = await db.select().from(users).where(
        and(
          eq(users.id, id),
          eq(users.role, 'seller')
        )
      );
      
      if (!seller) {
        throw new Error(`Seller with ID ${id} not found`);
      }
      
      // Remove fields that shouldn't be updated via this method
      const safeProfileData: Partial<User> = { ...profileData };
      
      // Fields to exclude from updates
      const excludeFields = ['id', 'role', 'approved', 'rejected'];
      excludeFields.forEach(field => {
        if (field in safeProfileData) {
          delete safeProfileData[field as keyof User];
        }
      });
      
      // Update the seller profile (without updatedAt since it might not exist in schema)
      const [updatedSeller] = await db
        .update(users)
        .set(safeProfileData)
        .where(eq(users.id, id))
        .returning();
        
      return updatedSeller;
    } catch (error) {
      console.error(`Error updating seller profile for ID ${id}:`, error);
      throw new Error("Failed to update seller profile");
    }
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
  
  // User Address Management Methods
  
  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    try {
      return await db.select()
        .from(userAddresses)
        .where(eq(userAddresses.userId, userId));
    } catch (error) {
      console.error("Error in getUserAddresses:", error);
      return [];
    }
  }
  
  async getUserAddressById(id: number): Promise<UserAddress | undefined> {
    try {
      const [address] = await db.select()
        .from(userAddresses)
        .where(eq(userAddresses.id, id));
      return address;
    } catch (error) {
      console.error(`Error getting address ${id}:`, error);
      return undefined;
    }
  }
  
  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    try {
      // If this is set as default, make sure to unset any other default addresses for this user
      if (address.isDefault) {
        await db.update(userAddresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(userAddresses.userId, address.userId),
              eq(userAddresses.isDefault, true)
            )
          );
      }
      
      // Now create the new address
      const [newAddress] = await db.insert(userAddresses)
        .values(address)
        .returning();
      
      return newAddress;
    } catch (error) {
      console.error("Error creating address:", error);
      throw new Error("Failed to create address");
    }
  }
  
  async updateUserAddress(id: number, updateData: Partial<UserAddress>): Promise<UserAddress> {
    try {
      const [existingAddress] = await db.select()
        .from(userAddresses)
        .where(eq(userAddresses.id, id));
      
      if (!existingAddress) {
        throw new Error(`Address with ID ${id} not found`);
      }
      
      // If setting this address as default, unset any other defaults first
      if (updateData.isDefault) {
        await db.update(userAddresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(userAddresses.userId, existingAddress.userId),
              eq(userAddresses.isDefault, true),
              (userAddresses.id != id) // Don't unset the current address
            )
          );
      }
      
      // Update the address
      const [updatedAddress] = await db.update(userAddresses)
        .set({
          ...updateData,
          updatedAt: new Date() // Always update the updatedAt timestamp
        })
        .where(eq(userAddresses.id, id))
        .returning();
      
      return updatedAddress;
    } catch (error) {
      console.error(`Error updating address ${id}:`, error);
      throw new Error("Failed to update address");
    }
  }
  
  async deleteUserAddress(id: number): Promise<void> {
    try {
      const [deletedAddress] = await db.delete(userAddresses)
        .where(eq(userAddresses.id, id))
        .returning();
      
      // If this was a default address and there are other addresses, make one of them the default
      if (deletedAddress?.isDefault) {
        const addresses = await db.select()
          .from(userAddresses)
          .where(eq(userAddresses.userId, deletedAddress.userId))
          .limit(1);
        
        if (addresses.length > 0) {
          await db.update(userAddresses)
            .set({ isDefault: true })
            .where(eq(userAddresses.id, addresses[0].id));
        }
      }
    } catch (error) {
      console.error(`Error deleting address ${id}:`, error);
      throw new Error("Failed to delete address");
    }
  }
  
  async setDefaultAddress(userId: number, addressId: number): Promise<void> {
    try {
      // First, check if the address exists and belongs to the user
      const [address] = await db.select()
        .from(userAddresses)
        .where(
          and(
            eq(userAddresses.id, addressId),
            eq(userAddresses.userId, userId)
          )
        );
      
      if (!address) {
        throw new Error(`Address ${addressId} not found for user ${userId}`);
      }
      
      // Unset all default addresses for this user
      await db.update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, userId));
      
      // Set the selected address as default
      await db.update(userAddresses)
        .set({ isDefault: true })
        .where(eq(userAddresses.id, addressId));
    } catch (error) {
      console.error(`Error setting default address:`, error);
      throw new Error("Failed to set default address");
    }
  }
  
  async getDefaultAddress(userId: number): Promise<UserAddress | undefined> {
    try {
      const [address] = await db.select()
        .from(userAddresses)
        .where(
          and(
            eq(userAddresses.userId, userId),
            eq(userAddresses.isDefault, true)
          )
        );
      
      return address;
    } catch (error) {
      console.error(`Error getting default address for user ${userId}:`, error);
      return undefined;
    }
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
        .set({ approved: true })
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
  
  // Reject a product (keeping it as false but marking it somehow)
  async rejectProduct(id: number): Promise<Product> {
    try {
      // Here we're just marking it as not approved
      // You could add a 'rejected' field to the schema if you want to track rejected products separately
      const [updatedProduct] = await db
        .update(products)
        .set({ approved: false })
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

  // Banner Management Methods
  async getBanners(active?: boolean): Promise<Banner[]> {
    try {
      let query = db.select().from(banners);
      
      if (active !== undefined) {
        query = query.where(eq(banners.active, active));
      }
      
      return await query.orderBy(banners.position);
    } catch (error) {
      console.error("Error in getBanners:", error);
      return [];
    }
  }
  
  async getBanner(id: number): Promise<Banner | undefined> {
    try {
      const [banner] = await db.select()
        .from(banners)
        .where(eq(banners.id, id));
      return banner;
    } catch (error) {
      console.error(`Error getting banner with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    try {
      // Set position to be at the end if not provided
      if (!insertBanner.position) {
        const lastBanners = await db.select()
          .from(banners)
          .orderBy(desc(banners.position))
          .limit(1);
        
        const lastPosition = lastBanners.length > 0 ? lastBanners[0].position : 0;
        insertBanner.position = lastPosition + 1;
      }
      
      const [banner] = await db.insert(banners)
        .values({
          ...insertBanner,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return banner;
    } catch (error) {
      console.error("Error creating banner:", error);
      throw new Error("Failed to create banner");
    }
  }
  
  async updateBanner(id: number, updateData: Partial<Banner>): Promise<Banner> {
    try {
      const [banner] = await db.update(banners)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(banners.id, id))
        .returning();
      
      if (!banner) {
        throw new Error(`Banner with ID ${id} not found`);
      }
      
      return banner;
    } catch (error) {
      console.error(`Error updating banner ${id}:`, error);
      throw new Error("Failed to update banner");
    }
  }
  
  async deleteBanner(id: number): Promise<void> {
    try {
      await db.delete(banners)
        .where(eq(banners.id, id));
      
      // Re-order remaining banners to maintain consistent position values
      const remainingBanners = await db.select()
        .from(banners)
        .orderBy(banners.position);
      
      for (let i = 0; i < remainingBanners.length; i++) {
        await db.update(banners)
          .set({ position: i + 1 })
          .where(eq(banners.id, remainingBanners[i].id));
      }
    } catch (error) {
      console.error(`Error deleting banner ${id}:`, error);
      throw new Error("Failed to delete banner");
    }
  }
  
  async updateBannerPosition(id: number, position: number): Promise<Banner> {
    try {
      // Get the current position of the banner
      const [banner] = await db.select()
        .from(banners)
        .where(eq(banners.id, id));
      
      if (!banner) {
        throw new Error(`Banner with ID ${id} not found`);
      }
      
      const currentPosition = banner.position;
      
      // Get all banners
      const allBanners = await db.select()
        .from(banners)
        .orderBy(banners.position);
      
      // Update positions
      if (position < currentPosition) {
        // Moving up - increase position of banners between new and old position
        for (const b of allBanners) {
          if (b.position >= position && b.position < currentPosition) {
            await db.update(banners)
              .set({ position: b.position + 1 })
              .where(eq(banners.id, b.id));
          }
        }
      } else if (position > currentPosition) {
        // Moving down - decrease position of banners between old and new position
        for (const b of allBanners) {
          if (b.position > currentPosition && b.position <= position) {
            await db.update(banners)
              .set({ position: b.position - 1 })
              .where(eq(banners.id, b.id));
          }
        }
      }
      
      // Update the position of the target banner
      const [updatedBanner] = await db.update(banners)
        .set({ 
          position,
          updatedAt: new Date()
        })
        .where(eq(banners.id, id))
        .returning();
      
      return updatedBanner;
    } catch (error) {
      console.error(`Error updating banner position ${id}:`, error);
      throw new Error("Failed to update banner position");
    }
  }
  
  async toggleBannerActive(id: number): Promise<Banner> {
    try {
      const [banner] = await db.select()
        .from(banners)
        .where(eq(banners.id, id));
      
      if (!banner) {
        throw new Error(`Banner with ID ${id} not found`);
      }
      
      const [updatedBanner] = await db.update(banners)
        .set({ 
          active: !banner.active,
          updatedAt: new Date()
        })
        .where(eq(banners.id, id))
        .returning();
      
      return updatedBanner;
    } catch (error) {
      console.error(`Error toggling banner active state ${id}:`, error);
      throw new Error("Failed to toggle banner active state");
    }
  }

  // Footer Content Methods
  async getFooterContents(section?: string, isActive?: boolean): Promise<FooterContent[]> {
    try {
      let query = db.select().from(footerContent);
      
      if (section) {
        query = query.where(eq(footerContent.section, section));
      }
      
      if (isActive !== undefined) {
        query = query.where(eq(footerContent.isActive, isActive));
      }
      
      // Always return in order by section and order
      return await query.orderBy(footerContent.section, footerContent.order);
    } catch (error) {
      console.error("Error getting footer contents:", error);
      return [];
    }
  }
  
  async getFooterContentById(id: number): Promise<FooterContent | undefined> {
    try {
      const [content] = await db.select()
        .from(footerContent)
        .where(eq(footerContent.id, id));
      return content;
    } catch (error) {
      console.error(`Error getting footer content with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createFooterContent(content: InsertFooterContent): Promise<FooterContent> {
    try {
      const [newContent] = await db.insert(footerContent)
        .values({
          ...content,
          lastUpdated: new Date()
        })
        .returning();
      return newContent;
    } catch (error) {
      console.error("Error creating footer content:", error);
      throw new Error("Failed to create footer content");
    }
  }
  
  async updateFooterContent(id: number, content: Partial<FooterContent>): Promise<FooterContent> {
    try {
      const [existingContent] = await db.select()
        .from(footerContent)
        .where(eq(footerContent.id, id));
      
      if (!existingContent) {
        throw new Error(`Footer content with ID ${id} not found`);
      }
      
      const [updatedContent] = await db.update(footerContent)
        .set({
          ...content,
          lastUpdated: new Date()
        })
        .where(eq(footerContent.id, id))
        .returning();
      
      return updatedContent;
    } catch (error) {
      console.error(`Error updating footer content ${id}:`, error);
      throw new Error("Failed to update footer content");
    }
  }
  
  async deleteFooterContent(id: number): Promise<void> {
    try {
      await db.delete(footerContent)
        .where(eq(footerContent.id, id));
    } catch (error) {
      console.error(`Error deleting footer content ${id}:`, error);
      throw new Error("Failed to delete footer content");
    }
  }
  
  async toggleFooterContentActive(id: number): Promise<FooterContent> {
    try {
      const [content] = await db.select()
        .from(footerContent)
        .where(eq(footerContent.id, id));
        
      if (!content) {
        throw new Error(`Footer content with ID ${id} not found`);
      }
      
      const [updatedContent] = await db.update(footerContent)
        .set({ 
          isActive: !content.isActive,
          lastUpdated: new Date()
        })
        .where(eq(footerContent.id, id))
        .returning();
      
      return updatedContent;
    } catch (error) {
      console.error(`Error toggling footer content active state for ID ${id}:`, error);
      throw new Error("Failed to toggle footer content active state");
    }
  }
  
  async updateFooterContentOrder(id: number, order: number): Promise<FooterContent> {
    try {
      const [content] = await db.select()
        .from(footerContent)
        .where(eq(footerContent.id, id));
        
      if (!content) {
        throw new Error(`Footer content with ID ${id} not found`);
      }
      
      const [updatedContent] = await db.update(footerContent)
        .set({ 
          order,
          lastUpdated: new Date()
        })
        .where(eq(footerContent.id, id))
        .returning();
      
      return updatedContent;
    } catch (error) {
      console.error(`Error updating footer content order for ID ${id}:`, error);
      throw new Error("Failed to update footer content order");
    }
  }
}

export const storage = new DatabaseStorage();