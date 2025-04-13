import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { CategoryNav } from "@/components/ui/category-nav";
import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSection } from "@/components/ui/hero-section";
import { ShopByCategory } from "@/components/ui/shop-by-category";
import { Loader2 } from "lucide-react";
import TestNavigation from "@/components/test-navigation";

export default function HomePage() {
  const [location] = useLocation();
  const [category, setCategory] = useState<string | null>(null);

  // Extract category from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const categoryParam = searchParams.get('category');
    setCategory(categoryParam);
  }, [location]);

  // Fetch products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { category }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, { category: string | null }];
      const url = `/api/products${params.category ? `?category=${params.category}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  // Fetch featured hero products
  const { data: heroProducts, isLoading: isLoadingHero } = useQuery({
    queryKey: ["/api/featured-hero-products"],
    queryFn: async () => {
      const res = await fetch('/api/featured-hero-products');
      if (!res.ok) throw new Error('Failed to fetch hero products');
      return res.json();
    }
  });
  
  // Fetch deal of the day
  const { data: dealOfTheDay, isLoading: isLoadingDeal } = useQuery({
    queryKey: ["/api/deal-of-the-day"],
    queryFn: async () => {
      const res = await fetch('/api/deal-of-the-day');
      if (!res.ok) throw new Error('Failed to fetch deal of the day');
      return res.json();
    }
  });

  // Organize products by category (dynamically)
  const allCategories = ['Electronics', 'Fashion', 'Home', 'Appliances', 'Mobiles', 'Beauty', 'Toys', 'Grocery'];
  
  // Function to get products by category
  const getProductsByCategory = (categoryName: string) => {
    return products?.filter(p => 
      p.category?.toLowerCase() === categoryName.toLowerCase()
    ).slice(0, 6) || [];
  };
  
  // Featured products (display either filtered or all featured)
  const featuredProducts = category 
    ? products?.slice(0, 5) || [] 
    : products?.filter(p => p.id <= 5).slice(0, 5) || [];
    
  // Generate products list for each category
  const categorizedProducts = allCategories.map(cat => ({
    name: cat,
    title: `Top ${cat}`,
    products: getProductsByCategory(cat)
  })).filter(catGroup => catGroup.products.length > 0);

  // Hero slider images with category links - using more reliable image URLs
  const heroImages = [
    { 
      url: "https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/8a89ee09acc1a9e5.jpg?q=20", 
      // Rebranded from Flipkart to Lelekart 
      alt: "Electronics Sale",
      category: "Electronics" // Link to Electronics category
    },
    { 
      url: "https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/33c7360d512a1741.jpg?q=20", 
      // Rebranded from Flipkart to Lelekart 
      alt: "Fashion Sale",
      category: "Fashion" // Link to Fashion category
    },
    { 
      url: "https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/4b0a5abab30de6f3.jpg?q=20", 
      // Rebranded from Flipkart to Lelekart 
      alt: "Festival Sale",
      category: "Home" // Link to Home category
    }
  ];

  // Loading states for product sections
  const ProductsLoading = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <Skeleton className="h-40 w-32 mb-3" />
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );

  const CategoryProductsLoading = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <Skeleton className="h-32 w-28 mb-2" />
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <CategoryNav />
      
      {/* Hero Section with enhanced slider and deal of the day */}
      {isLoadingHero || isLoadingDeal ? (
        <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-700 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      ) : heroProducts && heroProducts.length > 0 && dealOfTheDay ? (
        <HeroSection 
          sliderImages={heroProducts} 
          dealOfTheDay={dealOfTheDay}
        />
      ) : (
        // Fallback to static images if API fails
        <HeroSection sliderImages={heroImages} dealOfTheDay={{
          title: "Deal of the Day: Wireless Headphones",
          subtitle: "Limited time offer on premium audio experience",
          image: "https://rukminim1.flixcart.com/image/416/416/l31x2fk0/headphone/a/s/h/-original-image9ehehz8amg2.jpeg", // Rebranded from Flipkart to Lelekart
          originalPrice: 129.99,
          discountPrice: 99.99,
          discountPercentage: 23,
          hours: 47,
          minutes: 53,
          seconds: 41
        }} />
      )}

      {/* Shop by Category */}
      <ShopByCategory />
      
      {/* Test Navigation - for debugging product navigation */}
      <div className="container mx-auto px-4 py-2">
        <TestNavigation />
      </div>
      
      {/* Featured Deals */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-medium mb-4">Featured Deals</h2>
        <div className="bg-white p-4 rounded shadow-sm">
          {isLoading ? (
            <ProductsLoading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} featured={true} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Category Sections - Show only if not filtered by specific category */}
      {!category && categorizedProducts.map((categoryGroup, index) => (
        <div key={categoryGroup.name + index} className="container mx-auto px-4 py-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">{categoryGroup.title}</h2>
              <Link 
                href={`/?category=${categoryGroup.name.toLowerCase()}`} 
                className="text-primary hover:underline"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <CategoryProductsLoading />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {categoryGroup.products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* If filtering by category, show all matching products */}
      {category && products && products.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-medium mb-4 capitalize">{category} Products</h2>
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* No products found message */}
      {category && (!products || products.length === 0) && !isLoading && (
        <div className="container mx-auto px-4 py-6 text-center">
          <div className="bg-white p-8 rounded shadow-sm">
            <h2 className="text-2xl font-medium mb-2">No Products Found</h2>
            <p className="text-gray-600 mb-4">We couldn't find any products in the "{category}" category.</p>
            <Link href="/" className="text-primary hover:underline">
              View All Products
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
