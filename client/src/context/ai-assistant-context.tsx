import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ProductRecommendation = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  sellerId: number;
};

type AIAssistantContextType = {
  sessionId: string;
  personalizedRecommendations: ProductRecommendation[];
  complementaryProducts: ProductRecommendation[];
  sizeRecommendation: {
    recommendedSize: string | null;
    confidence: number;
    message: string;
  };
  conversationHistory: ConversationMessage[];
  isLoading: boolean;
  isAssistantVisible: boolean;
  // Track user activity (view product, search, etc.)
  trackActivity: (activityType: string, productId?: number, categoryId?: number, searchQuery?: string, additionalData?: any) => Promise<void>;
  // Get complementary products for a specific product
  getComplementaryProducts: (productId: number, limit?: number) => Promise<ProductRecommendation[]>;
  // Get size recommendation for a product
  getSizeRecommendation: (productId: number, category?: string) => Promise<{ recommendedSize: string | null; confidence: number; message: string }>;
  // Ask a question about a specific product
  askProductQuestion: (productId: number, question: string) => Promise<string>;
  // Chat with assistant (general questions)
  sendMessage: (message: string, productId?: number, categoryId?: number) => Promise<void>;
  // Toggle assistant visibility
  toggleAssistant: () => void;
  // Clear conversation
  clearConversation: () => void;
};

const AIAssistantContext = createContext<AIAssistantContextType | null>(null);

export const AIAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string>("");
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<ProductRecommendation[]>([]);
  const [complementaryProducts, setComplementaryProducts] = useState<ProductRecommendation[]>([]);
  const [sizeRecommendation, setSizeRecommendation] = useState<{
    recommendedSize: string | null;
    confidence: number;
    message: string;
  }>({
    recommendedSize: null,
    confidence: 0,
    message: "Sign in to get personalized size recommendations",
  });
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAssistantVisible, setIsAssistantVisible] = useState<boolean>(false);

  // Initialize session ID on load
  useEffect(() => {
    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId]);

  // Fetch personalized recommendations when user or session changes
  useEffect(() => {
    if (sessionId) {
      fetchPersonalizedRecommendations();
    }
  }, [sessionId, user?.id]);

  // Initialize a session for the user
  const initializeSession = async () => {
    try {
      const res = await apiRequest("GET", "/api/ai/session");
      const data = await res.json();
      setSessionId(data.sessionId);
    } catch (error) {
      console.error("Error initializing AI session:", error);
      // Generate a client-side fallback session ID if API fails
      setSessionId(`session_${Date.now()}`);
    }
  };

  // Track user activity for personalization
  const trackActivity = async (
    activityType: string,
    productId?: number,
    categoryId?: number,
    searchQuery?: string,
    additionalData?: any
  ) => {
    if (!sessionId) return;

    try {
      await apiRequest("POST", "/api/ai/track-activity", {
        sessionId,
        activityType,
        productId,
        categoryId,
        searchQuery,
        additionalData,
      });
    } catch (error) {
      console.error("Error tracking activity:", error);
    }
  };

  // Fetch personalized product recommendations
  const fetchPersonalizedRecommendations = async (limit = 5) => {
    if (!sessionId) return;

    try {
      const res = await apiRequest("GET", `/api/ai/recommendations?sessionId=${sessionId}&limit=${limit}`);
      const data = await res.json();
      setPersonalizedRecommendations(data);
    } catch (error) {
      console.error("Error fetching personalized recommendations:", error);
    }
  };

  // Get complementary products for a specific product
  const getComplementaryProducts = async (productId: number, limit = 5): Promise<ProductRecommendation[]> => {
    if (!sessionId || !productId) return [];

    try {
      const res = await apiRequest("GET", `/api/ai/complementary-products/${productId}?sessionId=${sessionId}&limit=${limit}`);
      const data = await res.json();
      setComplementaryProducts(data); // Update state
      return data;
    } catch (error) {
      console.error("Error fetching complementary products:", error);
      return [];
    }
  };

  // Get size recommendation for a product
  const getSizeRecommendation = async (
    productId: number,
    category?: string
  ): Promise<{ recommendedSize: string | null; confidence: number; message: string }> => {
    if (!productId) {
      return {
        recommendedSize: null,
        confidence: 0,
        message: "No product selected",
      };
    }

    try {
      const queryParams = category ? `?category=${encodeURIComponent(category)}` : "";
      const res = await apiRequest("GET", `/api/ai/size-recommendations/${productId}${queryParams}`);
      const data = await res.json();
      setSizeRecommendation(data); // Update state
      return data;
    } catch (error) {
      console.error("Error fetching size recommendation:", error);
      return {
        recommendedSize: null,
        confidence: 0,
        message: "Unable to determine size recommendation",
      };
    }
  };

  // Ask a question about a specific product
  const askProductQuestion = async (productId: number, question: string): Promise<string> => {
    if (!sessionId || !productId || !question) return "Missing required information";

    try {
      setIsLoading(true);
      const res = await apiRequest("POST", `/api/ai/product-qa/${productId}`, {
        question,
        sessionId,
      });
      const data = await res.json();
      setIsLoading(false);
      return data.answer;
    } catch (error) {
      console.error("Error asking product question:", error);
      setIsLoading(false);
      return "I'm sorry, but I'm having trouble finding information about this product right now.";
    }
  };

  // Chat with assistant (general questions)
  const sendMessage = async (message: string, productId?: number, categoryId?: number) => {
    if (!sessionId || !message.trim()) return;

    try {
      setIsLoading(true);
      
      // Add user message to conversation immediately for better UX
      setConversationHistory((prev) => [...prev, { role: "user", content: message }]);

      const res = await apiRequest("POST", "/api/ai/chat", {
        message,
        sessionId,
        productId,
        categoryId,
        conversationHistory,
      });
      
      const data = await res.json();
      
      // Update with the full conversation history from the server
      setConversationHistory(data.conversationHistory);
      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message to AI assistant:", error);
      setIsLoading(false);
      
      // Add error message to conversation
      setConversationHistory((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "I'm sorry, but I'm having trouble processing your request right now. Please try again later." 
        }
      ]);
      
      toast({
        title: "Communication Error",
        description: "Unable to reach the AI assistant. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Toggle assistant visibility
  const toggleAssistant = () => {
    setIsAssistantVisible(!isAssistantVisible);
  };

  // Clear conversation
  const clearConversation = () => {
    setConversationHistory([]);
  };

  return (
    <AIAssistantContext.Provider
      value={{
        sessionId,
        personalizedRecommendations,
        complementaryProducts,
        sizeRecommendation,
        conversationHistory,
        isLoading,
        isAssistantVisible,
        trackActivity,
        getComplementaryProducts,
        getSizeRecommendation,
        askProductQuestion,
        sendMessage,
        toggleAssistant,
        clearConversation,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider");
  }
  return context;
};