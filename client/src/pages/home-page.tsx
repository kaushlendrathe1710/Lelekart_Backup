import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSection } from "@/components/ui/hero-section";
import { Loader2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { FashionProductCardFixed } from "@/components/ui/fashion-product-card-fixed";

export default function HomePage() {
  const [location] = useLocation();
  const [category, setCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 36;

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1]);
    const categoryParam = searchParams.get("category");
    setCategory(categoryParam);
  }, [location]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1]);
    const pageParam = searchParams.get("page");
    if (pageParam) {
      setCurrentPage(parseInt(pageParam));
    } else {
      setCurrentPage(1);
    }
  }, [location]);

  const allCategories = [
    "Electronics",
    "Fashion",
    "Home",
    "Appliances",
    "Mobiles",
    "Beauty",
    "Toys",
    "Grocery",
  ];

  const fetchProductsByCategory = async (category) => {
    const cacheBuster = new Date().getTime();
    const url = `/api/products?category=${category}&page=${currentPage}&limit=${itemsPerPage}&approved=true&status=approved&_=${cacheBuster}`;
    const res = await fetch(url, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch products for ${category}`);
    return res.json();
  };

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["/api/products", { currentPage, itemsPerPage, category }],
    queryFn: async () => {
      if (category) {
        // Fetch products for a specific category
        const data = await fetchProductsByCategory(category);
        return {
          products: data.products || [],
          pagination: data.pagination || {
            currentPage: 1,
            totalPages: 1,
            total: 0,
          },
        };
      } else {
        // Fetch products for all categories
        const results = await Promise.all(
          allCategories.map((cat) => fetchProductsByCategory(cat))
        );
        const products = results.flatMap((result) => result.products || []);
        return {
          products,
          pagination: { currentPage: 1, totalPages: 1, total: products.length },
        };
      }
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  };

  const { data: heroProducts, isLoading: isLoadingHero } = useQuery({
    queryKey: ["/api/featured-hero-products"],
    queryFn: async () => {
      const res = await fetch(
        "/api/featured-hero-products?approved=true&status=approved"
      );
      if (!res.ok) throw new Error("Failed to fetch hero products");
      return res.json();
    },
    staleTime: 300000,
    refetchOnWindowFocus: true,
  });

  const { data: dealOfTheDay, isLoading: isLoadingDeal } = useQuery({
    queryKey: ["/api/deal-of-the-day"],
    queryFn: async () => {
      const res = await fetch(
        "/api/deal-of-the-day?approved=true&status=approved"
      );
      if (!res.ok) throw new Error("Failed to fetch deal of the day");
      return res.json();
    },
    staleTime: 300000,
  });

  const getProductsByCategory = (categoryName) => {
    return products
      .filter((p) => p.category?.toLowerCase() === categoryName.toLowerCase())
      .slice(0, 6);
  };

  const featuredProducts = category
    ? products.slice(0, 5)
    : products.filter((p) => p.id <= 5).slice(0, 5);

  const categorizedProducts = allCategories
    .map((cat) => ({
      name: cat,
      title: `Top ${cat}`,
      products: getProductsByCategory(cat),
    }))
    .filter((catGroup) => catGroup.products.length > 0);

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
      {isLoadingHero ? (
        <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-700 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      ) : heroProducts && heroProducts.length > 0 ? (
        <HeroSection sliderImages={heroProducts} dealOfTheDay={dealOfTheDay} />
      ) : (
        <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-700 flex flex-col items-center justify-center text-white">
          <div className="mb-4">No banners found in Banner Management</div>
          <p className="text-sm opacity-80">
            Add banners in Admin Panel → Banner Management
          </p>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-medium mb-4">Featured Deals</h2>
        <div className="bg-white p-4 rounded shadow-sm">
          {isLoading ? (
            <ProductsLoading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  featured={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {!category &&
        categorizedProducts.map((categoryGroup, index) => (
          <div
            key={categoryGroup.name + index}
            className="container mx-auto px-4 py-4"
          >
            <div className="bg-white p-4 rounded shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">{categoryGroup.title}</h2>
                <Link
                  href={`/category/${categoryGroup.name.toLowerCase()}`}
                  className="text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
              {isLoading ? (
                <CategoryProductsLoading />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {categoryGroup.products.map((product) =>
                    categoryGroup.name === "Fashion" ? (
                      <FashionProductCardFixed
                        key={product.id}
                        product={product}
                        className="h-full"
                      />
                    ) : (
                      <ProductCard key={product.id} product={product} />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

      {!category && (
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Products</TabsTrigger>
              <TabsTrigger value="new">New Arrivals</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="bg-white p-4 rounded shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">All Products</h2>
                <Link
                  href="/products"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  View All <span aria-hidden="true">→</span>
                </Link>
              </div>
              {isLoading ? (
                <CategoryProductsLoading />
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No products available yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="new" className="bg-white p-4 rounded shadow-sm">
              <div className="text-center py-8">
                <p>New arrivals coming soon!</p>
              </div>
            </TabsContent>

            <TabsContent
              value="popular"
              className="bg-white p-4 rounded shadow-sm"
            >
              <div className="text-center py-8">
                <p>Popular products feature coming soon!</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {category && products.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-medium mb-4 capitalize">
            {category} Products
          </h2>
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {products.map((product) =>
                category?.toLowerCase() === "fashion" ? (
                  <FashionProductCardFixed key={product.id} product={product} />
                ) : (
                  <ProductCard key={product.id} product={product} />
                )
              )}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => {
                    const params = new URLSearchParams(
                      location.split("?")[1] || ""
                    );
                    params.set("page", page.toString());
                    const newUrl = `/?category=${category}&${params.toString()}`;
                    window.location.href = newUrl;
                    window.scrollTo(0, 0);
                  }}
                />
              </div>
            )}

            <div className="text-sm text-gray-500 text-center mt-2">
              Showing {(pagination.currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                pagination.currentPage * itemsPerPage,
                pagination.total
              )}{" "}
              of {pagination.total} products
            </div>
          </div>
        </div>
      )}

      {category && products.length === 0 && !isLoading && (
        <div className="container mx-auto px-4 py-6 text-center">
          <div className="bg-white p-8 rounded shadow-sm">
            <h2 className="text-2xl font-medium mb-2">No Products Found</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find any products in the "{category}" category.
            </p>
            <Link href="/" className="text-primary hover:underline">
              View All Products
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
