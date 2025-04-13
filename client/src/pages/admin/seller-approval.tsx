import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CheckCircle, XCircle, User, Mail, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  const [selectedTab, setSelectedTab] = useState('pending');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sellers, isLoading } = useQuery<Seller[]>({
    queryKey: ['/api/admin/sellers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/sellers');
      return res.json();
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      const res = await apiRequest('POST', `/api/admin/sellers/${sellerId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sellers'] });
      toast({
        title: 'Seller approved',
        description: 'The seller has been approved successfully',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to approve seller',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      const res = await apiRequest('POST', `/api/admin/sellers/${sellerId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sellers'] });
      toast({
        title: 'Seller rejected',
        description: 'The seller has been rejected',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to reject seller',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  });

  const pendingSellers = sellers?.filter(seller => !seller.approved) || [];
  const approvedSellers = sellers?.filter(seller => seller.approved) || [];

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Seller Approval</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              {pendingSellers.length} Pending
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
              {approvedSellers.length} Approved
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="pending" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending Approval</TabsTrigger>
            <TabsTrigger value="approved">Approved Sellers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingSellers.length === 0 ? (
              <div className="bg-muted rounded-lg p-8 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No pending sellers</h3>
                <p className="text-muted-foreground mt-1">
                  All sellers have been reviewed. Check the approved tab to see approved sellers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingSellers.map(seller => (
                  <SellerCard 
                    key={seller.id} 
                    seller={seller} 
                    onApprove={() => approveMutation.mutate(seller.id)}
                    onReject={() => rejectMutation.mutate(seller.id)}
                    isApproving={approveMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approved" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : approvedSellers.length === 0 ? (
              <div className="bg-muted rounded-lg p-8 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No approved sellers</h3>
                <p className="text-muted-foreground mt-1">
                  Once you approve sellers, they will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {approvedSellers.map(seller => (
                  <SellerCard 
                    key={seller.id} 
                    seller={seller} 
                    onApprove={() => {}}
                    onReject={() => rejectMutation.mutate(seller.id)}
                    isApproving={false}
                    isRejecting={rejectMutation.isPending}
                    approved={true}
                  />
                ))}
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
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/10 rounded-full p-3">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{seller.name || seller.username}</h3>
                <p className="text-sm text-muted-foreground">Seller ID: #{seller.id}</p>
              </div>
              {approved && (
                <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">
                  Approved
                </Badge>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{seller.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{seller.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 md:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{seller.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {!approved ? (
            <div className="flex flex-col gap-3 justify-center">
              <Button 
                onClick={() => onApprove(seller.id)} 
                className="flex gap-2 items-center w-40"
                disabled={isApproving || isRejecting}
              >
                {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Approve
              </Button>
              <Button 
                onClick={() => onReject(seller.id)} 
                variant="outline" 
                className="flex gap-2 items-center text-red-600 border-red-200 hover:bg-red-50 w-40"
                disabled={isApproving || isRejecting}
              >
                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 justify-center">
              <Button 
                onClick={() => onReject(seller.id)} 
                variant="outline" 
                className="flex gap-2 items-center text-red-600 border-red-200 hover:bg-red-50 w-40"
                disabled={isRejecting}
              >
                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Revoke Access
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}