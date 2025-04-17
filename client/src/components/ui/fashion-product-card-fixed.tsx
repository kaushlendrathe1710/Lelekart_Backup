import React, { useState, useEffect } from 'react';
import { Product } from "@shared/schema";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { CartContext } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import { WishlistButton } from "./wishlist-button";
import { cn } from "@/lib/utils";

interface FashionProductCardFixedProps {
  product: Product;
  className?: string;
}

export function FashionProductCardFixed({ product, className }: FashionProductCardFixedProps) {
  const cartContext = useContext(CartContext);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get real fashion images from recommendations
  const { data: recommendedProducts } = useQuery({
    queryKey: ["/api/recommendations"],
    queryFn: async () => {
      const res = await fetch('/api/recommendations');
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return res.json();
    },
  });

  // Fetch a real fashion image from recommendations
  const getFashionImage = () => {
    if (recommendedProducts && recommendedProducts.length > 0) {
      // Find a product with a valid image URL
      const productWithImage = recommendedProducts.find((p: any) => 
        p.image_url && p.image_url.includes('fkcdn.com')
      );
      
      if (productWithImage && productWithImage.image_url) {
        return `/api/image-proxy?url=${encodeURIComponent(productWithImage.image_url)}&category=Fashion`;
      }
    }
    
    // Default to a category image if no recommendations found
    return "/images/categories/fashion.svg";
  };

  const [imageSrc, setImageSrc] = useState<string>("/images/categories/fashion.svg");
  const [hasLoadedRecommendations, setHasLoadedRecommendations] = useState(false);

  // Update image when recommendations load
  useEffect(() => {
    if (recommendedProducts && !hasLoadedRecommendations) {
      setImageSrc(getFashionImage());
      setHasLoadedRecommendations(true);
    }
  }, [recommendedProducts, hasLoadedRecommendations]);

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
              src={imageSrc}
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-sm"
              onError={() => {
                // Fallback to category image on error
                setImageSrc("/images/categories/fashion.svg");
              }}
            />
          </div>
          
          <div className="flex flex-col flex-grow w-full">
            <h3 className="font-medium text-center text-sm line-clamp-2 h-10">{product.name}</h3>
            <div className="text-green-600 font-medium mt-1 text-center">{formatPrice(product.price)}</div>
            <div className="text-xs text-gray-500 mt-1 text-center line-clamp-1">{product.description?.slice(0, 30)}...</div>
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