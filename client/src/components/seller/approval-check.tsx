import { ReactNode, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

interface ApprovalCheckProps {
  children: ReactNode;
}

interface SellerStatusResponse {
  approved: boolean;
  message: string;
}

export function ApprovalCheck({ children }: ApprovalCheckProps) {
  const { data: statusData, isLoading, error } = useQuery({
    queryKey: ['/api/seller/status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/seller/status');
      return res.json() as Promise<SellerStatusResponse>;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Checking seller account status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            We couldn't check your seller account status. Please try again later or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If seller is approved, show children components
  if (statusData?.approved) {
    return <>{children}</>;
  }

  // Not approved - show pending message
  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
            <h1 className="text-2xl font-bold">Your Seller Account is Pending Approval</h1>
            <p className="text-muted-foreground max-w-lg">
              {statusData?.message || 
               "Your seller account is currently being reviewed by our admin team. This usually takes 1-2 business days. Once approved, you'll be able to list products and manage your seller account."}
            </p>

            <div className="bg-muted rounded-md p-4 w-full mt-4">
              <h3 className="font-medium mb-2">While you wait:</h3>
              <ul className="list-disc pl-6 space-y-2 text-left">
                <li>Make sure your profile information is complete and accurate</li>
                <li>Prepare product images and descriptions</li>
                <li>Review our seller guidelines</li>
                <li>Contact support if your approval is taking longer than expected</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}