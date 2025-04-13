import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type Seller = {
  id: number;
  username: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  approved: boolean;
};

export default function SellerApprovalPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('pending');

  // Fetch pending sellers
  const {
    data: pendingSellers,
    isLoading: isPendingLoading,
    error: pendingError
  } = useQuery({
    queryKey: ['/api/sellers/pending'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/sellers/pending');
      return res.json() as Promise<Seller[]>;
    },
    enabled: activeTab === 'pending'
  });

  // Fetch approved sellers
  const {
    data: approvedSellers,
    isLoading: isApprovedLoading,
    error: approvedError
  } = useQuery({
    queryKey: ['/api/sellers/approved'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/sellers/approved');
      return res.json() as Promise<Seller[]>;
    },
    enabled: activeTab === 'approved'
  });

  // Mutation for approving seller
  const approveMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      const res = await apiRequest('PUT', `/api/sellers/${sellerId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Seller has been approved successfully.',
        variant: 'default',
      });
      
      // Invalidate both seller queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/sellers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sellers/approved'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to approve seller: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation for rejecting seller
  const rejectMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      const res = await apiRequest('PUT', `/api/sellers/${sellerId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Seller approval has been revoked.',
        variant: 'default',
      });
      
      // Invalidate both seller queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/sellers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sellers/approved'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to reject seller: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle approve seller
  const handleApproveSeller = (sellerId: number) => {
    approveMutation.mutate(sellerId);
  };

  // Handle reject seller
  const handleRejectSeller = (sellerId: number) => {
    rejectMutation.mutate(sellerId);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Seller Approval</h1>
        </div>

        <Tabs defaultValue="pending" onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending Approval
              {pendingSellers && pendingSellers.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingSellers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved Sellers</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isPendingLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingError ? (
              <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                Error loading pending sellers: {pendingError instanceof Error ? pendingError.message : 'Unknown error'}
              </div>
            ) : pendingSellers && pendingSellers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingSellers.map((seller) => (
                  <SellerCard 
                    key={seller.id} 
                    seller={seller} 
                    onApprove={handleApproveSeller}
                    onReject={handleRejectSeller}
                    isApproving={approveMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-muted/20 rounded-lg">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No pending seller approvals</h3>
                <p className="text-muted-foreground">All sellers have been reviewed!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {isApprovedLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : approvedError ? (
              <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                Error loading approved sellers: {approvedError instanceof Error ? approvedError.message : 'Unknown error'}
              </div>
            ) : approvedSellers && approvedSellers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedSellers.map((seller) => (
                  <SellerCard 
                    key={seller.id} 
                    seller={seller} 
                    onApprove={handleApproveSeller}
                    onReject={handleRejectSeller}
                    isApproving={approveMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                    approved={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-muted/20 rounded-lg">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No approved sellers yet</h3>
                <p className="text-muted-foreground">Approve some sellers to see them here!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

type SellerCardProps = {
  seller: Seller;
  onApprove: (sellerId: number) => void;
  onReject: (sellerId: number) => void;
  isApproving: boolean;
  isRejecting: boolean;
  approved?: boolean;
};

function SellerCard({ seller, onApprove, onReject, isApproving, isRejecting, approved = false }: SellerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {seller.username}
          {approved && (
            <Badge className="ml-2 bg-green-500 hover:bg-green-600">Approved</Badge>
          )}
        </CardTitle>
        <CardDescription>{seller.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <span className="font-semibold">Name:</span> {seller.name || 'Not provided'}
          </div>
          <div>
            <span className="font-semibold">Phone:</span> {seller.phone || 'Not provided'}
          </div>
          <div>
            <span className="font-semibold">Address:</span> {seller.address || 'Not provided'}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        {approved ? (
          <Button 
            variant="destructive" 
            onClick={() => onReject(seller.id)}
            disabled={isRejecting}
          >
            {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            Revoke Approval
          </Button>
        ) : (
          <>
            <Button 
              variant="default" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onApprove(seller.id)}
              disabled={isApproving}
            >
              {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Approve
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onReject(seller.id)}
              disabled={isRejecting}
            >
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}