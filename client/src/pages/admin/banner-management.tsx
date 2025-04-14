import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, EyeOff, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type ToastActionElement, type ToastProps } from "@/components/ui/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCategories } from "@/hooks/use-categories";

// Banner type matching the database schema
interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  category: string;
  position: number;
  active: boolean;
  badgeText: string | null;
  productId: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function BannerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [newBanner, setNewBanner] = useState<Omit<Banner, "id" | "createdAt" | "updatedAt">>({
    title: "",
    subtitle: "",
    imageUrl: "",
    buttonText: "Shop Now",
    category: "",
    position: 1,
    active: true,
    badgeText: "HOT DEAL",
    productId: null,
  });
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const { data: categories = [] } = useCategories();

  // Fetch all banners
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/banners");
      const data = await res.json();
      return data as Banner[];
    },
  });

  // Create a new banner
  const createBannerMutation = useMutation({
    mutationFn: async (banner: Omit<Banner, "id" | "createdAt" | "updatedAt">) => {
      const res = await apiRequest("POST", "/api/banners", banner);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-hero-products"] });
      setIsAddingBanner(false);
      setNewBanner({
        title: "",
        subtitle: "",
        imageUrl: "",
        buttonText: "Shop Now",
        category: "",
        position: 1,
        active: true,
        badgeText: "HOT DEAL",
        productId: null,
      });
      toast({
        title: "Banner created",
        description: "Your banner has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update a banner
  const updateBannerMutation = useMutation({
    mutationFn: async (banner: Banner) => {
      const { id, ...data } = banner;
      const res = await apiRequest("PUT", `/api/banners/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-hero-products"] });
      setEditingBanner(null);
      toast({
        title: "Banner updated",
        description: "Your banner has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a banner
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-hero-products"] });
      toast({
        title: "Banner deleted",
        description: "Your banner has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle banner active status
  const toggleBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/banners/${id}/toggle-active`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-hero-products"] });
      toast({
        title: "Banner status updated",
        description: "Your banner status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating banner status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update banner position
  const updateBannerPositionMutation = useMutation({
    mutationFn: async ({ id, position }: { id: number; position: number }) => {
      const res = await apiRequest("PATCH", `/api/banners/${id}/position`, { position });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-hero-products"] });
      toast({
        title: "Banner position updated",
        description: "Your banner position has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating banner position",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBanner = () => {
    createBannerMutation.mutate(newBanner);
  };

  const handleSaveChanges = () => {
    if (editingBanner) {
      updateBannerMutation.mutate(editingBanner);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('bannerImage', file);
    
    try {
      // Show loading toast
      toast({
        title: "Uploading image...",
        description: "Please wait while we upload your image.",
      });
      
      const res = await fetch("/api/upload/banner", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success && data.imageUrl) {
        // Update the banner state with the new image URL
        setNewBanner(prev => ({
          ...prev,
          imageUrl: data.imageUrl
        }));
        
        // Show success message
        toast({
          title: "Banner image uploaded",
          description: data.message || "Your banner image has been uploaded successfully.",
          variant: "default",
        });
      } else {
        // Show error message
        toast({
          title: "Upload failed",
          description: data.message || "There was an error uploading your image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingBanner) {
      return;
    }
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('bannerImage', file);
    
    try {
      // Show loading toast
      toast({
        title: "Uploading image...",
        description: "Please wait while we upload your image.",
      });
      
      const res = await fetch("/api/upload/banner", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success && data.imageUrl) {
        // Update the banner state with the new image URL
        setEditingBanner(prev => {
          if (!prev) return null;
          return {
            ...prev,
            imageUrl: data.imageUrl
          };
        });
        
        // Show success message
        toast({
          title: "Banner image uploaded",
          description: data.message || "Your banner image has been uploaded successfully.",
          variant: "default",
        });
      } else {
        // Show error message
        toast({
          title: "Upload failed",
          description: data.message || "There was an error uploading your image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMoveUp = (banner: Banner) => {
    if (banner.position > 1) {
      updateBannerPositionMutation.mutate({
        id: banner.id,
        position: banner.position - 1,
      });
    }
  };

  const handleMoveDown = (banner: Banner) => {
    updateBannerPositionMutation.mutate({
      id: banner.id,
      position: banner.position + 1,
    });
  };

  const handleNewBannerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewBanner((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditingBannerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!editingBanner) return;
    
    const { name, value } = e.target;
    setEditingBanner((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleToggleActive = (bannerId: number) => {
    toggleBannerMutation.mutate(bannerId);
  };

  const sortedBanners = [...banners].sort((a, b) => a.position - b.position);

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Banner Management</h1>
          {!isAddingBanner && (
            <Button 
              onClick={() => setIsAddingBanner(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add New Banner
            </Button>
          )}
        </div>

        {isAddingBanner && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Banner</CardTitle>
              <CardDescription>
                Create a new banner for the hero section of your store.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={newBanner.title}
                    onChange={handleNewBannerChange}
                    placeholder="e.g. Summer Sale"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    name="subtitle"
                    value={newBanner.subtitle}
                    onChange={handleNewBannerChange}
                    placeholder="e.g. Up to 50% off"
                  />
                </div>
                <div>
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    name="buttonText"
                    value={newBanner.buttonText}
                    onChange={handleNewBannerChange}
                    placeholder="e.g. Shop Now"
                  />
                </div>
                <div>
                  <Label htmlFor="badgeText">Badge Text (Optional)</Label>
                  <Input
                    id="badgeText"
                    name="badgeText"
                    value={newBanner.badgeText || ""}
                    onChange={handleNewBannerChange}
                    placeholder="e.g. HOT DEAL"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="imageUpload" className="text-sm text-muted-foreground">Upload Image</Label>
                      <Input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-1"
                      />
                    </div>
                    <div className="-- OR --">
                      <div className="relative flex items-center my-2">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="imageUrl" className="text-sm text-muted-foreground">Image URL</Label>
                      <Input
                        id="imageUrl"
                        name="imageUrl"
                        value={newBanner.imageUrl}
                        onChange={handleNewBannerChange}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {newBanner.imageUrl && (
                    <div className="mt-2">
                      <Label className="text-sm text-muted-foreground">Image Preview</Label>
                      <div className="mt-1 border rounded-md overflow-hidden w-full h-32 relative">
                        <img 
                          src={newBanner.imageUrl} 
                          alt="Banner preview" 
                          className="object-cover w-full h-full"
                          onError={(e) => e.currentTarget.src = "https://via.placeholder.com/300x150?text=Invalid+Image+URL"}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    name="category"
                    value={newBanner.category}
                    onValueChange={(value) =>
                      setNewBanner((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="productId">Product ID (Optional)</Label>
                  <Input
                    id="productId"
                    name="productId"
                    type="number"
                    value={newBanner.productId || ""}
                    onChange={(e) =>
                      setNewBanner((prev) => ({
                        ...prev,
                        productId: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    placeholder="e.g. 123"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="active"
                    checked={newBanner.active}
                    onCheckedChange={(checked) =>
                      setNewBanner((prev) => ({ ...prev, active: checked }))
                    }
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddingBanner(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBanner}
                disabled={createBannerMutation.isPending || !newBanner.title || !newBanner.imageUrl}
              >
                {createBannerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Banner
              </Button>
            </CardFooter>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : sortedBanners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No banners found. Create your first banner to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedBanners.map((banner) => (
              <Card key={banner.id} className={banner.active ? "" : "opacity-70"}>
                <CardHeader className="relative">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleActive(banner.id)}
                      title={banner.active ? "Deactivate" : "Activate"}
                    >
                      {banner.active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMoveUp(banner)}
                      disabled={banner.position <= 1}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMoveDown(banner)}
                      disabled={banner.position >= sortedBanners.length}
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete banner</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this banner? This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteBannerMutation.mutate(banner.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteBannerMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardTitle className="mb-2">
                    {banner.title}
                    <span className="text-sm text-muted-foreground ml-2">
                      (Position: {banner.position})
                    </span>
                  </CardTitle>
                  <CardDescription>{banner.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="aspect-video relative overflow-hidden rounded-md">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                      }}
                    />
                    {banner.badgeText && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 text-xs rounded">
                        {banner.badgeText}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Button:</span>{" "}
                      {banner.buttonText}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      {banner.category}
                    </div>
                    {banner.productId && (
                      <div>
                        <span className="font-medium">Product ID:</span>{" "}
                        {banner.productId}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      {banner.active ? "Active" : "Inactive"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setEditingBanner(banner)}
                  >
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Banner Modal */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Banner</CardTitle>
              <CardDescription>
                Update the details of your banner.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    value={editingBanner.title}
                    onChange={handleEditingBannerChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-subtitle">Subtitle</Label>
                  <Input
                    id="edit-subtitle"
                    name="subtitle"
                    value={editingBanner.subtitle}
                    onChange={handleEditingBannerChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-buttonText">Button Text</Label>
                  <Input
                    id="edit-buttonText"
                    name="buttonText"
                    value={editingBanner.buttonText}
                    onChange={handleEditingBannerChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-badgeText">Badge Text (Optional)</Label>
                  <Input
                    id="edit-badgeText"
                    name="badgeText"
                    value={editingBanner.badgeText || ""}
                    onChange={handleEditingBannerChange}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="edit-imageUpload" className="text-sm text-muted-foreground">Upload Image</Label>
                      <Input
                        id="edit-imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageUpload}
                        className="mt-1"
                      />
                    </div>
                    <div className="-- OR --">
                      <div className="relative flex items-center my-2">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-imageUrl" className="text-sm text-muted-foreground">Image URL</Label>
                      <Input
                        id="edit-imageUrl"
                        name="imageUrl"
                        value={editingBanner.imageUrl}
                        onChange={handleEditingBannerChange}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {editingBanner.imageUrl && (
                    <div className="mt-2">
                      <Label className="text-sm text-muted-foreground">Image Preview</Label>
                      <div className="mt-1 border rounded-md overflow-hidden w-full h-32 relative">
                        <img 
                          src={editingBanner.imageUrl} 
                          alt="Banner preview" 
                          className="object-cover w-full h-full"
                          onError={(e) => e.currentTarget.src = "https://via.placeholder.com/300x150?text=Invalid+Image+URL"}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    name="category"
                    value={editingBanner.category}
                    onValueChange={(value) =>
                      setEditingBanner((prev) => {
                        if (!prev) return null;
                        return { ...prev, category: value };
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-productId">Product ID (Optional)</Label>
                  <Input
                    id="edit-productId"
                    name="productId"
                    type="number"
                    value={editingBanner.productId || ""}
                    onChange={(e) =>
                      setEditingBanner((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          productId: e.target.value ? parseInt(e.target.value) : null,
                        };
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="edit-active"
                    checked={editingBanner.active}
                    onCheckedChange={(checked) =>
                      setEditingBanner((prev) => {
                        if (!prev) return null;
                        return { ...prev, active: checked };
                      })
                    }
                  />
                  <Label htmlFor="edit-active">Active</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingBanner(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={
                  updateBannerMutation.isPending ||
                  !editingBanner.title ||
                  !editingBanner.imageUrl
                }
              >
                {updateBannerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}