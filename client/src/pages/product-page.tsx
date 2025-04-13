import { useEffect, useState, useContext, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Product, User } from "@shared/schema";
import { CategoryNav } from "@/components/layout/category-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Star, Zap } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CartContext } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProductImageGallery } from "@/components/ui/product-image-gallery";

export default function ProductPage() {
  // Keep a stable reference to the component
  const componentMounted = useRef(true);
  const cachedImages = useRef<Record<number, string[]>>({});
  
  const [matched, params] = useRoute("/product/:id");
  console.log("Product route params:", matched, params);
  
  // Get productId from URL, with fallback to search params if route doesn't match
  let productId: number | null = null;
  
  if (params?.id) {
    productId = parseInt(params.id);
    console.log("Using route param for product ID:", productId);
  } else {
    // As a fallback, try to get from pathname
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2 && pathParts[1] === 'product') {
      productId = parseInt(pathParts[2]);
      console.log("Using pathname for product ID:", productId);
    }
  }
  
  if (!productId || isNaN(productId)) {
    console.error("Invalid product ID:", productId);
  }
  
  // Keep track if this is the first render
  const isFirstRender = useRef(true);
  
  const [quantity, setQuantity] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Clean up effect
  useEffect(() => {
    return () => {
      componentMounted.current = false;
    };
  }, []);
  
  // Try to use context first if available
  const cartContext = useContext(CartContext);
  
  // Get user data to check if logged in
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 60000,
  });
  
  // Fetch product details with stable identity
  const { data: product, isLoading: isProductLoading } = useQuery<Product>({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      console.log("Fetching product data for ID:", productId);
      if (!productId) throw new Error('Product ID is required');
      
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          console.error(`Failed to fetch product details for ID ${productId}:`, res.status);
          throw new Error('Failed to fetch product details');
        }
        const data = await res.json();
        console.log("Successfully fetched product data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching product:", error);
        throw error;
      }
    },
    enabled: !!productId,
    staleTime: 60000, // Keep data fresh for 1 minute
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
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
  
  // Get all images from the product
  const getProductImages = (product: Product): string[] => {
    if (!product) return [];
    
    // Check if we already processed this product's images
    if (productId && cachedImages.current[productId]) {
      console.log('Using cached images for product:', productId);
      return cachedImages.current[productId];
    }
    
    const images: string[] = [];
    console.log('Processing product images for:', product.id, product.name);
    
    // Add main image first if it exists
    if (product.imageUrl) {
      images.push(product.imageUrl);
      console.log('Added main image:', product.imageUrl);
    }
    
    // Try to extract additional images from the images field (could be stored as JSON string)
    if (product.images) {
      console.log('Images field found:', product.images, 'type:', typeof product.images);
      
      try {
        // If it's a string, try to parse it
        if (typeof product.images === 'string') {
          // Safely parse JSON string into array
          const parsedImages = JSON.parse(product.images);
          console.log('Parsed images result:', parsedImages);
          
          if (Array.isArray(parsedImages)) {
            // Add each valid image URL from the array
            parsedImages.forEach((img: any) => {
              if (typeof img === 'string' && img.trim() !== '') {
                images.push(img.trim());
              }
            });
            console.log('Added parsed image URLs, total count now:', images.length);
          }
        } 
        // If it's already an array, use it directly
        else if (Array.isArray(product.images)) {
          product.images.forEach((img: any) => {
            if (typeof img === 'string' && img.trim() !== '') {
              images.push(img.trim());
            }
          });
          console.log('Added array image URLs, total count now:', images.length);
        }
      } catch (error) {
        console.error('Failed to parse product images:', error);
      }
    } else {
      console.log('No additional images found');
    }
    
    // Return unique images (no duplicates)
    const uniqueImages = Array.from(new Set(images))
      .filter(url => url.startsWith('http')); // Ensure URLs start with http
    
    console.log('Final unique images:', uniqueImages);
    
    // Cache the images for this product
    if (productId) {
      cachedImages.current[productId] = uniqueImages;
    }
    
    return uniqueImages;
  };

  // Create mutations for cart operations
  const addToCartMutation = useMutation({
    mutationFn: async (data: { productId: number, quantity: number }) => {
      return apiRequest("POST", "/api/cart", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product?.name} has been added to your cart`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to cart",
        description: error.message || "There was an error adding the product to your cart",
        variant: "destructive",
      });
    }
  });
  
  // Handle add to cart action
  const handleAddToCart = async () => {
    if (!product) return;
    
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
      // Try to use context if available
      if (cartContext) {
        cartContext.addToCart(product, quantity);
      } else {
        // Fallback to direct API call
        await addToCartMutation.mutateAsync({
          productId: product.id,
          quantity: quantity
        });
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };
  
  // Handle buy now action
  const handleBuyNow = async () => {
    if (!product) return;
    
    // If user is not logged in, redirect to auth
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to purchase items",
        variant: "default",
      });
      setLocation("/auth");
      return;
    }
    
    // Only buyers can buy
    const userRole = user?.role as string; 
    if (userRole && userRole !== 'buyer') {
      toast({
        title: "Action Not Allowed",
        description: "Only buyers can purchase items. Please switch to a buyer account.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Try to use context if available
      if (cartContext) {
        cartContext.buyNow(product, quantity);
      } else {
        // Fallback to direct API approach
        await addToCartMutation.mutateAsync({
          productId: product.id,
          quantity: quantity
        });
        
        // Redirect to checkout
        setLocation("/checkout");
      }
    } catch (error) {
      console.error("Failed to buy now:", error);
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
              {/* Product Image Gallery */}
              <div className="flex justify-center items-start">
                <ProductImageGallery 
                  imageUrl={product.imageUrl}
                  additionalImages={product.images}
                  productName={product.name}
                  category={product.category}
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
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white px-8"
                    onClick={handleBuyNow}
                  >
                    <Zap className="h-4 w-4 mr-2" />
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
