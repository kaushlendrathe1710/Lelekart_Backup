import { 
  users, User, InsertUser,
  products, Product, InsertProduct,
  carts, Cart, InsertCart,
  shiprocketSettings, ShiprocketSettings, InsertShiprocketSettings,
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
  footerContent, FooterContent, InsertFooterContent,
  shippingMethods, ShippingMethod, InsertShippingMethod,
  shippingZones, ShippingZone, InsertShippingZone,
  shippingRules, ShippingRule, InsertShippingRule,
  sellerShippingSettings, SellerShippingSetting, InsertSellerShippingSetting,
  productShippingOverrides, ProductShippingOverride, InsertProductShippingOverride,
  shippingTracking, ShippingTracking, InsertShippingTracking,
  // New imports
  returns, Return, InsertReturn,
  sellerAnalytics, SellerAnalytic, InsertSellerAnalytic,
  sellerPayments, SellerPayment, InsertSellerPayment,
  sellerSettings, SellerSetting, InsertSellerSetting,
  supportTickets, SupportTicket, InsertSupportTicket,
  supportMessages, SupportMessage, InsertSupportMessage,
  // Rewards and Gift Cards imports
  rewards, Reward as SelectReward, InsertReward,
  rewardTransactions, RewardTransaction as SelectRewardTransaction, InsertRewardTransaction,
  rewardRules, RewardRule as SelectRewardRule, InsertRewardRule,
  giftCards, GiftCard as SelectGiftCard, InsertGiftCard,
  giftCardTransactions, GiftCardTransaction as SelectGiftCardTransaction, InsertGiftCardTransaction,
  giftCardTemplates, GiftCardTemplate as SelectGiftCardTemplate, InsertGiftCardTemplate,
  // Wallet imports
  wallets, Wallet as SelectWallet, InsertWallet,
  walletTransactions, WalletTransaction as SelectWalletTransaction, InsertWalletTransaction,
  walletSettings, WalletSettings as SelectWalletSettings, InsertWalletSettings
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { and, eq, desc, sql, ilike, or } from "drizzle-orm";
import { db } from "./db";
import { pool } from "./db";
import { shiprocketStorageMethods } from "./storage-shiprocket";

export interface IStorage {
  // Rewards Methods
  getUserRewards(userId: number): Promise<SelectReward | undefined>;
  createUserRewards(data: InsertReward): Promise<SelectReward>;
  updateUserRewards(userId: number, data: Partial<InsertReward>): Promise<SelectReward>;
  getUserRewardTransactions(userId: number, page?: number, limit?: number): Promise<{ transactions: SelectRewardTransaction[], total: number }>;
  createRewardTransaction(data: InsertRewardTransaction): Promise<SelectRewardTransaction>;
  getRewardRules(): Promise<SelectRewardRule[]>;
  getRewardRule(id: number): Promise<SelectRewardRule | undefined>;
  createRewardRule(data: InsertRewardRule): Promise<SelectRewardRule>;
  updateRewardRule(id: number, data: Partial<InsertRewardRule>): Promise<SelectRewardRule>;
  deleteRewardRule(id: number): Promise<void>;
  getRewardStatistics(): Promise<{ totalPointsIssued: number, totalPointsRedeemed: number, activeUsers: number }>;
  
  // Gift Card Methods
  getAllGiftCards(page?: number, limit?: number): Promise<{ giftCards: SelectGiftCard[], total: number }>;
  getUserGiftCards(userId: number): Promise<SelectGiftCard[]>;
  getGiftCard(id: number): Promise<SelectGiftCard | undefined>;
  getGiftCardByCode(code: string): Promise<SelectGiftCard | undefined>;
  createGiftCard(data: InsertGiftCard): Promise<SelectGiftCard>;
  updateGiftCard(id: number, data: Partial<InsertGiftCard>): Promise<SelectGiftCard>;
  createGiftCardTransaction(data: InsertGiftCardTransaction): Promise<SelectGiftCardTransaction>;
  getGiftCardTemplates(): Promise<SelectGiftCardTemplate[]>;
  getGiftCardTemplate(id: number): Promise<SelectGiftCardTemplate | undefined>;
  createGiftCardTemplate(data: InsertGiftCardTemplate): Promise<SelectGiftCardTemplate>;
  updateGiftCardTemplate(id: number, data: Partial<InsertGiftCardTemplate>): Promise<SelectGiftCardTemplate>;
  deleteGiftCardTemplate(id: number): Promise<void>;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User>;
  updateUserProfile(id: number, data: Partial<User>): Promise<User>;
  getUserNotificationPreferences(id: number): Promise<any | null>;
  updateUserNotificationPreferences(id: number, preferences: any): Promise<User>;
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
  getProductsCount(category?: string, sellerId?: number, approved?: boolean, search?: string): Promise<number>;
  getProductsPaginated(category?: string, sellerId?: number, approved?: boolean, offset?: number, limit?: number, search?: string): Promise<Product[]>;
  getAllProducts(filters?: { sellerId?: number, category?: string, approved?: boolean }): Promise<Product[]>;
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
  
  // Shipping Methods operations
  getShippingMethods(): Promise<ShippingMethod[]>;
  getShippingMethodById(id: number): Promise<ShippingMethod | undefined>;
  createShippingMethod(method: InsertShippingMethod): Promise<ShippingMethod>;
  updateShippingMethod(id: number, method: Partial<ShippingMethod>): Promise<ShippingMethod>;
  deleteShippingMethod(id: number): Promise<void>;
  
  // Shipping Zones operations
  getShippingZones(): Promise<ShippingZone[]>;
  getShippingZoneById(id: number): Promise<ShippingZone | undefined>;
  createShippingZone(zone: InsertShippingZone): Promise<ShippingZone>;
  updateShippingZone(id: number, zone: Partial<ShippingZone>): Promise<ShippingZone>;
  deleteShippingZone(id: number): Promise<void>;
  
  // Shipping Rules operations
  getShippingRules(): Promise<ShippingRule[]>;
  getShippingRuleById(id: number): Promise<ShippingRule | undefined>;
  getShippingRulesByMethod(methodId: number): Promise<ShippingRule[]>;
  getShippingRulesByZone(zoneId: number): Promise<ShippingRule[]>;
  createShippingRule(rule: InsertShippingRule): Promise<ShippingRule>;
  updateShippingRule(id: number, rule: Partial<ShippingRule>): Promise<ShippingRule>;
  deleteShippingRule(id: number): Promise<void>;
  
  // Seller Shipping Settings operations
  getSellerShippingSettings(sellerId: number): Promise<SellerShippingSetting | undefined>;
  createSellerShippingSettings(settings: InsertSellerShippingSetting): Promise<SellerShippingSetting>;
  updateSellerShippingSettings(sellerId: number, settings: Partial<SellerShippingSetting>): Promise<SellerShippingSetting>;
  
  // Product Shipping Overrides operations
  getProductShippingOverrides(sellerId: number): Promise<ProductShippingOverride[]>;
  getProductShippingOverrideById(id: number): Promise<ProductShippingOverride | undefined>;
  getProductShippingOverrideByProduct(productId: number): Promise<ProductShippingOverride | undefined>;
  createProductShippingOverride(override: InsertProductShippingOverride): Promise<ProductShippingOverride>;
  updateProductShippingOverride(id: number, override: Partial<ProductShippingOverride>): Promise<ProductShippingOverride>;
  deleteProductShippingOverride(id: number): Promise<void>;
  
  // Shipping Tracking operations
  getShippingTracking(orderId: number): Promise<ShippingTracking | undefined>;
  createShippingTracking(tracking: InsertShippingTracking): Promise<ShippingTracking>;
  updateShippingTracking(id: number, tracking: Partial<ShippingTracking>): Promise<ShippingTracking>;
  
  // Returns Management operations
  getReturnsForSeller(sellerId: number): Promise<Return[]>;
  getReturnById(id: number): Promise<Return | undefined>;
  createReturn(returnData: InsertReturn): Promise<Return>;
  updateReturnStatus(id: number, returnStatus: string, refundStatus?: string): Promise<Return>;
  
  // Analytics Management operations
  getSellerAnalytics(sellerId: number, startDate?: Date, endDate?: Date): Promise<SellerAnalytic[]>;
  createOrUpdateSellerAnalytics(data: InsertSellerAnalytic): Promise<SellerAnalytic>;
  
  // Payments Management operations
  getSellerPayments(sellerId: number): Promise<SellerPayment[]>;
  getSellerPaymentById(id: number): Promise<SellerPayment | undefined>;
  createSellerPayment(paymentData: InsertSellerPayment): Promise<SellerPayment>;
  updateSellerPayment(id: number, paymentData: Partial<InsertSellerPayment>): Promise<SellerPayment>;
  
  // Settings Management operations
  getSellerSettings(sellerId: number): Promise<SellerSetting | undefined>;
  createOrUpdateSellerSettings(sellerId: number, settingsData: Partial<InsertSellerSetting>): Promise<SellerSetting>;
  
  // Support Management operations
  getSellerSupportTickets(userId: number): Promise<SupportTicket[]>;
  getSupportTicketById(id: number): Promise<SupportTicket | undefined>;
  createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, ticketData: Partial<InsertSupportTicket>): Promise<SupportTicket>;
  getSupportMessages(ticketId: number): Promise<SupportMessage[]>;
  createSupportMessage(messageData: InsertSupportMessage): Promise<SupportMessage>;
  getSupportMessagesByTicket(ticketId: number): Promise<SupportMessage[]>;
  
  // Wallet Methods
  getWalletSettings(): Promise<SelectWalletSettings | null>;
  updateWalletSettings(settingsData: Partial<SelectWalletSettings>): Promise<SelectWalletSettings>;
  getUserWallet(userId: number): Promise<SelectWallet | null>;
  createUserWalletIfNotExists(userId: number): Promise<SelectWallet>;
  addCoinsToWallet(userId: number, amount: number, referenceType: string, referenceId?: number, description?: string): Promise<SelectWallet>;
  redeemCoinsFromWallet(userId: number, amount: number, referenceType: string, referenceId?: number, description?: string): Promise<{ wallet: SelectWallet, discountAmount: number }>;
  getUserWalletTransactions(userId: number, page?: number, limit?: number): Promise<{ transactions: SelectWalletTransaction[], total: number }>;
  processFirstPurchaseReward(userId: number, orderId: number): Promise<SelectWallet | null>;
  processExpiredCoins(): Promise<number>;
  manualAdjustWallet(userId: number, amount: number, description: string): Promise<SelectWallet>;
  getUsersWithWallets(): Promise<Array<{id: number; username: string; balance: number;}>>;
  
  // Shiprocket Methods
  getShiprocketSettings(): Promise<ShiprocketSettings | undefined>;
  updateShiprocketSettings(settings: InsertShiprocketSettings): Promise<ShiprocketSettings>;
  
  // Session store
  sessionStore: session.SessionStore;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  private shiprocketSettings: any = null;
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Implementing Shiprocket methods
  async getShiprocketSettings(): Promise<ShiprocketSettings | undefined> {
    return shiprocketStorageMethods.getShiprocketSettings.call(this);
  }

  async updateShiprocketSettings(settings: InsertShiprocketSettings): Promise<ShiprocketSettings> {
    return shiprocketStorageMethods.updateShiprocketSettings.call(this, settings);
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
          businessType: details.businessType
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
  
  async updateUserProfile(id: number, data: Partial<User>): Promise<User> {
    // Only allow updating these fields
    const allowedFields: (keyof User)[] = ['username', 'email', 'phone', 'address', 'profileImage'];
    
    // Filter out any fields that are not allowed
    const filteredData: Partial<User> = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        filteredData[key] = data[key];
      }
    }
    
    // Update the user in the database
    const [updatedUser] = await db
      .update(users)
      .set(filteredData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async getUserNotificationPreferences(id: number): Promise<any | null> {
    try {
      // Get the user first
      const user = await this.getUser(id);
      
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      // Check if notification preferences exist
      if (!user.notificationPreferences) {
        return null;
      }
      
      // Parse and return the notification preferences
      try {
        return JSON.parse(user.notificationPreferences);
      } catch (error) {
        console.error(`Error parsing notification preferences for user ${id}:`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error getting notification preferences for user ${id}:`, error);
      return null;
    }
  }
  
  async updateUserNotificationPreferences(id: number, preferences: any): Promise<User> {
    try {
      // Get the user first to ensure they exist
      const user = await this.getUser(id);
      
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      // Convert preferences to JSON string
      const preferencesJson = JSON.stringify(preferences);
      
      // Update the user's notification preferences
      const [updatedUser] = await db
        .update(users)
        .set({ notificationPreferences: preferencesJson })
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`Failed to update notification preferences for user ${id}`);
      }
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating notification preferences for user ${id}:`, error);
      throw new Error(`Failed to update notification preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
  
  async getUserAddress(id: number): Promise<UserAddress | undefined> {
    // This is an alias for getUserAddressById for better naming consistency
    return this.getUserAddressById(id);
  }

  async getWalletById(id: number): Promise<any> {
    try {
      // Use the getUserWallet function from wallet-handlers.js
      const { getUserWallet } = await import('./handlers/wallet-handlers');
      const wallet = await getUserWallet(id);
      return wallet;
    } catch (error) {
      console.error(`Error getting wallet with ID ${id}:`, error);
      return null;
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
  
  async getProductsCount(category?: string, sellerId?: number, approved?: boolean, search?: string): Promise<number> {
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
      
      // Add search filter
      if (search && search.trim() !== '') {
        query += ` AND (
          LOWER(name) LIKE LOWER($${params.length + 1}) OR 
          LOWER(description) LIKE LOWER($${params.length + 1}) OR
          LOWER(category) LIKE LOWER($${params.length + 1}) OR
          LOWER(sku) LIKE LOWER($${params.length + 1})
        )`;
        params.push(`%${search}%`);
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
    limit: number = 12,
    search?: string
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
      
      // Add search filter
      if (search && search.trim() !== '') {
        query += ` AND (
          LOWER(name) LIKE LOWER($${params.length + 1}) OR 
          LOWER(description) LIKE LOWER($${params.length + 1}) OR
          LOWER(category) LIKE LOWER($${params.length + 1}) OR
          LOWER(sku) LIKE LOWER($${params.length + 1})
        )`;
        params.push(`%${search}%`);
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

  async getAllProducts(filters?: { sellerId?: number, category?: string, approved?: boolean }): Promise<Product[]> {
    try {
      let params: any[] = [];
      let paramIndex = 1;
      
      // Build query with WHERE clauses for filtering
      let query = `
        SELECT * FROM products 
        WHERE 1=1
      `;
      
      if (filters) {
        if (filters.category) {
          query += ` AND LOWER(category) = LOWER($${paramIndex++})`;
          params.push(filters.category);
        }
        
        if (filters.sellerId !== undefined) {
          query += ` AND seller_id = $${paramIndex++}`;
          params.push(filters.sellerId);
        }
        
        if (filters.approved !== undefined) {
          query += ` AND approved = $${paramIndex++}`;
          params.push(filters.approved);
        }
      }
      
      // Add ORDER BY
      query += ` ORDER BY id DESC`;
      
      console.log("Executing SQL query for product export:", query, "with params:", params);
      
      // Execute the query
      const { rows } = await pool.query(query, params);
      console.log(`Found ${rows.length} products for export`);
      return rows;
    } catch (error) {
      console.error("Error in getAllProducts:", error);
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
  
  // Get products that are pending approval (where approved=false and rejected=false) with pagination
  async getPendingProducts(
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    category?: string
  ): Promise<{products: any[], total: number}> {
    try {
      console.log(`Getting pending products with filters: page=${page}, limit=${limit}, search=${search || 'none'}, category=${category || 'none'}`);
      
      // Build search conditions
      const conditions = [
        eq(products.approved, false),
        eq(products.rejected, false)
      ];
      
      // Add category filter if provided
      if (category) {
        conditions.push(ilike(products.category, `%${category}%`));
      }
      
      // Add search filter if provided
      if (search) {
        conditions.push(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.description, `%${search}%`),
            ilike(products.sku, `%${search}%`)
          )
        );
      }
      
      // First get the total count with filters applied
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(products)
        .where(and(...conditions));
      
      const total = Number(countResult[0].count);
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Join with users table to get seller information
      const result = await db
        .select({
          ...products,
          seller: {
            id: users.id,
            username: users.username,
            email: users.email,
            role: users.role
          }
        })
        .from(products)
        .leftJoin(users, eq(products.sellerId, users.id))
        .where(and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);
      
      console.log(`Found ${result.length} pending products (page ${page}/${Math.ceil(total/limit) || 1})`);
      return {
        products: result,
        total
      };
    } catch (error) {
      console.error("Error in getPendingProducts:", error);
      return {
        products: [],
        total: 0
      };
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
  
  // Reject a product (marking it as rejected)
  async rejectProduct(id: number): Promise<Product> {
    try {
      // Mark as not approved and explicitly rejected
      const [updatedProduct] = await db
        .update(products)
        .set({ 
          approved: false,
          rejected: true  // Set the rejected flag
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
    console.log(`Checking if product ${insertCart.productId} exists in cart for user ${insertCart.userId}`);
    
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
      console.log(`Found existing cart item: ${JSON.stringify(existingCartItem)}`);
      console.log(`Updating quantity from ${existingCartItem.quantity} to ${existingCartItem.quantity + insertCart.quantity}`);
      
      const [updatedCartItem] = await db
        .update(carts)
        .set({
          quantity: existingCartItem.quantity + insertCart.quantity
        })
        .where(eq(carts.id, existingCartItem.id))
        .returning();
      
      console.log(`Updated cart item: ${JSON.stringify(updatedCartItem)}`);
      return updatedCartItem;
    }
    
    // Otherwise insert new cart item
    console.log(`No existing cart item found, creating new one`);
    const [cartItem] = await db
      .insert(carts)
      .values(insertCart)
      .returning();
    
    console.log(`Created new cart item: ${JSON.stringify(cartItem)}`);
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
    
    // Only include the basic fields that we know exist in the database
    // Exclude any Shiprocket fields (shipping_status, etc) that might not exist yet
    const orderData = [{
      userId: orderToInsert.userId,
      status: orderToInsert.status,
      total: orderToInsert.total,
      date: typeof orderToInsert.date === 'string' ? new Date(orderToInsert.date) : orderToInsert.date,
      shippingDetails: orderToInsert.shippingDetails,
      paymentMethod: orderToInsert.paymentMethod || 'cod',
      // Include addressId if provided
      ...(orderToInsert.addressId ? { addressId: orderToInsert.addressId } : {}),
      // Include paymentId and orderId if provided
      ...(orderToInsert.paymentId ? { paymentId: orderToInsert.paymentId } : {}),
      ...(orderToInsert.orderId ? { orderId: orderToInsert.orderId } : {})
    }];
    
    // Remove any shipping-related fields that might not exist yet
    delete orderData[0]['shippingStatus'];
    delete orderData[0]['shiprocketOrderId'];
    delete orderData[0]['shiprocketShipmentId']; 
    delete orderData[0]['trackingDetails'];
    delete orderData[0]['courierName'];
    delete orderData[0]['awbCode'];
    delete orderData[0]['estimatedDeliveryDate'];
    
    // Add wallet-related fields if they exist in the order input
    if (orderToInsert.walletDiscount) {
      orderData[0]['walletDiscount'] = orderToInsert.walletDiscount;
    }
    
    if (orderToInsert.walletCoinsUsed) {
      orderData[0]['walletCoinsUsed'] = orderToInsert.walletCoinsUsed;
    }
    
    // Debug log to verify the final data being sent to the database
    console.log("Final order data for database insertion:", orderData);
    
    try {
      // Log the SQL that would be executed
      const query = db.insert(orders).values(orderData);
      const sql = query.toSQL();
      console.log("Order insertion SQL query:", sql.sql);
      console.log("Order insertion SQL parameters:", sql.params);
      
      const [order] = await query.returning();
      
      console.log("Order created successfully:", order);
      
      // Parse shippingDetails from string to object if it exists
      if (order.shippingDetails && typeof order.shippingDetails === 'string') {
        try {
          order.shippingDetails = JSON.parse(order.shippingDetails);
        } catch (error) {
          console.error('Error parsing shippingDetails:', error);
        }
      }
      
      return order;
    } catch (error) {
      console.error("Database error during order creation:", error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        // Check if it's a database error with code
        if ('code' in error) {
          console.error("Database error code:", (error as any).code);
          console.error("Database error detail:", (error as any).detail);
          console.error("Database error constraint:", (error as any).constraint);
        }
      }
      
      throw error;
    }
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
  
  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order> {
    // Handle trackingDetails - convert to string if provided as an object
    const orderToUpdate = { ...orderData };
    
    if (orderToUpdate.trackingDetails && typeof orderToUpdate.trackingDetails === 'object') {
      orderToUpdate.trackingDetails = JSON.stringify(orderToUpdate.trackingDetails);
    }
    
    // Handle shippingDetails - convert to string if provided as an object
    if (orderToUpdate.shippingDetails && typeof orderToUpdate.shippingDetails === 'object') {
      orderToUpdate.shippingDetails = JSON.stringify(orderToUpdate.shippingDetails);
    }
    
    const [updatedOrder] = await db
      .update(orders)
      .set(orderToUpdate)
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
    
    // Parse trackingDetails if it's a string
    if (updatedOrder.trackingDetails && typeof updatedOrder.trackingDetails === 'string') {
      try {
        updatedOrder.trackingDetails = JSON.parse(updatedOrder.trackingDetails);
      } catch (error) {
        console.error('Error parsing trackingDetails:', error);
      }
    }
    
    return updatedOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    return this.updateOrder(id, { status });
  }
  
  async updateOrderShipment(id: number, shipmentData: {
    shiprocketOrderId?: string;
    shiprocketShipmentId?: string;
    shipmentStatus?: string;
    courierName?: string;
    trackingId?: string;
    trackingUrl?: string;
  }): Promise<Order> {
    return this.updateOrder(id, shipmentData);
  }
  
  // Shiprocket Methods
  async getShiprocketSettings(): Promise<any> {
    try {
      // In a real implementation, this would fetch from a database
      // For now, return mock data from memory
      return this.shiprocketSettings || null;
    } catch (error) {
      console.error("Error getting Shiprocket settings:", error);
      return null;
    }
  }
  
  async saveShiprocketSettings(settings: any): Promise<any> {
    try {
      // In a real implementation, this would save to a database
      // For now, save to memory
      this.shiprocketSettings = settings;
      return settings;
    } catch (error) {
      console.error("Error saving Shiprocket settings:", error);
      throw error;
    }
  }
  
  // Method names aligned with handlers
  async getPendingShiprocketOrders(sellerId?: number): Promise<Order[]> {
    return this.getPendingShipmentOrders(sellerId);
  }
  
  async getOrdersWithShiprocketShipments(): Promise<Order[]> {
    try {
      return db
        .select()
        .from(orders)
        .where(
          and(
            not(isNull(orders.shiprocketOrderId)),
            not(isNull(orders.shiprocketShipmentId))
          )
        )
        .orderBy(desc(orders.date));
    } catch (error) {
      console.error("Error getting orders with Shiprocket shipments:", error);
      throw error;
    }
  }

  async getPendingShipmentOrders(sellerId?: number): Promise<Order[]> {
    try {
      // Get orders that are processing or confirmed and haven't been pushed to Shiprocket
      let query = db
        .select()
        .from(orders)
        .where(
          and(
            or(
              eq(orders.status, "processing"),
              eq(orders.status, "confirmed")
            ),
            isNull(orders.shiprocketOrderId)
          )
        );
      
      // Add seller filter if sellerId is provided
      if (sellerId !== undefined) {
        query = query.where(eq(orders.sellerId, sellerId));
      }
      
      return query.orderBy(desc(orders.date));
    } catch (error) {
      console.error("Error getting pending shipment orders:", error);
      return [];
    }
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

  // Shipping Methods methods
  async getShippingMethods(): Promise<ShippingMethod[]> {
    try {
      return await db.select().from(shippingMethods);
    } catch (error) {
      console.error('Error getting shipping methods:', error);
      return [];
    }
  }

  async getShippingMethodById(id: number): Promise<ShippingMethod | undefined> {
    try {
      const [method] = await db.select()
        .from(shippingMethods)
        .where(eq(shippingMethods.id, id));
      return method;
    } catch (error) {
      console.error(`Error getting shipping method with ID ${id}:`, error);
      return undefined;
    }
  }

  async createShippingMethod(method: InsertShippingMethod): Promise<ShippingMethod> {
    try {
      const [newMethod] = await db.insert(shippingMethods)
        .values(method)
        .returning();
      return newMethod;
    } catch (error) {
      console.error('Error creating shipping method:', error);
      throw new Error('Failed to create shipping method');
    }
  }

  async updateShippingMethod(id: number, method: Partial<ShippingMethod>): Promise<ShippingMethod> {
    try {
      const [updatedMethod] = await db.update(shippingMethods)
        .set(method)
        .where(eq(shippingMethods.id, id))
        .returning();
      
      if (!updatedMethod) {
        throw new Error(`Shipping method with ID ${id} not found`);
      }
      
      return updatedMethod;
    } catch (error) {
      console.error(`Error updating shipping method with ID ${id}:`, error);
      throw new Error('Failed to update shipping method');
    }
  }

  async deleteShippingMethod(id: number): Promise<void> {
    try {
      // Check if there are any shipping rules using this method
      const rules = await this.getShippingRulesByMethod(id);
      if (rules.length > 0) {
        throw new Error('Cannot delete shipping method that is in use by shipping rules');
      }

      // Check if there are any seller settings using this method
      const query = `
        SELECT EXISTS (
          SELECT 1 FROM seller_shipping_settings
          WHERE default_shipping_method_id = $1
        ) as exists
      `;
      
      const { rows } = await pool.query(query, [id]);
      if (rows[0].exists) {
        throw new Error('Cannot delete shipping method that is in use in seller settings');
      }

      await db.delete(shippingMethods)
        .where(eq(shippingMethods.id, id));
    } catch (error) {
      console.error(`Error deleting shipping method with ID ${id}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete shipping method');
    }
  }

  // Shipping Zones methods
  async getShippingZones(): Promise<ShippingZone[]> {
    try {
      return await db.select().from(shippingZones);
    } catch (error) {
      console.error('Error getting shipping zones:', error);
      return [];
    }
  }

  async getShippingZoneById(id: number): Promise<ShippingZone | undefined> {
    try {
      const [zone] = await db.select()
        .from(shippingZones)
        .where(eq(shippingZones.id, id));
      return zone;
    } catch (error) {
      console.error(`Error getting shipping zone with ID ${id}:`, error);
      return undefined;
    }
  }

  async createShippingZone(zone: InsertShippingZone): Promise<ShippingZone> {
    try {
      const [newZone] = await db.insert(shippingZones)
        .values(zone)
        .returning();
      return newZone;
    } catch (error) {
      console.error('Error creating shipping zone:', error);
      throw new Error('Failed to create shipping zone');
    }
  }

  async updateShippingZone(id: number, zone: Partial<ShippingZone>): Promise<ShippingZone> {
    try {
      const [updatedZone] = await db.update(shippingZones)
        .set(zone)
        .where(eq(shippingZones.id, id))
        .returning();
      
      if (!updatedZone) {
        throw new Error(`Shipping zone with ID ${id} not found`);
      }
      
      return updatedZone;
    } catch (error) {
      console.error(`Error updating shipping zone with ID ${id}:`, error);
      throw new Error('Failed to update shipping zone');
    }
  }

  async deleteShippingZone(id: number): Promise<void> {
    try {
      // Check if there are any shipping rules using this zone
      const rules = await this.getShippingRulesByZone(id);
      if (rules.length > 0) {
        throw new Error('Cannot delete shipping zone that is in use by shipping rules');
      }

      await db.delete(shippingZones)
        .where(eq(shippingZones.id, id));
    } catch (error) {
      console.error(`Error deleting shipping zone with ID ${id}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete shipping zone');
    }
  }

  // Shipping Rules methods
  async getShippingRules(): Promise<ShippingRule[]> {
    try {
      return await db.select().from(shippingRules);
    } catch (error) {
      console.error('Error getting shipping rules:', error);
      return [];
    }
  }

  async getShippingRuleById(id: number): Promise<ShippingRule | undefined> {
    try {
      const [rule] = await db.select()
        .from(shippingRules)
        .where(eq(shippingRules.id, id));
      return rule;
    } catch (error) {
      console.error(`Error getting shipping rule with ID ${id}:`, error);
      return undefined;
    }
  }

  async getShippingRulesByMethod(methodId: number): Promise<ShippingRule[]> {
    try {
      return await db.select()
        .from(shippingRules)
        .where(eq(shippingRules.methodId, methodId));
    } catch (error) {
      console.error(`Error getting shipping rules for method ID ${methodId}:`, error);
      return [];
    }
  }

  // For compatibility with shipping handlers
  async getShippingRulesByMethodId(methodId: number): Promise<ShippingRule[]> {
    return this.getShippingRulesByMethod(methodId);
  }

  async getShippingRulesByZone(zoneId: number): Promise<ShippingRule[]> {
    try {
      return await db.select()
        .from(shippingRules)
        .where(eq(shippingRules.zoneId, zoneId));
    } catch (error) {
      console.error(`Error getting shipping rules for zone ID ${zoneId}:`, error);
      return [];
    }
  }
  
  // For compatibility with shipping handlers
  async getShippingRulesByZoneId(zoneId: number): Promise<ShippingRule[]> {
    return this.getShippingRulesByZone(zoneId);
  }
  
  // For compatibility with shipping handlers
  async getShippingRulesByMethodAndZone(methodId: number, zoneId: number): Promise<ShippingRule[]> {
    try {
      return await db.select()
        .from(shippingRules)
        .where(and(
          eq(shippingRules.methodId, methodId),
          eq(shippingRules.zoneId, zoneId)
        ));
    } catch (error) {
      console.error(`Error getting shipping rules for method ID ${methodId} and zone ID ${zoneId}:`, error);
      return [];
    }
  }

  async createShippingRule(rule: InsertShippingRule): Promise<ShippingRule> {
    try {
      // Validate that the method and zone exist
      const method = await this.getShippingMethodById(rule.methodId);
      if (!method) {
        throw new Error(`Shipping method with ID ${rule.methodId} not found`);
      }

      const zone = await this.getShippingZoneById(rule.zoneId);
      if (!zone) {
        throw new Error(`Shipping zone with ID ${rule.zoneId} not found`);
      }

      // Check for duplicates
      const existingRules = await db.select()
        .from(shippingRules)
        .where(and(
          eq(shippingRules.methodId, rule.methodId),
          eq(shippingRules.zoneId, rule.zoneId)
        ));

      if (existingRules.length > 0) {
        throw new Error(`A shipping rule for method ID ${rule.methodId} and zone ID ${rule.zoneId} already exists`);
      }

      const [newRule] = await db.insert(shippingRules)
        .values(rule)
        .returning();
      return newRule;
    } catch (error) {
      console.error('Error creating shipping rule:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create shipping rule');
    }
  }

  async updateShippingRule(id: number, rule: Partial<ShippingRule>): Promise<ShippingRule> {
    try {
      // If updating methodId or zoneId, validate they exist
      if (rule.methodId) {
        const method = await this.getShippingMethodById(rule.methodId);
        if (!method) {
          throw new Error(`Shipping method with ID ${rule.methodId} not found`);
        }
      }

      if (rule.zoneId) {
        const zone = await this.getShippingZoneById(rule.zoneId);
        if (!zone) {
          throw new Error(`Shipping zone with ID ${rule.zoneId} not found`);
        }
      }

      // If updating both methodId and zoneId, check for duplicates
      if (rule.methodId && rule.zoneId) {
        const existingRules = await db.select()
          .from(shippingRules)
          .where(and(
            eq(shippingRules.methodId, rule.methodId),
            eq(shippingRules.zoneId, rule.zoneId),
            sql`${shippingRules.id} != ${id}`
          ));

        if (existingRules.length > 0) {
          throw new Error(`A shipping rule for method ID ${rule.methodId} and zone ID ${rule.zoneId} already exists`);
        }
      }

      const [updatedRule] = await db.update(shippingRules)
        .set(rule)
        .where(eq(shippingRules.id, id))
        .returning();
      
      if (!updatedRule) {
        throw new Error(`Shipping rule with ID ${id} not found`);
      }
      
      return updatedRule;
    } catch (error) {
      console.error(`Error updating shipping rule with ID ${id}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update shipping rule');
    }
  }

  async deleteShippingRule(id: number): Promise<void> {
    try {
      await db.delete(shippingRules)
        .where(eq(shippingRules.id, id));
    } catch (error) {
      console.error(`Error deleting shipping rule with ID ${id}:`, error);
      throw new Error('Failed to delete shipping rule');
    }
  }

  // Seller Shipping Settings methods
  async getSellerShippingSettings(sellerId: number): Promise<SellerShippingSetting | undefined> {
    try {
      const [settings] = await db.select()
        .from(sellerShippingSettings)
        .where(eq(sellerShippingSettings.sellerId, sellerId));
      return settings;
    } catch (error) {
      console.error(`Error getting shipping settings for seller ID ${sellerId}:`, error);
      return undefined;
    }
  }

  async createSellerShippingSettings(settings: InsertSellerShippingSetting): Promise<SellerShippingSetting> {
    try {
      // Validate that the default shipping method exists if provided
      if (settings.defaultShippingMethodId) {
        const method = await this.getShippingMethodById(settings.defaultShippingMethodId);
        if (!method) {
          throw new Error(`Shipping method with ID ${settings.defaultShippingMethodId} not found`);
        }
      }

      // Check if settings already exist for this seller
      const existingSettings = await this.getSellerShippingSettings(settings.sellerId);
      if (existingSettings) {
        throw new Error(`Shipping settings for seller ID ${settings.sellerId} already exist`);
      }

      const [newSettings] = await db.insert(sellerShippingSettings)
        .values(settings)
        .returning();
      return newSettings;
    } catch (error) {
      console.error('Error creating seller shipping settings:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create seller shipping settings');
    }
  }

  async updateSellerShippingSettings(sellerId: number, settings: Partial<SellerShippingSetting>): Promise<SellerShippingSetting> {
    try {
      // Validate that the default shipping method exists if provided
      if (settings.defaultShippingMethodId) {
        const method = await this.getShippingMethodById(settings.defaultShippingMethodId);
        if (!method) {
          throw new Error(`Shipping method with ID ${settings.defaultShippingMethodId} not found`);
        }
      }

      // Check if settings exist for this seller
      const existingSettings = await this.getSellerShippingSettings(sellerId);
      if (!existingSettings) {
        // Create new settings if they don't exist
        return await this.createSellerShippingSettings({
          sellerId,
          enableCustomShipping: settings.enableCustomShipping ?? false,
          defaultShippingMethodId: settings.defaultShippingMethodId,
          freeShippingThreshold: settings.freeShippingThreshold,
          processingTime: settings.processingTime || "1-2 business days",
          shippingPolicy: settings.shippingPolicy,
          returnPolicy: settings.returnPolicy,
          internationalShipping: settings.internationalShipping ?? false
        });
      }

      // Update existing settings
      const [updatedSettings] = await db.update(sellerShippingSettings)
        .set(settings)
        .where(eq(sellerShippingSettings.sellerId, sellerId))
        .returning();
      
      if (!updatedSettings) {
        throw new Error(`Failed to update shipping settings for seller ID ${sellerId}`);
      }
      
      return updatedSettings;
    } catch (error) {
      console.error(`Error updating shipping settings for seller ID ${sellerId}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update seller shipping settings');
    }
  }

  // Product Shipping Overrides methods
  async getProductShippingOverrides(sellerId: number): Promise<ProductShippingOverride[]> {
    try {
      return await db.select()
        .from(productShippingOverrides)
        .where(eq(productShippingOverrides.sellerId, sellerId));
    } catch (error) {
      console.error(`Error getting product shipping overrides for seller ID ${sellerId}:`, error);
      return [];
    }
  }

  async getProductShippingOverrideById(id: number): Promise<ProductShippingOverride | undefined> {
    try {
      const [override] = await db.select()
        .from(productShippingOverrides)
        .where(eq(productShippingOverrides.id, id));
      return override;
    } catch (error) {
      console.error(`Error getting product shipping override with ID ${id}:`, error);
      return undefined;
    }
  }

  async getProductShippingOverrideByProduct(productId: number): Promise<ProductShippingOverride | undefined> {
    try {
      const [override] = await db.select()
        .from(productShippingOverrides)
        .where(eq(productShippingOverrides.productId, productId));
      return override;
    } catch (error) {
      console.error(`Error getting product shipping override for product ID ${productId}:`, error);
      return undefined;
    }
  }

  async createProductShippingOverride(override: InsertProductShippingOverride): Promise<ProductShippingOverride> {
    try {
      // Validate that the product exists
      const product = await this.getProduct(override.productId);
      if (!product) {
        throw new Error(`Product with ID ${override.productId} not found`);
      }

      // Check if the seller owns the product
      if (product.sellerId !== override.sellerId) {
        throw new Error(`Seller ID ${override.sellerId} does not own product ID ${override.productId}`);
      }

      // Check if an override already exists for this product
      const existingOverride = await this.getProductShippingOverrideByProduct(override.productId);
      if (existingOverride) {
        throw new Error(`Shipping override for product ID ${override.productId} already exists`);
      }

      const [newOverride] = await db.insert(productShippingOverrides)
        .values(override)
        .returning();
      return newOverride;
    } catch (error) {
      console.error('Error creating product shipping override:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create product shipping override');
    }
  }

  async updateProductShippingOverride(id: number, override: Partial<ProductShippingOverride>): Promise<ProductShippingOverride> {
    try {
      // Validate product ID if provided
      if (override.productId) {
        const product = await this.getProduct(override.productId);
        if (!product) {
          throw new Error(`Product with ID ${override.productId} not found`);
        }

        // If sellerId is provided, check that seller owns the product
        if (override.sellerId && product.sellerId !== override.sellerId) {
          throw new Error(`Seller ID ${override.sellerId} does not own product ID ${override.productId}`);
        }

        // If seller ID isn't being updated, ensure seller still owns the product
        const existingOverride = await this.getProductShippingOverrideById(id);
        if (existingOverride && !override.sellerId && product.sellerId !== existingOverride.sellerId) {
          throw new Error(`Current seller (ID ${existingOverride.sellerId}) does not own product ID ${override.productId}`);
        }
      }

      const [updatedOverride] = await db.update(productShippingOverrides)
        .set(override)
        .where(eq(productShippingOverrides.id, id))
        .returning();
      
      if (!updatedOverride) {
        throw new Error(`Product shipping override with ID ${id} not found`);
      }
      
      return updatedOverride;
    } catch (error) {
      console.error(`Error updating product shipping override with ID ${id}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update product shipping override');
    }
  }

  async deleteProductShippingOverride(id: number): Promise<void> {
    try {
      await db.delete(productShippingOverrides)
        .where(eq(productShippingOverrides.id, id));
    } catch (error) {
      console.error(`Error deleting product shipping override with ID ${id}:`, error);
      throw new Error('Failed to delete product shipping override');
    }
  }

  // Shipping Tracking methods
  async getShippingTracking(orderId: number): Promise<ShippingTracking | undefined> {
    try {
      const [tracking] = await db.select()
        .from(shippingTracking)
        .where(eq(shippingTracking.orderId, orderId));
      return tracking;
    } catch (error) {
      console.error(`Error getting shipping tracking for order ID ${orderId}:`, error);
      return undefined;
    }
  }

  async createShippingTracking(tracking: InsertShippingTracking): Promise<ShippingTracking> {
    try {
      // Validate that the order exists
      const order = await this.getOrder(tracking.orderId);
      if (!order) {
        throw new Error(`Order with ID ${tracking.orderId} not found`);
      }

      // Check if tracking already exists for this order
      const existingTracking = await this.getShippingTracking(tracking.orderId);
      if (existingTracking) {
        throw new Error(`Shipping tracking for order ID ${tracking.orderId} already exists`);
      }

      const [newTracking] = await db.insert(shippingTracking)
        .values(tracking)
        .returning();
      return newTracking;
    } catch (error) {
      console.error('Error creating shipping tracking:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create shipping tracking');
    }
  }

  async updateShippingTracking(id: number, tracking: Partial<ShippingTracking>): Promise<ShippingTracking> {
    try {
      // If orderId is being updated, validate that the order exists
      if (tracking.orderId) {
        const order = await this.getOrder(tracking.orderId);
        if (!order) {
          throw new Error(`Order with ID ${tracking.orderId} not found`);
        }
        
        // Check if tracking already exists for the new order
        const existingTracking = await this.getShippingTracking(tracking.orderId);
        if (existingTracking && existingTracking.id !== id) {
          throw new Error(`Shipping tracking for order ID ${tracking.orderId} already exists`);
        }
      }

      const [updatedTracking] = await db.update(shippingTracking)
        .set({
          ...tracking,
          updatedAt: new Date()
        })
        .where(eq(shippingTracking.id, id))
        .returning();
      
      if (!updatedTracking) {
        throw new Error(`Shipping tracking with ID ${id} not found`);
      }
      
      return updatedTracking;
    } catch (error) {
      console.error(`Error updating shipping tracking with ID ${id}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update shipping tracking');
    }
  }
  
  // For backward compatibility with existing code
  async getOrderShippingTracking(orderId: number): Promise<ShippingTracking | undefined> {
    return this.getShippingTracking(orderId);
  }

  async createOrderShippingTracking(tracking: InsertShippingTracking): Promise<ShippingTracking> {
    return this.createShippingTracking(tracking);
  }

  async updateOrderShippingTracking(id: number, tracking: Partial<ShippingTracking>): Promise<ShippingTracking> {
    return this.updateShippingTracking(id, tracking);
  }

  // Returns Management
  async getReturnsForSeller(sellerId: number): Promise<Return[]> {
    try {
      return await db.select().from(returns).where(eq(returns.sellerId, sellerId))
        .orderBy(desc(returns.returnDate));
    } catch (error) {
      console.error(`Error getting returns for seller ID ${sellerId}:`, error);
      return [];
    }
  }

  async getReturnById(id: number): Promise<Return | undefined> {
    try {
      const [returnData] = await db.select().from(returns).where(eq(returns.id, id));
      return returnData;
    } catch (error) {
      console.error(`Error getting return with ID ${id}:`, error);
      return undefined;
    }
  }

  async createReturn(returnData: InsertReturn): Promise<Return> {
    try {
      const [newReturn] = await db.insert(returns).values(returnData).returning();
      return newReturn;
    } catch (error) {
      console.error("Error creating return:", error);
      throw new Error("Failed to create return");
    }
  }

  async updateReturnStatus(id: number, returnStatus: string, refundStatus?: string): Promise<Return> {
    try {
      const updateData: any = { returnStatus, updatedAt: new Date() };
      if (refundStatus) {
        updateData.refundStatus = refundStatus;
        if (refundStatus === "processed") {
          updateData.refundDate = new Date();
        }
      }

      const [updatedReturn] = await db
        .update(returns)
        .set(updateData)
        .where(eq(returns.id, id))
        .returning();
      
      if (!updatedReturn) {
        throw new Error(`Return with ID ${id} not found`);
      }
      
      return updatedReturn;
    } catch (error) {
      console.error(`Error updating return status for ID ${id}:`, error);
      throw new Error("Failed to update return status");
    }
  }

  // Analytics Management
  async getSellerAnalytics(sellerId: number, startDate?: Date, endDate?: Date): Promise<SellerAnalytic[]> {
    try {
      let query = db.select().from(sellerAnalytics).where(eq(sellerAnalytics.sellerId, sellerId));
      
      if (startDate) {
        query = query.where(sql`${sellerAnalytics.date} >= ${startDate}`);
      }
      
      if (endDate) {
        query = query.where(sql`${sellerAnalytics.date} <= ${endDate}`);
      }
      
      return await query.orderBy(sellerAnalytics.date);
    } catch (error) {
      console.error(`Error getting analytics for seller ID ${sellerId}:`, error);
      return [];
    }
  }

  async createOrUpdateSellerAnalytics(data: InsertSellerAnalytic): Promise<SellerAnalytic> {
    try {
      // Check if there's an existing record for this date
      const [existing] = await db
        .select()
        .from(sellerAnalytics)
        .where(eq(sellerAnalytics.sellerId, data.sellerId))
        .where(sql`${sellerAnalytics.date} = ${data.date}`);
      
      if (existing) {
        // Update existing record
        const [updated] = await db
          .update(sellerAnalytics)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(sellerAnalytics.id, existing.id))
          .returning();
        
        return updated;
      } else {
        // Create new record
        const [newRecord] = await db
          .insert(sellerAnalytics)
          .values(data)
          .returning();
        
        return newRecord;
      }
    } catch (error) {
      console.error("Error creating/updating analytics:", error);
      throw new Error("Failed to create/update analytics");
    }
  }

  // Payments Management
  async getSellerPayments(sellerId: number): Promise<SellerPayment[]> {
    try {
      return await db
        .select()
        .from(sellerPayments)
        .where(eq(sellerPayments.sellerId, sellerId))
        .orderBy(desc(sellerPayments.createdAt));
    } catch (error) {
      console.error(`Error getting payments for seller ID ${sellerId}:`, error);
      return [];
    }
  }

  async getSellerPaymentById(id: number): Promise<SellerPayment | undefined> {
    try {
      const [payment] = await db
        .select()
        .from(sellerPayments)
        .where(eq(sellerPayments.id, id));
      
      return payment;
    } catch (error) {
      console.error(`Error getting payment with ID ${id}:`, error);
      return undefined;
    }
  }

  async createSellerPayment(paymentData: InsertSellerPayment): Promise<SellerPayment> {
    try {
      const [newPayment] = await db
        .insert(sellerPayments)
        .values(paymentData)
        .returning();
      
      return newPayment;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw new Error("Failed to create payment");
    }
  }

  async updateSellerPayment(id: number, paymentData: Partial<InsertSellerPayment>): Promise<SellerPayment> {
    try {
      const [updatedPayment] = await db
        .update(sellerPayments)
        .set({
          ...paymentData,
          updatedAt: new Date()
        })
        .where(eq(sellerPayments.id, id))
        .returning();
      
      if (!updatedPayment) {
        throw new Error(`Payment with ID ${id} not found`);
      }
      
      return updatedPayment;
    } catch (error) {
      console.error(`Error updating payment with ID ${id}:`, error);
      throw new Error("Failed to update payment");
    }
  }

  // Settings Management
  async getSellerSettings(sellerId: number): Promise<SellerSetting | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(sellerSettings)
        .where(eq(sellerSettings.sellerId, sellerId));
      
      return settings;
    } catch (error) {
      console.error(`Error getting settings for seller ID ${sellerId}:`, error);
      return undefined;
    }
  }

  async createOrUpdateSellerSettings(sellerId: number, settingsData: Partial<InsertSellerSetting>): Promise<SellerSetting> {
    try {
      // Check if settings exist
      const existingSettings = await this.getSellerSettings(sellerId);
      
      if (existingSettings) {
        // Update existing settings
        const [updatedSettings] = await db
          .update(sellerSettings)
          .set({
            ...settingsData,
            updatedAt: new Date()
          })
          .where(eq(sellerSettings.id, existingSettings.id))
          .returning();
        
        return updatedSettings;
      } else {
        // Create new settings
        const [newSettings] = await db
          .insert(sellerSettings)
          .values({
            sellerId,
            ...settingsData
          })
          .returning();
        
        return newSettings;
      }
    } catch (error) {
      console.error(`Error creating/updating settings for seller ID ${sellerId}:`, error);
      throw new Error("Failed to create/update settings");
    }
  }

  // Support Management
  async getSellerSupportTickets(userId: number): Promise<SupportTicket[]> {
    try {
      return await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId))
        .orderBy(desc(supportTickets.createdAt));
    } catch (error) {
      console.error(`Error getting support tickets for user ID ${userId}:`, error);
      return [];
    }
  }

  async getSupportTicketById(id: number): Promise<SupportTicket | undefined> {
    try {
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, id));
      
      return ticket;
    } catch (error) {
      console.error(`Error getting support ticket with ID ${id}:`, error);
      return undefined;
    }
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    try {
      const [newTicket] = await db
        .insert(supportTickets)
        .values(ticketData)
        .returning();
      
      return newTicket;
    } catch (error) {
      console.error("Error creating support ticket:", error);
      throw new Error("Failed to create support ticket");
    }
  }

  async updateSupportTicket(id: number, ticketData: Partial<InsertSupportTicket>): Promise<SupportTicket> {
    try {
      const [updatedTicket] = await db
        .update(supportTickets)
        .set({
          ...ticketData,
          updatedAt: new Date()
        })
        .where(eq(supportTickets.id, id))
        .returning();
      
      if (!updatedTicket) {
        throw new Error(`Support ticket with ID ${id} not found`);
      }
      
      return updatedTicket;
    } catch (error) {
      console.error(`Error updating support ticket with ID ${id}:`, error);
      throw new Error("Failed to update support ticket");
    }
  }

  async getSupportMessages(ticketId: number): Promise<SupportMessage[]> {
    try {
      return await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.ticketId, ticketId))
        .orderBy(supportMessages.createdAt);
    } catch (error) {
      console.error(`Error getting support messages for ticket ID ${ticketId}:`, error);
      return [];
    }
  }

  async createSupportMessage(messageData: InsertSupportMessage): Promise<SupportMessage> {
    try {
      const [newMessage] = await db
        .insert(supportMessages)
        .values(messageData)
        .returning();
      
      // Update the ticket's updatedAt time
      await db
        .update(supportTickets)
        .set({ updatedAt: new Date() })
        .where(eq(supportTickets.id, messageData.ticketId));
      
      return newMessage;
    } catch (error) {
      console.error("Error creating support message:", error);
      throw new Error("Failed to create support message");
    }
  }

  // ========== Rewards Methods ==========
  async getUserRewards(userId: number): Promise<SelectReward | undefined> {
    try {
      const [userRewards] = await db.select()
        .from(rewards)
        .where(eq(rewards.userId, userId));
      return userRewards;
    } catch (error) {
      console.error(`Error getting user rewards: ${error}`);
      throw error;
    }
  }

  async createUserRewards(data: InsertReward): Promise<SelectReward> {
    try {
      const [userRewards] = await db.insert(rewards).values(data).returning();
      return userRewards;
    } catch (error) {
      console.error(`Error creating user rewards: ${error}`);
      throw error;
    }
  }

  async updateUserRewards(userId: number, data: Partial<InsertReward>): Promise<SelectReward> {
    try {
      const [userRewards] = await db.update(rewards)
        .set({
          ...data,
          lastUpdated: new Date()
        })
        .where(eq(rewards.userId, userId))
        .returning();
      return userRewards;
    } catch (error) {
      console.error(`Error updating user rewards: ${error}`);
      throw error;
    }
  }

  async getUserRewardTransactions(userId: number, page: number = 1, limit: number = 10): Promise<{ transactions: SelectRewardTransaction[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const transactions = await db.select()
        .from(rewardTransactions)
        .where(eq(rewardTransactions.userId, userId))
        .orderBy(desc(rewardTransactions.transactionDate))
        .limit(limit)
        .offset(offset);
      
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(rewardTransactions)
        .where(eq(rewardTransactions.userId, userId));
      
      return {
        transactions,
        total: Number(count)
      };
    } catch (error) {
      console.error(`Error getting user reward transactions: ${error}`);
      throw error;
    }
  }

  async createRewardTransaction(data: InsertRewardTransaction): Promise<SelectRewardTransaction> {
    try {
      const [transaction] = await db.insert(rewardTransactions).values(data).returning();
      return transaction;
    } catch (error) {
      console.error(`Error creating reward transaction: ${error}`);
      throw error;
    }
  }

  async getRewardRules(): Promise<SelectRewardRule[]> {
    try {
      return await db.select().from(rewardRules);
    } catch (error) {
      console.error(`Error getting reward rules: ${error}`);
      throw error;
    }
  }

  async getRewardRule(id: number): Promise<SelectRewardRule | undefined> {
    try {
      const [rule] = await db.select()
        .from(rewardRules)
        .where(eq(rewardRules.id, id));
      return rule;
    } catch (error) {
      console.error(`Error getting reward rule: ${error}`);
      throw error;
    }
  }

  async createRewardRule(data: InsertRewardRule): Promise<SelectRewardRule> {
    try {
      const [rule] = await db.insert(rewardRules).values(data).returning();
      return rule;
    } catch (error) {
      console.error(`Error creating reward rule: ${error}`);
      throw error;
    }
  }

  async updateRewardRule(id: number, data: Partial<InsertRewardRule>): Promise<SelectRewardRule> {
    try {
      const [rule] = await db.update(rewardRules)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(rewardRules.id, id))
        .returning();
      return rule;
    } catch (error) {
      console.error(`Error updating reward rule: ${error}`);
      throw error;
    }
  }

  async deleteRewardRule(id: number): Promise<void> {
    try {
      await db.delete(rewardRules).where(eq(rewardRules.id, id));
    } catch (error) {
      console.error(`Error deleting reward rule: ${error}`);
      throw error;
    }
  }

  async getRewardStatistics(): Promise<{ totalPointsIssued: number, totalPointsRedeemed: number, activeUsers: number }> {
    try {
      // Get total points issued (positive transactions)
      const [issuedResult] = await db.select({
        total: sql<number>`sum(points)`
      })
      .from(rewardTransactions)
      .where(sql`points > 0`);
      
      // Get total points redeemed (negative transactions)
      const [redeemedResult] = await db.select({
        total: sql<number>`sum(abs(points))`
      })
      .from(rewardTransactions)
      .where(sql`points < 0`);
      
      // Get count of users with reward accounts
      const [usersResult] = await db.select({
        count: sql<number>`count(*)`
      })
      .from(rewards);
      
      return {
        totalPointsIssued: Number(issuedResult?.total || 0),
        totalPointsRedeemed: Number(redeemedResult?.total || 0),
        activeUsers: Number(usersResult?.count || 0)
      };
    } catch (error) {
      console.error(`Error getting reward statistics: ${error}`);
      throw error;
    }
  }

  // ========== Gift Card Methods ==========
  async getAllGiftCards(page: number = 1, limit: number = 10): Promise<{ giftCards: SelectGiftCard[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const giftCards = await db.select()
        .from(giftCards)
        .orderBy(desc(giftCards.createdAt))
        .limit(limit)
        .offset(offset);
      
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(giftCards);
      
      return {
        giftCards,
        total: Number(count)
      };
    } catch (error) {
      console.error(`Error getting all gift cards: ${error}`);
      throw error;
    }
  }

  async getUserGiftCards(userId: number): Promise<SelectGiftCard[]> {
    try {
      return await db.select()
        .from(giftCards)
        .where(or(
          eq(giftCards.issuedTo, userId),
          eq(giftCards.purchasedBy, userId)
        ))
        .orderBy(desc(giftCards.createdAt));
    } catch (error) {
      console.error(`Error getting user gift cards: ${error}`);
      throw error;
    }
  }

  async getGiftCard(id: number): Promise<SelectGiftCard | undefined> {
    try {
      const [giftCard] = await db.select()
        .from(giftCards)
        .where(eq(giftCards.id, id));
      return giftCard;
    } catch (error) {
      console.error(`Error getting gift card: ${error}`);
      throw error;
    }
  }

  async getGiftCardByCode(code: string): Promise<SelectGiftCard | undefined> {
    try {
      const [giftCard] = await db.select()
        .from(giftCards)
        .where(eq(giftCards.code, code));
      return giftCard;
    } catch (error) {
      console.error(`Error getting gift card by code: ${error}`);
      throw error;
    }
  }

  async createGiftCard(data: InsertGiftCard): Promise<SelectGiftCard> {
    try {
      const [giftCard] = await db.insert(giftCards).values(data).returning();
      return giftCard;
    } catch (error) {
      console.error(`Error creating gift card: ${error}`);
      throw error;
    }
  }

  async updateGiftCard(id: number, data: Partial<InsertGiftCard>): Promise<SelectGiftCard> {
    try {
      const [giftCard] = await db.update(giftCards)
        .set(data)
        .where(eq(giftCards.id, id))
        .returning();
      return giftCard;
    } catch (error) {
      console.error(`Error updating gift card: ${error}`);
      throw error;
    }
  }

  async createGiftCardTransaction(data: InsertGiftCardTransaction): Promise<SelectGiftCardTransaction> {
    try {
      const [transaction] = await db.insert(giftCardTransactions).values(data).returning();
      return transaction;
    } catch (error) {
      console.error(`Error creating gift card transaction: ${error}`);
      throw error;
    }
  }

  async getGiftCardTemplates(): Promise<SelectGiftCardTemplate[]> {
    try {
      return await db.select().from(giftCardTemplates);
    } catch (error) {
      console.error(`Error getting gift card templates: ${error}`);
      throw error;
    }
  }

  async getGiftCardTemplate(id: number): Promise<SelectGiftCardTemplate | undefined> {
    try {
      const [template] = await db.select()
        .from(giftCardTemplates)
        .where(eq(giftCardTemplates.id, id));
      return template;
    } catch (error) {
      console.error(`Error getting gift card template: ${error}`);
      throw error;
    }
  }

  async createGiftCardTemplate(data: InsertGiftCardTemplate): Promise<SelectGiftCardTemplate> {
    try {
      const [template] = await db.insert(giftCardTemplates).values(data).returning();
      return template;
    } catch (error) {
      console.error(`Error creating gift card template: ${error}`);
      throw error;
    }
  }

  async updateGiftCardTemplate(id: number, data: Partial<InsertGiftCardTemplate>): Promise<SelectGiftCardTemplate> {
    try {
      const [template] = await db.update(giftCardTemplates)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(giftCardTemplates.id, id))
        .returning();
      return template;
    } catch (error) {
      console.error(`Error updating gift card template: ${error}`);
      throw error;
    }
  }

  async deleteGiftCardTemplate(id: number): Promise<void> {
    try {
      await db.delete(giftCardTemplates).where(eq(giftCardTemplates.id, id));
    } catch (error) {
      console.error(`Error deleting gift card template: ${error}`);
      throw error;
    }
  }

  // Wallet Methods Implementation
  async getWalletSettings(): Promise<SelectWalletSettings | null> {
    try {
      const [settings] = await db.select().from(walletSettings).limit(1);
      return settings || null;
    } catch (error) {
      console.error('Error getting wallet settings:', error);
      return null;
    }
  }

  async updateWalletSettings(settingsData: Partial<SelectWalletSettings>): Promise<SelectWalletSettings> {
    try {
      const [settings] = await db.select().from(walletSettings).limit(1);
      
      if (!settings) {
        // Create settings if none exist
        const [newSettings] = await db.insert(walletSettings).values({
          ...settingsData,
          updatedAt: new Date(),
        }).returning();
        return newSettings;
      }
      
      // Update existing settings
      const [updatedSettings] = await db
        .update(walletSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(walletSettings.id, settings.id))
        .returning();
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating wallet settings:', error);
      throw error;
    }
  }

  async getUserWallet(userId: number): Promise<SelectWallet | null> {
    try {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId));
      
      return wallet || null;
    } catch (error) {
      console.error(`Error getting wallet for user ${userId}:`, error);
      return null;
    }
  }

  async createUserWalletIfNotExists(userId: number): Promise<SelectWallet> {
    try {
      let wallet = await this.getUserWallet(userId);
      
      if (!wallet) {
        const [newWallet] = await db
          .insert(wallets)
          .values({
            userId,
            balance: 0,
            lifetimeEarned: 0,
            lifetimeRedeemed: 0,
          })
          .returning();
        
        wallet = newWallet;
      }
      
      return wallet;
    } catch (error) {
      console.error(`Error creating wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async addCoinsToWallet(
    userId: number, 
    amount: number, 
    referenceType: string, 
    referenceId?: number, 
    description?: string
  ): Promise<SelectWallet> {
    try {
      // Get or create wallet
      const wallet = await this.createUserWalletIfNotExists(userId);
      
      // Check wallet settings for coin expiry
      const settings = await this.getWalletSettings();
      const expiryDays = settings?.coinExpiryDays || 90;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      
      // Start transaction
      return await db.transaction(async (trx) => {
        // Add transaction record
        await trx.insert(walletTransactions).values({
          walletId: wallet.id,
          amount,
          transactionType: 'CREDIT',
          referenceType,
          referenceId,
          description,
          expiresAt,
        });
        
        // Update wallet balance
        const [updatedWallet] = await trx
          .update(wallets)
          .set({
            balance: wallet.balance + amount,
            lifetimeEarned: wallet.lifetimeEarned + amount,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id))
          .returning();
        
        return updatedWallet;
      });
    } catch (error) {
      console.error(`Error adding coins to wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async redeemCoinsFromWallet(
    userId: number,
    amount: number,
    referenceType: string,
    referenceId?: number,
    description?: string
  ): Promise<{ wallet: SelectWallet, discountAmount: number }> {
    try {
      // Get wallet and settings
      const wallet = await this.getUserWallet(userId);
      const settings = await this.getWalletSettings();
      
      if (!wallet || !settings || !settings.isEnabled) {
        throw new Error('Wallet not found or feature disabled');
      }
      
      // Validate amount is within limits
      if (amount > wallet.balance) {
        throw new Error('Insufficient coins in wallet');
      }
      
      if (amount > settings.maxRedeemableCoins) {
        throw new Error(`Maximum redeemable coins is ${settings.maxRedeemableCoins}`);
      }
      
      // Calculate discount amount based on coin-to-currency ratio
      const discountAmount = parseFloat((amount * parseFloat(settings.coinToCurrencyRatio.toString())).toFixed(2));
      
      // Start transaction
      const updatedWallet = await db.transaction(async (trx) => {
        // Add transaction record
        await trx.insert(walletTransactions).values({
          walletId: wallet.id,
          amount: -amount, // Negative amount for deduction
          transactionType: 'DEBIT',
          referenceType,
          referenceId,
          description,
        });
        
        // Update wallet balance
        const [updatedWallet] = await trx
          .update(wallets)
          .set({
            balance: wallet.balance - amount,
            lifetimeRedeemed: wallet.lifetimeRedeemed + amount,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id))
          .returning();
        
        return updatedWallet;
      });
      
      return {
        wallet: updatedWallet,
        discountAmount
      };
    } catch (error) {
      console.error(`Error redeeming coins from wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserWalletTransactions(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: SelectWalletTransaction[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      // Get user wallet
      const wallet = await this.getUserWallet(userId);
      if (!wallet) {
        return { transactions: [], total: 0 };
      }
      
      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id));
      
      const total = Number(totalResult[0]?.count) || 0;
      
      // Get transactions with pagination
      const transactions = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(limit)
        .offset(offset);
      
      return {
        transactions,
        total
      };
    } catch (error) {
      console.error(`Error getting wallet transactions for user ${userId}:`, error);
      return { transactions: [], total: 0 };
    }
  }

  async processFirstPurchaseReward(userId: number, orderId: number): Promise<SelectWallet | null> {
    try {
      // Check if this is the user's first purchase
      const wallet = await this.getUserWallet(userId);
      if (!wallet) {
        return null;
      }

      const transactions = await db
        .select()
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.walletId, wallet.id),
            eq(walletTransactions.referenceType, 'FIRST_PURCHASE')
          )
        );
      
      // If user already has a first purchase reward, don't give another
      if (transactions.length > 0) {
        return null;
      }
      
      // Get wallet settings
      const settings = await this.getWalletSettings();
      if (!settings || !settings.isEnabled) {
        return null;
      }
      
      // Add first purchase reward
      const coinsToAdd = settings.firstPurchaseCoins;
      const description = 'First purchase reward';
      
      return await this.addCoinsToWallet(
        userId,
        coinsToAdd,
        'FIRST_PURCHASE',
        orderId,
        description
      );
    } catch (error) {
      console.error(`Error processing first purchase reward for user ${userId}:`, error);
      return null;
    }
  }

  async processExpiredCoins(): Promise<number> {
    try {
      const now = new Date();
      let expiredCoinsCount = 0;
      
      // Find all transactions with coins that have expired
      const expiredTransactions = await db
        .select()
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.transactionType, 'CREDIT'),
            sql`${walletTransactions.expiresAt} IS NOT NULL`,
            sql`${walletTransactions.expiresAt} <= ${now}`,
            // Only include transactions that haven't been marked as expired yet
            sql`NOT EXISTS (
              SELECT 1 FROM ${walletTransactions} as wt
              WHERE wt.reference_type = 'EXPIRED'
              AND wt.reference_id = ${walletTransactions.id}
            )`
          )
        );
      
      // Process each expired transaction
      for (const transaction of expiredTransactions) {
        await db.transaction(async (trx) => {
          // Create an "EXPIRED" transaction that references the original
          await trx.insert(walletTransactions).values({
            walletId: transaction.walletId,
            amount: -transaction.amount, // Negative amount to reverse the credit
            transactionType: 'EXPIRED',
            referenceType: 'EXPIRED',
            referenceId: transaction.id,
            description: `Expired coins from transaction #${transaction.id}`,
          });
          
          // Update wallet balance
          const [wallet] = await trx
            .select()
            .from(wallets)
            .where(eq(wallets.id, transaction.walletId));
          
          if (wallet) {
            await trx
              .update(wallets)
              .set({
                balance: Math.max(0, wallet.balance - transaction.amount), // Ensure balance doesn't go negative
                updatedAt: new Date(),
              })
              .where(eq(wallets.id, transaction.walletId));
            
            expiredCoinsCount += transaction.amount;
          }
        });
      }
      
      return expiredCoinsCount;
    } catch (error) {
      console.error('Error processing expired coins:', error);
      return 0;
    }
  }

  async manualAdjustWallet(
    userId: number,
    amount: number,
    description: string
  ): Promise<SelectWallet> {
    try {
      if (amount === 0) {
        throw new Error('Adjustment amount cannot be zero');
      }
      
      const wallet = await this.createUserWalletIfNotExists(userId);
      
      return await db.transaction(async (trx) => {
        // Add transaction record
        await trx.insert(walletTransactions).values({
          walletId: wallet.id,
          amount,
          transactionType: amount > 0 ? 'CREDIT' : 'DEBIT',
          referenceType: 'MANUAL_ADJUSTMENT',
          description,
        });
        
        // Update wallet balance
        const [updatedWallet] = await trx
          .update(wallets)
          .set({
            balance: wallet.balance + amount,
            lifetimeEarned: amount > 0 ? wallet.lifetimeEarned + amount : wallet.lifetimeEarned,
            lifetimeRedeemed: amount < 0 ? wallet.lifetimeRedeemed - amount : wallet.lifetimeRedeemed,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id))
          .returning();
        
        return updatedWallet;
      });
    } catch (error) {
      console.error(`Error making manual adjustment to wallet for user ${userId}:`, error);
      throw error;
    }
  }
  
  async getUsersWithWallets(): Promise<Array<{id: number; username: string; balance: number;}>> {
    try {
      const result = await db
        .select({
          id: users.id,
          username: users.username,
          balance: wallets.balance,
        })
        .from(wallets)
        .innerJoin(users, eq(wallets.userId, users.id))
        .orderBy(users.id);
        
      return result;
    } catch (error) {
      console.error('Error fetching users with wallets:', error);
      throw new Error('Failed to fetch users with wallets');
    }
  }
}

export const storage = new DatabaseStorage();