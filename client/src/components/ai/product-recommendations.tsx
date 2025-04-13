import React from "react";
import { useAIAssistant } from "@/context/ai-assistant-context";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export const formatIndianPrice = (price: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

interface ProductRecommendationCardProps {
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
  };
  className?: string;
}

export const ProductRecommendationCard: React.FC<ProductRecommendationCardProps> = ({
  product,
  className,
}) => {
  const { trackActivity } = useAIAssistant();
  
  const handleProductClick = () => {
    // Track that the user clicked on this recommendation
    trackActivity("click_recommendation", product.id, undefined, undefined, {
      recommendationType: "personalized",
      productName: product.name,
    });
  };

  return (
    <Link href={`/product/${product.id}`} onClick={handleProductClick}>
      <Card className={cn("h-full cursor-pointer hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-md mb-2">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <h3 className="text-sm font-medium line-clamp-2 mb-1">{product.name}</h3>
          <p className="text-muted-foreground text-xs mb-2 line-clamp-1">{product.category}</p>
          <p className="font-semibold">{formatIndianPrice(product.price)}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export const PersonalizedRecommendations = () => {
  const { personalizedRecommendations, isLoading } = useAIAssistant();

  if (isLoading) {
    return (
      <div className="animate-pulse flex flex-col space-y-4">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!personalizedRecommendations.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h2 className="text-lg font-semibold">Recommended For You</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {personalizedRecommendations.map((product) => (
          <ProductRecommendationCard key={product.id} product={product} />
        ))}
      </div>
      <Separator className="my-6" />
    </div>
  );
};

export const ComplementaryProducts = ({ productId }: { productId: number }) => {
  const { getComplementaryProducts, complementaryProducts, trackActivity } = useAIAssistant();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (productId) {
      setIsLoading(true);
      getComplementaryProducts(productId, 5).finally(() => {
        setIsLoading(false);
      });

      // Track that this product page was viewed
      trackActivity("view_product", productId);
    }
  }, [productId, getComplementaryProducts, trackActivity]);

  if (isLoading) {
    return (
      <div className="animate-pulse flex flex-col space-y-4">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3 min-w-[150px]">
              <div className="aspect-square bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!complementaryProducts.length) {
    return null;
  }

  return (
    <div className="space-y-4 my-8">
      <h2 className="text-lg font-semibold">Frequently Bought Together</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {complementaryProducts.map((product) => (
          <ProductRecommendationCard
            key={product.id}
            product={product}
            className="min-w-[150px] w-[150px]"
          />
        ))}
      </div>
    </div>
  );
};