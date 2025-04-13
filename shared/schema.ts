import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with role
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("buyer"),
  name: text("name"),
  phone: text("phone"),
  address: text("address"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  name: true,
  phone: true,
  address: true,
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  specifications: text("specifications"), // Technical specifications
  purchasePrice: integer("purchase_price"), // Purchase Price (cost price)
  price: integer("price").notNull(),
  category: text("category").notNull(),
  color: text("color"), // Product color
  size: text("size"), // Product size
  imageUrl: text("image_url").notNull(),
  images: text("images"), // Additional images as JSON string
  sellerId: integer("seller_id").notNull().references(() => users.id),
  stock: integer("stock").notNull().default(0),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  specifications: true,
  purchasePrice: true,
  price: true,
  category: true,
  color: true,
  size: true,
  imageUrl: true,
  images: true,
  sellerId: true,
  stock: true,
  approved: true,
});

// Cart schema
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
});

export const insertCartSchema = createInsertSchema(carts).pick({
  userId: true,
  productId: true,
  quantity: true,
});

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  total: integer("total").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  shippingDetails: text("shipping_details"), // Stored as JSON string
  paymentMethod: text("payment_method").notNull().default("cod"),
  paymentId: text("payment_id"), // For Razorpay paymentId
  orderId: text("order_id"), // For Razorpay orderId
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  status: true,
  total: true,
  date: true,
  shippingDetails: true,
  paymentMethod: true,
  paymentId: true,
  orderId: true,
});

// OrderItem schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  price: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  carts: many(carts),
  orders: many(orders),
  reviews: many(reviews),
  reviewHelpfulVotes: many(reviewHelpful),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  cartItems: many(carts),
  orderItems: many(orderItems),
  reviews: many(reviews),
}));

export const cartsRelations = relations(carts, ({ one }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [carts.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  reviews: many(reviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// User OTP table for passwordless authentication
export const userOtps = pgTable("user_otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserOtpSchema = createInsertSchema(userOtps).pick({
  email: true,
  otp: true,
  expiresAt: true,
  verified: true,
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  image: text("image").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  image: true,
  displayOrder: true,
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  orderId: integer("order_id").references(() => orders.id), // Optional - to verify purchase
  rating: integer("rating").notNull(), // 1-5 star rating
  review: text("review"), // Text review (optional)
  title: text("title"), // Review title/headline (optional)
  verifiedPurchase: boolean("verified_purchase").notNull().default(false),
  status: text("status").notNull().default("published"), // published, pending, rejected
  helpfulCount: integer("helpful_count").notNull().default(0), // Number of users who found this helpful
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  productId: true,
  orderId: true,
  rating: true,
  review: true,
  title: true,
  verifiedPurchase: true,
  status: true,
});

// Review Images table (for photo reviews)
export const reviewImages = pgTable("review_images", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewImageSchema = createInsertSchema(reviewImages).pick({
  reviewId: true,
  imageUrl: true,
});

// Review Helpful Votes (to track which users found which reviews helpful)
export const reviewHelpful = pgTable("review_helpful", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewHelpfulSchema = createInsertSchema(reviewHelpful).pick({
  reviewId: true,
  userId: true,
});

// Relations for reviews
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  images: many(reviewImages),
  helpfulVotes: many(reviewHelpful),
}));

export const reviewImagesRelations = relations(reviewImages, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewImages.reviewId],
    references: [reviews.id],
  }),
}));

export const reviewHelpfulRelations = relations(reviewHelpful, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewHelpful.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewHelpful.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type UserOtp = typeof userOtps.$inferSelect;
export type InsertUserOtp = z.infer<typeof insertUserOtpSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ReviewImage = typeof reviewImages.$inferSelect;
export type InsertReviewImage = z.infer<typeof insertReviewImageSchema>;

export type ReviewHelpful = typeof reviewHelpful.$inferSelect;
export type InsertReviewHelpful = z.infer<typeof insertReviewHelpfulSchema>;

// User Activity Tracking for AI Assistant
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Can be null for anonymous sessions
  sessionId: text("session_id").notNull(), // For tracking anonymous users
  activityType: text("activity_type").notNull(), // view, search, add_to_cart, purchase, etc.
  productId: integer("product_id").references(() => products.id),
  categoryId: integer("category_id").references(() => categories.id),
  searchQuery: text("search_query"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  additionalData: text("additional_data"), // JSON string with additional context
});

export const insertUserActivitySchema = createInsertSchema(userActivities).pick({
  userId: true,
  sessionId: true,
  activityType: true,
  productId: true,
  categoryId: true,
  searchQuery: true,
  additionalData: true,
});

// Product Relationships for Complementary Products
export const productRelationships = pgTable("product_relationships", {
  id: serial("id").primaryKey(),
  sourceProductId: integer("source_product_id").notNull().references(() => products.id),
  relatedProductId: integer("related_product_id").notNull().references(() => products.id),
  relationshipType: text("relationship_type").notNull(), // complementary, similar, bundle, etc.
  strength: doublePrecision("strength").notNull().default(1.0), // Relation strength (higher = stronger relationship)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductRelationshipSchema = createInsertSchema(productRelationships).pick({
  sourceProductId: true,
  relatedProductId: true,
  relationshipType: true,
  strength: true,
});

// AI Assistant Conversations
export const aiAssistantConversations = pgTable("ai_assistant_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").references(() => products.id), // Optional - if about a specific product
  categoryId: integer("category_id").references(() => categories.id), // Optional - if about a specific category
  conversationHistory: text("conversation_history").notNull(), // JSON string of messages
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAiAssistantConversationSchema = createInsertSchema(aiAssistantConversations).pick({
  userId: true,
  sessionId: true,
  productId: true,
  categoryId: true,
  conversationHistory: true,
});

// Size Preferences for Size Recommendations
export const userSizePreferences = pgTable("user_size_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: text("category").notNull(), // clothing, shoes, etc.
  size: text("size").notNull(), // S, M, L, 42, etc.
  fit: text("fit"), // slim, regular, loose, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSizePreferenceSchema = createInsertSchema(userSizePreferences).pick({
  userId: true,
  category: true,
  size: true,
  fit: true,
});

// Relations for new tables
export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userActivities.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [userActivities.categoryId],
    references: [categories.id],
  }),
}));

export const productRelationshipsRelations = relations(productRelationships, ({ one }) => ({
  sourceProduct: one(products, {
    fields: [productRelationships.sourceProductId],
    references: [products.id],
  }),
  relatedProduct: one(products, {
    fields: [productRelationships.relatedProductId],
    references: [products.id],
  }),
}));

export const aiAssistantConversationsRelations = relations(aiAssistantConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiAssistantConversations.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [aiAssistantConversations.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [aiAssistantConversations.categoryId],
    references: [categories.id],
  }),
}));

export const userSizePreferencesRelations = relations(userSizePreferences, ({ one }) => ({
  user: one(users, {
    fields: [userSizePreferences.userId],
    references: [users.id],
  }),
}));

// Add relationships to existing tables
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

export type ProductRelationship = typeof productRelationships.$inferSelect;
export type InsertProductRelationship = z.infer<typeof insertProductRelationshipSchema>;

export type AiAssistantConversation = typeof aiAssistantConversations.$inferSelect;
export type InsertAiAssistantConversation = z.infer<typeof insertAiAssistantConversationSchema>;

export type UserSizePreference = typeof userSizePreferences.$inferSelect;
export type InsertUserSizePreference = z.infer<typeof insertUserSizePreferenceSchema>;