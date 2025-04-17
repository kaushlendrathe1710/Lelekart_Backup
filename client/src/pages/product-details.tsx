import { useState, useContext, useRef, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, User } from "@shared/schema";
import { CategoryNav } from "@/components/ui/category-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Star, Zap, Heart, Share2, Package, Shield, TruckIcon, Award, BarChart3, ChevronDown, Maximize, RotateCw } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CartContext, CartProvider } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductReviews from "@/components/product/product-reviews";
import ProductRecommendationCarousel from "@/components/ui/product-recommendation-carousel";
import { ProductQA, ComplementaryProducts, SizeRecommendation } from "@/components/ai";
import ImageZoom from 'react-image-zoom';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import React360View from 'react-360-view';

// Custom enhanced image slider component with zoom and 360-degree view capabilities
function ProductImageSlider({ images, name }: { images: string[], name: string }) {
  const [activeImage, setActiveImage] = useState(0);
  const [viewMode, setViewMode] = useState<'normal' | 'zoom' | '360'>('normal');
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Container ref for calculating zoom dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Default placeholder image based on category
  const defaultImage = "../images/placeholder.svg";
  
  // Handle image loading error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop
    target.src = defaultImage;
  };
  
  // Create a simulated 360° rotation effect using the available product images
  const get360Images = () => {
    if (images.length === 0) return [];
    
    // If we only have one image, use it as the base for the simulation
    if (images.length === 1) {
      return Array(36).fill(images[0]);
    }
    
    // Use all available product images and repeat them to create a circular effect
    // For example, if we have 4 images, we'll create a sequence like [0,1,2,3,2,1,0,1,2,3...] to simulate rotation
    const allImages = [...images];
    
    // Create a sequence that goes forward then backward through the images
    // This creates a more natural rotation effect with limited images
    const frames: string[] = [];
    
    // Generate 36 frames for a complete 360° view (each frame = 10 degrees)
    for (let i = 0; i < 36; i++) {
      // Determine which image to use for this frame
      // We cycle through the available images to create the illusion of rotation
      const index = i % (allImages.length * 2);
      
      // If we're in the first half of the cycle, go forward through images
      // If we're in the second half, go backward
      const imageIndex = index < allImages.length 
        ? index 
        : allImages.length * 2 - index - 1;
      
      frames.push(allImages[imageIndex]);
    }
    
    return frames;
  };
  
  // Get props for ImageZoom component
  const getZoomProps = () => {
    if (!containerRef.current) return {};
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 384; // Default height
    
    return {
      img: images[activeImage],
      zoomPosition: 'original',
      width: width,
      height: height,
      zoomWidth: width * 2,
      zoomStyle: 'opacity: 1;background-color: white;',
      alt: name
    };
  };
  
  return (
    <div className="space-y-4">
      {/* View mode toggle buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant={viewMode === 'normal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('normal')}
          className="flex items-center gap-1"
        >
          <Maximize size={16} />
          <span>Normal</span>
        </Button>
        
        <Button
          variant={viewMode === 'zoom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('zoom')}
          className="flex items-center gap-1"
        >
          <Maximize size={16} />
          <span>Zoom</span>
        </Button>
        
        <Button
          variant={viewMode === '360' ? 'default' : 'outline'}
          size="sm" 
          onClick={() => setViewMode('360')}
          className="flex items-center gap-1"
        >
          <RotateCw size={16} />
          <span>360° View</span>
        </Button>
      </div>
      
      <div className="flex">
        {/* Thumbnails on the left - always visible regardless of view mode */}
        <div className="flex flex-col gap-2 mr-4">
          {images.map((image, index) => (
            <div 
              key={index}
              className={`w-16 h-16 border cursor-pointer hover:border-primary ${index === activeImage ? 'border-primary' : 'border-gray-200'}`}
              onClick={() => {
                setActiveImage(index);
                // Reset to normal view when changing images
                if (viewMode !== 'normal') setViewMode('normal');
              }}
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
        
        {/* Main image area with different view modes */}
        <div ref={containerRef} className="flex-1 sticky top-0">
          {viewMode === 'normal' && (
            <div className="w-full h-96 border border-gray-100 flex items-center justify-center bg-white">
              {/* Use simple clickable image that expands to full screen on click */}
              <img 
                src={images[activeImage]} 
                alt={name} 
                className="max-w-full max-h-full object-contain cursor-zoom-in"
                onError={handleImageError}
                onClick={() => setViewMode('zoom')}
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white p-1 rounded text-xs">
                Click to zoom
              </div>
            </div>
          )}
          
          {viewMode === 'zoom' && (
            <div className="w-full h-96 border border-gray-100 bg-white">
              <div className="h-full relative">
                <Zoom>
                  <img 
                    src={images[activeImage]} 
                    alt={name} 
                    className="max-w-full max-h-full object-contain"
                    onError={handleImageError}
                    style={{ maxHeight: '384px', margin: '0 auto' }}
                  />
                </Zoom>
              </div>
              <div className="mt-2 text-center text-xs text-gray-500">
                Click on the image to zoom in and out
              </div>
            </div>
          )}
          
          {viewMode === '360' && (
            <div className="w-full h-96 border border-gray-100 bg-white overflow-hidden">
              {get360Images().length > 0 ? (
                <>
                  <div className="h-full flex items-center justify-center">
                    <div className="w-full h-full">
                      {/* Interactive 360° view implementation with user controls */}
                      <div 
                        className="relative w-full h-full flex items-center justify-center"
                        onMouseMove={(e) => {
                          // Calculate rotation based on mouse position
                          const frames = get360Images();
                          if (frames.length === 0) return;
                          
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left; // x position within the element
                          const relativeX = x / rect.width;
                          
                          // Map the x position to a frame index (0 to frames.length-1)
                          const frameIndex = Math.min(
                            frames.length - 1,
                            Math.max(0, Math.floor(relativeX * frames.length))
                          );
                          
                          // Update active image based on mouse position
                          if (images[frameIndex % images.length]) {
                            setActiveImage(frameIndex % images.length);
                          }
                        }}
                      >
                        <img 
                          src={images[activeImage]} 
                          alt={`${name} 360 view`} 
                          className="max-w-full max-h-full object-contain"
                          onError={handleImageError}
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                          <div className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-xs flex items-center">
                            <RotateCw size={14} className="mr-1 animate-spin" />
                            <span>Move mouse left/right to rotate</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-xs text-gray-500">
                    Interactive 360° view (move your mouse from left to right to rotate)
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  360° view not available for this product
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add a helper text explaining the interactions */}
      <div className="text-sm text-gray-500 mt-2">
        <p className="font-medium">Interactive view options:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Normal: Click to enlarge the image</li>
          <li>Zoom: Click on the image to zoom in and out</li>
          <li>360° View: Move your mouse left and right to rotate the product</li>
        </ul>
      </div>
    </div>
  );
}

// Wrap the entire component with CartProvider
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
  
  // Use formatPrice from utils.ts
  
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
    
    // Helper function to check problematic URLs
    const isProblematicUrl = (url: string) => {
      return url.includes('placeholder.com') ||
             url.includes('via.placeholder') ||
             url === 'null' ||
             url === 'undefined' ||
             url === '' ||
             !url;
    };
    
    // Main image URL (check imageUrl property and handle potential image_url property)
    const mainImage = product.imageUrl || 
                     (product as any).image_url || 
                     (product as any).image;
                     
    if (mainImage && typeof mainImage === 'string' && !isProblematicUrl(mainImage)) {
      const imageUrl = (mainImage.includes('flixcart.com') || mainImage.includes('lelekart.com'))
        ? `/api/image-proxy?url=${encodeURIComponent(mainImage)}&category=${encodeURIComponent(product.category || 'general')}`
        : mainImage;
      images.push(imageUrl);
    }
    
    // Helper function to safely parse JSON
    const safeJsonParse = (jsonString: string) => {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        return null;
      }
    };
    
    // Additional images from the images array - without filtering duplicates
    if (product.images) {
      let additionalImages;
      
      // Safely handle various data formats
      if (typeof product.images === 'string') {
        try {
          // First handle the common special format where images are stored as "{url1,url2,url3}"
          if (product.images.includes(',') && product.images.includes('http')) {
            // Try to extract URLs directly with regex
            const urlMatches = product.images.match(/https?:\/\/[^",\\}]+/g);
            if (urlMatches && urlMatches.length > 0) {
              console.log('Extracted URLs from special format:', urlMatches);
              additionalImages = urlMatches;
            }
          }
          // Then try normal JSON parsing if we don't have extracted URLs yet
          else if (additionalImages === undefined && 
              ((product.images.trim().startsWith('[') && product.images.trim().endsWith(']')) ||
               (product.images.trim().startsWith('{') && product.images.trim().endsWith('}')))
          ) {
            // Safe JSON parsing - fail silently
            try {
              additionalImages = JSON.parse(product.images);
            } catch (err) {
              // If JSON parsing fails, just log it and continue
              console.log('Failed to parse JSON, continuing with other methods');
            }
          } else {
            // Not a JSON array, treat as a single image URL
            additionalImages = [product.images];
          }
        } catch (err) {
          // Fallback in case any of the above throws an error
          console.log('Error processing image string format');
        }
      } else {
        // Already an array or object
        additionalImages = product.images;
      }
      
      // Process the additional images if we have a valid array
      if (Array.isArray(additionalImages)) {
        additionalImages.forEach(img => {
          if (!img) return;
          
          // Only process string values
          if (typeof img === 'string' && !isProblematicUrl(img)) {
            const imageUrl = (img.includes('flixcart.com') || img.includes('lelekart.com'))
              ? `/api/image-proxy?url=${encodeURIComponent(img)}&category=${encodeURIComponent(product.category || 'general')}`
              : img;
            
            // Include all images, even if they appear to be duplicates
            // This ensures we show exactly the number of images that exist in the database
            images.push(imageUrl);
          }
        });
      }
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
  
  // Process images, specifications, price details, colors and sizes
  const productImages = getProductImages(product);
  const specifications = parseSpecifications(product?.specifications);
  const { price, discount, original } = getPriceDetails(product);
  
  // Parse color and size options
  const colorOptions = product?.color ? product.color.split(/,\s*/).filter(Boolean) : [];
  const sizeOptions = product?.size ? product.size.split(/,\s*/).filter(Boolean) : [];
  
  return (
    <CartProvider>
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
                {/* Product Title with Wishlist Button */}
                <div className="flex justify-between items-start">
                  <h1 className="text-xl text-gray-800 font-medium">{product?.name}</h1>
                  {product && <WishlistButton productId={product.id} variant="icon-label" className="text-gray-600 hover:text-primary" />}
                </div>
                
                {/* SKU */}
                <div className="flex mt-1 text-sm text-gray-500">
                  <span>in {product?.category}</span>
                  {product?.sku && (
                    <span className="ml-4">SKU: {product.sku}</span>
                  )}
                </div>
                
                {/* Ratings */}
                <div className="flex items-center mt-2 mb-2">
                  <div className="flex items-center bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                    <span>4.3</span>
                    <Star className="h-3 w-3 ml-1 fill-current" />
                  </div>
                  <span className="text-gray-500 text-sm ml-2">(1,248 Ratings & 235 Reviews)</span>
                  <span className="text-green-600 text-sm ml-auto">Lelekart Assured</span>
                </div>
                
                {/* Special Offer */}
                <div className="text-green-600 text-sm font-medium">Special Price</div>
                
                {/* Pricing */}
                <div className="flex items-baseline mt-1">
                  <span className="text-3xl font-medium text-gray-800">{formatPrice(price)}</span>
                  <span className="text-sm text-gray-500 line-through ml-2">₹{product?.mrp?.toLocaleString('en-IN') || original.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-green-600 ml-2">
                    {Math.round(((product?.mrp || original) - price) / (product?.mrp || original) * 100)}% off
                  </span>
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
                        <span className="font-medium">Partner Offer:</span> Sign up for Lelekart Pay Later and get Lelekart Gift Card worth up to ₹1000
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
                
                {/* Color Options - Only shown if colors are available */}
                {colorOptions.length > 0 && (
                  <div className="mt-6 grid grid-cols-12 gap-4">
                    <div className="col-span-2 text-gray-600 text-sm">Color</div>
                    <div className="col-span-10">
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color, index) => (
                          <Badge 
                            key={index} 
                            className="bg-primary text-white px-3 py-1 cursor-pointer hover:bg-primary/90"
                          >
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
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
                  
                  {/* AI-Powered Product Q&A */}
                  {product && (
                    <div className="mt-8">
                      <ProductQA productId={product.id} />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="specifications" className="p-2">
                  <h3 className="font-medium text-lg mb-3">Specifications</h3>
                  
                  {/* AI-Powered Size Recommendation */}
                  {(product?.category?.toLowerCase().includes('fashion') || 
                   product?.category?.toLowerCase().includes('clothing') || 
                   product?.name?.toLowerCase().includes('shirt') || 
                   product?.name?.toLowerCase().includes('pant') || 
                   product?.name?.toLowerCase().includes('shoe')) && 
                   sizeOptions.length > 0 ? (
                    <div className="mb-5">
                      <SizeRecommendation 
                        productId={product.id} 
                        category={product.category}
                        availableSizes={sizeOptions}
                      />
                      <Separator className="my-4" />
                    </div>
                  ) : null}
                  
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
          
          {/* AI-powered Complementary Products */}
          {/* Skip complementary products for now - it requires cart context */}
          {/* <div className="bg-white rounded shadow-sm mb-3 p-4">
            {product && (
              <ComplementaryProducts
                productId={product.id}
                productName={product.name}
                productImage={productImages[0]}
                productPrice={price}
              />
            )}
          </div> */}
          
          {/* Similar Products Recommendation Carousel */}
          <div className="bg-white rounded shadow-sm mb-3 p-4">
            {product && (
              <ProductRecommendationCarousel 
                title="Similar Products You May Like"
                description="Based on product characteristics and purchase patterns"
                endpoint={`/api/recommendations/similar/${product.id}`}
                productId={product.id}
                limit={10}
              />
            )}
          </div>
          
          {/* Personalized Recommendations */}
          <div className="bg-white rounded shadow-sm mb-3 p-4">
            <ProductRecommendationCarousel 
              title="Recommended For You"
              description="Personalized picks based on your shopping preferences"
              endpoint="/api/recommendations"
              limit={10}
            />
          </div>
        </div>
      </div>
    </CartProvider>
  );
}