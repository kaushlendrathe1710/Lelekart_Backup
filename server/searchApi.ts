import express from 'express';
import { storage } from './storage';

// This is a dedicated API server for handling product search
// It is set up separately to avoid conflicts with the main routes and Vite
const searchApiRouter = express.Router();

searchApiRouter.get("/api/special-search", async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (!query || query.trim().length < 1) {
      return res.json([]);
    }
    
    console.log("Special search endpoint hit. Searching for:", query);
    const results = await storage.searchProducts(query, limit);
    console.log(`Found ${results.length} results for "${query}"`);
    
    // Set explicit headers to prevent caching and ensure JSON response
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');
    
    return res.json(results);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

export default searchApiRouter;