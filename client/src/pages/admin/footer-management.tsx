import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Check, X, ArrowUpDown } from "lucide-react";

const footerSections = [
  "about",
  "help",
  "consumer_policy",
  "social"
];

// Create form schema with Zod
const footerContentSchema = z.object({
  id: z.number().optional(),
  section: z.string().min(1, "Section is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  order: z.number().nonnegative("Order must be a non-negative number"),
  isActive: z.boolean().default(true),
});

type FooterContent = z.infer<typeof footerContentSchema>;

export default function FooterManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("about");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<FooterContent | null>(null);

  // Fetch footer content
  const { data: footerContents = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/footer-content"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/footer-content");
      const data = await res.json();
      return data;
    },
  });

  // Form setup for create/edit
  const form = useForm<FooterContent>({
    resolver: zodResolver(footerContentSchema),
    defaultValues: {
      section: activeTab,
      title: "",
      content: "",
      order: 0,
      isActive: true,
    },
  });

  // Update form values when editing
  useEffect(() => {
    if (currentContent && isEditDialogOpen) {
      form.reset(currentContent);
    }
  }, [currentContent, isEditDialogOpen, form]);

  // Update default section when tab changes
  useEffect(() => {
    form.setValue("section", activeTab);
  }, [activeTab, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<FooterContent, "id">) => {
      const res = await apiRequest("POST", "/api/admin/footer-content", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Footer content created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset({
        section: activeTab,
        title: "",
        content: "",
        order: 0,
        isActive: true,
      });
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/footer-content"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create footer content: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FooterContent) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PUT", `/api/admin/footer-content/${id}`, rest);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Footer content updated successfully",
      });
      setIsEditDialogOpen(false);
      setCurrentContent(null);
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/footer-content"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update footer content: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/footer-content/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Footer content deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setCurrentContent(null);
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/footer-content"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete footer content: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/admin/footer-content/${id}/toggle`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Status toggled successfully",
      });
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/footer-content"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to toggle status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: number; order: number }) => {
      const res = await apiRequest("PUT", `/api/admin/footer-content/${id}/order`, { order });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/footer-content"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update order: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FooterContent) => {
    if (isEditDialogOpen && currentContent?.id) {
      updateMutation.mutate({ ...data, id: currentContent.id });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filter content by section
  const filteredContents = footerContents.filter(
    (content: FooterContent) => content.section === activeTab
  );

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Footer Management</CardTitle>
            <CardDescription>
              Manage the content displayed in the website footer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Footer Content</h2>
              <Button
                onClick={() => {
                  form.reset({
                    section: activeTab,
                    title: "",
                    content: "",
                    order: 0,
                    isActive: true,
                  });
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Content
              </Button>
            </div>

            <Tabs
              defaultValue="about"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="help">Help</TabsTrigger>
                <TabsTrigger value="consumer_policy">Consumer Policy</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
              </TabsList>

              {footerSections.map((section) => (
                <TabsContent key={section} value={section}>
                  {isLoading ? (
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredContents.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">
                        No content found. Click "Add New Content" to create.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead className="w-24">Order</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                          <TableHead className="w-28 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContents
                          .sort((a: FooterContent, b: FooterContent) => a.order - b.order)
                          .map((content: FooterContent) => (
                            <TableRow key={content.id}>
                              <TableCell className="font-medium">
                                {content.title}
                              </TableCell>
                              <TableCell className="max-w-md truncate">
                                {content.content}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (content.order > 0) {
                                        updateOrderMutation.mutate({
                                          id: content.id,
                                          order: content.order - 1,
                                        });
                                      }
                                    }}
                                    disabled={content.order === 0}
                                  >
                                    <ArrowUpDown className="h-4 w-4" />
                                  </Button>
                                  <span className="mx-2">{content.order}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={content.isActive}
                                  onCheckedChange={() => {
                                    toggleActiveMutation.mutate(content.id);
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setCurrentContent(content);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setCurrentContent(content);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setCurrentContent(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Footer Content" : "Add New Footer Content"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {footerSections.map((section) => (
                        <Button
                          key={section}
                          type="button"
                          variant={field.value === section ? "default" : "outline"}
                          onClick={() => field.onChange(section)}
                          className="capitalize"
                        >
                          {section.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter content"
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter display order"
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
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <div className="flex items-center pt-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <Label className="ml-2">
                          {field.value ? "Active" : "Inactive"}
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isEditDialogOpen) {
                      setIsEditDialogOpen(false);
                    } else {
                      setIsCreateDialogOpen(false);
                    }
                    setCurrentContent(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false);
            setCurrentContent(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{currentContent?.title}</span>?
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCurrentContent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (currentContent?.id) {
                  deleteMutation.mutate(currentContent.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}