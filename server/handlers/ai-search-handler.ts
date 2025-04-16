import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import { products } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * Process a natural language search query and extract structured search parameters
 */
export async function handleAISearch(req: Request, res: Response) {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid query parameter' 
      });
    }
    
    // Get all available categories from the database for context
    const categories = await db.select({ name: products.category })
      .from(products)
      .groupBy(products.category);
    const availableCategories = categories.map(c => c.name);
    
    // Prompt for the AI model
    const prompt = `
You are a shopping assistant for an e-commerce platform called Lelekart. 
A user has provided a search query in natural language.
Your task is to extract structured search parameters from this query.

Available product categories: ${availableCategories.join(', ')}

User query: "${query}"

Analyze this query and extract the following information:
1. The main product category they're looking for
2. Any price constraints (minimum and maximum price)
3. Color preferences
4. Size preferences
5. Brand preferences
6. Any sorting preferences (price low to high, high to low, newest, popularity)
7. Other relevant keywords for the search

Return your analysis as a valid JSON object with the following structure:
{
  "category": "string or null if not specified",
  "priceMin": number or null if not specified,
  "priceMax": number or null if not specified,
  "color": "string or null if not specified",
  "size": "string or null if not specified",
  "brand": "string or null if not specified",
  "sortBy": "price_asc", "price_desc", "newest", "popularity" or null if not specified,
  "keywords": ["array", "of", "relevant", "keywords"],
  "enhancedQuery": "An improved search query based on the user's intent"
}

Only include fields that you can confidently extract from the query. If a field is not mentioned, set it to null.
Make sure the response is valid JSON.
`;
    
    // Get response from Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/```\n([\s\S]*?)\n```/) ||
                        text.match(/{[\s\S]*?}/);
                        
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      parsedResponse = JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing AI response as JSON:', error);
      console.log('Raw AI response:', text);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse AI response' 
      });
    }
    
    // Return the processed search parameters
    return res.json({
      success: true,
      query,
      filters: {
        category: parsedResponse.category,
        priceMin: parsedResponse.priceMin,
        priceMax: parsedResponse.priceMax,
        color: parsedResponse.color,
        size: parsedResponse.size,
        brand: parsedResponse.brand,
        sortBy: parsedResponse.sortBy,
        keywords: parsedResponse.keywords || []
      },
      enhancedQuery: parsedResponse.enhancedQuery || query,
    });
  } catch (error) {
    console.error('Error processing AI search:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process search query' 
    });
  }
}