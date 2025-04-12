import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Product, User } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface CartItem {
  product: Product;
  quantity: number;
  id?: number;
  userId?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  toggleCart: () => void;
  buyNow: (product: Product, quantity?: number) => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Get user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
  });

  // Fetch cart items using React Query for real-time updates
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchIntervalInBackground: false
  });

  // Add to cart API mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const res = await apiRequest("POST", "/api/cart", {
        productId,
        quantity,
      });
      return res.json();
    },
    onSuccess: () => {
      // Force refresh cart data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to cart",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update cart API mutation
  const updateCartMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      const res = await apiRequest("PUT", `/api/cart/${cartItemId}`, {
        quantity,
      });
      return res.json();
    },
    onSuccess: () => {
      // Force refresh cart data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update cart",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Remove from cart API mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      const res = await apiRequest("DELETE", `/api/cart/${cartItemId}`);
      return res;
    },
    onSuccess: () => {
      // Force refresh cart data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove item",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Add product to cart
  const addToCart = (product: Product, quantity = 1) => {
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
    
    // Add to server cart and immediately refresh the cart data
    addToCartMutation.mutate({
      productId: product.id,
      quantity: quantity,
    }, {
      onSuccess: () => {
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart`,
          variant: "default",
        });
      }
    });
  };

  // Remove product from cart
  const removeFromCart = (productId: number) => {
    const cartItem = cartItems.find(item => item.product.id === productId);
      
    // If user is logged in, call the API 
    if (user && cartItem && cartItem.id) {
      removeFromCartMutation.mutate(cartItem.id);
    }
  };

  // Update product quantity
  const updateQuantity = (productId: number, newQuantity: number) => {
    const cartItem = cartItems.find(item => item.product.id === productId);
      
    // If user is logged in, call the API
    if (user && cartItem && cartItem.id) {
      updateCartMutation.mutate({
        cartItemId: cartItem.id,
        quantity: newQuantity,
      });
    }
  };

  // Clear the cart
  const clearCart = () => {
    if (user) {
      // Clear each item individually
      cartItems.forEach(item => {
        if (item.id) {
          removeFromCartMutation.mutate(item.id);
        }
      });
    }
  };

  // Toggle cart sidebar visibility
  const toggleCart = () => {
    setIsOpen(prev => !prev);
  };
  
  // Buy now functionality (add to cart and redirect to checkout)
  const buyNow = (product: Product, quantity = 1) => {
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
    
    // Add to cart first, then redirect to checkout
    addToCartMutation.mutate({
      productId: product.id,
      quantity: quantity,
    }, {
      onSuccess: () => {
        // Navigate to checkout page
        navigate("/checkout");
      }
    });
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
