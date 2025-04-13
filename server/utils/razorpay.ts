import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with the API keys
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

/**
 * Create a Razorpay order
 * @param amount Amount in lowest currency unit (paise for INR)
 * @param receiptId Receipt ID for the order
 * @param notes Any additional notes for the order
 * @returns Razorpay order object
 */
export async function createOrder(amount: number, receiptId: string, notes: Record<string, any> = {}) {
  try {
    const options = {
      amount, // Amount in smallest currency unit (paise for INR)
      currency: "INR",
      receipt: receiptId,
      notes
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Verify Razorpay payment signature
 * @param orderId Razorpay order ID
 * @param paymentId Razorpay payment ID
 * @param signature Razorpay signature
 * @returns Boolean indicating whether the signature is valid
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Process payment and verify payment signature
 * @param paymentDetails The payment details from Razorpay
 * @returns Boolean indicating whether the payment was successful
 */
export async function processPayment(paymentDetails: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { orderId, paymentId, signature } = paymentDetails;
  
  // Step 1: Verify the payment signature
  const isValid = verifyPaymentSignature(orderId, paymentId, signature);
  
  if (!isValid) {
    throw new Error('Invalid payment signature');
  }
  
  // Step 2: Fetch payment details from Razorpay (optional, for additional verification)
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    
    // Verify payment status and other attributes if needed
    if (payment.status !== 'captured') {
      throw new Error(`Payment not captured. Status: ${payment.status}`);
    }
    
    return {
      success: true,
      payment
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}

/**
 * Get Razorpay public key (to be used in the frontend)
 * @returns Razorpay Key ID
 */
export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID!;
}