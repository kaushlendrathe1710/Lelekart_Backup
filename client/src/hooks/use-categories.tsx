import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Category {
  id: number;
  name: string;
  image: string;
}

export const useCategories = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return await res.json() as Category[];
    },
  });
  
  return { data: data || [], isLoading, error };
};