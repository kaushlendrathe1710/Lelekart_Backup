import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
}

export function ProductCard({ id, name, price, imageUrl, category }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart({
      id,
      name,
      price,
      imageUrl: imageUrl,
      category,
      quantity: 1,
    });
    
    toast({
      title: "Added to Cart",
      description: `${name} has been added to your cart.`,
    });
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <Link href={`/product/${id}`}>
          <a className="block h-full">
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                console.log("Image load error for:", name);
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/300x300?text=Product';
              }}
            />
          </a>
        </Link>
      </div>
      
      <div className="p-4">
        <Link href={`/product/${id}`}>
          <a className="block">
            <h3 className="font-medium text-lg truncate">{name}</h3>
          </a>
        </Link>
        
        <div className="mt-1 text-sm text-muted-foreground truncate">
          {category}
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="font-bold text-lg">₹{price}</div>
          
          <Button 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:inline-block">Add</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}