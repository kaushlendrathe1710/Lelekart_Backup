import { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertGiftCardSchema, insertGiftCardTemplateSchema } from '@shared/schema';
import crypto from 'crypto';

// Admin: Get all gift cards with optional filtering
export async function getAllGiftCards(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    // Parse query parameters for filtering
    const filters: Record<string, any> = {};
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    if (req.query.code) {
      filters.code = req.query.code as string;
    }
    if (req.query.recipientEmail) {
      filters.recipientEmail = req.query.recipientEmail as string;
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const offset = (page - 1) * limit;

    const giftCards = await storage.getAllGiftCards(filters, offset, limit);
    const totalCount = await storage.getAllGiftCardsCount(filters);

    return res.json({
      giftCards,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error getting gift cards:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Admin: Create a new gift card
export async function createGiftCard(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    // Extend the gift card schema to handle the code generation
    const createGiftCardSchema = insertGiftCardSchema.extend({
      code: z.string().optional(), // If not provided, we'll generate one
      initialValue: z.number().int().positive(),
      expiryMonths: z.number().int().min(1).optional(), // Optional number of months until expiry
    }).omit({ createdAt: true, lastUsed: true });

    const result = createGiftCardSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid gift card data', errors: result.error.format() });
    }

    let { code, expiryMonths, ...giftCardData } = result.data;
    
    // Generate a unique code if not provided
    if (!code) {
      code = await generateUniqueGiftCardCode();
    }

    // Calculate expiry date if months are provided
    let expiryDate = undefined;
    if (expiryMonths) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    }

    // Create the gift card
    const newGiftCard = await storage.createGiftCard({
      ...giftCardData,
      code,
      currentBalance: giftCardData.initialValue, // Initialize current balance to initial value
      expiryDate,
      createdAt: new Date()
    });

    return res.status(201).json(newGiftCard);
  } catch (error) {
    console.error('Error creating gift card:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Generate a unique gift card code
async function generateUniqueGiftCardCode(): Promise<string> {
  // Generate a random alphanumeric code
  const generateCode = () => {
    const randomBytes = crypto.randomBytes(6);
    return randomBytes.toString('hex').toUpperCase();
  };

  // Format the code with hyphens for readability
  const formatCode = (code: string) => {
    const parts = [];
    for (let i = 0; i < code.length; i += 4) {
      parts.push(code.substring(i, i + 4));
    }
    return parts.join('-');
  };

  // Try to generate a unique code, retrying if there's a collision
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    code = formatCode(generateCode());
    const existing = await storage.getGiftCardByCode(code);
    isUnique = !existing;
  }
  
  return code;
}

// Admin: Update a gift card
export async function updateGiftCard(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const giftCardId = parseInt(req.params.id, 10);
    if (isNaN(giftCardId)) {
      return res.status(400).json({ message: 'Invalid gift card ID' });
    }

    // Only allow updating certain fields
    const updateSchema = z.object({
      isActive: z.boolean().optional(),
      recipientEmail: z.string().email().optional().nullable(),
      recipientName: z.string().optional().nullable(),
      message: z.string().optional().nullable(),
      designTemplate: z.string().optional(),
      expiryDate: z.string().optional().nullable(), // ISO date string
    });

    const result = updateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid update data', errors: result.error.format() });
    }

    const updateData = result.data;
    
    // Convert ISO date string to Date object if provided
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate);
    }
    
    const updatedGiftCard = await storage.updateGiftCard(giftCardId, updateData);
    if (!updatedGiftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }

    return res.json(updatedGiftCard);
  } catch (error) {
    console.error('Error updating gift card:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Admin: Delete a gift card
export async function deleteGiftCard(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const giftCardId = parseInt(req.params.id, 10);
    if (isNaN(giftCardId)) {
      return res.status(400).json({ message: 'Invalid gift card ID' });
    }

    const success = await storage.deleteGiftCard(giftCardId);
    if (!success) {
      return res.status(404).json({ message: 'Gift card not found' });
    }

    return res.json({ message: 'Gift card deleted successfully' });
  } catch (error) {
    console.error('Error deleting gift card:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Get gift card transactions
export async function getGiftCardTransactions(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const giftCardId = parseInt(req.params.id, 10);
    if (isNaN(giftCardId)) {
      return res.status(400).json({ message: 'Invalid gift card ID' });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const offset = (page - 1) * limit;

    const transactions = await storage.getGiftCardTransactions(giftCardId, offset, limit);
    const totalCount = await storage.getGiftCardTransactionsCount(giftCardId);

    return res.json({
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error getting gift card transactions:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// User: Verify and get gift card balance
export async function verifyGiftCard(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const schema = z.object({
      code: z.string()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input data', errors: result.error.format() });
    }

    const { code } = result.data;
    
    const giftCard = await storage.getGiftCardByCode(code);
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }
    
    // Check if the gift card is active
    if (!giftCard.isActive) {
      return res.status(400).json({ message: 'Gift card is inactive' });
    }
    
    // Check if the gift card has expired
    if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Gift card has expired' });
    }
    
    // Check if the gift card has a balance
    if (giftCard.currentBalance <= 0) {
      return res.status(400).json({ message: 'Gift card has no remaining balance' });
    }
    
    return res.json({
      isValid: true,
      currentBalance: giftCard.currentBalance,
      expiryDate: giftCard.expiryDate,
      initialValue: giftCard.initialValue
    });
  } catch (error) {
    console.error('Error verifying gift card:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Apply gift card to an order (partial or full payment)
export async function applyGiftCard(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const schema = z.object({
      code: z.string(),
      orderId: z.number().int().positive(),
      amount: z.number().int().positive()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input data', errors: result.error.format() });
    }

    const { code, orderId, amount } = result.data;
    const userId = req.user!.id;
    
    // Get the gift card
    const giftCard = await storage.getGiftCardByCode(code);
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }
    
    // Validate the gift card
    if (!giftCard.isActive) {
      return res.status(400).json({ message: 'Gift card is inactive' });
    }
    
    if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Gift card has expired' });
    }
    
    if (giftCard.currentBalance <= 0) {
      return res.status(400).json({ message: 'Gift card has no remaining balance' });
    }
    
    if (amount > giftCard.currentBalance) {
      return res.status(400).json({ 
        message: 'Requested amount exceeds gift card balance',
        availableBalance: giftCard.currentBalance
      });
    }
    
    // Create a transaction record
    const transaction = await storage.createGiftCardTransaction({
      giftCardId: giftCard.id,
      userId,
      orderId,
      amount: -amount, // Negative amount for redemption
      type: 'redemption',
      transactionDate: new Date(),
      note: `Applied to order #${orderId}`
    });
    
    // Update the gift card balance
    const newBalance = giftCard.currentBalance - amount;
    const updatedGiftCard = await storage.updateGiftCardBalance(giftCard.id, newBalance);
    
    return res.status(200).json({
      message: 'Gift card applied successfully',
      amountApplied: amount,
      remainingBalance: newBalance,
      transaction
    });
  } catch (error) {
    console.error('Error applying gift card:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// User: Purchase a gift card
export async function purchaseGiftCard(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const schema = z.object({
      initialValue: z.number().int().positive(),
      recipientEmail: z.string().email(),
      recipientName: z.string().optional(),
      message: z.string().optional(),
      designTemplate: z.string().optional(),
      expiryMonths: z.number().int().min(1).optional(), // Optional number of months until expiry
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input data', errors: result.error.format() });
    }

    const { initialValue, recipientEmail, recipientName, message, designTemplate, expiryMonths } = result.data;
    const userId = req.user!.id;
    
    // Generate a unique code
    const code = await generateUniqueGiftCardCode();
    
    // Calculate expiry date if months are provided
    let expiryDate = undefined;
    if (expiryMonths) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    }
    
    // Create the gift card
    const newGiftCard = await storage.createGiftCard({
      code,
      initialValue,
      currentBalance: initialValue,
      purchasedBy: userId,
      isActive: true,
      expiryDate,
      createdAt: new Date(),
      recipientEmail,
      recipientName: recipientName || null,
      message: message || null,
      designTemplate: designTemplate || 'default'
    });
    
    // Create a purchase transaction
    await storage.createGiftCardTransaction({
      giftCardId: newGiftCard.id,
      userId,
      amount: initialValue,
      type: 'purchase',
      transactionDate: new Date(),
      note: `Gift card purchased for ${recipientEmail}`
    });
    
    // TODO: Send an email to the recipient with the gift card details
    
    return res.status(201).json({
      message: 'Gift card purchased successfully',
      giftCard: newGiftCard
    });
  } catch (error) {
    console.error('Error purchasing gift card:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Admin: Manage gift card templates
export async function getAllGiftCardTemplates(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const templates = await storage.getAllGiftCardTemplates();
    return res.json(templates);
  } catch (error) {
    console.error('Error getting gift card templates:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

export async function createGiftCardTemplate(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const templateData = insertGiftCardTemplateSchema.safeParse(req.body);
    if (!templateData.success) {
      return res.status(400).json({ message: 'Invalid template data', errors: templateData.error.format() });
    }

    const newTemplate = await storage.createGiftCardTemplate(templateData.data);
    return res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating gift card template:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

export async function updateGiftCardTemplate(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const templateId = parseInt(req.params.id, 10);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const templateData = insertGiftCardTemplateSchema.partial().safeParse(req.body);
    if (!templateData.success) {
      return res.status(400).json({ message: 'Invalid template data', errors: templateData.error.format() });
    }

    const updatedTemplate = await storage.updateGiftCardTemplate(templateId, templateData.data);
    if (!updatedTemplate) {
      return res.status(404).json({ message: 'Gift card template not found' });
    }

    return res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating gift card template:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

export async function deleteGiftCardTemplate(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const templateId = parseInt(req.params.id, 10);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const success = await storage.deleteGiftCardTemplate(templateId);
    if (!success) {
      return res.status(404).json({ message: 'Gift card template not found' });
    }

    return res.json({ message: 'Gift card template deleted successfully' });
  } catch (error) {
    console.error('Error deleting gift card template:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}