import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Product } from "@shared/schema";
import { CategoryNav } from "@/components/layout/category-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { ProductCard } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id ? parseInt(params.id) : null;
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  // Fetch product details
  const { data: product, isLoading: isProductLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  // Fetch related products
  const { data: relatedProducts, isLoading: isRelatedLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: product?.category }],
    enabled: !!product?.category,
  });

  // Reset quantity when product changes
  useEffect(() => {
    setQuantity(1);
  }, [productId]);

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
        variant: "default",
      });
    }
  };

  return (
    <>
      <CategoryNav />
      
      <div className="container mx-auto px-4 py-6">
        {isProductLoading ? (
          <div className="bg-white p-6 rounded shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex justify-center">
                <Skeleton className="h-80 w-80" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <div className="flex space-x-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
          </div>
        ) : product ? (
          <div className="bg-white p-6 rounded shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Image */}
              <div className="flex justify-center items-start">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="max-h-96 object-contain"
                />
              </div>
              
              {/* Product Details */}
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">{product.name}</h1>
                <div className="flex items-center mt-2">
                  <div className="flex items-center bg-green-600 text-white px-2 py-0.5 rounded text-sm">
                    <span>4.3</span>
                    <Star className="h-3 w-3 ml-1 fill-current" />
                  </div>
                  <span className="text-gray-500 text-sm ml-2">(1,248 Ratings & 235 Reviews)</span>
                </div>
                
                <div className="mt-4">
                  <span className="text-3xl font-semibold text-gray-900">{formatPrice(product.price)}</span>
                  <span className="text-sm text-gray-500 line-through ml-2">₹{(product.price * 1.2).toLocaleString('en-IN')}</span>
                  <span className="text-sm text-green-600 ml-2">20% off</span>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900">Description:</h3>
                  <p className="mt-1 text-gray-600">{product.description}</p>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900">Available Stock:</h3>
                  <p className="mt-1 text-gray-600">{product.stock} units</p>
                </div>
                
                <Separator className="my-6" />
                
                <div className="flex items-center">
                  <span className="mr-3 font-medium">Quantity:</span>
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-l" 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 h-8 bg-white flex items-center justify-center text-sm border-t border-b">
                      {quantity}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-r" 
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    ADD TO CART
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 text-white px-8">
                    BUY NOW
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow-sm text-center">
            <h2 className="text-xl font-semibold text-gray-800">Product not found</h2>
            <p className="text-gray-600 mt-2">The product you're looking for doesn't exist or has been removed.</p>
          </div>
        )}
        
        {/* Related Products */}
        {!isRelatedLoading && relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-medium mb-4">Similar Products</h2>
            <div className="bg-white p-4 rounded shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {relatedProducts
                  .filter(p => p.id !== product?.id)
                  .slice(0, 6)
                  .map(relatedProduct => (
                    <ProductCard key={relatedProduct.id} product={relatedProduct} />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
