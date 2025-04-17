import React from 'react';
import { Product } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { CartContext } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import { WishlistButton } from "./wishlist-button";
import { cn } from "@/lib/utils";

// Array of reliable fallback fashion images just in case
const FALLBACK_FASHION_IMAGES = [
  "https://i.imgur.com/iG1V7Fb.jpeg",
  "https://i.imgur.com/p5MtsVR.jpeg",
  "https://i.imgur.com/C5QXI5p.jpeg",
  "https://i.imgur.com/ycJNc3i.jpeg",
  "https://i.imgur.com/sMa3lHY.jpeg",
  "https://i.imgur.com/hb0HfJB.jpeg"
];

interface FashionProductCardFixedProps {
  product: Product;
  className?: string;
}

export function FashionProductCardFixed({ product, className }: FashionProductCardFixedProps) {
  const cartContext = useContext(CartContext);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if image URL is from placeholder
  const isProblematicUrl = (url: string | null | undefined) => {
    if (!url) return true;
    return url.includes('placeholder.com') || url.includes('placehold.it');
  };

  // Get a fashion image for the product
  const getImageSrc = () => {
    // Use the product's actual image_url if it's valid now
    if (product.image_url && !isProblematicUrl(product.image_url)) {
      return product.image_url;
    }
    
    // Use the product's image if it exists
    if (product.image && !isProblematicUrl(product.image)) {
      return product.image;
    }
    
    // Fallback: Use one of our predetermined fashion images based on product ID
    const imageIndex = (product.id % FALLBACK_FASHION_IMAGES.length);
    return FALLBACK_FASHION_IMAGES[imageIndex];
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user is not logged in, redirect to auth
    if (!cartContext) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart",
        variant: "default",
      });
      return;
    }
    
    try {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
      
      // Refresh cart data
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: "There was an error adding the product to your cart",
        variant: "destructive",
      });
    }
  };

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="relative">
      {/* Add Wishlist button on top right of card */}
      <WishlistButton productId={product.id} variant="card" />
      
      <Card 
        className={cn("h-full flex flex-col items-center p-3 transition-transform duration-200 hover:cursor-pointer hover:shadow-md hover:-translate-y-1", className)}
        onClick={() => {
          window.location.href = `/product/${product.id}`;
        }}
      >
        <CardContent className="p-0 w-full flex flex-col items-center h-full">
          <div className="w-full flex-shrink-0 h-40 flex items-center justify-center mb-3 bg-slate-50 rounded-md">
            <img
              src={getImageSrc()}
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-sm"
              onError={(e) => {
                // Fallback to fashion category image on error
                (e.target as HTMLImageElement).src = "/images/categories/fashion.svg";
              }}
            />
          </div>
          
          <div className="flex flex-col flex-grow w-full">
            <h3 className="font-medium text-center text-sm line-clamp-2 h-10">{product.name}</h3>
            <div className="text-green-600 font-medium mt-1 text-center">{formatPrice(product.price)}</div>
            <div className="text-xs text-gray-500 mt-1 text-center line-clamp-1">{product.description?.slice(0, 30) || "Fashion product"}...</div>
          </div>
          
          <Button 
            variant="ghost"
            size="sm" 
            className="mt-2 w-full text-primary hover:bg-primary/10"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}