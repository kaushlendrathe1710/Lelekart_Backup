import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Helper function to get initials from name
function getInitials(name: string): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export default function AdminSellerApproval() {
  const [pendingSellers, setPendingSellers] = useState<User[]>([]);
  const [approvedSellers, setApprovedSellers] = useState<User[]>([]);
  const [rejectedSellers, setRejectedSellers] = useState<User[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        // Fetch the sellers for approval directly - authorization is handled by middleware
        const response = await fetch("/api/admin/sellers", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in as an admin to access this page.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (response.status === 403) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch seller data");
        }
        
        const data = await response.json();
        console.log("Fetched sellers data:", data);
        
        if (!Array.isArray(data)) {
          console.error("Expected array of sellers but got:", data);
          throw new Error("Invalid data format received from server");
        }
        
        // Separate sellers by approval status
        setPendingSellers(data.filter((seller: User) => 
          seller.approvalStatus === "pending" || !seller.approvalStatus
        ));
        
        setApprovedSellers(data.filter((seller: User) => 
          seller.approvalStatus === "approved"
        ));
        
        setRejectedSellers(data.filter((seller: User) => 
          seller.approvalStatus === "rejected"
        ));
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sellers:", error);
        toast({
          title: "Error fetching sellers",
          description: "There was a problem loading the seller data. Please make sure you're logged in as an admin.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    fetchSellers();
  }, [toast]);
  
  const handleApproveSeller = async (sellerId: number) => {
    setIsApproving(true);
    try {
      const response = await apiRequest("POST", `/api/admin/sellers/${sellerId}/approve`);
      
      if (!response.ok) {
        throw new Error("Failed to approve seller");
      }
      
      // Update the local state
      const updatedSeller = await response.json();
      
      // Remove from pending and add to approved
      setPendingSellers(prev => prev.filter(seller => seller.id !== sellerId));
      setApprovedSellers(prev => [...prev, updatedSeller]);
      
      // If this was the selected seller, update it
      if (selectedSeller && selectedSeller.id === sellerId) {
        setSelectedSeller(updatedSeller);
      }
      
      toast({
        title: "Seller approved",
        description: "The seller has been approved and can now list products in the store.",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      
    } catch (error) {
      console.error("Error approving seller:", error);
      toast({
        title: "Error approving seller",
        description: "There was a problem approving the seller.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleRejectSeller = async (sellerId: number) => {
    setIsRejecting(true);
    try {
      const response = await apiRequest("POST", `/api/admin/sellers/${sellerId}/reject`);
      
      if (!response.ok) {
        throw new Error("Failed to reject seller");
      }
      
      // Update the local state
      const updatedSeller = await response.json();
      
      // Remove from pending and add to rejected
      setPendingSellers(prev => prev.filter(seller => seller.id !== sellerId));
      setRejectedSellers(prev => [...prev, updatedSeller]);
      
      // If this was the selected seller, update it
      if (selectedSeller && selectedSeller.id === sellerId) {
        setSelectedSeller(updatedSeller);
      }
      
      toast({
        title: "Seller rejected",
        description: "The seller has been rejected and will not be able to list products in the store.",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      
    } catch (error) {
      console.error("Error rejecting seller:", error);
      toast({
        title: "Error rejecting seller",
        description: "There was a problem rejecting the seller.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };
  
  const openSellerDetails = (seller: User) => {
    setSelectedSeller(seller);
    setDetailsOpen(true);
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Seller Approval</h1>
            <p className="text-muted-foreground">Manage and approve sellers before they can list products</p>
          </div>
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="relative">
              Pending Approval
              {pendingSellers.length > 0 && (
                <Badge className="ml-2 bg-orange-500" variant="outline">
                  {pendingSellers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved Sellers
              {approvedSellers.length > 0 && (
                <Badge className="ml-2 bg-green-500" variant="outline">
                  {approvedSellers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected Sellers
              {rejectedSellers.length > 0 && (
                <Badge className="ml-2 bg-red-500" variant="outline">
                  {rejectedSellers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {pendingSellers.length === 0 ? (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No pending seller approvals</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All sellers have been reviewed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Seller Approvals</CardTitle>
                  <CardDescription>
                    Review and approve sellers before they can list products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seller</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSellers.map((seller) => (
                        <TableRow key={seller.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(seller.name || seller.username)}</AvatarFallback>
                              </Avatar>
                              <span>{seller.name || seller.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>{seller.email}</TableCell>
                          <TableCell>{seller.phone || "—"}</TableCell>
                          <TableCell>
                            <Badge className="bg-orange-500">Pending</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openSellerDetails(seller)}
                              >
                                Details
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveSeller(seller.id)}
                                disabled={isApproving}
                              >
                                {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                Approve
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRejectSeller(seller.id)}
                                disabled={isRejecting}
                              >
                                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="approved">
            {approvedSellers.length === 0 ? (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No approved sellers yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sellers that are approved will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Approved Sellers</CardTitle>
                  <CardDescription>
                    All sellers that have been approved and can list products in the store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seller</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedSellers.map((seller) => (
                        <TableRow key={seller.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(seller.name || seller.username)}</AvatarFallback>
                              </Avatar>
                              <span>{seller.name || seller.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>{seller.email}</TableCell>
                          <TableCell>{seller.phone || "—"}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">Approved</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openSellerDetails(seller)}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRejectSeller(seller.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="rejected">
            {rejectedSellers.length === 0 ? (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No rejected sellers</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sellers that are rejected will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Rejected Sellers</CardTitle>
                  <CardDescription>
                    All sellers that have been rejected and cannot list products in the store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seller</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedSellers.map((seller) => (
                        <TableRow key={seller.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(seller.name || seller.username)}</AvatarFallback>
                              </Avatar>
                              <span>{seller.name || seller.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>{seller.email}</TableCell>
                          <TableCell>{seller.phone || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">Rejected</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openSellerDetails(seller)}
                              >
                                Details
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveSeller(seller.id)}
                              >
                                Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Seller Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Seller Details</DialogTitle>
              <DialogDescription>
                Detailed information about the seller
              </DialogDescription>
            </DialogHeader>
            
            {selectedSeller && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedSeller.name || selectedSeller.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedSeller.name || selectedSeller.username}</h3>
                    <div className="mt-1">
                      {selectedSeller.approvalStatus === "pending" || !selectedSeller.approvalStatus ? (
                        <Badge className="bg-orange-500">Pending Approval</Badge>
                      ) : selectedSeller.approvalStatus === "approved" ? (
                        <Badge className="bg-green-500">Approved</Badge>
                      ) : (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Username</div>
                    <div>{selectedSeller.username}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Email</div>
                    <div>{selectedSeller.email}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Phone</div>
                    <div>{selectedSeller.phone || "—"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Role</div>
                    <div className="capitalize">{selectedSeller.role}</div>
                  </div>
                </div>
                
                {selectedSeller.address && (
                  <div className="text-sm">
                    <div className="font-medium text-muted-foreground">Address</div>
                    <div className="whitespace-pre-line">{selectedSeller.address}</div>
                  </div>
                )}
                
                <div className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <p className="text-sm">
                      {selectedSeller.approvalStatus === "pending" || !selectedSeller.approvalStatus
                        ? "This seller is awaiting approval. They cannot list products until approved."
                        : selectedSeller.approvalStatus === "approved"
                          ? "This seller has been approved and can list products in the store."
                          : "This seller has been rejected and cannot list products in the store."}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedSeller && (selectedSeller.approvalStatus === "pending" || !selectedSeller.approvalStatus) && (
                <>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveSeller(selectedSeller.id)}
                    disabled={isApproving}
                  >
                    {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Approve Seller
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleRejectSeller(selectedSeller.id)}
                    disabled={isRejecting}
                  >
                    {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Reject Seller
                  </Button>
                </>
              )}
              
              {selectedSeller && selectedSeller.approvalStatus === "approved" && (
                <Button 
                  variant="destructive"
                  onClick={() => handleRejectSeller(selectedSeller.id)}
                  disabled={isRejecting}
                >
                  {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject Seller
                </Button>
              )}
              
              {selectedSeller && selectedSeller.approvalStatus === "rejected" && (
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveSeller(selectedSeller.id)}
                  disabled={isApproving}
                >
                  {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve Seller
                </Button>
              )}
              
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}