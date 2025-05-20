/**
 * Return Management Routes
 * 
 * This file contains all the API routes for the return management system.
 */

import { Router } from "express";
import { storage } from "../storage";
import * as returnHandlers from "../handlers/return-handlers";
import { checkReturnEligibility } from "../services/return-eligibility";

const router = Router();

// Base route handler for /api/returns
router.get("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const user = req.user;
    
    // If user is a buyer, get buyer returns
    if (user.role === "buyer") {
      console.log(`Fetching returns for buyer: ${user.id}`);
      const limitStr = req.query.limit ? String(req.query.limit) : "10";
      const offsetStr = req.query.offset ? String(req.query.offset) : "0";
      
      const returns = await storage.getReturnRequestsByBuyerId(
        user.id,
        parseInt(limitStr),
        parseInt(offsetStr)
      );
      
      return res.json(returns || []);
    } 
    // If user is a seller, get seller returns
    else if (user.role === "seller") {
      console.log(`Fetching returns for seller: ${user.id}`);
      const limitStr = req.query.limit ? String(req.query.limit) : "10";
      const offsetStr = req.query.offset ? String(req.query.offset) : "0";
      
      const returns = await storage.getReturnRequestsBySellerId(
        user.id,
        parseInt(limitStr),
        parseInt(offsetStr)
      );
      
      return res.json(returns || []);
    }
    // If user is an admin, get all returns with optional filters
    else if (user.role === "admin" || (user.isCoAdmin === true)) {
      console.log(`Fetching returns for admin: ${user.id}`);
      const limitStr = req.query.limit ? String(req.query.limit) : "10";
      const offsetStr = req.query.offset ? String(req.query.offset) : "0";
      
      // Create filters
      const filters: Record<string, any> = {};
      if (req.query.status) filters.status = String(req.query.status);
      if (req.query.sellerId) filters.sellerId = parseInt(String(req.query.sellerId));
      if (req.query.buyerId) filters.buyerId = parseInt(String(req.query.buyerId));
      
      const returns = await storage.getReturnRequests(
        filters,
        parseInt(limitStr),
        parseInt(offsetStr)
      );
      
      return res.json(returns || []);
    }
    
    // If user role is not recognized
    return res.status(403).json({ error: "Access denied" });
  } catch (error) {
    console.error("Error getting return requests:", error);
    return res.status(500).json({ error: "Failed to get return requests" });
  }
});

// Check return eligibility
router.get("/check-eligibility/:orderId/:orderItemId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const orderId = parseInt(req.params.orderId);
    const orderItemId = parseInt(req.params.orderItemId);
    const { requestType } = req.query;
    
    if (isNaN(orderId) || isNaN(orderItemId) || !requestType) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Check eligibility
    const eligibility = await checkReturnEligibility(
      orderId, 
      orderItemId, 
      requestType as string
    );
    
    return res.json(eligibility);
  } catch (error) {
    console.error("Error checking return eligibility:", error);
    return res.status(500).json({ error: "Failed to check return eligibility" });
  }
});

// Get active return reasons
router.get("/reasons", async (req, res) => {
  try {
    const { requestType } = req.query;
    const reasons = await storage.getActiveReturnReasons(requestType as string);
    return res.json(reasons);
  } catch (error) {
    console.error("Error getting return reasons:", error);
    return res.status(500).json({ error: "Failed to get return reasons" });
  }
});

// Create a return request
router.post("/request", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { 
      orderId, 
      orderItemId, 
      requestType, 
      reasonId, 
      description,
      mediaUrls
    } = req.body;
    
    if (!orderId || !orderItemId || !requestType || !reasonId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Create return request
    const returnRequest = await returnHandlers.createReturnRequest(
      req.user.id,
      orderId,
      orderItemId,
      requestType,
      reasonId,
      description,
      mediaUrls
    );
    
    return res.status(201).json(returnRequest);
  } catch (error) {
    console.error("Error creating return request:", error);
    return res.status(500).json({ error: error.message || "Failed to create return request" });
  }
});

// Get return requests for buyer
router.get("/buyer", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { limit = 10, offset = 0 } = req.query;
    
    // Get return requests
    const returns = await storage.getReturnRequestsByBuyerId(
      req.user.id, 
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    return res.json(returns);
  } catch (error) {
    console.error("Error getting buyer return requests:", error);
    return res.status(500).json({ error: "Failed to get return requests" });
  }
});

// Get return requests for seller
router.get("/seller", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user is a seller
    if (req.user.role !== "seller" && req.user.role !== "admin" && !req.user.isCoAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { limit = 10, offset = 0 } = req.query;
    
    // Get return requests
    const returns = await storage.getReturnRequestsBySellerId(
      req.user.id, 
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    return res.json(returns);
  } catch (error) {
    console.error("Error getting seller return requests:", error);
    return res.status(500).json({ error: "Failed to get return requests" });
  }
});

// Get all return requests (admin only)
router.get("/admin", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user is admin or co-admin
    if (req.user.role !== "admin" && !req.user.isCoAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { 
      limit = 10, 
      offset = 0,
      status,
      sellerId,
      buyerId
    } = req.query;
    
    // Create filters
    const filters: any = {};
    if (status) filters.status = status;
    if (sellerId) filters.sellerId = parseInt(sellerId as string);
    if (buyerId) filters.buyerId = parseInt(buyerId as string);
    
    // Get return requests
    const returns = await storage.getReturnRequests(
      filters,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    return res.json(returns);
  } catch (error) {
    console.error("Error getting all return requests:", error);
    return res.status(500).json({ error: "Failed to get return requests" });
  }
});

// Get return request details
router.get("/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    
    if (isNaN(returnId)) {
      return res.status(400).json({ error: "Invalid return ID" });
    }
    
    // Get the return request details
    const returnRequest = await returnHandlers.getReturnRequest(returnId, req.user.id);
    
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }
    
    // Check if user is authorized to view this return
    const user = req.user;
    const isAuthorized = 
      returnRequest.buyerId === user.id || 
      returnRequest.sellerId === user.id || 
      user.role === "admin" || 
      user.isCoAdmin;
    
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    return res.json(returnRequest);
  } catch (error) {
    console.error("Error getting return request:", error);
    return res.status(500).json({ error: "Failed to get return request" });
  }
});

// Get return messages
router.get("/:id/messages", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    
    if (isNaN(returnId)) {
      return res.status(400).json({ error: "Invalid return ID" });
    }
    
    // Get the return request to check authorization
    const returnRequest = await storage.getReturnRequestById(returnId);
    
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }
    
    // Check if user is authorized to view this return's messages
    const user = req.user;
    const isAuthorized = 
      returnRequest.buyerId === user.id || 
      returnRequest.sellerId === user.id || 
      user.role === "admin" || 
      user.isCoAdmin;
    
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get messages
    const messages = await returnHandlers.getReturnMessages(returnId, user.id);
    
    return res.json(messages);
  } catch (error) {
    console.error("Error getting return messages:", error);
    return res.status(500).json({ error: "Failed to get return messages" });
  }
});

// Add return message
router.post("/:id/messages", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const { message, mediaUrls } = req.body;
    
    if (isNaN(returnId) || !message) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Get the return request to check authorization
    const returnRequest = await storage.getReturnRequestById(returnId);
    
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }
    
    // Check if user is authorized to add messages to this return
    const user = req.user;
    const isAuthorized = 
      returnRequest.buyerId === user.id || 
      returnRequest.sellerId === user.id || 
      user.role === "admin" || 
      user.isCoAdmin;
    
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Add message
    const newMessage = await returnHandlers.addReturnMessage(
      returnId,
      user.id,
      message,
      mediaUrls
    );
    
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error adding return message:", error);
    return res.status(500).json({ error: "Failed to add return message" });
  }
});

// Cancel return request
router.post("/:id/cancel", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const { reason } = req.body;
    
    if (isNaN(returnId) || !reason) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Cancel the return
    const updatedReturn = await returnHandlers.cancelReturnRequest(
      returnId,
      req.user.id,
      reason
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    console.error("Error cancelling return request:", error);
    return res.status(500).json({ error: error.message || "Failed to cancel return request" });
  }
});

// Update return status (seller or admin only)
router.post("/:id/status", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    if (isNaN(returnId) || !status) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Update the status
    const updatedReturn = await returnHandlers.updateReturnRequestStatus(
      returnId,
      req.user.id,
      status,
      notes
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    console.error("Error updating return status:", error);
    return res.status(500).json({ error: error.message || "Failed to update return status" });
  }
});

// Add return tracking (buyer or admin only)
router.post("/:id/return-tracking", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const trackingInfo = req.body;
    
    if (isNaN(returnId) || !trackingInfo) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Add tracking info
    const updatedReturn = await returnHandlers.updateReturnTracking(
      returnId,
      req.user.id,
      trackingInfo
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    console.error("Error adding return tracking:", error);
    return res.status(500).json({ error: error.message || "Failed to add return tracking" });
  }
});

// Add replacement tracking (seller or admin only)
router.post("/:id/replacement-tracking", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const trackingInfo = req.body;
    
    if (isNaN(returnId) || !trackingInfo) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Add tracking info
    const updatedReturn = await returnHandlers.updateReplacementTracking(
      returnId,
      req.user.id,
      trackingInfo
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    console.error("Error adding replacement tracking:", error);
    return res.status(500).json({ error: error.message || "Failed to add replacement tracking" });
  }
});

// Mark return as received (seller or admin only)
router.post("/:id/mark-received", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const { condition, notes } = req.body;
    
    if (isNaN(returnId) || !condition) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Mark as received
    const updatedReturn = await returnHandlers.markReturnReceived(
      returnId,
      req.user.id,
      condition,
      notes
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    console.error("Error marking return as received:", error);
    return res.status(500).json({ error: error.message || "Failed to mark return as received" });
  }
});

// Complete return request (seller or admin only)
router.post("/:id/complete", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    
    if (isNaN(returnId)) {
      return res.status(400).json({ error: "Invalid return ID" });
    }
    
    // Complete the return
    const updatedReturn = await returnHandlers.completeReturnRequest(
      returnId,
      req.user.id
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    console.error("Error completing return request:", error);
    return res.status(500).json({ error: error.message || "Failed to complete return request" });
  }
});

// Return policies routes (admin or seller only)

// Get return policies for seller
router.get("/policies/seller", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Only sellers or admins can view policies
    if (req.user.role !== "seller" && req.user.role !== "admin" && !req.user.isCoAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const policies = await storage.getReturnPoliciesBySellerId(req.user.id);
    return res.json(policies);
  } catch (error) {
    console.error("Error getting seller return policies:", error);
    return res.status(500).json({ error: "Failed to get return policies" });
  }
});

// Create policy
router.post("/policies", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Only admins can create global policies or policies for other sellers
    const isAdmin = req.user.role === "admin" || req.user.isCoAdmin;
    
    // If the user is not an admin, they can only create policies for themselves
    if (!isAdmin && req.body.sellerId && req.body.sellerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Create the policy
    const policy = await storage.createReturnPolicy({
      ...req.body,
      // If seller is creating policy for themselves, make sure sellerId is correct
      sellerId: isAdmin ? req.body.sellerId : req.user.id
    });
    
    return res.status(201).json(policy);
  } catch (error) {
    console.error("Error creating return policy:", error);
    return res.status(500).json({ error: "Failed to create return policy" });
  }
});

// Update policy
router.put("/policies/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const policyId = parseInt(req.params.id);
    
    if (isNaN(policyId)) {
      return res.status(400).json({ error: "Invalid policy ID" });
    }
    
    // Get the policy to check ownership
    const policy = await storage.getReturnPolicyById(policyId);
    
    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }
    
    // Check authorization
    const isAdmin = req.user.role === "admin" || req.user.isCoAdmin;
    const isSeller = req.user.role === "seller";
    const isSellerOwner = isSeller && policy.sellerId === req.user.id;
    
    // Only admins can update global policies or policies for other sellers
    if (!isAdmin && !isSellerOwner) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Update the policy
    const updatedPolicy = await storage.updateReturnPolicy(
      policyId,
      req.body
    );
    
    return res.json(updatedPolicy);
  } catch (error) {
    console.error("Error updating return policy:", error);
    return res.status(500).json({ error: "Failed to update return policy" });
  }
});

export default router;