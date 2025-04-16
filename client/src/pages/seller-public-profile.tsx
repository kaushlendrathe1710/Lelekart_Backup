import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Store, ShoppingBag, Calendar, Star, MapPin } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { ProductCard } from "@/components/ui/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type SellerProfile = {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  approved: boolean;
  // Add any additional fields that might be available
  businessName?: string;
  businessType?: string;
  description?: string;
  profileImage?: string;
  joinedAt?: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice: number;
  category: string;
  sellerId: number;
  images: string;
  approved: boolean;
  createdAt: string;
  rating?: number;
  totalSold?: number;
};

export default function SellerPublicProfilePage() {
  // Handle both URL formats - "/seller/:id" and "/seller-profile/:id"
  const [sellerMatch, sellerParams] = useRoute("/seller/:id");
  const [profileMatch, profileParams] = useRoute("/seller-profile/:id");
  
  // Use params from whichever route matched
  const params = sellerMatch ? sellerParams : profileParams;
  const sellerId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState("products");
  
  // Fetch seller profile
  const { data: seller, isLoading: isLoadingSeller } = useQuery<SellerProfile>({
    queryKey: ['/api/users/seller', sellerId],
    queryFn: async () => {
      if (!sellerId) throw new Error("Seller ID is required");
      
      const res = await fetch(`/api/users/seller/${sellerId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch seller profile");
      }
      return res.json();
    },
    enabled: !!sellerId,
  });
  
  // Fetch seller products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<{products: Product[], total: number}>({
    queryKey: ['/api/products', { sellerId, approved: true }],
    queryFn: async () => {
      if (!sellerId) throw new Error("Seller ID is required");
      
      const res = await fetch(`/api/products?sellerId=${sellerId}&approved=true`);
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      return res.json();
    },
    enabled: !!sellerId,
  });
  
  // Set document title with seller name
  useEffect(() => {
    if (seller?.businessName) {
      document.title = `${seller.businessName} - Lelekart`;
    } else if (seller?.name) {
      document.title = `${seller.name} - Lelekart`;
    } else if (seller?.username) {
      document.title = `${seller.username} - Lelekart`;
    } else {
      document.title = "Seller Profile - Lelekart";
    }
    
    return () => {
      document.title = "Lelekart";
    };
  }, [seller]);
  
  if (isLoadingSeller) {
    return (
      <Layout>
        <div className="container py-10 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p>Loading seller profile...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!seller) {
    return (
      <Layout>
        <div className="container py-10 text-center min-h-[50vh] flex flex-col items-center justify-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Seller Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The seller you're looking for doesn't exist or may have been removed.
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="bg-muted/30">
        <div className="container py-6">
          {/* Seller profile header */}
          <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 h-32 relative">
              {/* Banner image could go here */}
            </div>
            
            <div className="p-6 pt-0 relative">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile image */}
                <div className="flex justify-center md:justify-start">
                  <div className="w-24 h-24 rounded-full bg-background border-4 border-background shadow-md overflow-hidden -mt-12 flex items-center justify-center">
                    {seller.profileImage ? (
                      <img 
                        src={seller.profileImage} 
                        alt={seller.businessName || seller.name || seller.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">
                          {seller.businessName || seller.name || seller.username}
                        </h1>
                        {seller.approved && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1">Seller ID: #{seller.id}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center text-sm bg-muted rounded-lg px-3 py-1.5">
                        <Package className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        <span>{productsData?.total || 0} Products</span>
                      </div>
                      <div className="flex items-center text-sm bg-muted rounded-lg px-3 py-1.5">
                        <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        <span>Joined {seller.joinedAt ? new Date(seller.joinedAt).toLocaleDateString() : 'Recently'}</span>
                      </div>
                      <div className="flex items-center text-sm bg-muted rounded-lg px-3 py-1.5">
                        <Star className="h-4 w-4 mr-1.5 text-amber-500" />
                        <span>4.8 Rating</span>
                      </div>
                    </div>
                  </div>
                  
                  {seller.address && (
                    <div className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{seller.address}</span>
                    </div>
                  )}
                  
                  {seller.description && (
                    <p className="mt-4 text-sm">{seller.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs navigation */}
          <div className="mt-6">
            <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="about" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  About
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="mt-6">
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : productsData?.products && productsData.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {productsData.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Products Available</h3>
                    <p className="text-muted-foreground mt-1">This seller doesn't have any products listed yet.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="about" className="mt-6">
                <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                  <div className="px-6 py-4 bg-muted/30 border-b">
                    <h3 className="text-lg font-medium">About the Seller</h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-4">Business Information</h4>
                        <ul className="space-y-3">
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Business Name:</span>
                            <span className="font-medium">{seller.businessName || 'Not provided'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Business Type:</span>
                            <span className="font-medium">{seller.businessType || 'Not provided'}</span>
                          </li>
                          <Separator className="my-3" />
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Seller Since:</span>
                            <span className="font-medium">{seller.joinedAt ? new Date(seller.joinedAt).toLocaleDateString() : 'Recently'}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-4">Contact Information</h4>
                        <ul className="space-y-3">
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{seller.email || 'Not provided'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-medium">{seller.phone || 'Not provided'}</span>
                          </li>
                          <Separator className="my-3" />
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Address:</span>
                            <span className="font-medium">{seller.address || 'Not provided'}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    {seller.description && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <h4 className="font-medium mb-3">Description</h4>
                          <p className="text-muted-foreground">{seller.description}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}