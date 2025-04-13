import { Product, User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { CartContext } from "@/context/cart-context"; // Import context directly
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { apiRequest } from "@/lib/queryClient";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const cartContext = useContext(CartContext); // Use context directly with optional chaining
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get user data to check if logged in
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 60000,
  });

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };
  
  const handleAddToCart = async (e: React.MouseEvent) => {
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
    
    // Only buyers can add to cart
    // After null check, the user is definitely a User type with a role property
    const userRole = user?.role as string; 
    if (userRole && userRole !== 'buyer') {
      toast({
        title: "Action Not Allowed",
        description: "Only buyers can add items to cart. Please switch to a buyer account.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Use direct API call if context is not available
      if (cartContext) {
        cartContext.addToCart(product);
      } else {
        // Fallback to direct API call
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
      }
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: "There was an error adding the product to your cart",
        variant: "destructive",
      });
    }
  };

  if (featured) {
    return (
      <div className="relative">
        <Card 
          className="product-card p-3 flex flex-col items-center rounded transition-transform duration-200 hover:cursor-pointer hover:shadow-md hover:-translate-y-1"
          onClick={(e) => {
            e.preventDefault();
            console.log(`Navigating to product page: /product/${product.id}`);
            setLocation(`/product/${product.id}`);
          }}
        >
          <CardContent className="p-0 flex flex-col items-center">
            <img 
              src={product.imageUrl || (product as any).image_url} 
              alt={product.name} 
              className="w-32 h-40 object-contain mb-3"
              onError={(e) => {
                // Use a fallback image on error
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                
                // Use category-specific placeholder or default placeholder
                if (product.category) {
                  // Map to our known category placeholders
                  switch(product.category) {
                    case 'Electronics':
                      target.src = "/images/categories/electronics.svg";
                      break;
                    case 'Fashion':
                      target.src = "/images/categories/fashion.svg";
                      break;
                    case 'Home':
                      target.src = "/images/categories/home.svg";
                      break;
                    case 'Appliances':
                      target.src = "/images/categories/appliances.svg";
                      break;
                    case 'Mobiles':
                      target.src = "/images/categories/mobiles.svg";
                      break;
                    case 'Beauty':
                      target.src = "/images/categories/beauty.svg";
                      break;
                    case 'Toys':
                      target.src = "/images/categories/toys.svg";
                      break;
                    case 'Grocery':
                      target.src = "/images/categories/grocery.svg";
                      break;
                    default:
                      target.src = "/images/placeholder.svg";
                  }
                } else {
                  target.src = "/images/placeholder.svg";
                }
              }}
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
      </div>
    );
  }

  return (
    <div className="relative">
      <Card 
        className="product-card flex flex-col items-center p-3 transition-transform duration-200 hover:cursor-pointer hover:shadow-md hover:-translate-y-1"
        onClick={(e) => {
          e.preventDefault();
          console.log(`Navigating to product page: /product/${product.id}`);
          setLocation(`/product/${product.id}`);
        }}
      >
        <CardContent className="p-0 flex flex-col items-center">
          <img 
            src={product.imageUrl || (product as any).image_url} 
            alt={product.name} 
            className="w-28 h-32 object-contain mb-2"
            onError={(e) => {
              // Use a fallback image on error
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              
              // Use category-specific placeholder or default placeholder
              if (product.category) {
                // Convert to lowercase and use direct category images
                const categoryLower = product.category.toLowerCase();
                target.src = `/images/${categoryLower}.svg`;
              } else {
                target.src = "/images/placeholder.svg";
              }
            }}
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
    </div>
  );
}
