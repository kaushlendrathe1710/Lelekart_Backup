import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, Edit, FileEdit, FileText, Loader2, PlusCircle, Trash } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import axiosClient from '@/lib/axiosClient';

// Define the document template type
interface DocumentTemplate {
  id?: number;
  name: string;
  type: string;
  content: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Form validation schema
const templateSchema = z.object({
  name: z.string().min(1, { message: 'Template name is required' }),
  type: z.string().min(1, { message: 'Template type is required' }),
  content: z.string().min(10, { message: 'Template content must be at least 10 characters' }),
  isDefault: z.boolean().default(false),
});

export default function DocumentTemplatesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Form for creating/editing templates
  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      type: '',
      content: '',
      isDefault: false,
    },
  });
  
  // Fetch all templates
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/document-templates'],
    queryFn: async () => {
      try {
        // Use axios for better cookie handling
        const response = await axiosClient.get('/api/admin/document-templates');
        console.log('Template API response:', response);
        return response.data;
      } catch (err) {
        console.error('Axios error:', err);
        throw new Error(err.response?.data?.error || err.message || 'Failed to fetch templates');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to load templates: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: DocumentTemplate) => {
      const response = await axiosClient.post('/api/admin/document-templates', template);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/document-templates'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Template created successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: DocumentTemplate) => {
      const response = await axiosClient.put(`/api/admin/document-templates/${template.id}`, template);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/document-templates'] });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Template updated successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axiosClient.delete(`/api/admin/document-templates/${id}`);
      return response.status === 204 ? null : response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/document-templates'] });
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleCreateSubmit = (data: z.infer<typeof templateSchema>) => {
    createTemplateMutation.mutate(data);
  };

  const handleEditSubmit = (data: z.infer<typeof templateSchema>) => {
    if (selectedTemplate?.id) {
      updateTemplateMutation.mutate({ ...data, id: selectedTemplate.id });
    }
  };

  const handleEditClick = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    form.reset({
      name: template.name,
      type: template.type,
      content: template.content,
      isDefault: template.isDefault,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplate?.id) {
      deleteTemplateMutation.mutate(selectedTemplate.id);
    }
  };

  // Filter templates based on the active tab
  const filteredTemplates = templates.filter((template: DocumentTemplate) => {
    if (activeTab === 'all') return true;
    return template.type === activeTab;
  });

  // Get unique template types for tabs
  const templateTypes = ['all', ...new Set(templates.map((t: DocumentTemplate) => t.type))];

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Document Templates</h1>
            <p className="text-gray-500 mt-1">
              Manage invoice and shipping slip templates
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Create Template</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Create a new document template for invoices or shipping slips
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Standard Invoice" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select template type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="shipping_slip">Shipping Slip</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Content (Handlebars)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your template content using Handlebars syntax" 
                            className="font-mono h-64 resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Use Handlebars syntax like &#123;&#123;order.id&#125;&#125; to include dynamic data
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Set as Default Template</FormLabel>
                          <FormDescription>
                            This template will be used when no specific template is selected
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTemplateMutation.isPending}>
                      {createTemplateMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Template
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs for filtering templates by type */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {templateTypes.map(type => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type === 'all' ? 'All Templates' : type.replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No templates found</h3>
                <p className="text-gray-500">
                  {activeTab === 'all' 
                    ? 'Create your first template to get started'
                    : `No ${activeTab.replace('_', ' ')} templates found`}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick edit links for common templates */}
                <div className="bg-card rounded-md border shadow-sm p-4 mb-6">
                  <h3 className="font-medium text-lg mb-3">Quick Access</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4 bg-muted/30 flex flex-col">
                      <span className="font-medium mb-1">Invoice Template</span>
                      <p className="text-sm text-muted-foreground mb-3">Edit your default invoice template</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-auto self-start"
                        onClick={() => {
                          const invoiceTemplate = templates.find(t => t.type === 'invoice' && t.isDefault);
                          if (invoiceTemplate) {
                            handleEditClick(invoiceTemplate);
                          } else {
                            toast({
                              title: 'Template not found',
                              description: 'Default invoice template not found',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <FileEdit className="h-4 w-4 mr-2" />
                        Edit Invoice Template
                      </Button>
                    </div>
                    <div className="border rounded-md p-4 bg-muted/30 flex flex-col">
                      <span className="font-medium mb-1">Shipping Slip Template</span>
                      <p className="text-sm text-muted-foreground mb-3">Edit your default shipping slip template</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-auto self-start"
                        onClick={() => {
                          const shippingTemplate = templates.find(t => t.type === 'shipping_slip' && t.isDefault);
                          if (shippingTemplate) {
                            handleEditClick(shippingTemplate);
                          } else {
                            toast({
                              title: 'Template not found',
                              description: 'Default shipping slip template not found',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <FileEdit className="h-4 w-4 mr-2" />
                        Edit Shipping Template
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* All template cards */}
                <h3 className="font-medium text-lg mb-3">All Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template: DocumentTemplate) => (
                    <TemplateCard 
                      key={template.id} 
                      template={template} 
                      onEdit={handleEditClick} 
                      onDelete={handleDeleteClick} 
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your document template
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Standard Invoice" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="shipping_slip">Shipping Slip</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Content (Handlebars)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your template content using Handlebars syntax" 
                        className="font-mono h-64 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Use Handlebars syntax like &#123;&#123;order.id&#125;&#125; to include dynamic data
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as Default Template</FormLabel>
                      <FormDescription>
                        This template will be used when no specific template is selected
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTemplateMutation.isPending}>
                  {updateTemplateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Template
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTemplate && (
              <div className="border rounded-md p-4">
                <div className="font-semibold">{selectedTemplate.name}</div>
                <div className="text-sm text-gray-500 capitalize">{selectedTemplate.type.replace('_', ' ')}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function TemplateCard({ 
  template, 
  onEdit, 
  onDelete 
}: { 
  template: DocumentTemplate; 
  onEdit: (template: DocumentTemplate) => void; 
  onDelete: (template: DocumentTemplate) => void; 
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="mb-1">{template.name}</CardTitle>
            <CardDescription className="capitalize">
              {template.type.replace('_', ' ')}
            </CardDescription>
          </div>
          {template.isDefault && (
            <div className="rounded-full bg-primary/10 text-primary text-xs px-2 py-1 flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Default
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-2 rounded font-mono text-xs overflow-hidden text-gray-700 h-24">
          <div className="line-clamp-6">{template.content}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A'}
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(template)}>
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}