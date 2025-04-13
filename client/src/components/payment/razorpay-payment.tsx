import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type RazorpayOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
};

type RazorpayPaymentProps = {
  amount: number;
  shippingDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
  };
  onSuccess?: (orderId: number) => void;
  onError?: (error: string) => void;
};

export default function RazorpayPayment({ 
  amount, 
  shippingDetails, 
  onSuccess, 
  onError 
}: RazorpayPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState<string>('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Load the Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      setScriptLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      toast({
        title: 'Payment Error',
        description: 'Failed to load payment gateway. Please try again later.',
        variant: 'destructive',
      });
    };
    
    document.body.appendChild(script);
    
    // Fetch Razorpay Key
    const fetchRazorpayKey = async () => {
      try {
        const response = await apiRequest('GET', '/api/razorpay/key');
        const data = await response.json();
        setRazorpayKey(data.keyId);
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
        toast({
          title: 'Payment Error',
          description: 'Failed to initialize payment gateway. Please try again later.',
          variant: 'destructive',
        });
      }
    };
    
    fetchRazorpayKey();
    
    return () => {
      // Cleanup
      document.body.removeChild(script);
    };
  }, [toast]);

  const handlePayment = async () => {
    if (!scriptLoaded || !razorpayKey) {
      toast({
        title: 'Payment Error',
        description: 'Payment gateway not loaded. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create a Razorpay order
      const response = await apiRequest('POST', '/api/razorpay/create-order');
      const orderData: RazorpayOrderResponse = await response.json();
      
      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: orderData.amount, // already in paisa
        currency: orderData.currency,
        name: 'Lelekart',
        description: 'Purchase on Lelekart',
        order_id: orderData.orderId,
        handler: function (response) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name: shippingDetails.name,
          email: '', // User's email can be pulled from context if needed
          contact: shippingDetails.phone || '',
        },
        notes: {
          address: `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state}, ${shippingDetails.zipCode}`,
        },
        theme: {
          color: '#2874f0', // Lelekart blue
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        toast({
          title: 'Payment Failed',
          description: response.error.description || 'Your payment was unsuccessful. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        if (onError) onError(response.error.description);
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initiate payment. Please try again later.',
        variant: 'destructive',
      });
      setLoading(false);
      if (onError) onError('Failed to initiate payment');
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;
      
      // Verify payment with backend
      const verifyResponse = await apiRequest('POST', '/api/razorpay/verify-payment', {
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        shippingDetails: shippingDetails,
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        toast({
          title: 'Payment Successful',
          description: 'Your order has been placed successfully!',
        });
        
        // Invalidate cart cache
        queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
        
        // Handle success callback
        if (onSuccess && verifyData.order && verifyData.order.id) {
          onSuccess(verifyData.order.id);
        } else {
          // Fallback navigation if no callback provided
          setLocation('/order-confirmation');
        }
      } else {
        toast({
          title: 'Payment Verification Failed',
          description: 'We received your payment but could not verify it. Our team will contact you.',
          variant: 'destructive',
        });
        
        if (onError) onError('Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Payment Verification Error',
        description: 'We received your payment but there was an issue. Our team will contact you.',
        variant: 'destructive',
      });
      
      if (onError) onError('Payment verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Pay with Razorpay</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Pay securely using Razorpay - India's trusted payment gateway</p>
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium">Amount:</span>
            <span className="ml-2 font-bold">₹{(amount / 100).toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-600">
            Pay using Credit/Debit card, Net Banking, UPI, or Wallets
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePayment} 
          disabled={loading || !scriptLoaded || !razorpayKey}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}