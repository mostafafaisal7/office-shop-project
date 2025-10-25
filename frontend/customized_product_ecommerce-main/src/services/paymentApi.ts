/**
 * Payment API Service
 *
 * Refactored to use BaseApiClient for consistency.
 * Maintains 100% backward compatibility.
 */

import { BaseApiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api';

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

class PaymentApiService extends BaseApiClient {
  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    try {
      const response = await this.get(
        API_ENDPOINTS.PAYMENT.METHODS,
        undefined,
        { requiresAuth: false }
      );

      return {
        success: response.success,
        data: response.data || [],
        message: response.message || 'Payment methods retrieved successfully',
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
