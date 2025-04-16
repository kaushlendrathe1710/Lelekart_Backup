import { Request, Response } from 'express';
import { storage } from '../storage';
import { 
  insertGiftCardSchema, 
  insertGiftCardTransactionSchema, 
  insertGiftCardTemplateSchema 
} from '@shared/schema';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Generate a unique gift card code
const generateGiftCardCode = () => {
  // Generate a random code with prefix GC-
  const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GC-${randomCode}`;
};

// Get all gift cards (admin only)
export const getAllGiftCards = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const giftCards = await storage.getAllGiftCards(page, limit);
    return res.json(giftCards);
  } catch (error) {
    console.error('Error getting gift cards:', error);
    return res.status(500).json({ error: 'Failed to get gift cards' });
  }
};

// Get gift cards for a user
export const getUserGiftCards = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const giftCards = await storage.getUserGiftCards(userId);
    return res.json(giftCards);
  } catch (error) {
    console.error('Error getting user gift cards:', error);
    return res.status(500).json({ error: 'Failed to get user gift cards' });
  }
};

// Get a single gift card by ID
export const getGiftCard = async (req: Request, res: Response) => {
  try {
    const giftCardId = parseInt(req.params.id);
    
    if (!giftCardId) {
      return res.status(400).json({ error: 'Gift card ID is required' });
    }
    
    const giftCard = await storage.getGiftCard(giftCardId);
    
    if (!giftCard) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    return res.json(giftCard);
  } catch (error) {
    console.error('Error getting gift card:', error);
    return res.status(500).json({ error: 'Failed to get gift card' });
  }
};

// Check gift card balance by code
export const checkGiftCardBalance = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Gift card code is required' });
    }
    
    const giftCard = await storage.getGiftCardByCode(code);
    
    if (!giftCard) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    if (!giftCard.isActive) {
      return res.status(400).json({ error: 'Gift card is inactive' });
    }
    
    // Check if the gift card is expired
    if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
      return res.status(400).json({ error: 'Gift card has expired' });
    }
    
    return res.json({
      code: giftCard.code,
      balance: giftCard.currentBalance,
      isActive: giftCard.isActive,
      expiryDate: giftCard.expiryDate
    });
  } catch (error) {
    console.error('Error checking gift card balance:', error);
    return res.status(500).json({ error: 'Failed to check gift card balance' });
  }
};

// Create a new gift card
export const createGiftCard = async (req: Request, res: Response) => {
  try {
    const { initialValue, recipientEmail, recipientName, message, designTemplate, purchasedBy } = req.body;
    
    if (!initialValue || initialValue <= 0) {
      return res.status(400).json({ error: 'Valid initial value is required' });
    }
    
    // Generate a unique code for the gift card
    const code = generateGiftCardCode();
    
    // Set expiry date to 1 year from now
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    const giftCardData = {
      code,
      initialValue,
      currentBalance: initialValue,
      isActive: true,
      expiryDate,
      recipientEmail,
      recipientName,
      message,
      designTemplate: designTemplate || 'default',
      purchasedBy: purchasedBy ? parseInt(purchasedBy) : undefined
    };
    
    // Validate and create the gift card
    const validatedData = insertGiftCardSchema.parse(giftCardData);
    const giftCard = await storage.createGiftCard(validatedData);
    
    // Create a purchase transaction record
    if (giftCard.id) {
      await storage.createGiftCardTransaction({
        giftCardId: giftCard.id,
        userId: purchasedBy ? parseInt(purchasedBy) : undefined,
        amount: initialValue,
        type: 'purchase',
        note: 'Gift card purchase'
      });
    }
    
    return res.status(201).json(giftCard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating gift card:', error);
    return res.status(500).json({ error: 'Failed to create gift card' });
  }
};

// Apply gift card to an order
export const applyGiftCard = async (req: Request, res: Response) => {
  try {
    const { code, amount, orderId, userId } = req.body;
    
    if (!code || !amount || amount <= 0 || !orderId) {
      return res.status(400).json({ error: 'Gift card code, valid amount, and order ID are required' });
    }
    
    // Get the gift card
    const giftCard = await storage.getGiftCardByCode(code);
    
    if (!giftCard) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    if (!giftCard.isActive) {
      return res.status(400).json({ error: 'Gift card is inactive' });
    }
    
    // Check if the gift card is expired
    if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
      return res.status(400).json({ error: 'Gift card has expired' });
    }
    
    // Check if there's enough balance
    if (giftCard.currentBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient gift card balance',
        currentBalance: giftCard.currentBalance,
        requestedAmount: amount
      });
    }
    
    // Update the gift card balance
    const updatedGiftCard = await storage.updateGiftCard(giftCard.id, {
      currentBalance: giftCard.currentBalance - amount,
      lastUsed: new Date()
    });
    
    // Create a redemption transaction
    const transaction = await storage.createGiftCardTransaction({
      giftCardId: giftCard.id,
      userId: userId ? parseInt(userId) : undefined,
      orderId: parseInt(orderId),
      amount,
      type: 'redemption',
      note: `Applied to order #${orderId}`
    });
    
    return res.status(200).json({
      transaction,
      giftCard: updatedGiftCard,
      appliedAmount: amount,
      remainingBalance: updatedGiftCard.currentBalance
    });
  } catch (error) {
    console.error('Error applying gift card:', error);
    return res.status(500).json({ error: 'Failed to apply gift card' });
  }
};

// Deactivate/reactivate a gift card (admin only)
export const toggleGiftCardStatus = async (req: Request, res: Response) => {
  try {
    const giftCardId = parseInt(req.params.id);
    
    if (!giftCardId) {
      return res.status(400).json({ error: 'Gift card ID is required' });
    }
    
    const giftCard = await storage.getGiftCard(giftCardId);
    
    if (!giftCard) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    const updatedGiftCard = await storage.updateGiftCard(giftCardId, {
      isActive: !giftCard.isActive
    });
    
    return res.json(updatedGiftCard);
  } catch (error) {
    console.error('Error toggling gift card status:', error);
    return res.status(500).json({ error: 'Failed to toggle gift card status' });
  }
};

// Get all gift card templates (admin)
export const getGiftCardTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await storage.getGiftCardTemplates();
    return res.json(templates);
  } catch (error) {
    console.error('Error getting gift card templates:', error);
    return res.status(500).json({ error: 'Failed to get gift card templates' });
  }
};

// Create a new gift card template (admin only)
export const createGiftCardTemplate = async (req: Request, res: Response) => {
  try {
    const templateData = insertGiftCardTemplateSchema.parse(req.body);
    
    const template = await storage.createGiftCardTemplate(templateData);
    return res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating gift card template:', error);
    return res.status(500).json({ error: 'Failed to create gift card template' });
  }
};

// Update a gift card template (admin only)
export const updateGiftCardTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }
    
    const template = await storage.getGiftCardTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Gift card template not found' });
    }
    
    const updatedTemplate = await storage.updateGiftCardTemplate(templateId, req.body);
    return res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating gift card template:', error);
    return res.status(500).json({ error: 'Failed to update gift card template' });
  }
};

// Delete a gift card template (admin only)
export const deleteGiftCardTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }
    
    const template = await storage.getGiftCardTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Gift card template not found' });
    }
    
    await storage.deleteGiftCardTemplate(templateId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting gift card template:', error);
    return res.status(500).json({ error: 'Failed to delete gift card template' });
  }
};