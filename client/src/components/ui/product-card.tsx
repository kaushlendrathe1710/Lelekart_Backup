import { Product } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get user data to check if logged in
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 60000,
  });

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user is not logged in, redirect to auth
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart",
        variant: "default",
      });
      setLocation("/auth");
      return;
    }
    
    // Add product to cart
    addToCart(product);
  };

  if (featured) {
    return (
      <Link to={`/product/${product.id}`}>
        <Card className="product-card p-3 flex flex-col items-center rounded transition-transform duration-200 hover:cursor-pointer hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-0 flex flex-col items-center">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-32 h-40 object-contain mb-3" 
            />
            <h3 className="font-medium text-center text-sm">{product.name}</h3>
            <div className="text-green-600 font-medium mt-1">{formatPrice(product.price)}</div>
            <div className="text-xs text-gray-500 mt-1">{product.description.slice(0, 30)}...</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full border-primary text-primary hover:bg-primary hover:text-white"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="product-card flex flex-col items-center p-3 transition-transform duration-200 hover:cursor-pointer hover:shadow-md hover:-translate-y-1">
        <CardContent className="p-0 flex flex-col items-center">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-28 h-32 object-contain mb-2" 
          />
          <h3 className="font-medium text-center text-sm">{product.name}</h3>
          <div className="text-green-600 text-sm mt-1">From {formatPrice(product.price)}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 w-full text-primary hover:bg-primary/10"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add to Cart
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
