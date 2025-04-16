import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  CircleHelp,
  HelpCircle,
  Info,
  LifeBuoy,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ThumbsUp,
  Video,
} from "lucide-react";

// Helper for ticket status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Open</Badge>;
    case "inProgress":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">In Progress</Badge>;
    case "resolved":
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Resolved</Badge>;
    case "closed":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function SellerSupportPage() {
  const [currentTab, setCurrentTab] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newTicketForm, setNewTicketForm] = useState({
    subject: "",
    category: "account",
    description: "",
    priority: "medium"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch support tickets
  const { data: tickets = [], isLoading: isTicketsLoading } = useQuery({
    queryKey: ['/api/support/tickets'],
    queryFn: async () => {
      const res = await fetch('/api/support/tickets');
      if (!res.ok) {
        throw new Error('Failed to fetch tickets');
      }
      return res.json();
    }
  });

  // Fetch ticket messages when a ticket is selected
  const { data: ticketMessages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['/api/support/tickets', selectedTicket?.id, 'messages'],
    queryFn: async () => {
      if (!selectedTicket) return [];
      
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`);
      if (!res.ok) {
        throw new Error('Failed to fetch ticket messages');
      }
      return res.json();
    },
    enabled: !!selectedTicket,
  });

  // Create new ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof newTicketForm) => {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create ticket');
      }
      
      return res.json();
    },
    onSuccess: () => {
      setShowNewTicketDialog(false);
      setNewTicketForm({
        subject: "",
        category: "account",
        description: "",
        priority: "medium"
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Create Ticket",
        description: "There was an error creating your support ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number, message: string }) => {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets', selectedTicket?.id, 'messages'] });
    },
    onError: () => {
      toast({
        title: "Failed to Send Message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowTicketDialog(true);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    addMessageMutation.mutate({
      ticketId: selectedTicket.id,
      message: newMessage
    });
  };

  const handleCreateTicket = () => {
    createTicketMutation.mutate(newTicketForm);
  };

  const filteredTickets = tickets.filter((ticket: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      ticket.id?.toString().includes(query) ||
      ticket.subject?.toLowerCase().includes(query) ||
      ticket.category?.toLowerCase().includes(query)
    );
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, h:mm a');
  };

  // Get FAQ questions & answers
  const faqs = [
    {
      question: "How do I process a return request?",
      answer: "To process a return request, go to the Returns tab in your Seller Dashboard. You can view all return requests, check details, and approve or reject them. Once approved, follow the return process instructions."
    },
    {
      question: "How do I upload my product catalog?",
      answer: "You can upload your product catalog individually or in bulk. For individual products, go to Products > Add New Product. For bulk uploads, use the Bulk Upload section and download our template first."
    },
    {
      question: "When will I receive my payments?",
      answer: "Payments are processed according to your settlement cycle, typically every 7 days. Funds are usually settled within 1-2 business days after the settlement date. You can check your next payment date in the Payments section."
    },
    {
      question: "How do I update my bank account details?",
      answer: "To update your bank account details, go to Settings > Billing > Bank Account Information. Fill in your new account details and click Save Changes. Your future payments will be processed to the new account."
    },
    {
      question: "What fees does Lelekart charge?",
      answer: "Lelekart charges a percentage commission on each sale, which varies by category. There might also be fixed fees for certain services. You can view your fee structure in the Payments > Commissions section."
    },
    {
      question: "How can I offer discounts on my products?",
      answer: "You can create promotions and offers through the Marketing section. You can set discounts by percentage or fixed amount, create buy-one-get-one offers, or participate in platform-wide sales events."
    },
    {
      question: "What happens if a customer cancels an order?",
      answer: "If a customer cancels an order before shipping, the order status will be updated automatically and no action is required from you. If the product has already been shipped, you'll need to process a return once it's received back."
    },
    {
      question: "How do I handle a product that's out of stock?",
      answer: "You can mark products as out of stock in the Inventory section. You can also enable backorders or set up notifications to alert you when inventory is low so you can restock in time."
    }
  ];

  return (
    <SellerDashboardLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">Get assistance and answers to your seller questions</p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <TabsList>
              <TabsTrigger value="tickets">My Tickets</TabsTrigger>
              <TabsTrigger value="faq">FAQs</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            {currentTab === "tickets" && (
              <div className="flex gap-2 mt-4 sm:mt-0">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search tickets..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setShowNewTicketDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="tickets" className="m-0">
            <Card>
              <CardContent className="p-6">
                {isTicketsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No support tickets found</h3>
                    <p className="text-muted-foreground mt-1 mb-6">
                      {searchQuery ? "Try adjusting your search query" : "Create a new ticket to get help from our support team"}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowNewTicketDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Support Ticket
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map((ticket: any) => (
                      <div 
                        key={ticket.id}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{ticket.subject}</h3>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span>Ticket #{ticket.id}</span>
                            <span className="mx-2">•</span>
                            <span>{ticket.category}</span>
                            <span className="mx-2">•</span>
                            <span>Created {formatDate(ticket.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                          <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'outline'}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                          </Badge>
                          <Button variant="ghost" size="icon">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Get quick answers to common seller questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CircleHelp className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">{faq.question}</h3>
                        <p className="text-muted-foreground mt-2">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <h3 className="font-medium mb-2">Didn't find what you were looking for?</h3>
                <Button onClick={() => setShowNewTicketDialog(true)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seller Guides</CardTitle>
                  <CardDescription>Helpful resources to grow your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Getting Started Guide</h3>
                      <p className="text-sm text-muted-foreground mt-1">Everything you need to know as a new seller</p>
                      <Button variant="link" className="px-0 h-auto mt-1">View Guide</Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <ThumbsUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Best Practices</h3>
                      <p className="text-sm text-muted-foreground mt-1">Tips to optimize your listings and boost sales</p>
                      <Button variant="link" className="px-0 h-auto mt-1">View Guide</Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Video Tutorials</h3>
                      <p className="text-sm text-muted-foreground mt-1">Step-by-step video guides for sellers</p>
                      <Button variant="link" className="px-0 h-auto mt-1">Watch Videos</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Reach out to our seller support team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Phone Support</h3>
                      <p className="text-sm text-muted-foreground mt-1">+91 1800-419-1234</p>
                      <p className="text-xs text-muted-foreground">Available Monday-Saturday, 9 AM - 6 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email Support</h3>
                      <p className="text-sm text-muted-foreground mt-1">seller-support@lelekart.com</p>
                      <p className="text-xs text-muted-foreground">We typically respond within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <LifeBuoy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Live Chat</h3>
                      <p className="text-sm text-muted-foreground mt-1">Chat with our support team in real-time</p>
                      <Button variant="link" className="px-0 h-auto mt-1">Start Chat</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Seller Community</CardTitle>
                  <CardDescription>Connect with other sellers and share experiences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium">Seller Forums</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Join discussions with other sellers and share your experiences and tips.
                      </p>
                      <Button variant="outline" className="mt-3 w-full">Visit Forums</Button>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium">Seller Webinars</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Attend live webinars hosted by our team to learn new strategies and features.
                      </p>
                      <Button variant="outline" className="mt-3 w-full">View Schedule</Button>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium">Success Stories</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Read about successful sellers and how they grew their business on Lelekart.
                      </p>
                      <Button variant="outline" className="mt-3 w-full">Read Stories</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span>Ticket #{selectedTicket?.id} - {selectedTicket?.subject}</span>
                {selectedTicket && getStatusBadge(selectedTicket.status)}
              </div>
            </DialogTitle>
            <DialogDescription>
              Created {selectedTicket?.createdAt ? formatDate(selectedTicket.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Ticket Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{selectedTicket?.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{selectedTicket?.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <span className="font-medium">{selectedTicket?.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">
                      {selectedTicket?.updatedAt ? formatDate(selectedTicket.updatedAt) : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Support Agent</h3>
                {selectedTicket?.agent ? (
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>{selectedTicket.agent.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedTicket.agent.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedTicket.agent.role}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned yet</p>
                )}
              </div>
            </div>
            
            <div className="md:w-2/3 space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Conversation</h3>
                <div className="border rounded-lg overflow-y-auto max-h-[300px] p-4 space-y-4">
                  {isMessagesLoading ? (
                    <div className="flex justify-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : ticketMessages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No messages yet</p>
                  ) : (
                    ticketMessages.map((message: any, index: number) => (
                      <div key={index} className={`flex gap-3 ${message.isFromSeller ? 'justify-end' : ''}`}>
                        {!message.isFromSeller && (
                          <Avatar>
                            <AvatarFallback>
                              {message.senderName?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[80%] ${message.isFromSeller ? 'bg-primary/10 text-primary-foreground' : 'bg-muted'} p-3 rounded-lg`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">
                              {message.isFromSeller ? 'You' : (message.senderName || 'Support Agent')}
                            </span>
                            <HoverCard>
                              <HoverCardTrigger>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.createdAt), 'h:mm a')}
                                </span>
                              </HoverCardTrigger>
                              <HoverCardContent side="top" className="w-auto p-2">
                                <span className="text-xs">
                                  {formatDate(message.createdAt)}
                                </span>
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                        {message.isFromSeller && (
                          <Avatar>
                            <AvatarFallback>Y</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Textarea 
                  placeholder="Type your message here..." 
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={selectedTicket?.status === 'closed' || selectedTicket?.status === 'resolved'}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {selectedTicket?.status === 'closed' || selectedTicket?.status === 'resolved' 
                      ? 'This ticket is closed and cannot be replied to.' 
                      : 'Press Enter to send, Shift+Enter for new line'}
                  </p>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={
                      addMessageMutation.isPending || 
                      !newMessage.trim() || 
                      selectedTicket?.status === 'closed' || 
                      selectedTicket?.status === 'resolved'
                    }
                  >
                    {addMessageMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
            <DialogDescription>
              Please provide details about your issue so we can assist you better.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input 
                id="subject" 
                value={newTicketForm.subject}
                onChange={(e) => setNewTicketForm({...newTicketForm, subject: e.target.value})}
                placeholder="Brief description of your issue"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category
                </label>
                <Select 
                  value={newTicketForm.category} 
                  onValueChange={(value) => setNewTicketForm({...newTicketForm, category: value})}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Account & Login</SelectItem>
                    <SelectItem value="orders">Orders & Shipping</SelectItem>
                    <SelectItem value="payments">Payments & Settlements</SelectItem>
                    <SelectItem value="returns">Returns & Refunds</SelectItem>
                    <SelectItem value="products">Product Listing</SelectItem>
                    <SelectItem value="technical">Technical Issues</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </label>
                <Select 
                  value={newTicketForm.priority} 
                  onValueChange={(value) => setNewTicketForm({...newTicketForm, priority: value})}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea 
                id="description" 
                rows={5}
                value={newTicketForm.description}
                onChange={(e) => setNewTicketForm({...newTicketForm, description: e.target.value})}
                placeholder="Please provide detailed information about your issue"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewTicketDialog(false)}
              disabled={createTicketMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket}
              disabled={
                createTicketMutation.isPending || 
                !newTicketForm.subject.trim() || 
                !newTicketForm.description.trim()
              }
            >
              {createTicketMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}