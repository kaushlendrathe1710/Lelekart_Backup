import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";

export default function TicketManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState("");
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["/api/support/tickets"],
    queryFn: async () => {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return res.json();
    },
  });

  // Fetch messages for selected ticket
  const { data: messages = [], isLoading: isMessagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/support/tickets", selectedTicket?.id, "messages"],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`);
      if (!res.ok) throw new Error("Failed to fetch ticket messages");
      return res.json();
    },
    enabled: !!selectedTicket,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      setStatusUpdating(true);
      setStatusError("");
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setStatusUpdating(false);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatusError(err?.error || "Failed to update status");
        throw new Error(err?.error || "Failed to update status");
      }
      setStatusError("");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      refetchMessages();
    },
  });

  // Add mutation for deleting a ticket
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete ticket');
      }
    },
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      if (selectedTicket?.id === ticketId) {
        setShowDialog(false);
        setSelectedTicket(null);
      }
      // Optionally show a toast (if you have a toast system)
      // toast({ title: 'Ticket Deleted', description: 'The support ticket has been deleted successfully.' });
    },
    onError: () => {
      // Optionally show a toast (if you have a toast system)
      // toast({ title: 'Failed to Delete Ticket', description: 'There was an error deleting the ticket. Please try again.', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!showDialog) {
      setSelectedTicket(null);
      setNewMessage("");
      setStatusError("");
    }
  }, [showDialog]);

  const filteredTickets = tickets.filter((t: any) => {
    const matchesSearch =
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.id?.toString().includes(search) ||
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <AdminLayout>
      <Card className="mt-8 mx-auto max-w-6xl">
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by subject, ID, user, or category"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64"
            />
            <label htmlFor="status-filter" className="sr-only">Status Filter</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8}>Loading...</TableCell></TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow><TableCell colSpan={8}>No tickets found</TableCell></TableRow>
              ) : (
                filteredTickets.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.id}</TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>{ticket.userName ? `${ticket.userName} (${ticket.userEmail})` : ticket.userEmail}</TableCell>
                    <TableCell><Badge variant={ticket.status === 'open' ? 'default' : ticket.status === 'in_progress' ? 'secondary' : ticket.status === 'resolved' ? 'outline' : 'destructive'}>{ticket.status}</Badge></TableCell>
                    <TableCell><Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'outline'}>{ticket.priority}</Badge></TableCell>
                    <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => { setSelectedTicket(ticket); setShowDialog(true); }}>View</Button>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteTicketMutation.mutate(ticket.id); }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Ticket #{selectedTicket?.id} - {selectedTicket?.subject}</DialogTitle>
              </DialogHeader>
              {selectedTicket && (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Ticket Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium">{selectedTicket.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium">{selectedTicket.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Priority:</span>
                          <span className="font-medium">{selectedTicket.priority}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Updated:</span>
                          <span className="font-medium">{selectedTicket.updatedAt ? new Date(selectedTicket.updatedAt).toLocaleString() : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Change Status</h3>
                      <label htmlFor="admin-status-select" className="sr-only">Change Status</label>
                      <select
                        id="admin-status-select"
                        value={selectedTicket.status}
                        onChange={e => updateStatusMutation.mutate(e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        disabled={statusUpdating}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {statusUpdating && <div className="text-xs text-blue-600 mt-1 flex items-center"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Updating status...</div>}
                      {statusError && <div className="text-xs text-red-600 mt-1">{statusError}</div>}
                    </div>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Conversation</h3>
                      <div className="border rounded-lg overflow-y-auto max-h-[300px] p-4 space-y-4">
                        {isMessagesLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : messages.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">No messages yet</p>
                        ) : (
                          messages.map((message: any, index: number) => (
                            <div key={index} className={`flex gap-3 ${message.isFromSeller ? 'justify-end' : ''}`}>
                              {!message.isFromSeller && (
                                <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-600">A</div>
                              )}
                              <div className={`max-w-[80%] ${message.isFromSeller ? 'bg-primary/10 text-primary-foreground' : 'bg-muted'} p-3 rounded-lg`}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">
                                    {message.isFromSeller ? 'User' : 'Admin'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(message.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                              </div>
                              {message.isFromSeller && (
                                <div className="bg-blue-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-blue-600">U</div>
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
                        onChange={e => setNewMessage(e.target.value)}
                        disabled={selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' || sendMessageMutation.isPending}
                      />
                      <div className="flex justify-between">
                        <p className="text-xs text-muted-foreground">
                          {selectedTicket.status === 'closed' || selectedTicket.status === 'resolved'
                            ? 'This ticket is closed and cannot be replied to.'
                            : 'Press Enter to send, Shift+Enter for new line'}
                        </p>
                        <Button
                          onClick={() => sendMessageMutation.mutate(newMessage)}
                          disabled={
                            sendMessageMutation.isPending ||
                            !newMessage.trim() ||
                            selectedTicket.status === 'closed' ||
                            selectedTicket.status === 'resolved'
                          }
                        >
                          {sendMessageMutation.isPending ? (
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
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </AdminLayout>
  );
} 