import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";

interface ProductData {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

interface UseInfiniteProductsOptions {
  category?: string;
  search?: string;
  sellerId?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useInfiniteProducts({
  category,
  search,
  sellerId,
  pageSize = 12,
  enabled = true,
}: UseInfiniteProductsOptions = {}) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Fetch products with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["infinite-products", { category, search, sellerId, pageSize }],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: pageSize.toString(),
        approved: "true",
        status: "approved",
        homepage: "true",
      });

      if (category) params.append("category", category);
      if (search) params.append("search", search);
      if (sellerId) params.append("sellerId", sellerId.toString());

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json() as Promise<ProductData>;
    },
    getNextPageParam: (lastPage, pages) => {
      const { currentPage, totalPages } = lastPage.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Combine all pages into a single products array
  const products = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.products);
  }, [data?.pages]);

  // Update hasMore based on query result
  useEffect(() => {
    setHasMore(hasNextPage ?? false);
  }, [hasNextPage]);

  // Load more products
  const loadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, isFetchingNextPage, hasNextPage]);

  // Get pagination info
  const pagination = useMemo(() => {
    if (!data?.pages?.length) {
      return { currentPage: 1, totalPages: 1, total: 0 };
    }

    const lastPage = data.pages[data.pages.length - 1];
    return lastPage.pagination;
  }, [data?.pages]);

  return {
    products,
    pagination,
    hasMore,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    loadMore,
    refetch,
  };
}

// Hook for category-specific product loading
export function useCategoryProducts(category: string, limit: number = 6) {
  return useQuery({
    queryKey: ["category-products", category, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        category,
        page: "1",
        limit: limit.toString(),
        approved: "true",
        status: "approved",
      });

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} products`);
      }
      return response.json() as Promise<ProductData>;
    },
    enabled: !!category,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
