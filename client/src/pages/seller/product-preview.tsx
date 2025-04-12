import React, { useState, useEffect } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  Star,
  Truck,
  ShieldCheck,
  Heart,
  Share2,
  Info,
  Check,
  Tag
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast, useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

// Image gallery component
function ImageGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(0);
  
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="overflow-hidden rounded-md border aspect-square bg-background">
        <img
          src={images[selectedImage] || "https://placehold.co/600x400?text=No+Image"}
          alt="Product preview"
          className="h-full w-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, i) => (
            <div 
              key={i} 
              className={`overflow-hidden rounded-md border cursor-pointer w-16 h-16 ${selectedImage === i ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedImage(i)}
            >
              <img
                src={image}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductPreviewPage() {
  const { toast } = useToast();
  const [params, setParams] = useParams();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const productId = params?.id ? parseInt(params.id) : 0;

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch product');
      }
      return res.json();
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <SellerDashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2 text-xl">Loading product data...</p>
        </div>
      </SellerDashboardLayout>
    );
  }

  // Calculate discounted percentage if MRP is provided
  const discountPercentage = product?.mrp ? 
    Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  // Convert product images to array, or use a placeholder
  const productImages = product?.imageUrl ? 
    [product.imageUrl] : 
    ["https://placehold.co/600x400?text=No+Image"];

  return (
    <SellerDashboardLayout>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Product Preview</CardTitle>
              <CardDescription>This is how your product will appear to customers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4 text-sm flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-yellow-600" />
            <div className="text-yellow-800">
              <p>This is a preview of how your product will appear. Not all features are fully interactive in preview mode.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column with images - larger on desktop */}
        <div className="md:col-span-5 lg:col-span-4">
          <Card>
            <CardContent className="pt-6">
              <ImageGallery images={productImages} />
              <div className="flex justify-between mt-4">
                <Button variant="outline" className="w-[48%]">
                  <Heart className="h-4 w-4 mr-2" />
                  Wishlist
                </Button>
                <Button variant="outline" className="w-[48%]">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column with product details */}
        <div className="md:col-span-7 lg:col-span-8 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Breadcrumbs */}
                <div className="text-sm text-muted-foreground">
                  Home &gt; {product?.category || "Category"} &gt; {product?.name || "Product"}
                </div>

                {/* Product title and badges */}
                <div>
                  <h1 className="text-xl md:text-2xl font-medium">{product?.name || "Product Name"}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="rounded-sm font-normal bg-green-50 text-green-600 border-green-200">
                      {product?.approved ? "Approved" : "Pending Review"}
                    </Badge>
                    <div className="flex items-center text-sm">
                      <span className="bg-green-600 text-white px-1.5 py-0.5 rounded-sm flex items-center">
                        <span className="mr-0.5">4.2</span>
                        <Star className="h-3 w-3" />
                      </span>
                      <span className="text-muted-foreground ml-1">({Math.floor(Math.random() * 1000) + 100} ratings)</span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl md:text-3xl font-medium">₹{product?.price?.toLocaleString() || "0"}</span>
                    {discountPercentage > 0 && (
                      <>
                        <span className="text-muted-foreground line-through">₹{product?.mrp?.toLocaleString()}</span>
                        <span className="text-green-600 font-medium">{discountPercentage}% off</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Inclusive of all taxes
                  </div>
                </div>

                {/* Available offers */}
                <div className="space-y-2">
                  <h2 className="font-medium">Available offers</h2>
                  <ul className="space-y-2">
                    <li className="text-sm flex items-start gap-2">
                      <span className="text-green-600 font-medium flex-shrink-0 mt-0.5">
                        <Tag className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="font-medium">Bank Offer:</span> 10% off on HDFC Bank Credit Card, up to ₹1500. On orders of ₹5000 and above
                      </span>
                    </li>
                    <li className="text-sm flex items-start gap-2">
                      <span className="text-green-600 font-medium flex-shrink-0 mt-0.5">
                        <Tag className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="font-medium">No cost EMI:</span> Avail No Cost EMI on select cards for orders above ₹3000
                      </span>
                    </li>
                    <li className="text-sm flex items-start gap-2">
                      <span className="text-green-600 font-medium flex-shrink-0 mt-0.5">
                        <Tag className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="font-medium">Partner Offer:</span> Get GST invoice and save up to 28% on business purchases
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Delivery options */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="font-medium">Delivery</h2>
                    <span className="text-primary text-sm font-medium">Check</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Free delivery</div>
                      <div className="text-sm text-muted-foreground">Delivery by {new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    </div>
                  </div>
                </div>

                {/* Highlights & Seller */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h2 className="font-medium mb-2">Highlights</h2>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>Stock: {product?.stock || 0} units</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>Category: {product?.category || "N/A"}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>Return Policy: 7 days</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>Warranty: 1 Year</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h2 className="font-medium mb-2">Seller</h2>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Your Store</span>
                        <div className="flex items-center">
                          <span className="bg-green-600 text-white px-1 py-0.5 rounded-sm flex items-center text-xs">
                            <span className="mr-0.5">4.5</span>
                            <Star className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                      <ul className="mt-2">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>7 Day Replacement</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>GST Invoice Available</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Protection plans */}
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <h2 className="font-medium">Protection Plans Available</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="border rounded-md p-3 cursor-pointer hover:border-primary">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Extended Warranty</span>
                        <span className="font-medium">₹1,249</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">1-year extended warranty</p>
                    </div>
                    <div className="border rounded-md p-3 cursor-pointer hover:border-primary">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Damage Protection</span>
                        <span className="font-medium">₹799</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Accidental & liquid damage</p>
                    </div>
                  </div>
                </div>
                
              </div>
            </CardContent>
          </Card>

          {/* Product details tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="description">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="specifications">Specifications</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Product Description</h3>
                    <p className="text-sm whitespace-pre-line">
                      {product?.description || "No description available"}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="specifications" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">General Specifications</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="grid grid-cols-2 py-2 even:bg-muted/50">
                        <span className="text-sm text-muted-foreground">Brand</span>
                        <span className="text-sm">Your Brand</span>
                      </div>
                      <div className="grid grid-cols-2 py-2 odd:bg-muted/50">
                        <span className="text-sm text-muted-foreground">Model</span>
                        <span className="text-sm">{product?.sku || product?.id || "Model"}</span>
                      </div>
                      <div className="grid grid-cols-2 py-2 even:bg-muted/50">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <span className="text-sm">{product?.category || "Category"}</span>
                      </div>
                      <div className="grid grid-cols-2 py-2 odd:bg-muted/50">
                        <span className="text-sm text-muted-foreground">Color</span>
                        <span className="text-sm">Multiple</span>
                      </div>
                      <div className="grid grid-cols-2 py-2 even:bg-muted/50">
                        <span className="text-sm text-muted-foreground">Stock</span>
                        <span className="text-sm">{product?.stock || 0} units</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Reviews & Ratings</h3>
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        This product doesn't have any reviews yet. Reviews will show up here after customers purchase and review the product.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed checkout buttons on mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex justify-between gap-2 z-10">
          <Button variant="outline" className="w-1/2" onClick={() => window.history.back()}>
            Edit
          </Button>
          <Button className="w-1/2" onClick={() => window.history.back()}>
            Back to Products
          </Button>
        </div>
      )}

      {/* Floating action buttons on desktop */}
      {!isMobile && (
        <div className="fixed bottom-8 right-8 z-10">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => window.location.href = `/seller/products/edit/${productId}`}>
              Edit Product
            </Button>
          </div>
        </div>
      )}
    </SellerDashboardLayout>
  );
}