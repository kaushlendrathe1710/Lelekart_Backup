import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileEdit, Trash2, Plus, Gift, Tag, RefreshCw, Copy, Eye, Calendar } from 'lucide-react';
import { formatDistanceToNow, format, isValid, parseISO, addMonths } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

// Types for gift cards
type GiftCard = {
  id: number;
  code: string;
  initialValue: number;
  currentBalance: number;
  issuedTo: number | null;
  purchasedBy: number | null;
  isActive: boolean;
  expiryDate: string | null;
  createdAt: string;
  lastUsed: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  message: string | null;
  designTemplate: string;
};

type GiftCardTransaction = {
  id: number;
  giftCardId: number;
  userId: number | null;
  orderId: number | null;
  amount: number;
  type: string;
  transactionDate: string;
  note: string | null;
};

type GiftCardTemplate = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function GiftCardsManagement() {
  const [activeTab, setActiveTab] = useState('gift-cards');
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [isEditCardDialogOpen, setIsEditCardDialogOpen] = useState(false);
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false);
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false);
  const [isViewTransactionsDialogOpen, setIsViewTransactionsDialogOpen] = useState(false);
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<GiftCardTemplate | null>(null);
  const [selectedCardForTransactions, setSelectedCardForTransactions] = useState<number | null>(null);
  const [newGiftCard, setNewGiftCard] = useState({
    code: '',
    initialValue: 500,
    currentBalance: 500,
    isActive: true,
    expiryDate: null as Date | null,
    expiryMonths: 12,
    recipientEmail: '',
    recipientName: '',
    message: '',
    designTemplate: 'default'
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    imageUrl: '',
    active: true
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch gift cards with pagination
  const { data: giftCardsData, isLoading: isLoadingGiftCards } = useQuery({
    queryKey: ['/api/admin/gift-cards', page, limit, searchTerm],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (searchTerm) {
        if (searchTerm.includes('@')) {
          searchParams.append('recipientEmail', searchTerm);
        } else {
          searchParams.append('code', searchTerm);
        }
      }
      
      const response = await apiRequest('GET', `/api/admin/gift-cards?${searchParams.toString()}`);
      const data = await response.json();
      return data;
    }
  });

  // Fetch gift card templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/admin/gift-cards/templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/gift-cards/templates');
      const data = await response.json();
      return data;
    }
  });

  // Fetch transactions for a specific gift card
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/admin/gift-cards/transactions', selectedCardForTransactions],
    queryFn: async () => {
      if (!selectedCardForTransactions) return { transactions: [] };
      const response = await apiRequest('GET', `/api/admin/gift-cards/${selectedCardForTransactions}/transactions`);
      const data = await response.json();
      return data;
    },
    enabled: !!selectedCardForTransactions
  });

  // Create gift card mutation
  const createGiftCardMutation = useMutation({
    mutationFn: async (cardData: any) => {
      const response = await apiRequest('POST', '/api/admin/gift-cards', cardData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards'] });
      toast({
        title: 'Success',
        description: 'Gift card created successfully',
      });
      setIsAddCardDialogOpen(false);
      resetNewGiftCard();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create gift card: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update gift card mutation
  const updateGiftCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/admin/gift-cards/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards'] });
      toast({
        title: 'Success',
        description: 'Gift card updated successfully',
      });
      setIsEditCardDialogOpen(false);
      setSelectedGiftCard(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update gift card: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete gift card mutation
  const deleteGiftCardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/gift-cards/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards'] });
      toast({
        title: 'Success',
        description: 'Gift card deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete gift card: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest('POST', '/api/admin/gift-cards/templates', templateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards/templates'] });
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
      setIsAddTemplateDialogOpen(false);
      setNewTemplate({
        name: '',
        description: '',
        imageUrl: '',
        active: true
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create template: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/admin/gift-cards/templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards/templates'] });
      toast({
        title: 'Success',
        description: 'Template updated successfully',
      });
      setIsEditTemplateDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update template: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/gift-cards/templates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards/templates'] });
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete template: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const handleCreateGiftCard = () => {
    const cardData = { ...newGiftCard };
    
    // Convert the expiryDate to an ISO string for the API
    if (cardData.expiryDate) {
      cardData.expiryDate = (cardData.expiryDate as Date).toISOString();
    } else if (cardData.expiryMonths) {
      // Calculate expiry date based on months if direct date not set
      const expiryDate = addMonths(new Date(), cardData.expiryMonths);
      cardData.expiryDate = expiryDate.toISOString();
    }
    
    // Make sure currentBalance starts as initialValue
    cardData.currentBalance = cardData.initialValue;
    
    createGiftCardMutation.mutate(cardData);
  };

  const handleUpdateGiftCard = () => {
    if (!selectedGiftCard) return;
    
    const cardData = { 
      isActive: selectedGiftCard.isActive,
      recipientEmail: selectedGiftCard.recipientEmail,
      recipientName: selectedGiftCard.recipientName,
      message: selectedGiftCard.message,
      designTemplate: selectedGiftCard.designTemplate,
    };
    
    // Only include expiryDate if it was modified
    if (selectedGiftCard.expiryDate && typeof selectedGiftCard.expiryDate === 'object') {
      cardData.expiryDate = (selectedGiftCard.expiryDate as Date).toISOString();
    }
    
    updateGiftCardMutation.mutate({ id: selectedGiftCard.id, data: cardData });
  };

  const handleCreateTemplate = () => {
    createTemplateMutation.mutate(newTemplate);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;
    updateTemplateMutation.mutate({ id: selectedTemplate.id, data: selectedTemplate });
  };

  const handleDeleteGiftCard = (id: number) => {
    if (confirm('Are you sure you want to delete this gift card?')) {
      deleteGiftCardMutation.mutate(id);
    }
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleEditGiftCard = (card: GiftCard) => {
    // Convert string dates to Date objects for the form
    const processedCard = { ...card };
    if (processedCard.expiryDate) {
      processedCard.expiryDate = parseISO(processedCard.expiryDate);
    }
    setSelectedGiftCard(processedCard);
    setIsEditCardDialogOpen(true);
  };

  const handleEditTemplate = (template: GiftCardTemplate) => {
    setSelectedTemplate(template);
    setIsEditTemplateDialogOpen(true);
  };

  const handleViewTransactions = (cardId: number) => {
    setSelectedCardForTransactions(cardId);
    setIsViewTransactionsDialogOpen(true);
  };

  const resetNewGiftCard = () => {
    setNewGiftCard({
      code: '',
      initialValue: 500,
      currentBalance: 500,
      isActive: true,
      expiryDate: null,
      expiryMonths: 12,
      recipientEmail: '',
      recipientName: '',
      message: '',
      designTemplate: 'default'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Code copied to clipboard',
    });
  };

  // Helper function to format date relative to now
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiry';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'PPP') : 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gift Cards Management</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards/templates'] });
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            {activeTab === 'gift-cards' ? (
              <Button onClick={() => setIsAddCardDialogOpen(true)}>
                <Gift className="mr-2 h-4 w-4" />
                New Gift Card
              </Button>
            ) : (
              <Button onClick={() => setIsAddTemplateDialogOpen(true)}>
                <Tag className="mr-2 h-4 w-4" />
                New Template
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="gift-cards">
              <Gift className="h-4 w-4 mr-2" />
              Gift Cards
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Tag className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Gift Cards Tab */}
          <TabsContent value="gift-cards">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Gift Cards</CardTitle>
                  <div className="w-64">
                    <Input 
                      placeholder="Search by code or email" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <CardDescription>
                  Manage gift cards, check balances, and view transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingGiftCards ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {giftCardsData?.giftCards?.map((card: GiftCard) => (
                          <TableRow key={card.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="font-mono">{card.code}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(card.code)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>₹{card.initialValue}</TableCell>
                            <TableCell>₹{card.currentBalance}</TableCell>
                            <TableCell>
                              {card.recipientEmail ? (
                                <div>
                                  <div>{card.recipientEmail}</div>
                                  {card.recipientName && (
                                    <div className="text-sm text-muted-foreground">{card.recipientName}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No recipient</span>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(card.expiryDate)}</TableCell>
                            <TableCell>
                              <Badge variant={card.isActive ? "success" : "secondary"}>
                                {card.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewTransactions(card.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEditGiftCard(card)}
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeleteGiftCard(card.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  {giftCardsData?.pagination && (
                    <div className="text-sm text-muted-foreground">
                      Showing {(giftCardsData.pagination.page - 1) * giftCardsData.pagination.limit + 1}-
                      {Math.min(giftCardsData.pagination.page * giftCardsData.pagination.limit, giftCardsData.pagination.totalCount)} of {giftCardsData.pagination.totalCount}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(page > 1 ? page - 1 : 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(page + 1)}
                    disabled={giftCardsData?.pagination && page >= giftCardsData.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Gift Card Templates</CardTitle>
                <CardDescription>
                  Manage templates for gift cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTemplates ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {templates.map((template: GiftCardTemplate) => (
                      <Card key={template.id} className="overflow-hidden">
                        <div className="relative aspect-video bg-muted">
                          {template.imageUrl ? (
                            <img 
                              src={template.imageUrl} 
                              alt={template.name} 
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              No image
                            </div>
                          )}
                          <Badge 
                            variant={template.active ? "success" : "secondary"}
                            className="absolute top-2 right-2"
                          >
                            {template.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <CardHeader className="p-4">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground">
                            {template.description || 'No description'}
                          </p>
                        </CardContent>
                        <CardFooter className="p-4 flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditTemplate(template)}
                          >
                            <FileEdit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                    {templates.length === 0 && (
                      <div className="col-span-full py-8 text-center text-muted-foreground">
                        No templates found. Create a new template to get started.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Gift Card Dialog */}
        <Dialog open={isAddCardDialogOpen} onOpenChange={setIsAddCardDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Gift Card</DialogTitle>
              <DialogDescription>
                Create a new gift card that can be used for purchases
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="initialValue">Value (₹)</Label>
                <Input 
                  id="initialValue" 
                  type="number" 
                  placeholder="Enter gift card value" 
                  value={newGiftCard.initialValue || ''} 
                  onChange={(e) => setNewGiftCard({...newGiftCard, initialValue: Number(e.target.value), currentBalance: Number(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code (Optional)</Label>
                <Input 
                  id="code" 
                  placeholder="Leave blank to generate automatically" 
                  value={newGiftCard.code} 
                  onChange={(e) => setNewGiftCard({...newGiftCard, code: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">If left blank, a unique code will be generated</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryMonths">Expiry Period (Months)</Label>
                <Input 
                  id="expiryMonths" 
                  type="number" 
                  placeholder="Enter months until expiry" 
                  value={newGiftCard.expiryMonths || ''} 
                  onChange={(e) => setNewGiftCard({...newGiftCard, expiryMonths: Number(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipientEmail">Recipient Email</Label>
                <Input 
                  id="recipientEmail" 
                  type="email" 
                  placeholder="Enter recipient email" 
                  value={newGiftCard.recipientEmail} 
                  onChange={(e) => setNewGiftCard({...newGiftCard, recipientEmail: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input 
                  id="recipientName" 
                  placeholder="Enter recipient name" 
                  value={newGiftCard.recipientName} 
                  onChange={(e) => setNewGiftCard({...newGiftCard, recipientName: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Gift Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Enter a message to the recipient" 
                  value={newGiftCard.message} 
                  onChange={(e) => setNewGiftCard({...newGiftCard, message: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="designTemplate">Design Template</Label>
                <select 
                  id="designTemplate" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newGiftCard.designTemplate} 
                  onChange={(e) => setNewGiftCard({...newGiftCard, designTemplate: e.target.value})}
                >
                  <option value="default">Default</option>
                  {templates.map((template: GiftCardTemplate) => (
                    <option key={template.id} value={template.name}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isActive" 
                  checked={newGiftCard.isActive} 
                  onCheckedChange={(checked) => setNewGiftCard({...newGiftCard, isActive: checked})}
                />
                <Label htmlFor="isActive">Gift Card Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCardDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateGiftCard}>Create Gift Card</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Gift Card Dialog */}
        <Dialog open={isEditCardDialogOpen} onOpenChange={setIsEditCardDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Gift Card</DialogTitle>
              <DialogDescription>
                Update gift card details and status
              </DialogDescription>
            </DialogHeader>
            {selectedGiftCard && (
              <div className="grid gap-4 py-4">
                <div className="p-4 bg-muted rounded-md mb-2">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Code:</span>
                    <span className="font-mono">{selectedGiftCard.code}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Initial Value:</span>
                    <span>₹{selectedGiftCard.initialValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Current Balance:</span>
                    <span>₹{selectedGiftCard.currentBalance}</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <div className="relative">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {selectedGiftCard.expiryDate ? (
                            format(selectedGiftCard.expiryDate as Date, 'PP')
                          ) : (
                            <span>No expiry date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={selectedGiftCard.expiryDate as Date}
                          onSelect={(date) => setSelectedGiftCard({...selectedGiftCard, expiryDate: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-recipientEmail">Recipient Email</Label>
                  <Input 
                    id="edit-recipientEmail" 
                    type="email" 
                    placeholder="Enter recipient email" 
                    value={selectedGiftCard.recipientEmail || ''} 
                    onChange={(e) => setSelectedGiftCard({...selectedGiftCard, recipientEmail: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-recipientName">Recipient Name</Label>
                  <Input 
                    id="edit-recipientName" 
                    placeholder="Enter recipient name" 
                    value={selectedGiftCard.recipientName || ''} 
                    onChange={(e) => setSelectedGiftCard({...selectedGiftCard, recipientName: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-message">Gift Message</Label>
                  <Textarea 
                    id="edit-message" 
                    placeholder="Enter a message to the recipient" 
                    value={selectedGiftCard.message || ''} 
                    onChange={(e) => setSelectedGiftCard({...selectedGiftCard, message: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-designTemplate">Design Template</Label>
                  <select 
                    id="edit-designTemplate" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedGiftCard.designTemplate} 
                    onChange={(e) => setSelectedGiftCard({...selectedGiftCard, designTemplate: e.target.value})}
                  >
                    <option value="default">Default</option>
                    {templates.map((template: GiftCardTemplate) => (
                      <option key={template.id} value={template.name}>{template.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="edit-isActive" 
                    checked={selectedGiftCard.isActive} 
                    onCheckedChange={(checked) => setSelectedGiftCard({...selectedGiftCard, isActive: checked})}
                  />
                  <Label htmlFor="edit-isActive">Gift Card Active</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditCardDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateGiftCard}>Update Gift Card</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Template Dialog */}
        <Dialog open={isAddTemplateDialogOpen} onOpenChange={setIsAddTemplateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a new design template for gift cards
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input 
                  id="templateName" 
                  placeholder="Enter template name" 
                  value={newTemplate.name} 
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="templateDescription">Description</Label>
                <Textarea 
                  id="templateDescription" 
                  placeholder="Enter template description" 
                  value={newTemplate.description} 
                  onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="templateImageUrl">Image URL</Label>
                <Input 
                  id="templateImageUrl" 
                  placeholder="Enter image URL" 
                  value={newTemplate.imageUrl} 
                  onChange={(e) => setNewTemplate({...newTemplate, imageUrl: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="templateActive" 
                  checked={newTemplate.active} 
                  onCheckedChange={(checked) => setNewTemplate({...newTemplate, active: checked})}
                />
                <Label htmlFor="templateActive">Template Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTemplateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTemplate}>Create Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Template Dialog */}
        <Dialog open={isEditTemplateDialogOpen} onOpenChange={setIsEditTemplateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update template details and status
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-templateName">Template Name</Label>
                  <Input 
                    id="edit-templateName" 
                    placeholder="Enter template name" 
                    value={selectedTemplate.name} 
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-templateDescription">Description</Label>
                  <Textarea 
                    id="edit-templateDescription" 
                    placeholder="Enter template description" 
                    value={selectedTemplate.description || ''} 
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, description: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-templateImageUrl">Image URL</Label>
                  <Input 
                    id="edit-templateImageUrl" 
                    placeholder="Enter image URL" 
                    value={selectedTemplate.imageUrl || ''} 
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, imageUrl: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="edit-templateActive" 
                    checked={selectedTemplate.active} 
                    onCheckedChange={(checked) => setSelectedTemplate({...selectedTemplate, active: checked})}
                  />
                  <Label htmlFor="edit-templateActive">Template Active</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditTemplateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateTemplate}>Update Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Transactions Dialog */}
        <Dialog open={isViewTransactionsDialogOpen} onOpenChange={setIsViewTransactionsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gift Card Transactions</DialogTitle>
              <DialogDescription>
                View transaction history for this gift card
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isLoadingTransactions ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.transactions?.map((transaction: GiftCardTransaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatRelativeTime(transaction.transactionDate)}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'purchase' ? 'default' : transaction.type === 'redemption' ? 'secondary' : 'outline'}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </TableCell>
                          <TableCell>{transaction.userId || '-'}</TableCell>
                          <TableCell>{transaction.orderId || '-'}</TableCell>
                          <TableCell>{transaction.note || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {(!transactions?.transactions || transactions.transactions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No transactions found for this gift card
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewTransactionsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default GiftCardsManagement;