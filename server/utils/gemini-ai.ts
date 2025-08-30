import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize the Gemini API if key is available
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

if (!genAI) {
  console.warn(
    "Warning: GEMINI_API_KEY environment variable is missing. AI features will be disabled."
  );
}

// Use the most advanced model - Gemini 1.5 Pro only if API is available
const model = genAI
  ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  : null;

/**
 * General purpose chat function for the AI assistant
 */
export async function getChatResponse(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  if (!model) {
    throw new Error(
      "Gemini API is not configured. Please add GEMINI_API_KEY to your secrets."
    );
  }
  // Convert messages format for Gemini
  const geminiMessages = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [
      typeof msg.content === "string"
        ? { text: msg.content }
        : { text: String(msg.content) },
    ],
  }));

  // Add system prompt as first message from model
  geminiMessages.unshift({
    role: "model",
    parts: [
      typeof systemPrompt === "string"
        ? { text: systemPrompt }
        : { text: String(systemPrompt) },
    ],
  });

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent({
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chat response:", error);
    throw new Error(
      `Failed to generate chat response: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get a personalized product recommendation based on user preferences and history
 */
export async function getPersonalizedRecommendations(
  userId?: number,
  browsingHistory?: Array<{
    productId: number;
    productName: string;
    category: string;
    viewCount: number;
    lastViewed: Date;
  }>,
  purchaseHistory?: Array<{
    productId: number;
    productName: string;
    category: string;
    purchaseDate: Date;
  }>
): Promise<string> {
  const userContext = userId
    ? `For user ID: ${userId}.`
    : "For an anonymous user.";

  let browsingContext = "No browsing history available.";
  if (browsingHistory && browsingHistory.length > 0) {
    browsingContext = `
      User has recently viewed these products:
      ${browsingHistory
        .map(
          (item) =>
            `- ${item.productName} (Category: ${item.category}, Viewed ${item.viewCount} times, Last viewed: ${item.lastViewed})`
        )
        .join("\n")}
    `;
  }

  let purchaseContext = "No purchase history available.";
  if (purchaseHistory && purchaseHistory.length > 0) {
    purchaseContext = `
      User has purchased these products:
      ${purchaseHistory
        .map(
          (item) =>
            `- ${item.productName} (Category: ${item.category}, Purchased on: ${item.purchaseDate})`
        )
        .join("\n")}
    `;
  }

  const prompt = `
    I need personalized product recommendations for an e-commerce customer.
    ${userContext}
    ${browsingContext}
    ${purchaseContext}
    
    Based on this information, provide recommendations for products that would interest this user.
    Respond with a JSON array of product recommendations, where each object has these fields:
    - productId (number, can be randomly assigned between 1-100)
    - name (string, product name)
    - description (string, product description)
    - price (number, product price)
    - category (string, product category)
    - image_url (string, URL for product image)

    Ensure the recommendations are appropriate for the user's apparent interests.
    Generate at least 5 product recommendations.
    ONLY respond with the JSON array, no explanations or other text.
  `;

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no JSON array was found, return the whole text
    return text;
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    throw new Error(
      `Failed to generate recommendations: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate complementary product suggestions for a specific product
 */
export async function getComplementaryProducts(
  productId: number,
  productName: string,
  productCategory: string,
  limit: number = 5
): Promise<string> {
  const prompt = `
    I need complementary product suggestions for an e-commerce product.
    Product ID: ${productId}
    Product Name: ${productName}
    Category: ${productCategory}
    
    Based on this information, provide ${limit} products that would complement this item or are frequently bought together with it.
    Respond with a JSON array of product recommendations, where each object has these fields:
    - id (number, can be randomly assigned between 1-100)
    - name (string, product name)
    - description (string, product description)
    - price (number, product price)
    - category (string, product category)
    - image_url (string, URL for product image)

    Ensure the suggestions are genuinely complementary to the main product.
    ONLY respond with the JSON array, no explanations or other text.
  `;

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no JSON array was found, return the whole text
    return text;
  } catch (error) {
    console.error("Error generating complementary products:", error);
    throw new Error(
      `Failed to generate complementary products: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get size recommendations based on product and user measurements
 */
export async function getSizeRecommendation(
  productId: number,
  productCategory: string,
  userMeasurements?: {
    height?: string;
    weight?: string;
    bust?: string;
    waist?: string;
    hips?: string;
    inseam?: string;
    shoeSize?: string;
  },
  previousPurchases?: Array<{
    productId: number;
    productName: string;
    size: string;
    fit: "too small" | "too large" | "just right";
  }>,
  availableSizes: string[] = []
): Promise<string> {
  let measurementsContext = "No user measurements provided.";
  if (userMeasurements && Object.keys(userMeasurements).length > 0) {
    measurementsContext = `
      User measurements:
      ${Object.entries(userMeasurements)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join("\n")}
    `;
  }

  let purchaseContext = "No previous size information available.";
  if (previousPurchases && previousPurchases.length > 0) {
    purchaseContext = `
      User's previous size selections:
      ${previousPurchases
        .map(
          (item) =>
            `- ${item.productName}: Size ${item.size} (Fit was ${item.fit})`
        )
        .join("\n")}
    `;
  }

  const prompt = `
    I need to recommend the best size for a customer shopping for a product.
    Product ID: ${productId}
    Product Category: ${productCategory}
    Available Sizes: ${availableSizes.join(", ")}
    
    ${measurementsContext}
    ${purchaseContext}
    
    Based on this information, please provide:
    1. The recommended size from the available sizes
    2. An explanation of why this size would be best
    3. Any additional sizing advice for this specific product type
    
    Format your response as a JSON object with these fields:
    - recommendedSize (string): The best size for this customer
    - confidence (number between 0-1): How confident you are in this recommendation
    - explanation (string): Explanation for the recommendation
    - additionalAdvice (string): Any extra sizing tips
    
    ONLY respond with the JSON object, no additional text.
  `;

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no JSON object was found, return the whole text
    return text;
  } catch (error) {
    console.error("Error generating size recommendation:", error);
    throw new Error(
      `Failed to generate size recommendation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Answer product-specific questions
 */
export async function answerProductQuestion(
  productId: number,
  productName: string,
  productDescription: string,
  productCategory: string,
  question: string
): Promise<string> {
  const prompt = `
    I need to answer a customer's question about a product.
    Product ID: ${productId}
    Product Name: ${productName}
    Product Description: ${productDescription}
    Product Category: ${productCategory}
    
    Customer Question: "${question}"
    
    Please provide a helpful, informative answer to the customer's question.
    If the answer cannot be directly inferred from the product information provided,
    give a reasonable response based on general knowledge about similar products.
    
    Format your response as a JSON object with these fields:
    - answer (string): Your response to the customer's question
    - confidence (number between 0-1): How confident you are in this answer
    - suggestionsForMoreInfo (array of strings): Additional details the customer might want to know
    
    ONLY respond with the JSON object, no additional text.
  `;

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no JSON object was found, return the whole text
    return text;
  } catch (error) {
    console.error("Error answering product question:", error);
    throw new Error(
      `Failed to answer product question: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Find similar products using AI analysis
 * @param productInfo Information about the product to find similar items for
 * @param availableProducts Array of available products to choose from
 * @param limit Maximum number of similar products to return
 * @returns Array of similar product IDs
 */
export async function findSimilarProducts(
  productInfo: {
    name: string;
    category: string;
    subcategory1?: string;
    subcategory2?: string;
    description?: string;
    brand?: string;
    price?: number;
  },
  availableProducts: Array<{
    id: number;
    name: string;
    category: string;
    subcategory1?: string;
    subcategory2?: string;
    description?: string;
    brand?: string;
    price?: number;
  }>,
  limit: number = 6
): Promise<number[]> {
  if (!model) {
    throw new Error(
      "Gemini API is not configured. Please add GEMINI_API_KEY to your secrets."
    );
  }

  try {
    // Create a detailed prompt for the AI
    const prompt = `
You are an AI product recommendation system for an e-commerce platform.

I need to find ${limit} products that are MOST SIMILAR to this product:
- Name: ${productInfo.name}
- Category: ${productInfo.category}
- Subcategory: ${productInfo.subcategory1 || "N/A"} ${productInfo.subcategory2 || "N/A"}
- Description: ${productInfo.description || "N/A"}
- Brand: ${productInfo.brand || "N/A"}
- Price: ${productInfo.price || "N/A"}

Available products to choose from:
${availableProducts.map((p) => `ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Subcategory: ${p.subcategory1 || "N/A"} ${p.subcategory2 || "N/A"}, Brand: ${p.brand || "N/A"}, Price: ${p.price || "N/A"}`).join("\n")}

IMPORTANT RULES:
1. Focus on products in the SAME category as the target product
2. Prioritize products with similar subcategories
3. Consider product names, descriptions, and brands for similarity
4. If this is jewellery, find other jewellery items, not clothing or electronics
5. If this is electronics, find other electronics, not clothing or jewellery
6. Price similarity is a factor but not the primary one
7. Return ONLY the product IDs of the most similar products

Return ONLY a JSON array of product IDs (numbers) that would be most similar.
Example: [123, 456, 789]

If you cannot determine similarity or don't have enough context, return an empty array: []
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          // Filter to only include IDs that exist in availableProducts
          const validIds = parsed.filter(
            (id) =>
              typeof id === "number" &&
              id > 0 &&
              availableProducts.some((p) => p.id === id)
          );
          return validIds.slice(0, limit);
        }
      } catch (parseError) {
        console.error("Error parsing AI response JSON:", parseError);
      }
    }

    // Fallback: try to find numbers in the response
    const numberMatches = text.match(/\d+/g);
    if (numberMatches) {
      const ids = numberMatches
        .map(Number)
        .filter((id) => id > 0 && availableProducts.some((p) => p.id === id));
      return ids.slice(0, limit);
    }

    return [];
  } catch (error) {
    console.error("Error in AI similar products:", error);
    return [];
  }
}
