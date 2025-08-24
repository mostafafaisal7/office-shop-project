const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://localhost:8000' // Server-side
  : '/api'; // Client-side (uses proxy)

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'card' | 'paypal' | 'cod';
  is_active: boolean;
  description?: string;
  icon?: string;
}

export interface PaymentMethodsResponse {
  success: boolean;
  data: PaymentMethod[];
  message?: string;
}

class PaymentApiService {
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/methods`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payment methods');
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Payment methods retrieved successfully',
      };
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch payment methods',
      };
    }
  }
}

export const paymentApi = new PaymentApiService();
