import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Grid,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  X
} from "lucide-react";
import { Category, insertCategorySchema } from "@shared/schema";
import { FileUpload } from "@/components/ui/file-upload";

// Define schema for category form
const categorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  image: z.string().url({ message: "Please enter a valid image URL" }),
  displayOrder: z.coerce.number().int().positive(),
  gstRate: z.coerce.string().default("0.00"), // Changed to string to match database schema
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategories() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Form
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      image: "",
      displayOrder: 0,
      gstRate: "0.00", // Changed to string to match database schema
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const res = await apiRequest("POST", "/api/categories", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Created",
        description: "The category has been created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CategoryFormValues;
    }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Updated",
        description: "The category has been updated successfully",
      });
      setEditDialogOpen(false);
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/categories/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete category");
      }
      // Return true for 204 No Content responses (don't try to parse as JSON)
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const onSubmit = (values: CategoryFormValues) => {
    createMutation.mutate(values);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      image: category.image,
      displayOrder: category.displayOrder,
      gstRate: category.gstRate ? String(category.gstRate) : "0.00", // Changed to string to match database schema
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  // Display order handlers
  const handleMoveUp = (category: Category) => {
    // Find the category with the next lower display order
    const sortedCategories = [...(categories || [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedCategories.findIndex(c => c.id === category.id);
    
    if (currentIndex > 0) {
      const targetCategory = sortedCategories[currentIndex - 1];
      const newDisplayOrder = targetCategory.displayOrder;
      
      updateMutation.mutate({
        id: category.id,
        data: {
          ...category,
          displayOrder: newDisplayOrder,
        },
      });
      
      // Also update the other category's display order
      updateMutation.mutate({
        id: targetCategory.id,
        data: {
          ...targetCategory,
          displayOrder: category.displayOrder,
        },
      });
    }
  };

  const handleMoveDown = (category: Category) => {
    // Find the category with the next higher display order
    const sortedCategories = [...(categories || [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedCategories.findIndex(c => c.id === category.id);
    
    if (currentIndex < sortedCategories.length - 1) {
      const targetCategory = sortedCategories[currentIndex + 1];
      const newDisplayOrder = targetCategory.displayOrder;
      
      updateMutation.mutate({
        id: category.id,
        data: {
          ...category,
          displayOrder: newDisplayOrder,
        },
      });
      
      // Also update the other category's display order
      updateMutation.mutate({
        id: targetCategory.id,
        data: {
          ...targetCategory,
          displayOrder: category.displayOrder,
        },
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories that appear in the store
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Category List</CardTitle>
                <CardDescription>
                  All categories displayed in order of appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : categories && categories.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Display Order</TableHead>
                        <TableHead>GST Rate (%)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((category) => (
                          <TableRow key={category.id}>
                            <TableCell>
                              <div className="h-12 w-12 overflow-hidden rounded border border-gray-200">
                                <img 
                                  src={category.image} 
                                  alt={category.name} 
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=No+Image";
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell>{category.displayOrder}</TableCell>
                            <TableCell>{category.gstRate ? `${Number(category.gstRate).toFixed(2)}%` : '0.00%'}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleMoveUp(category)}
                                >
                                  <MoveUp className="h-4 w-4" />
                                  <span className="sr-only">Move up</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleMoveDown(category)}
                                >
                                  <MoveDown className="h-4 w-4" />
                                  <span className="sr-only">Move down</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openEditDialog(category)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-500"
                                  onClick={() => openDeleteDialog(category)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center">
                    <Grid className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-lg font-medium">No Categories Found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create your first category to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Category Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Add New Category</CardTitle>
                <CardDescription>
                  Create a new category for products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Electronics" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Image</FormLabel>
                          <div className="space-y-4">
                            {/* Image Upload */}
                            <div>
                              <p className="text-sm mb-2 font-medium text-muted-foreground">Option 1: Upload Image</p>
                              <FileUpload
                                onChange={(url) => {
                                  console.log("Image uploaded:", url);
                                  // Update form field with the uploaded image URL
                                  field.onChange(url);
                                }}
                                value={field.value}
                                label="Category Image"
                                accept="image/*"
                                maxSizeMB={2}
                                multiple={false}
                              />
                            </div>
                            
                            {/* URL Input */}
                            <div>
                              <p className="text-sm mb-2 font-medium text-muted-foreground">Option 2: Enter Image URL</p>
                              <FormControl>
                                <div className="flex space-x-2">
                                  <Input 
                                    placeholder="https://example.com/image.png" 
                                    value={field.value} 
                                    onChange={field.onChange}
                                  />
                                  {field.value && (
                                    <div className="h-10 w-10 overflow-hidden rounded border border-gray-200 flex-shrink-0">
                                      <img 
                                        src={field.value} 
                                        alt="Preview" 
                                        className="h-full w-full object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=No+Image";
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Order</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              placeholder="1" 
                              {...field} 
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gstRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0.00" 
                              {...field} 
                              onChange={(e) => {
                                const value = e.target.value;
                                // Store as string but validate it's a valid number
                                const numValue = parseFloat(value);
                                if (isNaN(numValue)) {
                                  field.onChange("0.00");
                                } else {
                                  // Format to 2 decimal places as string
                                  field.onChange(numValue.toFixed(2));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating..." : "Create Category"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Make changes to the category details below
            </DialogDescription>
          </DialogHeader>
          
          {selectedCategory && (
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit((data) => {
                  updateMutation.mutate({
                    id: selectedCategory.id,
                    data,
                  });
                })}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Image</FormLabel>
                      <div className="space-y-4">
                        {/* Image Upload */}
                        <div>
                          <p className="text-sm mb-2 font-medium text-muted-foreground">Option 1: Upload Image</p>
                          <FileUpload
                            onChange={(url) => {
                              console.log("Image uploaded in edit mode:", url);
                              // Update form field with the uploaded image URL
                              field.onChange(url);
                            }}
                            value={field.value}
                            label="Category Image"
                            accept="image/*"
                            maxSizeMB={2}
                            multiple={false}
                          />
                        </div>
                        
                        {/* URL Input */}
                        <div>
                          <p className="text-sm mb-2 font-medium text-muted-foreground">Option 2: Enter Image URL</p>
                          <FormControl>
                            <div className="flex space-x-2">
                              <Input 
                                placeholder="https://example.com/image.png" 
                                value={field.value} 
                                onChange={field.onChange}
                              />
                              {field.value && (
                                <div className="h-10 w-10 overflow-hidden rounded border border-gray-200 flex-shrink-0">
                                  <img 
                                    src={field.value} 
                                    alt="Preview" 
                                    className="h-full w-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=No+Image";
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field} 
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gstRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0.00" 
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value;
                            // Store as string but validate it's a valid number
                            const numValue = parseFloat(value);
                            if (isNaN(numValue)) {
                              field.onChange("0.00");
                            } else {
                              // Format to 2 decimal places as string
                              field.onChange(numValue.toFixed(2));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{selectedCategory?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedCategory) {
                  deleteMutation.mutate(selectedCategory.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}