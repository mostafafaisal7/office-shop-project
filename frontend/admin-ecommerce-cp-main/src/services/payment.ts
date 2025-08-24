import { apiService as api } from './api';
import type {
  PaymentMethod,
  PaymentMethodCreate,
  PaymentMethodUpdate,
  PaymentMethodListParams,
} from '@/types/payment';

// Payment Methods
export const paymentMethodService = {
  // Get all payment methods with optional filters
  getAll: async (params?: PaymentMethodListParams): Promise<PaymentMethod[]> => {
    const searchParams = new URLSearchParams();
    
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.type) searchParams.append('type', params.type);

    const queryString = searchParams.toString();
    const url = `/payment/methods${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<PaymentMethod[]>(url);
    return response.data;
  },

  // Get payment method by ID
  getById: async (id: number): Promise<PaymentMethod> => {
    const response = await api.get<PaymentMethod>(`/payment/methods/${id}`);
    return response.data;
  },

  // Create new payment method
  create: async (data: PaymentMethodCreate): Promise<PaymentMethod> => {
    const response = await api.post<PaymentMethod>('/payment/methods', data);
    return response.data;
  },

  // Update payment method
  update: async (id: number, data: PaymentMethodUpdate): Promise<PaymentMethod> => {
    const response = await api.put<PaymentMethod>(`/payment/methods/${id}`, data);
    return response.data;
  },

  // Delete payment method
  delete: async (id: number): Promise<void> => {
    await api.delete(`/payment/methods/${id}`);
  },
};
