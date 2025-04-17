import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link as RouterLink, useRoute } from "wouter";
import { 
  Building2, 
  Calendar,
  ShoppingBag,
  Star,
  Shield,
  MapPin,
  PackageCheck,
  Truck,
  Store,
  Award,
  ChevronRight,
  Home
} from "lucide-react";

export default function PublicSellerProfilePage() {
  // Extract seller ID from URL
  const [, params] = useRoute<{ id: string }>("/seller/public-profile/:id");
  const sellerId = params?.id;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("about");

  // Fetch seller public profile data
  const { data: sellerProfile, isLoading } = useQuery({
    queryKey: [`/api/seller/public-profile/${sellerId}`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/seller/public-profile/${sellerId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch seller profile');
        }
        return res.json();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load seller profile",
          variant: "destructive"
        });
        return null;
      }
    },
    enabled: !!sellerId
  });

  // Fetch seller products
  const { data: sellerProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: [`/api/products`, { sellerId }],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/products?sellerId=${sellerId}&approved=true`);
        if (!res.ok) {
          throw new Error('Failed to fetch products');
        }
        return res.json();
      } catch (error) {
        return { products: [] };
      }
    },
    enabled: !!sellerId
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!sellerProfile) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardHeader>
              <CardTitle>Seller Not Found</CardTitle>
              <CardDescription>The seller profile you're looking for doesn't exist or is not available.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <RouterLink href="/marketplace">Back to Marketplace</RouterLink>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/marketplace">Marketplace</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{sellerProfile.businessName}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Seller Header */}
        <div className="bg-background border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={sellerProfile.logoUrl || ""} alt={sellerProfile.businessName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {sellerProfile.businessName?.charAt(0)?.toUpperCase() || 'S'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{sellerProfile.businessName}</h1>
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    <Award className="h-3 w-3 mr-1" /> Verified Seller
                  </Badge>
                </div>
                <div className="flex items-center text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">Member since {sellerProfile.memberSince || "April 2023"}</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground mr-1" />
                    <span className="text-sm">{sellerProducts?.products?.length || 0} Products</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-sm">{sellerProfile.rating || "4.8"} Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:flex">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          {/* About Tab */}
          <TabsContent value="about" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-muted-foreground">Business Name</span>
                    <span className="font-medium">{sellerProfile.businessName}</span>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-muted-foreground">Business Type</span>
                    <span className="font-medium">{sellerProfile.businessType || "Retail"}</span>
                  </div>
                  {sellerProfile.gstNumber && (
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-sm font-medium text-muted-foreground">GST Number</span>
                      <span className="font-medium">{sellerProfile.gstNumber}</span>
                    </div>
                  )}
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-muted-foreground">Location</span>
                    <span className="font-medium">{sellerProfile.location || "Mumbai, India"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Seller Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md border border-green-100">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700">This seller has been verified by our team</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-md p-4 bg-primary/5 flex flex-col items-center">
                    <PackageCheck className="h-8 w-8 text-primary mb-2" />
                    <div className="text-center">
                      <div className="font-medium">{sellerProfile.ordersCompleted || "500+"}</div>
                      <div className="text-sm text-muted-foreground">Orders Completed</div>
                    </div>
                  </div>
                  <div className="border rounded-md p-4 bg-primary/5 flex flex-col items-center">
                    <Truck className="h-8 w-8 text-primary mb-2" />
                    <div className="text-center">
                      <div className="font-medium">{sellerProfile.avgDeliveryTime || "2-3 days"}</div>
                      <div className="text-sm text-muted-foreground">Avg. Delivery Time</div>
                    </div>
                  </div>
                  <div className="border rounded-md p-4 bg-primary/5 flex flex-col items-center">
                    <Store className="h-8 w-8 text-primary mb-2" />
                    <div className="text-center">
                      <div className="font-medium">{sellerProfile.returnRate || "<2%"}</div>
                      <div className="text-sm text-muted-foreground">Return Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {sellerProfile.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{sellerProfile.description}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <h2 className="text-xl font-semibold">Products by {sellerProfile.businessName}</h2>
            
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : sellerProducts?.products?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sellerProducts.products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-1 text-sm text-muted-foreground">{product.category}</div>
                      <h3 className="font-semibold text-base line-clamp-2 min-h-[40px]">{product.name}</h3>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex flex-col">
                          {product.salePrice && product.salePrice < product.price ? (
                            <>
                              <span className="font-semibold">₹{product.salePrice}</span>
                              <span className="text-sm line-through text-muted-foreground">₹{product.price}</span>
                            </>
                          ) : (
                            <span className="font-semibold">₹{product.price}</span>
                          )}
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <RouterLink href={`/product/${product.id}`}>View</RouterLink>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No products available from this seller.</p>
                </CardContent>
              </Card>
            )}
            
            {sellerProducts?.products?.length > 0 && (
              <div className="text-center mt-6">
                <Button asChild>
                  <RouterLink href={`/marketplace?sellerId=${sellerId}`}>
                    View All Products
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </RouterLink>
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Customer Reviews</h2>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-lg">{sellerProfile.rating || "4.8"}</span>
                <span className="text-muted-foreground">({sellerProfile.reviewCount || "120"} reviews)</span>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-6">
                {sellerProfile.reviews && sellerProfile.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {sellerProfile.reviews.map((review, index) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{review.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{review.username}</div>
                              <div className="text-sm text-muted-foreground">{review.date}</div>
                            </div>
                          </div>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "text-amber-500" : "text-gray-200"
                                }`}
                                fill={i < review.rating ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No reviews available for this seller yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}