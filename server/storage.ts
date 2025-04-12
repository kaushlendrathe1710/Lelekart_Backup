import { 
  users, User, InsertUser,
  products, Product, InsertProduct,
  carts, Cart, InsertCart,
  orders, Order, InsertOrder,
  orderItems, OrderItem, InsertOrderItem
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

  // Product operations
  getProducts(category?: string, sellerId?: number, approved?: boolean): Promise<Product[]>;
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

  async getProducts(category?: string, sellerId?: number, approved?: boolean): Promise<Product[]> {
    let query = db.select().from(products);
    
    // Build the where conditions
    const conditions = [];
    
    if (category) {
      conditions.push(eq(products.category, category));
    }
    
    if (sellerId) {
      conditions.push(eq(products.sellerId, sellerId));
    }
    
    if (approved !== undefined) {
      conditions.push(eq(products.approved, approved));
    }
    
    // Apply the conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query;
    return result;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const productToInsert = {
      ...insertProduct,
      approved: insertProduct.approved ?? false
    };
    
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
    
    // Create a properly typed order object
    const orderData = {
      userId: orderToInsert.userId,
      status: orderToInsert.status,
      total: orderToInsert.total,
      date: orderToInsert.date,
      shippingDetails: orderToInsert.shippingDetails
    };
    
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

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(insertOrderItem)
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
}

export const storage = new DatabaseStorage();