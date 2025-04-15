import {
  useQuery,
  useMutation,
  QueryClient
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Type definitions for permissions
export interface CoAdminPermissions {
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canApproveProducts: boolean;
  canCreateCategories: boolean;
  canEditCategories: boolean;
  canDeleteCategories: boolean;
  canManageBanners: boolean;
  canManageFooter: boolean;
  canViewSales: boolean;
  canViewReports: boolean;
  canManageSellers: boolean;
  canApproveSellers: boolean;
}

export interface CreateCoAdminData {
  username: string;
  email: string;
  password: string;
  permissions: CoAdminPermissions;
}

export const useCoAdmins = () => {
  const { toast } = useToast();

  // Fetch all co-admins
  const {
    data: coAdmins,
    isLoading,
    error,
    refetch
  } = useQuery<User[]>({
    queryKey: ["/api/co-admins"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/co-admins");
      return response.json();
    }
  });

  // Create a new co-admin
  const createCoAdminMutation = useMutation({
    mutationFn: async (coAdminData: CreateCoAdminData) => {
      const response = await apiRequest("POST", "/api/co-admins", coAdminData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/co-admins"] });
      toast({
        title: "Success",
        description: "Co-admin created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create co-admin: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update co-admin permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: number, permissions: CoAdminPermissions }) => {
      const response = await apiRequest("PUT", `/api/co-admins/${id}/permissions`, { permissions });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/co-admins"] });
      toast({
        title: "Success",
        description: "Co-admin permissions updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update permissions: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete a co-admin
  const deleteCoAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/co-admins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/co-admins"] });
      toast({
        title: "Success",
        description: "Co-admin deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete co-admin: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return {
    coAdmins,
    isLoading,
    error,
    refetch,
    createCoAdmin: createCoAdminMutation.mutate,
    isCreating: createCoAdminMutation.isPending,
    updatePermissions: updatePermissionsMutation.mutate,
    isUpdating: updatePermissionsMutation.isPending,
    deleteCoAdmin: deleteCoAdminMutation.mutate,
    isDeleting: deleteCoAdminMutation.isPending
  };
};