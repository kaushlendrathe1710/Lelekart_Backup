import axios from 'axios';

export interface ShiprocketSettings {
  email: string;
  password: string;
  token?: string;
  tokenExpiry?: Date;
}

interface CreateOrderRequest {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;
  billing_email: string;
  billing_phone: string;
  shipping_customer_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_pincode: string;
  shipping_email: string;
  shipping_phone: string;
  order_items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
  }[];
  payment_method: 'COD' | 'Prepaid';
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

interface CreateOrderResponse {
  order_id: number;
  shipment_id: number;
}

interface ShippingRateRequest {
  pickup_postcode: string;
  delivery_postcode: string;
  weight: number;
  cod?: boolean;
}

export class ShiprocketService {
  private readonly baseUrl = 'https://apiv2.shiprocket.in/v1/external';
  public token: string | null = null;
  public tokenExpiry: Date | null = null;
  
  constructor(private email: string, private password: string) {}
  
  /**
   * Authenticate with Shiprocket and get access token
   */
  async authenticate(): Promise<string> {
    try {
      // Check if token exists and is still valid
      if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.token;
      }
      
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: this.email,
        password: this.password
      });
      
      this.token = response.data.token;
      
      // Set token expiry (token is valid for 24 hours)
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 23); // Set to 23 hours to be safe
      this.tokenExpiry = expiryDate;
      
      return this.token;
    } catch (error) {
      console.error('Shiprocket authentication failed:', error);
      throw new Error('Failed to authenticate with Shiprocket');
    }
  }
  
  /**
   * Get authorization headers with token
   */
  private async getHeaders() {
    const token = await this.authenticate();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Create a new order on Shiprocket
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.post(`${this.baseUrl}/orders/create/adhoc`, orderData, { headers });
      
      return {
        order_id: response.data.order_id,
        shipment_id: response.data.shipment_id
      };
    } catch (error) {
      console.error('Error creating Shiprocket order:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Cancel an order on Shiprocket
   */
  async cancelOrder(orderId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      
      await axios.post(`${this.baseUrl}/orders/cancel`, 
        { ids: [orderId] }, 
        { headers }
      );
    } catch (error) {
      console.error('Error cancelling Shiprocket order:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Track a shipment using tracking ID
   */
  async trackShipment(trackingId: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(`${this.baseUrl}/courier/track/awb/${trackingId}`, { headers });
      
      return response.data.tracking_data;
    } catch (error) {
      console.error('Error tracking Shiprocket shipment:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Generate shipping label for shipment
   */
  async generateLabel(shipmentId: string): Promise<{ label_url: string }> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.post(`${this.baseUrl}/courier/generate/label`, 
        { shipment_id: [shipmentId] }, 
        { headers }
      );
      
      if (!response.data.label_url) {
        throw new Error('Failed to generate label: No label URL returned');
      }
      
      return { label_url: response.data.label_url };
    } catch (error) {
      console.error('Error generating Shiprocket label:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Get list of courier companies
   */
  async getCourierCompanies(): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(`${this.baseUrl}/courier/courier-companies`, { headers });
      
      return response.data.courier_companies || [];
    } catch (error) {
      console.error('Error fetching courier companies:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Get shipping rates
   */
  async getShippingRates(params: ShippingRateRequest): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(`${this.baseUrl}/courier/serviceability`, {
        headers,
        params: {
          pickup_postcode: params.pickup_postcode,
          delivery_postcode: params.delivery_postcode,
          weight: params.weight,
          cod: params.cod ? 1 : 0
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching shipping rates:', error.response?.data || error.message);
      throw error;
    }
  }
}