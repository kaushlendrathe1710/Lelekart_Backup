import { useQuery } from "@tanstack/react-query";

interface Category {
  id: number;
  name: string;
  image: string;
}

export function useCategories() {
  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  return {
    categories,
    isLoading,
    error,
  };
}