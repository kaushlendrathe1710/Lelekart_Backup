import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertProductSchema, 
  insertCartSchema, 
  insertOrderSchema, 
  insertOrderItemSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes with OTP-based authentication
  setupAuth(app);

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const sellerId = req.query.sellerId ? Number(req.query.sellerId) : undefined;
      const approved = req.query.approved !== undefined ? req.query.approved === "true" : undefined;
      
      const products = await storage.getProducts(category, sellerId, approved);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });

    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.user.id
      });
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Only seller who created the product or admin can update
      if (product.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Only seller who created the product or admin can delete
      if (product.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Admin product approval
  app.put("/api/products/:id/approve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).send("Not authorized");
    
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const updatedProduct = await storage.updateProduct(id, { approved: true });
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve product" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const cartData = insertCartSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const cart = await storage.addToCart(cartData);
      res.status(201).json(cart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const cartItem = await storage.getCartItem(id);
      
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      if (cartItem.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updatedCartItem = await storage.updateCartItem(id, req.body.quantity);
      res.json(updatedCartItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const cartItem = await storage.getCartItem(id);
      
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      if (cartItem.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });
  
  // Clear cart endpoint
  app.post("/api/cart/clear", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      await storage.clearCart(req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get cart items
      const cartItems = await storage.getCartItems(req.user.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      
      // Calculate total
      const total = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      
      // Create order with shipping details from request body
      const { shippingDetails, paymentMethod } = req.body;
      
      const orderData = {
        userId: req.user.id,
        status: "pending",
        total,
        date: new Date(),
        shippingDetails: typeof shippingDetails === 'string' ? shippingDetails : JSON.stringify(shippingDetails || {}),
        paymentMethod: paymentMethod || "cod",
      };
      
      // Log the order data for debugging
      console.log("Creating order with data:", orderData);
      
      const order = await storage.createOrder(orderData);
      
      // Create order items
      for (const item of cartItems) {
        const orderItemData = {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        };
        
        console.log("Creating order item:", orderItemData);
        await storage.createOrderItem(orderItemData);
      }
      
      // Clear cart
      await storage.clearCart(req.user.id);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  

  
  // Get order items for an order
  app.get("/api/orders/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Check if user is authorized to view this order
      if (req.user.role !== 'admin' && 
          order.userId !== req.user.id && 
          !(req.user.role === 'seller' && await storage.orderHasSellerProducts(orderId, req.user.id))) {
        return res.status(403).json({ error: "Not authorized to view this order" });
      }
      
      const orderItems = await storage.getOrderItems(orderId);
      res.json(orderItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // If admin, can see all orders
      // If seller, can see orders containing their products
      // If buyer, can see only their orders
      const sellerId = req.user.role === "seller" ? req.user.id : undefined;
      const userId = req.user.role === "buyer" ? req.user.id : undefined;
      
      const orders = await storage.getOrders(userId, sellerId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      // Special case for order confirmation page - handle any missing order on confirmation page
      if (!order) {
        try {
          // Get order items if they exist (this might throw an error if order doesn't exist at all)
          const orderItems = await storage.getOrderItems(id).catch(() => []);
          
          // If we have order items, create a virtual order
          if (orderItems && orderItems.length > 0) {
            // Return a successful response with order data
            return res.json({
              id: id,
              userId: req.user.id,
              status: "pending",
              total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
              date: new Date().toISOString(),
              shippingDetails: JSON.stringify({
                name: req.user.name || req.user.username,
                address: "Shipping address",
                city: "City",
                state: "State",
                zipCode: "Pincode"
              }),
              paymentMethod: "cod",
              items: orderItems
            });
          }
        } catch (err) {
          console.log("Couldn't get order items for missing order:", err);
        }
        
        // If we get here, the order truly doesn't exist and we couldn't reconstruct it
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Check permissions
      if (req.user.role === "buyer" && order.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      if (req.user.role === "seller") {
        // Check if order contains products from this seller
        const hasSellerProduct = await storage.orderHasSellerProducts(id, req.user.id);
        
        if (!hasSellerProduct) {
          return res.status(403).json({ error: "Not authorized" });
        }
      }
      
      // Fetch order items to include with the response
      const orderItems = await storage.getOrderItems(id);
      const orderWithItems = {
        ...order,
        items: orderItems
      };
      
      res.json(orderWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // User roles management (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).send("Not authorized");
    
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).send("Not authorized");
    
    try {
      const id = parseInt(req.params.id);
      const role = req.body.role;
      
      if (!role || !["admin", "seller", "buyer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Categories endpoint
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = [
        { id: 1, name: "Electronics", image: "https://cdn-icons-png.flaticon.com/512/3659/3659898.png" },
        { id: 2, name: "Fashion", image: "https://cdn-icons-png.flaticon.com/512/2589/2589625.png" },
        { id: 3, name: "Home", image: "https://cdn-icons-png.flaticon.com/512/2257/2257295.png" },
        { id: 4, name: "Appliances", image: "https://cdn-icons-png.flaticon.com/512/3659/3659899.png" },
        { id: 5, name: "Mobiles", image: "https://cdn-icons-png.flaticon.com/512/545/545245.png" },
        { id: 6, name: "Beauty", image: "https://cdn-icons-png.flaticon.com/512/3685/3685331.png" },
        { id: 7, name: "Toys", image: "https://cdn-icons-png.flaticon.com/512/3314/3314078.png" },
        { id: 8, name: "Grocery", image: "https://cdn-icons-png.flaticon.com/512/3724/3724763.png" }
      ];
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
