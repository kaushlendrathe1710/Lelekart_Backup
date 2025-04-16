import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertRewardSchema, insertRewardTransactionSchema, insertRewardRuleSchema } from '@shared/schema';
import { z } from 'zod';

// Get user rewards
export const getUserRewards = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const rewards = await storage.getUserRewards(userId);
    
    if (!rewards) {
      // If no rewards exist yet, create a new rewards record
      const newRewards = await storage.createUserRewards({
        userId,
        points: 0,
        lifetimePoints: 0
      });
      
      return res.json(newRewards);
    }
    
    return res.json(rewards);
  } catch (error) {
    console.error('Error getting user rewards:', error);
    return res.status(500).json({ error: 'Failed to get user rewards' });
  }
};

// Get reward transactions for a user
export const getUserRewardTransactions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const transactions = await storage.getUserRewardTransactions(userId, page, limit);
    return res.json(transactions);
  } catch (error) {
    console.error('Error getting reward transactions:', error);
    return res.status(500).json({ error: 'Failed to get reward transactions' });
  }
};

// Add reward points to a user
export const addRewardPoints = async (req: Request, res: Response) => {
  try {
    const { userId, points, type, description, orderId, productId } = req.body;
    
    if (!userId || !points || !type) {
      return res.status(400).json({ error: 'User ID, points, and type are required' });
    }
    
    // First, add a transaction record
    const transaction = await storage.createRewardTransaction({
      userId,
      points,
      type,
      description,
      orderId,
      productId,
      status: 'active'
    });
    
    // Then, update the user's total points
    const userRewards = await storage.getUserRewards(userId);
    
    if (!userRewards) {
      // Create a new rewards record if it doesn't exist
      await storage.createUserRewards({
        userId,
        points,
        lifetimePoints: points
      });
    } else {
      // Update existing rewards
      await storage.updateUserRewards(userId, {
        points: userRewards.points + points,
        lifetimePoints: userRewards.lifetimePoints + points
      });
    }
    
    return res.status(201).json(transaction);
  } catch (error) {
    console.error('Error adding reward points:', error);
    return res.status(500).json({ error: 'Failed to add reward points' });
  }
};

// Redeem reward points
export const redeemRewardPoints = async (req: Request, res: Response) => {
  try {
    const { userId, points, description, orderId } = req.body;
    
    if (!userId || !points) {
      return res.status(400).json({ error: 'User ID and points are required' });
    }
    
    // Get the user's current rewards
    const userRewards = await storage.getUserRewards(userId);
    
    if (!userRewards) {
      return res.status(404).json({ error: 'User rewards not found' });
    }
    
    // Check if user has enough points
    if (userRewards.points < points) {
      return res.status(400).json({ 
        error: 'Insufficient points',
        currentPoints: userRewards.points,
        requestedPoints: points
      });
    }
    
    // Add a redemption transaction
    const transaction = await storage.createRewardTransaction({
      userId,
      points: -points, // Negative value for redemption
      type: 'redeem',
      description: description || 'Points redemption',
      orderId,
      status: 'used'
    });
    
    // Update the user's points
    await storage.updateUserRewards(userId, {
      points: userRewards.points - points
    });
    
    return res.status(201).json({
      transaction,
      remainingPoints: userRewards.points - points
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    return res.status(500).json({ error: 'Failed to redeem points' });
  }
};

// Get all reward rules (for admin)
export const getRewardRules = async (_req: Request, res: Response) => {
  try {
    const rules = await storage.getRewardRules();
    return res.json(rules);
  } catch (error) {
    console.error('Error getting reward rules:', error);
    return res.status(500).json({ error: 'Failed to get reward rules' });
  }
};

// Create a new reward rule (admin only)
export const createRewardRule = async (req: Request, res: Response) => {
  try {
    // Validate rule data
    const ruleData = insertRewardRuleSchema.parse(req.body);
    
    const rule = await storage.createRewardRule(ruleData);
    return res.status(201).json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating reward rule:', error);
    return res.status(500).json({ error: 'Failed to create reward rule' });
  }
};

// Update a reward rule (admin only)
export const updateRewardRule = async (req: Request, res: Response) => {
  try {
    const ruleId = parseInt(req.params.ruleId);
    
    if (!ruleId) {
      return res.status(400).json({ error: 'Rule ID is required' });
    }
    
    const rule = await storage.getRewardRule(ruleId);
    
    if (!rule) {
      return res.status(404).json({ error: 'Reward rule not found' });
    }
    
    const updatedRule = await storage.updateRewardRule(ruleId, req.body);
    return res.json(updatedRule);
  } catch (error) {
    console.error('Error updating reward rule:', error);
    return res.status(500).json({ error: 'Failed to update reward rule' });
  }
};

// Delete a reward rule (admin only)
export const deleteRewardRule = async (req: Request, res: Response) => {
  try {
    const ruleId = parseInt(req.params.ruleId);
    
    if (!ruleId) {
      return res.status(400).json({ error: 'Rule ID is required' });
    }
    
    const rule = await storage.getRewardRule(ruleId);
    
    if (!rule) {
      return res.status(404).json({ error: 'Reward rule not found' });
    }
    
    await storage.deleteRewardRule(ruleId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting reward rule:', error);
    return res.status(500).json({ error: 'Failed to delete reward rule' });
  }
};

// Get reward statistics for admin dashboard
export const getRewardStatistics = async (_req: Request, res: Response) => {
  try {
    const statistics = await storage.getRewardStatistics();
    return res.json(statistics);
  } catch (error) {
    console.error('Error getting reward statistics:', error);
    return res.status(500).json({ error: 'Failed to get reward statistics' });
  }
};