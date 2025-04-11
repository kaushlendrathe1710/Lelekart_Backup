import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Product } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  // We'll not use authentication for cart functionality in local state for now
  const user = null;

  // Load cart from localStorage on initial load
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

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
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        item => item.product.id === product.id
      );

      // If user is logged in, call the API
      if (user) {
        addToCartMutation.mutate({
          productId: product.id,
          quantity: existingItem ? existingItem.quantity + quantity : quantity,
        });
      }

      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { product, quantity }];
      }
    });
  };

  // Remove product from cart
  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => {
      const cartItem = prevItems.find(item => item.product.id === productId);
      
      // If user is logged in, call the API
      if (user && cartItem) {
        removeFromCartMutation.mutate(cartItem.product.id);
      }
      
      return prevItems.filter(item => item.product.id !== productId);
    });
  };

  // Update product quantity
  const updateQuantity = (productId: number, newQuantity: number) => {
    setCartItems(prevItems => {
      const cartItem = prevItems.find(item => item.product.id === productId);
      
      // If user is logged in, call the API
      if (user && cartItem) {
        updateCartMutation.mutate({
          cartItemId: cartItem.product.id,
          quantity: newQuantity,
        });
      }
      
      return prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  // Clear the cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Toggle cart sidebar visibility
  const toggleCart = () => {
    setIsOpen(prev => !prev);
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
