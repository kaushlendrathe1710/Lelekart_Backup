import { useState, useContext } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, User } from "@shared/schema";
import { CategoryNav } from "@/components/ui/category-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Star, Zap, Heart, Share2, Package, Shield, TruckIcon, Award, BarChart3, ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CartContext } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductReviews from "@/components/product/product-reviews";

// Custom image slider component with Flipkart-like thumbnails on the left
function ProductImageSlider({ images, name }: { images: string[], name: string }) {
  const [activeImage, setActiveImage] = useState(0);
  
  // Default placeholder image based on category
  const defaultImage = "../images/placeholder.svg";
  
  // Handle image loading error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop
    target.src = defaultImage;
  };
  
  return (
    <div className="flex">
      {/* Thumbnails on the left */}
      <div className="flex flex-col gap-2 mr-4">
        {images.map((image, index) => (
          <div 
            key={index}
            className={`w-16 h-16 border cursor-pointer hover:border-primary ${index === activeImage ? 'border-primary' : 'border-gray-200'}`}
            onClick={() => setActiveImage(index)}
          >
            <img 
              src={image} 
              alt={`${name} thumbnail ${index + 1}`} 
              className="w-full h-full object-contain"
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
      
      {/* Main image */}
      <div className="flex-1 sticky top-0">
        <div className="w-full h-96 border border-gray-100 flex items-center justify-center bg-white">
          <img 
            src={images[activeImage]} 
            alt={name} 
            className="max-w-full max-h-full object-contain"
            onError={handleImageError}
          />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  // Extract product ID from the URL using wouter's useRoute
  const [match, params] = useRoute('/product/:id');
  const productId = match ? parseInt(params.id) : null;
  
  const [quantity, setQuantity] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Try to use context first if available
  const cartContext = useContext(CartContext);
  
  // Get user data to check if logged in
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 60000,
  });
  
  // Fetch product details
  const { data: product, isLoading: isProductLoading } = useQuery<Product>({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch product details');
      return res.json();
    },
    enabled: !!productId && !isNaN(productId),
  });
  
  // Fetch related products
  const { data: relatedProducts, isLoading: isRelatedLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: product?.category }],
    enabled: !!product?.category,
  });
  
  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
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
      window.location.href = "/auth";
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
      window.location.href = "/auth";
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
        window.location.href = "/checkout";
      }
    } catch (error) {
      console.error("Failed to buy now:", error);
    }
  };

  // Parse specifications string into structured data
  const parseSpecifications = (specs?: string | null) => {
    if (!specs) return [];
    
    return specs.split('|').map(spec => {
      const [key, value] = spec.split(':').map(s => s.trim());
      return { key, value: value || '' };
    });
  };
  
  // Process images for the product
  const getProductImages = (product?: Product) => {
    if (!product) return [];
    
    // Start with main image if available
    const images: string[] = [];
    
    // Main image URL (check imageUrl property and handle potential image_url property)
    const mainImage = product.imageUrl || 
                     (product as any).image_url || 
                     (product as any).image;
                     
    if (mainImage) {
      const imageUrl = typeof mainImage === 'string' && 
                      (mainImage.includes('flixcart.com') || mainImage.includes('flipkart.com'))
        ? `/api/image-proxy?url=${encodeURIComponent(mainImage)}&category=${encodeURIComponent(product.category || 'general')}`
        : mainImage;
      images.push(imageUrl);
    }
    
    // Additional images from the images array - without filtering duplicates
    try {
      if (product.images) {
        const additionalImages = typeof product.images === 'string' 
          ? JSON.parse(product.images)
          : product.images;
        
        if (Array.isArray(additionalImages)) {
          additionalImages.forEach(img => {
            if (!img) return;
            
            const imageUrl = typeof img === 'string' && 
                            (img.includes('flixcart.com') || img.includes('flipkart.com'))
              ? `/api/image-proxy?url=${encodeURIComponent(img)}&category=${encodeURIComponent(product.category || 'general')}`
              : img;
            
            // Include all images, even if they appear to be duplicates
            // This ensures we show exactly the number of images that exist in the database
            images.push(imageUrl);
          });
        }
      }
    } catch (e) {
      console.error("Error parsing additional images:", e);
    }
    
    // If no images, use a placeholder based on category
    if (images.length === 0) {
      const categoryLower = (product.category || 'general').toLowerCase();
      images.push(`../images/${categoryLower}.svg`);
    }
    
    return images;
  };

  // Get product price details
  const getPriceDetails = (product?: Product) => {
    if (!product) return { price: 0, discount: 0, original: 0 };
    
    const price = product.price || 0;
    // Calculate original price based on 20% off
    const original = Math.round(price * 1.25);
    const discount = original - price;
    
    return { price, discount, original };
  };
  
  // Loading skeleton
  if (isProductLoading) {
    return (
      <>
        <CategoryNav />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 p-4">
                <Skeleton className="w-full h-96" />
                <div className="flex gap-4 mt-6">
                  <Skeleton className="flex-1 h-12" />
                  <Skeleton className="flex-1 h-12" />
                </div>
              </div>
              <div className="md:col-span-7 p-4 space-y-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Product not found
  if (!product && !isProductLoading) {
    return (
      <>
        <CategoryNav />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white p-8 text-center rounded shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800">Product not found</h2>
            <p className="text-gray-600 mt-2 mb-4">The product you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </>
    );
  }
  
  // Process images, specifications, price details
  const productImages = getProductImages(product);
  const specifications = parseSpecifications(product?.specifications);
  const { price, discount, original } = getPriceDetails(product);
  
  return (
    <>
      <CategoryNav />
      
      <div className="bg-gray-100 min-h-screen">
        {/* Product Header */}
        <div className="bg-white mb-3">
          <div className="container mx-auto px-4 py-3">
            <div className="text-sm text-gray-500">
              Home &gt; {product?.category || 'Products'} &gt; {product?.name}
            </div>
          </div>
        </div>
        
        {/* Product Details Section */}
        <div className="container mx-auto px-4">
          <div className="bg-white rounded shadow-sm mb-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
              {/* Left: Product Images (5/12) */}
              <div className="md:col-span-5 p-4 border-r border-gray-100">
                <ProductImageSlider 
                  images={productImages} 
                  name={product?.name || 'Product'}
                />
              </div>
              
              {/* Right: Product Info (7/12) */}
              <div className="md:col-span-7 p-4">
                {/* Product Title */}
                <h1 className="text-xl text-gray-800 font-medium">{product?.name}</h1>
                
                {/* Ratings */}
                <div className="flex items-center mt-1 mb-2">
                  <div className="flex items-center bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                    <span>4.3</span>
                    <Star className="h-3 w-3 ml-1 fill-current" />
                  </div>
                  <span className="text-gray-500 text-sm ml-2">(1,248 Ratings & 235 Reviews)</span>
                  <span className="text-green-600 text-sm ml-auto">Flipkart Assured</span>
                </div>
                
                {/* Special Offer */}
                <div className="text-green-600 text-sm font-medium">Special Price</div>
                
                {/* Pricing */}
                <div className="flex items-baseline mt-1">
                  <span className="text-3xl font-medium text-gray-800">{formatPrice(price)}</span>
                  <span className="text-sm text-gray-500 line-through ml-2">₹{original.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-green-600 ml-2">20% off</span>
                </div>
                
                {/* Available Offers */}
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Available offers</h3>
                  <ul className="space-y-2">
                    <li className="flex">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-sm">
                        <span className="font-medium">Bank Offer:</span> 10% off on HDFC Bank Credit Card, up to ₹1500
                      </span>
                    </li>
                    <li className="flex">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-sm">
                        <span className="font-medium">Special Price:</span> Get extra 5% off (price inclusive of discount)
                      </span>
                    </li>
                    <li className="flex">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-sm">
                        <span className="font-medium">Partner Offer:</span> Sign up for Flipkart Pay Later and get Flipkart Gift Card worth up to ₹1000
                      </span>
                    </li>
                  </ul>
                </div>
                
                {/* Delivery Options */}
                <div className="mt-6 grid grid-cols-12 gap-4">
                  <div className="col-span-2 text-gray-600 text-sm">Delivery</div>
                  <div className="col-span-10">
                    <div className="flex items-center">
                      <input className="border border-gray-300 rounded px-2 py-1 w-32 text-sm" placeholder="Enter pincode" />
                      <Button variant="ghost" className="text-primary text-sm ml-2">Check</Button>
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      Delivery in 2-3 days | Free delivery
                    </div>
                  </div>
                </div>
                
                {/* Highlights & Services */}
                <div className="mt-4 grid grid-cols-12 gap-4">
                  <div className="col-span-2 text-gray-600 text-sm">Highlights</div>
                  <div className="col-span-10">
                    <ul className="text-sm space-y-1">
                      {specifications.slice(0, 4).map((spec, i) => (
                        <li key={i}>• {spec.key}: {spec.value}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Services */}
                <div className="mt-4 grid grid-cols-12 gap-4">
                  <div className="col-span-2 text-gray-600 text-sm">Services</div>
                  <div className="col-span-10">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center">
                        <TruckIcon className="h-4 w-4 text-primary mr-2" />
                        <span>7 Days Replacement</span>
                      </div>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-primary mr-2" />
                        <span>1 Year Warranty</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-primary mr-2" />
                        <span>Top Brand</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Seller Info */}
                <div className="mt-4 grid grid-cols-12 gap-4">
                  <div className="col-span-2 text-gray-600 text-sm">Seller</div>
                  <div className="col-span-10">
                    <div className="text-primary text-sm font-medium">SuperComNet</div>
                    <div className="flex items-center">
                      <div className="flex items-center bg-green-600 text-white px-1.5 py-0.5 rounded text-xs">
                        <span>4.1</span>
                        <Star className="h-2 w-2 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Buttons Section - Only shown in product info section, not duplicated at bottom */}
                <div className="flex mt-6 gap-3">
                  <Button 
                    size="lg"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    ADD TO CART
                  </Button>
                  <Button 
                    size="lg"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleBuyNow}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    BUY NOW
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Details Tabs */}
          <div className="bg-white rounded shadow-sm mb-3">
            <div className="p-4">
              <Tabs defaultValue="description">
                <TabsList className="w-full justify-start border-b mb-4">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="specifications">Specifications</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="p-2">
                  <h3 className="font-medium text-lg mb-3">Product Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{product?.description}</p>
                </TabsContent>
                
                <TabsContent value="specifications" className="p-2">
                  <h3 className="font-medium text-lg mb-3">Specifications</h3>
                  <div className="border rounded">
                    <div className="bg-gray-50 p-3 border-b">
                      <h4 className="font-medium">General</h4>
                    </div>
                    <div className="p-0">
                      <table className="w-full">
                        <tbody>
                          {specifications.map((spec, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-3 border-b border-gray-200 w-1/3 text-gray-600">{spec.key}</td>
                              <td className="p-3 border-b border-gray-200">{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="p-2">
                  {productId && <ProductReviews productId={productId} />}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Similar Products Section */}
          {!isRelatedLoading && relatedProducts && relatedProducts.length > 0 && (
            <div className="bg-white rounded shadow-sm mb-3 p-4">
              <h2 className="font-medium text-xl mb-4">Similar Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {relatedProducts
                  .filter(p => p.id !== product?.id)
                  .slice(0, 6)
                  .map(relatedProduct => (
                    <ProductCard key={relatedProduct.id} product={relatedProduct} />
                  ))}
              </div>
            </div>
          )}
          
          {/* Frequently Bought Together */}
          <div className="bg-white rounded shadow-sm mb-3 p-4">
            <h2 className="font-medium text-xl mb-4">Frequently Bought Together</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* This could be populated dynamically but using placeholder for now */}
              <div className="border rounded p-4 flex items-center">
                <div className="w-20 h-20 mr-4">
                  <img 
                    src={productImages[0]} 
                    alt="Current product" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium">{product?.name}</div>
                  <div className="text-primary font-medium">{formatPrice(price)}</div>
                </div>
              </div>
              
              {/* Placeholder items */}
              <div className="border rounded p-4 flex items-center opacity-50">
                <div className="w-20 h-20 mr-4 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
                <div>
                  <div className="text-sm font-medium">Compatible Accessory</div>
                  <div className="text-primary font-medium">₹399</div>
                </div>
              </div>
              
              <div className="border rounded p-4 flex items-center opacity-50">
                <div className="w-20 h-20 mr-4 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
                <div>
                  <div className="text-sm font-medium">Extended Warranty</div>
                  <div className="text-primary font-medium">₹499</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center">
              <span className="font-medium mr-4">Total: {formatPrice(price + 399 + 499)}</span>
              <Button variant="outline" size="sm">Add All To Cart</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}