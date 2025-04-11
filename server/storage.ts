import { 
  users, User, InsertUser,
  products, Product, InsertProduct,
  carts, Cart, InsertCart,
  orders, Order, InsertOrder,
  orderItems, OrderItem, InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private carts: Map<number, Cart>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;

  private userIdCounter: number;
  private productIdCounter: number;
  private cartIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;

  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.carts = new Map();
    this.orders = new Map();
    this.orderItems = new Map();

    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.cartIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });

    // Create admin user
    this.createInitialUsers();
    
    // Create sample products
    this.createSampleProducts();
  }

  private async createInitialUsers() {
    // Admin user
    await this.createUser({
      username: "admin",
      password: "$2b$10$rQ5ZG1WAR0d25r2Riil1MOwE1kGxnpvLK2p1sDI6FrfDwtdpn.U/6", // "admin123"
      email: "admin@flipkart.com",
      role: "admin",
      name: "Admin User",
      phone: "1234567890",
      address: "Flipkart HQ, Bengaluru"
    });

    // Seller user
    await this.createUser({
      username: "seller",
      password: "$2b$10$rQ5ZG1WAR0d25r2Riil1MOwE1kGxnpvLK2p1sDI6FrfDwtdpn.U/6", // "seller123"
      email: "seller@flipkart.com",
      role: "seller",
      name: "Seller User",
      phone: "9876543210",
      address: "Seller Address, Mumbai"
    });

    // Buyer user
    await this.createUser({
      username: "buyer",
      password: "$2b$10$rQ5ZG1WAR0d25r2Riil1MOwE1kGxnpvLK2p1sDI6FrfDwtdpn.U/6", // "buyer123"
      email: "buyer@example.com",
      role: "buyer",
      name: "Buyer User",
      phone: "7890123456",
      address: "Buyer Address, Delhi"
    });
  }

  private createSampleProducts() {
    // Electronic products
    const electronics = [
      {
        name: "Premium Smartphone",
        description: "High-end smartphone with advanced features",
        price: 12999,
        category: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 50,
        isApproved: true
      },
      {
        name: "Gaming Laptop",
        description: "Powerful laptop with dedicated graphics",
        price: 58990,
        category: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 20,
        isApproved: true
      },
      {
        name: "Wireless Headphones",
        description: "Premium sound quality with noise cancellation",
        price: 2499,
        category: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 100,
        isApproved: true
      },
      {
        name: "Smart Watch",
        description: "Track your fitness and stay connected",
        price: 3595,
        category: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 45,
        isApproved: true
      },
      {
        name: "4K Smart TV",
        description: "Ultra HD display with smart features",
        price: 29999,
        category: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1525598912003-663126343e1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 15,
        isApproved: true
      },
      {
        name: "Wireless Earbuds",
        description: "True wireless with long battery life",
        price: 999,
        category: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1625895197185-efcec01cffe0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 80,
        isApproved: true
      }
    ];

    // Fashion products
    const fashion = [
      {
        name: "Running Shoes",
        description: "Lightweight and durable running shoes",
        price: 1999,
        category: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 75,
        isApproved: true
      },
      {
        name: "Men's Casual Shirt",
        description: "Comfortable cotton casual shirt",
        price: 599,
        category: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 120,
        isApproved: true
      },
      {
        name: "Women's Dresses",
        description: "Elegant dress for all occasions",
        price: 899,
        category: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 65,
        isApproved: true
      },
      {
        name: "Premium Watches",
        description: "Stylish watches for men and women",
        price: 1299,
        category: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 40,
        isApproved: true
      },
      {
        name: "Designer Handbags",
        description: "Premium quality handbags",
        price: 799,
        category: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 55,
        isApproved: true
      },
      {
        name: "Trendy Sunglasses",
        description: "UV protection stylish sunglasses",
        price: 399,
        category: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1610020057504-e7160c08679c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 90,
        isApproved: true
      }
    ];

    // Home products
    const home = [
      {
        name: "Coffee Maker",
        description: "Automatic coffee maker for perfect brew",
        price: 1999,
        category: "Home",
        imageUrl: "https://images.unsplash.com/photo-1543248939-4296e1fea89b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 30,
        isApproved: true
      },
      {
        name: "Kitchen Utensils",
        description: "Complete set of kitchen tools",
        price: 499,
        category: "Home",
        imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 85,
        isApproved: true
      },
      {
        name: "Luxury Bedsheets",
        description: "Soft and comfortable bedsheets",
        price: 899,
        category: "Home",
        imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 60,
        isApproved: true
      },
      {
        name: "Indoor Plants",
        description: "Low maintenance indoor plants",
        price: 349,
        category: "Home",
        imageUrl: "https://images.unsplash.com/photo-1518436935151-68389371a1e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 70,
        isApproved: true
      },
      {
        name: "Wall Decor",
        description: "Modern wall decoration items",
        price: 299,
        category: "Home",
        imageUrl: "https://images.unsplash.com/photo-1594225841581-91db3fbcabe6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 100,
        isApproved: true
      },
      {
        name: "Storage Solutions",
        description: "Space-saving storage containers",
        price: 199,
        category: "Home",
        imageUrl: "https://images.unsplash.com/photo-1569397288884-4d43d6738fbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        sellerId: 2,
        stock: 110,
        isApproved: true
      }
    ];

    // Add all products
    [...electronics, ...fashion, ...home].forEach(product => {
      this.products.set(this.productIdCounter, {
        ...product,
        id: this.productIdCounter++,
        createdAt: new Date()
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    user.role = role;
    this.users.set(id, user);
    return user;
  }

  // Product operations
  async getProducts(category?: string, sellerId?: number, approved?: boolean): Promise<Product[]> {
    let result = Array.from(this.products.values());
    
    if (category) {
      result = result.filter(product => product.category === category);
    }
    
    if (sellerId) {
      result = result.filter(product => product.sellerId === sellerId);
    }
    
    if (approved !== undefined) {
      result = result.filter(product => product.isApproved === approved);
    }
    
    return result;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { 
      ...insertProduct, 
      id, 
      isApproved: false,
      createdAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error("Product not found");
    }
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
  }

  // Cart operations
  async getCartItems(userId: number): Promise<{id: number, quantity: number, product: Product, userId: number}[]> {
    const cartItems = Array.from(this.carts.values())
      .filter(cart => cart.userId === userId);
    
    return Promise.all(
      cartItems.map(async cart => {
        const product = await this.getProduct(cart.productId);
        if (!product) {
          throw new Error("Product not found");
        }
        return {
          id: cart.id,
          quantity: cart.quantity,
          product,
          userId: cart.userId
        };
      })
    );
  }

  async getCartItem(id: number): Promise<Cart | undefined> {
    return this.carts.get(id);
  }

  async addToCart(insertCart: InsertCart): Promise<Cart> {
    // Check if product exists in cart already
    const existingCartItem = Array.from(this.carts.values())
      .find(cart => cart.userId === insertCart.userId && cart.productId === insertCart.productId);
    
    if (existingCartItem) {
      // Update quantity instead of adding new item
      return this.updateCartItem(existingCartItem.id, existingCartItem.quantity + insertCart.quantity);
    }
    
    const id = this.cartIdCounter++;
    const cart: Cart = { ...insertCart, id };
    this.carts.set(id, cart);
    return cart;
  }

  async updateCartItem(id: number, quantity: number): Promise<Cart> {
    const cart = await this.getCartItem(id);
    if (!cart) {
      throw new Error("Cart item not found");
    }
    
    const updatedCart = { ...cart, quantity };
    this.carts.set(id, updatedCart);
    return updatedCart;
  }

  async removeFromCart(id: number): Promise<void> {
    this.carts.delete(id);
  }

  async clearCart(userId: number): Promise<void> {
    const cartItems = Array.from(this.carts.values())
      .filter(cart => cart.userId === userId);
    
    for (const cart of cartItems) {
      this.carts.delete(cart.id);
    }
  }

  // Order operations
  async getOrders(userId?: number, sellerId?: number): Promise<Order[]> {
    let orders = Array.from(this.orders.values());
    
    if (userId) {
      orders = orders.filter(order => order.userId === userId);
    }
    
    if (sellerId) {
      // This is more complex as we need to find orders that contain products from this seller
      const orderIds = new Set<number>();
      
      // Get all order items
      const allOrderItems = Array.from(this.orderItems.values());
      
      // For each order item, check if the product belongs to the seller
      for (const orderItem of allOrderItems) {
        const product = await this.getProduct(orderItem.productId);
        if (product && product.sellerId === sellerId) {
          orderIds.add(orderItem.orderId);
        }
      }
      
      orders = orders.filter(order => orderIds.has(order.id));
    }
    
    return orders;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]> {
    const orderItems = Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
    
    return Promise.all(
      orderItems.map(async item => {
        const product = await this.getProduct(item.productId);
        if (!product) {
          throw new Error("Product not found");
        }
        return { ...item, product };
      })
    );
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  async orderHasSellerProducts(orderId: number, sellerId: number): Promise<boolean> {
    const orderItems = await this.getOrderItems(orderId);
    return orderItems.some(item => item.product.sellerId === sellerId);
  }
}

export const storage = new MemStorage();
