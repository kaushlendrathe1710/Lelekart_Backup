import crypto from 'crypto';

// Constants
const KEY_ID = process.env.RAZORPAY_KEY_ID || null;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || null;

const isRazorpayConfigured = KEY_ID && KEY_SECRET;
if (!isRazorpayConfigured) {
  console.warn("Warning: Razorpay credentials missing. Payment features will be disabled.");
}
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

/**
 * Get Razorpay Key ID for client-side usage
 * @returns Razorpay Key ID
 */
export function getRazorpayKeyId(): string {
  return KEY_ID;
}

/**
 * Generate a receipt ID for Razorpay order
 */
export function generateReceiptId(): string {
  return `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Create a Razorpay order
 * @param amount Amount in paisa (smallest currency unit)
 * @param receipt Receipt ID for the order
 * @param notes Optional notes for the order
 */
export async function createRazorpayOrder(amount: number, receipt: string, notes?: Record<string, string>): Promise<any> {
  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: notes || {},
        payment_capture: 1, // Auto capture payment
      })
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', requestOptions);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Razorpay order creation failed: ${JSON.stringify(error)}`);
    }
    
    return await response.json();
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
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
}

/**
 * Get payment details from Razorpay
 * @param paymentId Razorpay payment ID
 */
export async function getPaymentDetails(paymentId: string): Promise<any> {
  try {
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`
      }
    };

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, requestOptions);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch payment details: ${JSON.stringify(error)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting payment details:', error);
    throw error;
  }
}

/**
 * Capture a payment (if not auto-captured)
 * @param paymentId Razorpay payment ID
 * @param amount Amount to capture in paisa
 */
export async function capturePayment(paymentId: string, amount: number): Promise<any> {
  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({ amount, currency: 'INR' })
    };

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, requestOptions);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Payment capture failed: ${JSON.stringify(error)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error capturing payment:', error);
    throw error;
  }
}

/**
 * Handle a successful Razorpay payment
 * @param paymentId Razorpay payment ID
 * @param orderId Razorpay order ID
 * @param signature Razorpay signature
 */
export async function handleSuccessfulPayment(paymentId: string, orderId: string, signature: string): Promise<{success: boolean, payment?: any, error?: string}> {
  try {
    // Verify the payment signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!isValid) {
      return { 
        success: false, 
        error: 'Invalid payment signature' 
      };
    }
    
    // Get payment details
    const paymentDetails = await getPaymentDetails(paymentId);
    
    return {
      success: true,
      payment: paymentDetails
    };
  } catch (error) {
    console.error('Error handling successful payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing payment'
    };
  }
}