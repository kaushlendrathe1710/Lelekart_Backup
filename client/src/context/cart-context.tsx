import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Product as BaseProduct, User, ProductVariant } from "@shared/schema";

// Extend the Product type to include the isVariant property and variant-related fields
type Product = BaseProduct & {
  isVariant?: boolean;
  parentProductId?: number;
  hasVariants?: boolean;
  variants?: ProductVariant[];
};
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface CartItem {
  product: Product;
  quantity: number;
  id?: number;
  userId?: number;
  variant?: ProductVariant;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  toggleCart: () => void;
  buyNow: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  validateCart: () => Promise<boolean>;
  cleanupInvalidCartItems: () => Promise<boolean>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Get user data with better error handling and logging
  const { data: user, error: userError, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/user', { 
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // User not authenticated, return null
            return null;
          }
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        
        const userData = await res.json();
        return userData;
      } catch (err) {
        console.error("Error fetching user", err);
        // Don't throw, just return null to prevent query from entering error state
        return null;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch cart items using React Query for real-time updates
  const { data: cartItems = [], isLoading: isCartLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      if (!user) {
        // User not authenticated, return empty cart
        return [];
      }
      
      try {
        // Fetch cart items for logged-in user
        const res = await fetch('/api/cart', { 
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // Handle auth error gracefully by returning empty cart
            return [];
          }
          throw new Error(`Failed to fetch cart: ${res.status}`);
        }
        
        const cartData = await res.json();
        return cartData;
      } catch (err) {
        // Log error but return empty cart for graceful degradation
        console.error("Error fetching cart", err);
        // Return empty cart on error for graceful degradation
        return [];
      }
    },
    // Only fetch cart if user is logged in
    enabled: !!user && !isUserLoading,
    staleTime: 10000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
    // Removed frequent polling to avoid performance issues
  });

  // Add to cart API mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ 
      productId, 
      quantity, 
      variantId 
    }: { 
      productId: number; 
      quantity: number; 
      variantId?: number 
    }) => {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
          },
          body: JSON.stringify({
            productId,
            quantity,
            variantId
          })
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // Handle authentication error
            toast({
              title: "Authentication Required",
              description: "Please log in to add items to your cart",
              variant: "destructive",
            });
            
            // Redirect to auth page
            setTimeout(() => navigate("/auth"), 1500);
            throw new Error("Authentication required");
          }
          
          const errorData = await res.json();
          throw new Error(errorData.error || `Server error: ${res.status}`);
        }
        
        return res.json();
      } catch (error) {
        console.error("Error in addToCartMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Force refresh cart data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      // Don't show auth errors as they are already handled in the mutation function
      if (error.message !== "Authentication required") {
        toast({
          title: "Failed to add to cart",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
  });

  // Update cart API mutation
  const updateCartMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      try {
        const res = await fetch(`/api/cart/${cartItemId}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
          },
          body: JSON.stringify({
            quantity,
          })
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // Handle authentication error
            toast({
              title: "Authentication Required",
              description: "Please log in to update your cart",
              variant: "destructive",
            });
            
            // Redirect to auth page
            setTimeout(() => navigate("/auth"), 1500);
            throw new Error("Authentication required");
          }
          
          const errorData = await res.json();
          throw new Error(errorData.error || `Server error: ${res.status}`);
        }
        
        return res.json();
      } catch (error) {
        console.error("Error in updateCartMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Force refresh cart data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      // Don't show auth errors as they are already handled in the mutation function
      if (error.message !== "Authentication required") {
        toast({
          title: "Failed to update cart",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
  });

  // Remove from cart API mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      try {
        const res = await fetch(`/api/cart/${cartItemId}`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
          }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // Handle authentication error
            toast({
              title: "Authentication Required",
              description: "Please log in to manage your cart",
              variant: "destructive",
            });
            
            // Redirect to auth page
            setTimeout(() => navigate("/auth"), 1500);
            throw new Error("Authentication required");
          }
          
          // Try to get error details if possible
          const errorData = await res.json().catch(() => ({ error: `Server error: ${res.status}` }));
          throw new Error(errorData.error || `Server error: ${res.status}`);
        }
        
        // Some DELETE endpoints don't return JSON, handle that gracefully
        return res.json().catch(() => ({}));
      } catch (error) {
        console.error("Error in removeFromCartMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Force refresh cart data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      // Don't show auth errors as they are already handled in the mutation function
      if (error.message !== "Authentication required") {
        toast({
          title: "Failed to remove item",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
  });

  // Add product to cart with optional variant
  const addToCart = async (product: Product, quantity = 1, variant?: ProductVariant) => {
    if (!user) {
      // Redirect to auth page if not logged in
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to your cart",
        variant: "default",
      });
      navigate("/auth");
      return;
    }
    
    // Only buyers can add to cart
    if (user.role !== 'buyer') {
      toast({
        title: "Action Not Allowed",
        description: "Only buyers can add items to cart. Please switch to a buyer account.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for available stock
    const availableStock = variant?.stock ?? product.stock ?? 0;
    if (availableStock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }
    
    // Limit quantity to available stock
    const requestedQuantity = Math.min(quantity, availableStock);
    if (requestedQuantity < quantity) {
      toast({
        title: "Limited Stock",
        description: `Only ${availableStock} units available. Added maximum available quantity to cart.`,
        variant: "default",
      });
    }
    
    // Validate that the product ID is valid
    if (!product || !product.id || typeof product.id !== 'number' || isNaN(product.id)) {
      toast({
        title: "Invalid Product",
        description: "The selected product cannot be added to cart.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if product has variants but none are selected
    if ((product.hasVariants || (product.variants && product.variants.length > 0)) && !variant) {
      toast({
        title: "Selection Required",
        description: "Please select product options before adding to cart",
        variant: "default",
      });
      
      // Don't add to cart - user needs to select variant first
      return;
    }
    
    // Add to server cart and immediately refresh the cart data
    addToCartMutation.mutate({
      productId: product.id,
      quantity: requestedQuantity, // Use stock-limited quantity
      variantId: variant?.id
    }, {
      onSuccess: () => {
        // Force refresh cart data immediately
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        
        // Show a toast with variant details if applicable
        let productName = product.name;
        if (variant) {
          productName += ` (${variant.color}${variant.size ? `, ${variant.size}` : ''})`;
        }
        
        toast({
          title: "Added to cart",
          description: `${productName} has been added to your cart`,
          variant: "default",
        });
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId: number) => {
    // If user is logged in, call the API directly with the item ID
    if (user) {
      removeFromCartMutation.mutate(itemId);
    }
  };

  // Update item quantity
  const updateQuantity = (itemId: number, newQuantity: number) => {
    // If user is logged in, call the API directly with the item ID
    if (user) {
      updateCartMutation.mutate({
        cartItemId: itemId,
        quantity: newQuantity,
      });
    }
  };

  // Clear the cart
  const clearCart = async () => {
    if (user) {
      try {
        // Use the dedicated clear cart endpoint instead of removing items one by one
        await apiRequest("POST", "/api/cart/clear", {});
        
        // Force refresh cart data immediately
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        
        toast({
          title: "Cart Cleared",
          description: "Your cart has been cleared successfully.",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Failed to clear cart",
          description: "There was an error clearing your cart. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Toggle cart sidebar visibility
  const toggleCart = () => {
    setIsOpen(prev => !prev);
  };
  
  // Buy now functionality (add to cart and redirect to checkout)
  const buyNow = async (product: Product, quantity = 1, variant?: ProductVariant) => {
    // Handle buy now flow for direct purchase
    console.log("buyNow called in cart context with:", {
      productId: product.id,
      quantity,
      variantId: variant?.id,
      hasVariant: !!variant
    });
    
    if (isUserLoading) {
      toast({
        title: "Please wait",
        description: "We're preparing your purchase",
        variant: "default",
      });
      return;
    }
    
    if (!user) {
      // Redirect to auth page if not logged in
      toast({
        title: "Please log in",
        description: "You need to be logged in to make a purchase",
        variant: "default",
      });
      navigate("/auth");
      return;
    }
    
    // Only buyers can purchase
    if (user.role !== 'buyer') {
      toast({
        title: "Action Not Allowed",
        description: "Only buyers can make purchases. Please switch to a buyer account.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for available stock
    const availableStock = variant?.stock ?? product.stock ?? 0;
    if (availableStock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }
    
    // Limit quantity to available stock
    const requestedQuantity = Math.min(quantity, availableStock);
    if (requestedQuantity < quantity) {
      toast({
        title: "Limited Stock",
        description: `Only ${availableStock} units available. Proceeding with maximum available quantity.`,
        variant: "default",
      });
    }
    
    // Validate that the product ID is valid
    if (!product || !product.id || typeof product.id !== 'number' || isNaN(product.id)) {
      toast({
        title: "Invalid Product",
        description: "The selected product cannot be purchased.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if product has variants but none are selected
    if ((product.hasVariants || (product.variants && product.variants.length > 0)) && !variant) {
      toast({
        title: "Selection Required",
        description: "Please select product options before proceeding to checkout",
        variant: "default",
      });
      
      // Don't proceed - user needs to select variant first
      return;
    }
    
    try {
      // Use direct fetch API for more explicit control over the buy now process
      // This avoids race conditions with React Query and ensures the cart item is created
      const response = await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: requestedQuantity,
          variantId: variant?.id,
          buyNow: true // Signal to the server this is a buy now request
        })
      });

      if (!response.ok) {
        // Handle error response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Get the response data
      const cartItem = await response.json();
      console.log("Successfully added to cart:", cartItem);
      
      // Force refresh cart data
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      // Show success message
      toast({
        title: "Added to cart",
        description: `${product.name}${variant ? ` (${variant.color || ''}${variant.size ? `, ${variant.size}` : ''})` : ''} has been added to your cart`,
        variant: "default",
      });
      
      // Redirect to checkout with buynow parameter
      setTimeout(() => {
        window.location.href = "/checkout?buynow=true";
      }, 500); // Increased delay to ensure server processing completes
    } catch (error) {
      console.error("Buy Now error:", error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "An error occurred while processing your purchase",
        variant: "destructive",
      });
    }
  };

  // Cart validation function
  const validateCart = async (): Promise<boolean> => {
    // Check if cart validation is needed
    if (!user) {
      return true; // No validation needed for unauthenticated users
    }
    
    try {
      const response = await fetch("/api/cart/validate", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Cart validation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.invalid && result.invalid.length > 0) {
        // Show notifications about invalid items
        toast({
          title: "Cart Updated",
          description: "Some items in your cart are no longer available and will be removed.",
          variant: "destructive",
        });
        
        // Auto-remove invalid items from cart
        for (const item of result.invalid) {
          // Find the cart item with this product ID
          const invalidCartItem = cartItems.find(ci => 
            ci.product.id === item.productId &&
            (!item.variantId || ci.variant?.id === item.variantId)
          );
          
          if (invalidCartItem?.id) {
            // Remove the invalid item from cart
            removeFromCart(invalidCartItem.id);
            
            toast({
              title: "Item Removed",
              description: `${invalidCartItem.product.name} was removed from your cart (${item.error})`,
              variant: "destructive",
            });
          }
        }
        
        // After cleanup, cart is still considered invalid
        return false;
      }
      
      // Validation passed successfully
      return true;
    } catch (error) {
      // Log error but return false for validation
      console.error("Error validating cart:", error);
      return false;
    }
  };

  // New function to clean up invalid cart items
  const cleanupInvalidCartItems = async (): Promise<boolean> => {
    if (!user) {
      return true; // No cleanup needed for unauthenticated users
    }
    
    try {
      // First validate to identify invalid items
      const response = await fetch("/api/cart/validate", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Cart validation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.invalid && result.invalid.length > 0) {
        // Show notification about cleanup action
        toast({
          title: "Cart Updated",
          description: "Some items in your cart were no longer available and have been removed. Please review your updated cart.",
          variant: "destructive",
        });
        
        // Process each invalid item
        let cleanupSuccessful = true;
        
        for (const item of result.invalid) {
          if (item.id) {
            try {
              // Remove the invalid item directly using its ID
              const deleteResponse = await fetch(`/api/cart/${item.id}`, {
                method: "DELETE",
                credentials: "include",
              });
              
              if (!deleteResponse.ok) {
                cleanupSuccessful = false;
              }
            } catch (error) {
              cleanupSuccessful = false;
            }
          } else {
            // If the item doesn't have an ID, try to find it by product ID
            const invalidCartItem = cartItems.find(ci => 
              ci.product.id === item.productId &&
              (!item.variantId || ci.variant?.id === item.variantId)
            );
            
            if (invalidCartItem?.id) {
              try {
                const deleteResponse = await fetch(`/api/cart/${invalidCartItem.id}`, {
                  method: "DELETE",
                  credentials: "include",
                });
                
                if (!deleteResponse.ok) {
                  cleanupSuccessful = false;
                }
              } catch (error) {
                cleanupSuccessful = false;
              }
            } else {
              cleanupSuccessful = false;
            }
          }
        }
        
        // Refresh cart data after cleanup
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        
        if (!cleanupSuccessful) {
          return false;
        }
      }
      
      return true; // Cleanup succeeded or no invalid items found
    } catch (error) {
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isOpen,
        toggleCart,
        buyNow,
        validateCart,
        cleanupInvalidCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
