import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertProductSchema, 
  insertCartSchema, 
  insertOrderSchema, 
  insertOrderItemSchema,
  insertCategorySchema,
  insertReviewSchema,
  insertReviewImageSchema,
  insertReviewHelpfulSchema,
  insertUserActivitySchema,
  insertSalesHistorySchema,
  insertDemandForecastSchema,
  insertPriceOptimizationSchema,
  insertInventoryOptimizationSchema,
  insertAiGeneratedContentSchema,
  insertWishlistSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { uploadFile } from "./helpers/s3";
import { handleImageProxy } from "./utils/image-proxy";
import { RecommendationEngine } from "./utils/recommendation-engine";
import { createRazorpayOrder, handleSuccessfulPayment, generateReceiptId, getRazorpayKeyId } from "./utils/razorpay";
import { 
  trackUserActivity, 
  getPersonalizedRecommendations, 
  getComplementaryProducts,
  getSizeRecommendations,
  generateSessionId,
  getProductQAResponse,
  getAIResponse
} from "./utils/ai-assistant";
import {
  generateDemandForecast,
  generatePriceOptimization,
  generateInventoryOptimization,
  generateProductContent,
  recordSalesData,
  updatePriceOptimizationStatus,
  updateInventoryOptimizationStatus,
  updateAIContentStatus
} from "./utils/ml-inventory-manager";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes with OTP-based authentication
  setupAuth(app);

  // Search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim() === '') {
        return res.status(400).json({ error: "Search query is required" });
      }

      console.log(`Searching for products with query: "${query}"`);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const results = await storage.searchProducts(query, limit);
      
      console.log(`Found ${results.length} search results for "${query}"`);
      return res.json(results);
    } catch (error) {
      console.error("Error in search endpoint:", error);
      return res.status(500).json({ error: "Failed to perform search" });
    }
  });

  // Product routes with pagination
  app.get("/api/products", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const sellerId = req.query.sellerId ? Number(req.query.sellerId) : undefined;
      const approved = req.query.approved !== undefined ? req.query.approved === "true" : undefined;
      
      // Pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
      const offset = (page - 1) * limit;
      
      console.log('Fetching products with filters:', { category, sellerId, approved, page, limit });
      
      // Get total count for pagination
      const totalCount = await storage.getProductsCount(category, sellerId, approved);
      const totalPages = Math.ceil(totalCount / limit);
      
      // Get paginated products
      let products = await storage.getProductsPaginated(category, sellerId, approved, offset, limit);
      console.log(`Found ${products?.length || 0} products (page ${page}/${totalPages})`);
      
      if (!products || !Array.isArray(products)) {
        console.error('Invalid products data returned:', products);
        return res.status(500).json({ error: "Invalid products data returned" });
      }
      
      // Process products to ensure they all have valid images
      // and fetch seller information for each product
      const productsWithSellerInfo = await Promise.all(
        products.map(async (product) => {
          // Ensure imageUrl exists for every product
          if (!product.imageUrl) {
            product.imageUrl = "/images/placeholder.svg";
          }
          
          // Fetch seller information if sellerId exists
          if (product.sellerId) {
            try {
              const seller = await storage.getUser(product.sellerId);
              if (seller) {
                return {
                  ...product,
                  sellerName: seller.username || "Unknown Seller"
                };
              }
            } catch (error) {
              console.error(`Error fetching seller for product ${product.id}:`, error);
            }
          }
          
          return {
            ...product,
            sellerName: "Unknown Seller"
          };
        })
      );
      
      products = productsWithSellerInfo;
      
      // Return both products and pagination data
      res.json({
        products,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage: page,
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Failed to fetch products", details: error instanceof Error ? error.message : 'Unknown error' });
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
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
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

  // Razorpay payment routes
  app.get("/api/razorpay/key", (req, res) => {
    try {
      const keyId = getRazorpayKeyId();
      res.json({ keyId });
    } catch (error) {
      console.error('Error fetching Razorpay key:', error);
      res.status(500).json({ error: "Failed to fetch Razorpay key" });
    }
  });

  app.post("/api/razorpay/create-order", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get cart items to calculate total
      const cartItems = await storage.getCartItems(req.user.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      
      // Calculate total in lowest currency unit (paise for INR)
      const totalInPaise = Math.round(cartItems.reduce(
        (acc, item) => acc + (item.product.price * item.quantity), 0
      ) * 100);
      
      // Create a unique receipt ID
      const receiptId = `receipt_${Date.now()}_${req.user.id}`;
      
      // Notes for the order
      const notes = {
        userId: req.user.id.toString(),
        email: req.user.email,
        items: JSON.stringify(cartItems.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })))
      };
      
      // Create Razorpay order
      const order = await createRazorpayOrder(totalInPaise, receiptId, notes);
      
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: "Failed to create Razorpay order" });
    }
  });

  app.post("/api/razorpay/verify-payment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, shippingDetails } = req.body;
      
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ error: "Missing payment verification details" });
      }
      
      // Verify the payment signature
      const result = await handleSuccessfulPayment(
        razorpayPaymentId,
        razorpayOrderId, 
        razorpaySignature
      );
      
      if (!result.success) {
        return res.status(400).json({ error: "Payment verification failed" });
      }
      
      // Get cart items
      const cartItems = await storage.getCartItems(req.user.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      
      // Calculate total
      const total = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      
      // Create order in our system
      const orderData = {
        userId: req.user.id,
        status: "paid", // Payment successful, so mark as paid
        total,
        date: new Date(),
        shippingDetails: typeof shippingDetails === 'string' ? shippingDetails : JSON.stringify(shippingDetails || {}),
        paymentMethod: "razorpay",
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId
      };
      
      console.log("Creating order after successful Razorpay payment:", orderData);
      
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
      
      res.status(201).json({
        success: true,
        order: {
          ...order,
          razorpayPaymentId,
          razorpayOrderId
        }
      });
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      res.status(500).json({ error: "Payment verification failed" });
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
  
  // Update order status endpoint
  app.put("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "seller") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      // Get the order to check permissions
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Sellers can only update orders that contain their products
      if (req.user.role === "seller") {
        const hasSellerProduct = await storage.orderHasSellerProducts(id, req.user.id);
        if (!hasSellerProduct) {
          return res.status(403).json({ error: "Not authorized" });
        }
      }
      
      // Update the order status
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // User roles management (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
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

  // File Upload endpoint
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB file size limit
    },
    fileFilter: (req, file, cb) => {
      // Accept images only
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
        return new Error(`Unsupported file type: ${file.mimetype}. Only images are allowed.`);
      }
    }
  });

  app.post("/api/upload", (req, res, next) => {
    // Custom error handler to catch multer errors
    upload.single("file")(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error("Multer error:", err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: `File too large. Maximum file size is 100MB.`
          });
        }
        return res.status(400).json({
          error: `Upload error: ${err.message}`
        });
      } else if (err) {
        // An unknown error occurred
        console.error("Upload error:", err);
        return res.status(400).json({
          error: err.message || "File upload failed"
        });
      }
      // Everything went fine, proceed
      next();
    });
  }, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      console.log(`Processing upload: ${req.file.originalname}, size: ${req.file.size}, mimetype: ${req.file.mimetype}`);
      
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const fileType = req.file.mimetype;
      
      // Upload file to S3 and get URL
      const fileUrl = await uploadFile(fileBuffer, fileName, fileType);
      console.log(`File uploaded successfully to S3: ${fileUrl}`);
      
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to upload file to storage" 
      });
    }
  });

  // Bulk upload endpoint
  app.post("/api/products/bulk-upload", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (req.user.role !== "seller" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    // This endpoint just confirms receipt of the upload
    // Actual processing is done on the client to demonstrate both approaches
    // In a production environment, you'd likely process the CSV server-side
    res.status(200).json({ message: "Upload received" });
  });

  // Get all orders endpoint (admin only)
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      let orders;
      
      if (req.user.role === "admin") {
        // Admin can see all orders
        orders = await storage.getOrders();
      } else if (req.user.role === "seller") {
        // Sellers can only see orders for their products
        orders = await storage.getOrders(undefined, req.user.id);
      } else {
        // Buyers can only see their own orders
        orders = await storage.getOrders(req.user.id);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Categories endpoints
  app.get("/api/categories", async (_req, res) => {
    try {
      console.log("Fetching categories...");
      const categories = await storage.getCategories();
      
      // If no categories exist yet, return default categories
      if (categories.length === 0) {
        console.log("No categories found, returning default categories");
        const defaultCategories = [
          { id: 1, name: "Electronics", image: "https://cdn-icons-png.flaticon.com/512/3659/3659898.png", displayOrder: 1 },
          { id: 2, name: "Fashion", image: "https://cdn-icons-png.flaticon.com/512/2589/2589625.png", displayOrder: 2 },
          { id: 3, name: "Home", image: "https://cdn-icons-png.flaticon.com/512/2257/2257295.png", displayOrder: 3 },
          { id: 4, name: "Appliances", image: "https://cdn-icons-png.flaticon.com/512/3659/3659899.png", displayOrder: 4 },
          { id: 5, name: "Mobiles", image: "https://cdn-icons-png.flaticon.com/512/545/545245.png", displayOrder: 5 },
          { id: 6, name: "Beauty", image: "https://cdn-icons-png.flaticon.com/512/3685/3685331.png", displayOrder: 6 },
          { id: 7, name: "Toys", image: "https://cdn-icons-png.flaticon.com/512/3314/3314078.png", displayOrder: 7 },
          { id: 8, name: "Grocery", image: "https://cdn-icons-png.flaticon.com/512/3724/3724763.png", displayOrder: 8 }
        ];
        res.json(defaultCategories);
      } else {
        console.log(`Found ${categories.length} categories`);
        res.json(categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });
  
  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  });
  
  app.put("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const updatedCategory = await storage.updateCategory(id, req.body);
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });
  
  app.delete("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // API route to get featured products for hero section
  app.get('/api/featured-hero-products', async (_req, res) => {
    try {
      // Get one product from each category for the hero carousel
      const categories = await storage.getCategories();
      const heroProducts = [];
      
      for (const category of categories) {
        const products = await storage.getProducts(category.name, undefined, true);
        if (products.length > 0) {
          // Take the first product from each category
          const product = products[0];
          // Get image URL properly - handle different field naming (imageUrl vs image_url)
          let imageUrl = '';
          
          // Use actual product images with fallback to category placeholders if needed
          if (product.imageUrl) {
            imageUrl = product.imageUrl;
          } else if (product.images && typeof product.images === 'string') {
            try {
              const parsedImages = JSON.parse(product.images);
              if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                imageUrl = parsedImages[0];
              }
            } catch (e) {
              console.log('Error parsing images JSON for hero:', e);
            }
          }
          
          // Fallback to category placeholders if no product image
          if (!imageUrl) {
            const categoryPlaceholders: Record<string, string> = {
              'Electronics': '/images/categories/electronics.svg',
              'Fashion': '/images/categories/fashion.svg',
              'Home': '/images/categories/home.svg', 
              'Appliances': '/images/categories/appliances.svg',
              'Mobiles': '/images/categories/mobiles.svg',
              'Beauty': '/images/categories/beauty.svg',
              'Toys': '/images/categories/toys.svg',
              'Grocery': '/images/categories/grocery.svg',
            };
            
            imageUrl = categoryPlaceholders[product.category] || '/images/placeholder.svg';
          }
          
          heroProducts.push({
            title: `${category.name} Sale`,
            subtitle: `Up to 30% off on all ${category.name.toLowerCase()} items`,
            url: imageUrl,
            alt: product.name,
            buttonText: 'Shop Now',
            category: category.name,
            badgeText: 'HOT DEAL',
            productId: product.id
          });
        }
      }
      
      res.json(heroProducts);
    } catch (error) {
      console.error("Error fetching hero products:", error);
      res.status(500).json({ error: "Failed to fetch hero products" });
    }
  });

  // Get deal of the day product
  app.get('/api/deal-of-the-day', async (_req, res) => {
    try {
      // Get all electronics products (or another category that typically has good deals)
      const products = await storage.getProducts("Electronics", undefined, true);
      
      // If no products, try a different category
      let dealProduct = null;
      if (products.length === 0) {
        // Try Mobiles category as fallback
        const mobileProducts = await storage.getProducts("Mobiles", undefined, true);
        if (mobileProducts.length > 0) {
          dealProduct = mobileProducts[0];
        }
      } else {
        dealProduct = products[0];
      }
      
      if (!dealProduct) {
        return res.status(404).json({ error: "No products found for deal of the day" });
      }
      
      // Get product image - use actual product images with fallback
      let imageUrl = '';
      
      // Try to get image URL from product data
      if (dealProduct.imageUrl) {
        imageUrl = dealProduct.imageUrl;
      } else if (dealProduct.images && typeof dealProduct.images === 'string') {
        try {
          const parsedImages = JSON.parse(dealProduct.images);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            imageUrl = parsedImages[0];
          }
        } catch (e) {
          console.log('Error parsing images JSON for deal of the day:', e);
        }
      }
      
      // If no image found, use category placeholder
      if (!imageUrl) {
        const categoryPlaceholders: Record<string, string> = {
          'Electronics': '/images/categories/electronics.svg',
          'Fashion': '/images/categories/fashion.svg',
          'Home': '/images/categories/home.svg',
          'Appliances': '/images/categories/appliances.svg',
          'Mobiles': '/images/categories/mobiles.svg',
          'Beauty': '/images/categories/beauty.svg',
          'Toys': '/images/categories/toys.svg',
          'Grocery': '/images/categories/grocery.svg',
        };
        
        imageUrl = categoryPlaceholders[dealProduct.category] || '/images/placeholder.svg';
      }
      
      // Calculate discount (for display purposes)
      const originalPrice = dealProduct.price;
      const discountPercentage = 15; // 15% off
      const discountPrice = originalPrice * (1 - discountPercentage/100);
      
      res.json({
        title: `Deal of the Day: ${dealProduct.name}`,
        subtitle: `Limited time offer on premium ${dealProduct.category}`,
        image: imageUrl,
        originalPrice: originalPrice,
        discountPrice: discountPrice,
        discountPercentage: discountPercentage,
        productId: dealProduct.id,
        hours: 47,
        minutes: 53,
        seconds: 41
      });
    } catch (error) {
      console.error("Error fetching deal of the day:", error);
      res.status(500).json({ error: "Failed to fetch deal of the day" });
    }
  });

  // Image proxy route to handle CORS issues with external images
  app.get("/api/image-proxy", handleImageProxy);
  
  // Advanced search endpoint with instant results
  app.get("/api/lelekart-search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!query || query.trim().length < 1) {
        return res.json([]);
      }
      
      console.log("Searching products with query:", query);
      const results = await storage.searchProducts(query, limit);
      console.log(`Found ${results.length} results for "${query}"`);
      
      // Set the content type explicitly to application/json
      res.setHeader('Content-Type', 'application/json');
      return res.json(results);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });
  
  // Review Routes
  // Get reviews for a product
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ error: "Failed to fetch product reviews" });
    }
  });
  
  // Get product rating summary
  app.get("/api/products/:id/rating", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const ratingSummary = await storage.getProductRatingSummary(productId);
      res.json(ratingSummary);
    } catch (error) {
      console.error("Error fetching product rating summary:", error);
      res.status(500).json({ error: "Failed to fetch product rating summary" });
    }
  });
  
  // Get reviews by a user
  app.get("/api/user/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviews = await storage.getUserReviews(req.user.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ error: "Failed to fetch user reviews" });
    }
  });
  
  // Get a specific review
  app.get("/api/reviews/:id", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });
  
  // Create a review
  app.post("/api/products/:id/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Check if user has purchased the product (for verified purchase status)
      const hasUserPurchased = await storage.hasUserPurchasedProduct(req.user.id, productId);
      
      // Create the review
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id,
        productId,
        verifiedPurchase: hasUserPurchased
      });
      
      const review = await storage.createReview(reviewData);
      
      // If review has images, create them
      if (req.body.images && Array.isArray(req.body.images)) {
        for (const imageUrl of req.body.images) {
          await storage.addReviewImage({
            reviewId: review.id,
            imageUrl
          });
        }
      }
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ 
        error: "Failed to create review",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Update a review
  app.put("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Only the author of the review or an admin can update it
      if (review.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const updatedReview = await storage.updateReview(reviewId, req.body);
      res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });
  
  // Delete a review
  app.delete("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Only the author of the review or an admin can delete it
      if (review.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      await storage.deleteReview(reviewId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });
  
  // Mark a review as helpful
  app.post("/api/reviews/:id/helpful", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Can't mark your own review as helpful
      if (review.userId === req.user.id) {
        return res.status(400).json({ error: "Cannot mark your own review as helpful" });
      }
      
      const helpfulVote = await storage.markReviewHelpful(reviewId, req.user.id);
      res.status(201).json(helpfulVote);
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      res.status(500).json({ error: "Failed to mark review as helpful" });
    }
  });
  
  // Remove helpful mark from a review
  app.delete("/api/reviews/:id/helpful", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Check if user has marked this review as helpful
      const isHelpful = await storage.isReviewHelpfulByUser(reviewId, req.user.id);
      
      if (!isHelpful) {
        return res.status(400).json({ error: "You have not marked this review as helpful" });
      }
      
      await storage.unmarkReviewHelpful(reviewId, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing helpful mark from review:", error);
      res.status(500).json({ error: "Failed to remove helpful mark from review" });
    }
  });
  
  // Check if user has marked a review as helpful
  app.get("/api/reviews/:id/helpful", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      const isHelpful = await storage.isReviewHelpfulByUser(reviewId, req.user.id);
      res.json({ isHelpful });
    } catch (error) {
      console.error("Error checking if review is helpful:", error);
      res.status(500).json({ error: "Failed to check if review is helpful" });
    }
  });
  
  // RECOMMENDATION API ENDPOINTS
  
  // Get personalized recommendations for the current user
  app.get("/api/recommendations", async (req, res) => {
    try {
      const userId = req.isAuthenticated() ? req.user.id : null;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      console.log(`Getting personalized recommendations for ${userId ? `user ${userId}` : 'anonymous user'}`);
      const recommendations = await RecommendationEngine.getPersonalizedRecommendations(userId, limit);
      
      console.log(`Found ${recommendations.length} personalized recommendations`);
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting personalized recommendations:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });
  
  // Get similar products for a specific product
  app.get("/api/recommendations/similar/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      
      console.log(`Getting similar products for product ID ${productId}`);
      const similarProducts = await RecommendationEngine.getSimilarProducts(productId, limit);
      
      console.log(`Found ${similarProducts.length} similar products for product ID ${productId}`);
      res.json(similarProducts);
    } catch (error) {
      console.error("Error getting similar products:", error);
      res.status(500).json({ error: "Failed to get similar products" });
    }
  });
  
  // Get recommended products for homepage and product pages
  app.get("/api/recommendations/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      console.log("Getting featured recommendations");
      const featuredRecommendations = await RecommendationEngine.getPersonalizedRecommendations(userId, limit);
      
      console.log(`Found ${featuredRecommendations.length} featured recommendations`);
      res.json(featuredRecommendations);
    } catch (error) {
      console.error("Error getting featured recommendations:", error);
      res.status(500).json({ error: "Failed to get featured recommendations" });
    }
  });
  
  // Image proxy route to avoid CORS issues with external image URLs
  app.get("/api/proxy-image", handleImageProxy);
  
  // ======= AI Shopping Assistant API Routes =======

  // Generate a session ID for tracking user activity
  app.get('/api/ai/session', (req, res) => {
    const sessionId = req.query.sessionId || generateSessionId();
    res.json({ sessionId });
  });

  // Track user activity endpoint (views, clicks, searches)
  app.post('/api/ai/track-activity', async (req, res) => {
    try {
      const { sessionId, activityType, productId, categoryId, searchQuery, additionalData } = req.body;
      
      if (!sessionId || !activityType) {
        return res.status(400).json({ error: "sessionId and activityType are required" });
      }
      
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      await trackUserActivity(
        userId,
        sessionId,
        activityType,
        productId,
        categoryId,
        searchQuery,
        additionalData
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error tracking user activity:', error);
      res.status(500).json({ error: "Failed to track user activity" });
    }
  });

  // Personalized product recommendations
  app.get('/api/ai/recommendations', async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      console.log(`Getting AI-powered personalized recommendations for ${userId ? `user ${userId}` : 'anonymous user'}`);
      
      const recommendations = await getPersonalizedRecommendations(userId, sessionId, limit);
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      res.status(500).json({ error: "Failed to get personalized recommendations" });
    }
  });

  // Complementary product suggestions
  app.get('/api/ai/complementary-products/:productId', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // Track this activity if session ID is provided
      if (req.query.sessionId) {
        const userId = req.isAuthenticated() ? req.user.id : null;
        await trackUserActivity(
          userId,
          req.query.sessionId as string,
          'view_complementary_products',
          productId
        );
      }
      
      const complementaryProducts = await getComplementaryProducts(productId, limit);
      res.json(complementaryProducts);
    } catch (error) {
      console.error('Error getting complementary products:', error);
      res.status(500).json({ error: "Failed to get complementary products" });
    }
  });

  // Size recommendations
  app.get('/api/ai/size-recommendations/:productId', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(200).json({
        recommendedSize: null,
        confidence: 0,
        message: "Sign in to get personalized size recommendations"
      });
    }
    
    try {
      const productId = parseInt(req.params.productId);
      const category = req.query.category as string;
      
      const recommendation = await getSizeRecommendations(req.user.id, productId, category);
      res.json(recommendation);
    } catch (error) {
      console.error('Error getting size recommendations:', error);
      res.status(500).json({ error: "Failed to get size recommendations" });
    }
  });

  // Product-specific Q&A
  app.post('/api/ai/product-qa/:productId', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { question, sessionId } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }
      
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      const answer = await getProductQAResponse(
        productId,
        question,
        userId,
        sessionId
      );
      
      res.json({ answer });
    } catch (error) {
      console.error('Error getting product Q&A response:', error);
      res.status(500).json({ error: "Failed to get answer" });
    }
  });

  // General AI shopping assistant conversation
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { 
        message, 
        sessionId, 
        productId, 
        categoryId, 
        conversationHistory = [] 
      } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ error: "Message and sessionId are required" });
      }
      
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      // Format the conversation history for Gemini
      const messages = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];
      
      const contextInfo = {
        userId,
        sessionId,
        productId: productId ? parseInt(productId) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined
      };
      
      const aiResponse = await getAIResponse(messages, contextInfo);
      
      // Add AI response to the history
      const updatedHistory = [
        ...messages,
        { role: 'assistant', content: aiResponse }
      ];
      
      res.json({
        response: aiResponse,
        conversationHistory: updatedHistory
      });
    } catch (error) {
      console.error('Error getting AI chat response:', error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });
  
  // Smart Inventory & Price Management API Routes
  
  // Sales History endpoints
  app.get("/api/seller/sales-history/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const salesHistory = await storage.getSalesHistory(productId, sellerId);
      res.json(salesHistory);
    } catch (error) {
      console.error("Error fetching sales history:", error);
      res.status(500).json({ error: "Failed to fetch sales history" });
    }
  });
  
  app.post("/api/seller/sales-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const { productId, quantity, revenue, costPrice, channel, promotionApplied, seasonality } = req.body;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const salesData = insertSalesHistorySchema.parse({
        productId,
        sellerId: req.user.id,
        date: new Date(),
        quantity,
        revenue,
        costPrice,
        profitMargin: ((revenue - costPrice) / revenue) * 100,
        channel: channel || "marketplace",
        promotionApplied: promotionApplied || false,
        seasonality: seasonality || "",
        createdAt: new Date()
      });
      
      const salesRecord = await storage.createSalesRecord(salesData);
      res.status(201).json(salesRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error recording sales data:", error);
      res.status(500).json({ error: "Failed to record sales data" });
    }
  });
  
  // Demand Forecast endpoints
  app.get("/api/seller/demand-forecasts/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const forecasts = await storage.getDemandForecasts(productId, sellerId);
      res.json(forecasts);
    } catch (error) {
      console.error("Error fetching demand forecasts:", error);
      res.status(500).json({ error: "Failed to fetch demand forecasts" });
    }
  });
  
  app.post("/api/seller/demand-forecasts/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      const { period } = req.body;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Generate demand forecast using Gemini AI
      const forecast = await generateDemandForecast(productId, sellerId, period || "monthly");
      res.status(201).json(forecast);
    } catch (error) {
      console.error("Error generating demand forecast:", error);
      res.status(500).json({ error: "Failed to generate demand forecast" });
    }
  });
  
  // Price Optimization endpoints
  app.get("/api/seller/price-optimizations/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const optimizations = await storage.getPriceOptimizations(productId, sellerId);
      res.json(optimizations);
    } catch (error) {
      console.error("Error fetching price optimizations:", error);
      res.status(500).json({ error: "Failed to fetch price optimizations" });
    }
  });
  
  app.post("/api/seller/price-optimizations/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Generate price optimization using Gemini AI
      const optimization = await generatePriceOptimization(productId, sellerId);
      res.status(201).json(optimization);
    } catch (error) {
      console.error("Error generating price optimization:", error);
      res.status(500).json({ error: "Failed to generate price optimization" });
    }
  });
  
  app.put("/api/seller/price-optimizations/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "applied", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const optimization = await storage.updatePriceOptimizationStatus(id, status, req.user.id);
      res.json(optimization);
    } catch (error) {
      console.error("Error updating price optimization status:", error);
      res.status(500).json({ error: "Failed to update price optimization status" });
    }
  });
  
  app.post("/api/seller/price-optimizations/:id/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      
      // Apply the price optimization to the product
      const updatedProduct = await storage.applyPriceOptimization(id, req.user.id);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error applying price optimization:", error);
      res.status(500).json({ error: "Failed to apply price optimization" });
    }
  });
  
  // Inventory Optimization endpoints
  app.get("/api/seller/inventory-optimizations/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const optimizations = await storage.getInventoryOptimizations(productId, sellerId);
      res.json(optimizations);
    } catch (error) {
      console.error("Error fetching inventory optimizations:", error);
      res.status(500).json({ error: "Failed to fetch inventory optimizations" });
    }
  });
  
  app.post("/api/seller/inventory-optimizations/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Generate inventory optimization using Gemini AI
      const optimization = await generateInventoryOptimization(productId, sellerId);
      res.status(201).json(optimization);
    } catch (error) {
      console.error("Error generating inventory optimization:", error);
      res.status(500).json({ error: "Failed to generate inventory optimization" });
    }
  });
  
  app.put("/api/seller/inventory-optimizations/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "applied", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const optimization = await storage.updateInventoryOptimizationStatus(id, status, req.user.id);
      res.json(optimization);
    } catch (error) {
      console.error("Error updating inventory optimization status:", error);
      res.status(500).json({ error: "Failed to update inventory optimization status" });
    }
  });
  
  app.post("/api/seller/inventory-optimizations/:id/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      
      // Apply the inventory optimization to the product
      const updatedProduct = await storage.applyInventoryOptimization(id, req.user.id);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error applying inventory optimization:", error);
      res.status(500).json({ error: "Failed to apply inventory optimization" });
    }
  });
  
  // AI Generated Content endpoints
  app.get("/api/seller/ai-generated-content/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      const contentType = req.query.contentType as string | undefined;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const contents = await storage.getAIGeneratedContents(productId, sellerId, contentType);
      res.json(contents);
    } catch (error) {
      console.error("Error fetching AI generated content:", error);
      res.status(500).json({ error: "Failed to fetch AI generated content" });
    }
  });
  
  app.post("/api/seller/ai-generated-content/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      const { contentType, originalData } = req.body;
      
      if (!contentType || !["description", "features", "specifications"].includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type" });
      }
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Generate AI content using Gemini AI
      const content = await generateProductContent(productId, sellerId, contentType, originalData || "");
      res.status(201).json(content);
    } catch (error) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ error: "Failed to generate AI content" });
    }
  });
  
  app.put("/api/seller/ai-generated-content/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "applied", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const content = await storage.updateAIGeneratedContentStatus(id, status, req.user.id);
      res.json(content);
    } catch (error) {
      console.error("Error updating AI content status:", error);
      res.status(500).json({ error: "Failed to update AI content status" });
    }
  });
  
  app.post("/api/seller/ai-generated-content/:id/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      
      // Apply the AI generated content to the product
      const updatedProduct = await storage.applyAIGeneratedContent(id, req.user.id);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error applying AI content:", error);
      res.status(500).json({ error: "Failed to apply AI content" });
    }
  });
  
  // Wishlist routes
  app.get("/api/wishlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const wishlistItems = await storage.getWishlistItems(req.user.id);
      res.json(wishlistItems);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }
      
      const wishlistData = insertWishlistSchema.parse({
        userId: req.user.id,
        productId: parseInt(productId)
      });
      
      // Check if product exists
      const product = await storage.getProduct(wishlistData.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Check if item already exists in wishlist
      const existing = await storage.getWishlistItem(req.user.id, wishlistData.productId);
      if (existing) {
        return res.status(409).json({ error: "Product already in wishlist", item: existing });
      }
      
      const wishlistItem = await storage.addToWishlist(wishlistData);
      res.status(201).json(wishlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const productId = parseInt(req.params.productId);
      
      // Check if product exists in user's wishlist
      const existing = await storage.getWishlistItem(req.user.id, productId);
      if (!existing) {
        return res.status(404).json({ error: "Product not found in wishlist" });
      }
      
      await storage.removeFromWishlist(req.user.id, productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });

  // Check if a product is in the user's wishlist
  app.get("/api/wishlist/check/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ inWishlist: false });
    
    try {
      const productId = parseInt(req.params.productId);
      const wishlistItem = await storage.getWishlistItem(req.user.id, productId);
      res.json({ inWishlist: !!wishlistItem });
    } catch (error) {
      console.error("Error checking wishlist:", error);
      res.status(500).json({ error: "Failed to check wishlist status" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
