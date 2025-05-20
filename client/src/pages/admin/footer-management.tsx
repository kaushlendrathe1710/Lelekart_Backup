import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
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
  DialogDescription,
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
  "social",
  "mail_us",
  "hero",
  "about_page"
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
    
    // If switching to hero section and creating a new entry, set helpful default content
    if (activeTab === "hero" && !isEditDialogOpen) {
      form.setValue("content", JSON.stringify({
        link: "/path-or-url",
        variant: "default", 
        icon: "package"
      }, null, 2));
      form.setValue("title", "Button Text");
    }
    
    // If switching to social section and creating a new entry, set helpful default content
    if (activeTab === "social" && !isEditDialogOpen) {
      form.setValue("content", "https://");
      form.setValue("title", "");
      form.setValue("order", 0);
    }
    
    // If switching to about_page section and creating a new entry, set helpful default content
    if (activeTab === "about_page" && !isEditDialogOpen) {
      const defaultContent = `<h2 class="text-xl md:text-2xl font-bold mb-4 text-[#2874f0]">Example Section Title</h2>
<p class="mb-4 text-gray-700">
  This is an example of content you can add to the About Us page. You can use HTML tags like 
  &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, etc., to format your content.
</p>`;
      form.setValue("content", defaultContent);
      form.setValue("title", "Section Name");
    }
  }, [activeTab, form, isEditDialogOpen]);

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
                  const defaultContent = activeTab === "hero" 
                    ? JSON.stringify({
                        link: "/path-or-url",
                        variant: "default", 
                        icon: "package"
                      }, null, 2)
                    : "";
                    
                  const defaultTitle = activeTab === "hero"
                    ? "Button Text"
                    : "";
                    
                  form.reset({
                    section: activeTab,
                    title: defaultTitle,
                    content: defaultContent,
                    order: 0,
                    isActive: true,
                  });
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add New {activeTab === "hero" ? "Button" : "Content"}
              </Button>
            </div>

            <Tabs
              defaultValue="about"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-7 mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="help">Help</TabsTrigger>
                <TabsTrigger value="consumer_policy">Consumer Policy</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="mail_us">Mail Us</TabsTrigger>
                <TabsTrigger value="hero">Hero Buttons</TabsTrigger>
                <TabsTrigger value="about_page">About Page</TabsTrigger>
              </TabsList>

              {footerSections.map((section) => (
                <TabsContent key={section} value={section}>
                  {/* Section Header with examples for About Page */}
                  {section === "about_page" && (
                    <div className="mb-6 p-4 border border-blue-100 bg-blue-50 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-blue-700">About Us Page Editor</h3>
                      <p className="text-sm text-blue-600 mb-2">
                        Each entry here will be displayed as a section on the About Us page. The page looks for specific titles:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-blue-700 mb-1">Main Page Sections</h4>
                          <ul className="list-disc pl-4 text-blue-600 space-y-1">
                            <li><strong>Hero Title</strong> - Blue header at the top of the page</li>
                            <li><strong>Company Intro</strong> - Main company description</li>
                            <li><strong>At a Glance</strong> - Statistics sidebar</li>
                            <li><strong>Core Values</strong> - The 3-card section with values</li>
                            <li><strong>Leadership Team</strong> - Team photos & titles</li>
                            <li><strong>Our Journey</strong> - Timeline of company milestones</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-700 mb-1">Example HTML Content</h4>
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <code className="text-xs whitespace-pre-wrap text-blue-800">
{`<h2 class="text-xl font-bold mb-4">Our Mission</h2>
<p>
  We believe in making shopping accessible to everyone 
  with <strong>affordable prices</strong> and 
  <strong>quality products</strong>.
</p>
<ul>
  <li>24/7 Customer support</li>
  <li>Nationwide delivery</li>
</ul>`}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Section Header with instructions for Mail Us Section */}
                  {section === "mail_us" && (
                    <div className="mb-6 p-4 border border-amber-100 bg-amber-50 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-amber-700">Mail Us Section Management</h3>
                      <p className="text-sm text-amber-600 mb-2">
                        Configure the "Mail Us" section that appears in the footer. This typically contains your company's mailing address.
                      </p>
                      <ul className="list-disc pl-4 text-amber-600 space-y-1 text-sm">
                        <li><strong>Title</strong> - The label (e.g., "Company Name", "Address Line", etc.)</li>
                        <li><strong>Content</strong> - The text content (e.g., "Lelekart Internet Private Limited")</li>
                        <li><strong>Order</strong> - Control the display order (lower numbers appear first)</li>
                        <li><strong>Active</strong> - Toggle to show/hide this line without deleting it</li>
                      </ul>
                      <div className="mt-3 p-2 bg-white rounded border border-amber-200">
                        <p className="text-xs text-amber-700">
                          <strong>Tip:</strong> Each entry will appear as a separate line in the "Mail Us" section. 
                          Create 5-6 entries for a complete address with company name, building, street, city, etc.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Section Header with instructions for Social Media Links */}
                  {section === "social" && (
                    <div className="mb-6 p-4 border border-green-100 bg-green-50 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-green-700">Social Media Links Management</h3>
                      <p className="text-sm text-green-600 mb-2">
                        Configure social media links that will appear in the website footer. You can customize the following:
                      </p>
                      <ul className="list-disc pl-4 text-green-600 space-y-1 text-sm">
                        <li><strong>Title</strong> - Platform name that determines the icon (e.g., "Facebook", "Chunumunu", "YouTube", "Instagram", etc.)</li>
                        <li><strong>Content</strong> - The full URL to your social media page or profile</li>
                        <li><strong>URL</strong> - For advanced usage: customize the link URL separately from the content (optional)</li>
                        <li><strong>Order</strong> - Control the display order in the footer (lower numbers appear first)</li>
                        <li><strong>Active</strong> - Toggle to show/hide this social media link without deleting it</li>
                      </ul>
                      <div className="mt-4 p-3 bg-white rounded border border-green-200">
                        <h4 className="text-sm font-medium text-green-700 mb-2">Supported Social Platforms</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-green-700">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                          </div>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.059 10.059 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 14-7.496 14-13.986 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                            Chunumunu
                          </div>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            YouTube
                          </div>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                            </svg>
                            Instagram
                          </div>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            LinkedIn
                          </div>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                            </svg>
                            GitHub
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-white rounded border border-green-200">
                        <p className="text-xs text-green-700">
                          <strong>Note:</strong> Twitter has been renamed to "Chunumunu" in the footer. 
                          You can add other social platforms as needed - just use the correct platform name in the Title field.
                        </p>
                      </div>
                    </div>
                  )}
                
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
                                {section === "social" ? (
                                  <div className="flex items-center">
                                    {content.title === "Facebook" && (
                                      <svg className="h-4 w-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                      </svg>
                                    )}
                                    {content.title === "Chunumunu" && (
                                      <svg className="h-4 w-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.059 10.059 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 14-7.496 14-13.986 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                      </svg>
                                    )}
                                    {content.title === "YouTube" && (
                                      <svg className="h-4 w-4 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                      </svg>
                                    )}
                                    {content.title === "Instagram" && (
                                      <svg className="h-4 w-4 mr-2 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                                      </svg>
                                    )}
                                    {content.title === "LinkedIn" && (
                                      <svg className="h-4 w-4 mr-2 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                      </svg>
                                    )}
                                    {content.title === "GitHub" && (
                                      <svg className="h-4 w-4 mr-2 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                      </svg>
                                    )}
                                    {content.title}
                                  </div>
                                ) : (
                                  content.title
                                )}
                              </TableCell>
                              <TableCell className="max-w-md">
                                {section === "about_page" ? (
                                  <div>
                                    <details className="text-sm">
                                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                        View HTML content
                                      </summary>
                                      <div className="mt-2 p-2 bg-gray-50 rounded border text-xs overflow-auto max-h-32">
                                        <code className="whitespace-pre-wrap">{content.content}</code>
                                      </div>
                                    </details>
                                    <div className="mt-1 text-xs text-gray-500">
                                      Click pencil icon to edit this content section
                                    </div>
                                  </div>
                                ) : section === "social" ? (
                                  <div>
                                    <a 
                                      href={content.content}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 hover:underline truncate block"
                                    >
                                      {content.content}
                                    </a>
                                    <div className="flex items-center mt-1.5">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${content.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {content.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                      <span className="mx-2 text-gray-300">|</span>
                                      <span className="text-xs text-gray-500">
                                        Order: {content.order}
                                      </span>
                                    </div>
                                  </div>
                                ) : section === "hero" ? (
                                  <div>
                                    <div className="truncate font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                                      {content.content}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                      {(() => {
                                        try {
                                          const data = JSON.parse(content.content);
                                          return (
                                            <span>
                                              Links to: <span className="font-medium">{data.link}</span>
                                            </span>
                                          );
                                        } catch (e) {
                                          return "Invalid JSON format";
                                        }
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="truncate">{content.content}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (content.order > 0 && content.id !== undefined) {
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
                                    if (content.id !== undefined) {
                                      toggleActiveMutation.mutate(content.id);
                                    }
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
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the content for this footer section"
                : "Add a new entry to the footer section"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {footerSections.map((section) => (
                        <Button
                          key={section}
                          type="button"
                          variant={field.value === section ? "default" : "outline"}
                          onClick={() => field.onChange(section)}
                          className="capitalize"
                        >
                          {section === "hero" ? "Hero Buttons" : 
                           section === "about_page" ? "About Page" : 
                           section.replace("_", " ")}
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
                      <Input 
                        placeholder={
                          form.getValues("section") === "social" 
                            ? "Enter title (Facebook, Chunumunu, YouTube, or Instagram)" 
                            : "Enter title"
                        } 
                        {...field} 
                      />
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
                        placeholder={
                          form.getValues("section") === "hero" 
                            ? 'For hero buttons, you can use a JSON format like: {"link":"/path-or-url", "variant":"default", "icon":"home"}'
                            : form.getValues("section") === "social"
                            ? 'Enter the full URL (e.g., https://www.facebook.com/yourbrand)'
                            : 'Enter content'
                        }
                        {...field}
                        rows={form.getValues("section") === "about_page" ? 10 : 5}
                        className={form.getValues("section") === "about_page" ? "font-mono text-sm" : ""}
                      />
                    </FormControl>
                    {form.getValues("section") === "hero" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>For Hero Buttons:</strong> Use JSON format with properties: <br />
                        - <code className="bg-muted p-0.5 rounded">link</code>: URL path or external link (use {'{orderId}'} as placeholder if needed) <br />
                        - <code className="bg-muted p-0.5 rounded">variant</code>: Button style (default, outline, ghost, link) <br />
                        - <code className="bg-muted p-0.5 rounded">icon</code>: Icon name (home, package, shopping-bag, user, heart, etc.) <br />
                        Example: <code className="bg-muted p-0.5 rounded text-xs">{"{"}"link":"/order/{'{orderId}'}", "variant":"default", "icon":"package"{"}"}</code>
                      </p>
                    )}
                    
                    {form.getValues("section") === "social" && (
                      <div className="space-y-3 mt-2">
                        <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100">
                          <p className="flex items-center font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Social Media Link Configuration
                          </p>
                          <ul className="mt-1 space-y-1 pl-5 list-disc">
                            <li>Enter the complete URL including <code className="bg-green-100 px-1 rounded">https://</code></li>
                            <li>Choose an appropriate title that matches a supported platform name</li>
                            <li>Set order number (lower numbers appear first in the footer)</li>
                          </ul>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {["Facebook", "Chunumunu", "YouTube", "Instagram", "LinkedIn", "GitHub"].map(platform => (
                            <Button 
                              key={platform}
                              type="button"
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                form.setValue("title", platform);
                              }}
                            >
                              Use {platform}
                            </Button>
                          ))}
                        </div>
                        
                        <div className="text-xs text-blue-600">
                          <p>
                            <strong>Example setup:</strong>
                          </p>
                          <ul className="pl-5 space-y-1 list-disc">
                            <li><strong>Title:</strong> Facebook</li>
                            <li><strong>Content:</strong> https://www.facebook.com/yourbrand</li>
                            <li><strong>Order:</strong> 0 (will be first in list)</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    {form.getValues("section") === "about_page" && (
                      <div className="space-y-2 text-xs text-muted-foreground mt-1">
                        <p><strong>About Page Content Editor:</strong></p>
                        <p>Use this editor to manage the content sections on the About Us page. Each entry will create a separate section on the page.</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            <strong>Title:</strong> Name of this content section (e.g., "Hero Title", "Company Intro", "Our Values", "Leadership Team")
                          </li>
                          <li>
                            <strong>Content:</strong> HTML content for this section. You can use HTML tags for formatting:
                            <ul className="list-disc pl-5 mt-1">
                              <li><code className="bg-muted p-0.5 rounded">&lt;h2&gt;</code> for headings</li>
                              <li><code className="bg-muted p-0.5 rounded">&lt;p&gt;</code> for paragraphs</li>
                              <li><code className="bg-muted p-0.5 rounded">&lt;strong&gt;</code> or <code className="bg-muted p-0.5 rounded">&lt;b&gt;</code> for bold text</li>
                              <li><code className="bg-muted p-0.5 rounded">&lt;ul&gt;</code> and <code className="bg-muted p-0.5 rounded">&lt;li&gt;</code> for lists</li>
                              <li><code className="bg-muted p-0.5 rounded">&lt;a href="..."&gt;</code> for links</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Recommended sections:</strong> "Hero Title", "Company Intro", "At a Glance", "Core Values", "Leadership Team", "Our Journey", "FAQs", "Join Us CTA"
                          </li>
                        </ul>
                      </div>
                    )}
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
            <DialogDescription>
              This will permanently remove this item from the footer.
            </DialogDescription>
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