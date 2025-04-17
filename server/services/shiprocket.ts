import axios from 'axios';
import { Order, OrderItem } from '@shared/schema';

// Base URL for Shiprocket API
const SHIPROCKET_API_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// Token cache
let authToken: string | null = null;
let tokenExpiry: Date | null = null;

// Interface for Shiprocket order
interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id: string;
  comment: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount: number;
    tax: number;
    hsn: number;
  }[];
  payment_method: string;
  shipping_charges: number;
  giftwrap_charges: number;
  transaction_charges: number;
  total_discount: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

/**
 * Get authentication token from Shiprocket
 */
async function getAuthToken(): Promise<string> {
  // Check if we have a valid token
  if (authToken && tokenExpiry && tokenExpiry > new Date()) {
    return authToken;
  }

  // If not, get a new token
  try {
    const response = await axios.post(`${SHIPROCKET_API_BASE_URL}/auth/login`, {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });

    authToken = response.data.token;
    // Set token expiry to 9 days (tokens are valid for 10 days)
    tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 9);
    
    return authToken;
  } catch (error) {
    console.error('Error authenticating with Shiprocket:', error);
    throw new Error('Failed to authenticate with Shiprocket');
  }
}

/**
 * Convert our Order to Shiprocket format
 */
function mapOrderToShiprocketPayload(order: Order, orderItems: OrderItem[]): ShiprocketOrderPayload {
  // Parse shipping details if needed
  let shippingDetails: any = {};
  
  if (order.shippingDetails) {
    try {
      if (typeof order.shippingDetails === 'string') {
        shippingDetails = JSON.parse(order.shippingDetails);
      } else {
        shippingDetails = order.shippingDetails;
      }
    } catch (error) {
      console.error('Error parsing shipping details:', error);
    }
  }
  
  // Extract customer details from shipping details
  const fullName = shippingDetails.fullName || 'Customer';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  // Default dimensions and weight if not provided
  const defaultLength = 15; // cm
  const defaultBreadth = 15; // cm
  const defaultHeight = 5; // cm
  const defaultWeight = 0.5; // kg

  // Map payment method
  let paymentMethod = 'COD';
  if (order.paymentMethod === 'PREPAID') {
    paymentMethod = 'Prepaid';
  }

  // Extract order details
  const orderId = order.orderId || order.id.toString();
  const orderDate = order.date ? new Date(order.date) : new Date();
  
  // Create Shiprocket order payload
  const payload: ShiprocketOrderPayload = {
    order_id: orderId,
    order_date: orderDate.toISOString().split('T')[0],
    pickup_location: 'Primary',
    channel_id: '', // Set your channel ID here or fetch from settings
    comment: shippingDetails.notes || 'Order from Lelekart',
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: shippingDetails.address || 'Address not provided',
    billing_address_2: shippingDetails.city || 'City not provided',
    billing_city: shippingDetails.city || 'City not provided',
    billing_pincode: shippingDetails.pincode || '000000',
    billing_state: shippingDetails.state || 'State not provided',
    billing_country: 'India',
    billing_email: shippingDetails.email || 'customer@example.com',
    billing_phone: shippingDetails.phone || '0000000000',
    shipping_is_billing: true, // Assuming shipping address is the same as billing
    order_items: orderItems.map(item => {
      // Get product details from the database or item
      const product = item.product || { name: `Product ${item.productId}` };
      
      return {
        name: product.name || `Product ${item.productId}`,
        sku: item.productId.toString(),
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: 0, // Hardcoded for now, can be added to product details later
      };
    }),
    payment_method: paymentMethod,
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: order.total,
    length: defaultLength,
    breadth: defaultBreadth,
    height: defaultHeight,
    weight: defaultWeight,
  };

  // If shipping address is different
  if (shippingDetails.shippingAddress) {
    payload.shipping_is_billing = false;
    payload.shipping_customer_name = firstName;
    payload.shipping_last_name = lastName;
    payload.shipping_address = shippingDetails.shippingAddress;
    payload.shipping_address_2 = shippingDetails.shippingCity || shippingDetails.city;
    payload.shipping_city = shippingDetails.shippingCity || shippingDetails.city;
    payload.shipping_pincode = shippingDetails.shippingPincode || shippingDetails.pincode;
    payload.shipping_state = shippingDetails.shippingState || shippingDetails.state;
    payload.shipping_country = 'India';
    payload.shipping_email = shippingDetails.email;
    payload.shipping_phone = shippingDetails.phone;
  }

  return payload;
}

/**
 * Create order in Shiprocket
 */
export async function createShiprocketOrder(order: Order, orderItems: OrderItem[]): Promise<any> {
  try {
    const token = await getAuthToken();
    const payload = mapOrderToShiprocketPayload(order, orderItems);

    console.log('Creating order in Shiprocket:', JSON.stringify(payload, null, 2));

    const response = await axios.post(`${SHIPROCKET_API_BASE_URL}/orders/create/adhoc`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Shiprocket order created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating order in Shiprocket:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Shiprocket API error details:', error.response.data);
    }
    throw new Error('Failed to create order in Shiprocket');
  }
}

/**
 * Track order in Shiprocket
 */
export async function trackShiprocketOrder(orderNumber: string): Promise<any> {
  try {
    const token = await getAuthToken();
    
    const response = await axios.get(`${SHIPROCKET_API_BASE_URL}/courier/track/awb/${orderNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error tracking order in Shiprocket:', error);
    throw new Error('Failed to track order in Shiprocket');
  }
}

/**
 * Get shipping rates
 */
export async function getShippingRates(
  pickup_postcode: string,
  delivery_postcode: string,
  weight: number,
  cod: boolean = false
): Promise<any> {
  try {
    const token = await getAuthToken();
    
    const response = await axios.get(
      `${SHIPROCKET_API_BASE_URL}/courier/serviceability`, {
        params: {
          pickup_postcode,
          delivery_postcode,
          weight,
          cod: cod ? 1 : 0
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting shipping rates from Shiprocket:', error);
    throw new Error('Failed to get shipping rates from Shiprocket');
  }
}

/**
 * Generate AWB (tracking number) for an order
 */
export async function generateAWB(
  orderId: string,
  courierCompanyId: number
): Promise<any> {
  try {
    const token = await getAuthToken();
    
    const response = await axios.post(
      `${SHIPROCKET_API_BASE_URL}/courier/assign/awb`, 
      {
        shipment_id: orderId,
        courier_company_id: courierCompanyId
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error generating AWB in Shiprocket:', error);
    throw new Error('Failed to generate AWB in Shiprocket');
  }
}

/**
 * Get order details from Shiprocket
 */
export async function getShiprocketOrderDetails(orderNumber: string): Promise<any> {
  try {
    const token = await getAuthToken();
    
    const response = await axios.get(`${SHIPROCKET_API_BASE_URL}/orders`, {
      params: {
        search: orderNumber
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching order details from Shiprocket:', error);
    throw new Error('Failed to fetch order details from Shiprocket');
  }
}

/**
 * Cancel order in Shiprocket
 */
export async function cancelShiprocketOrder(orderNumber: string): Promise<any> {
  try {
    const token = await getAuthToken();
    
    const response = await axios.post(
      `${SHIPROCKET_API_BASE_URL}/orders/cancel`,
      { ids: [orderNumber] },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error cancelling order in Shiprocket:', error);
    throw new Error('Failed to cancel order in Shiprocket');
  }
}