import { apiService as api } from './api';
import type {
  ShippingAddress,
  ShippingAddressCreate,
  ShippingAddressUpdate,
  ShippingAddressListParams,
  ShippingMethod,
  ShippingMethodCreate,
  ShippingMethodUpdate,
  ShippingCostRule,
  ShippingCostRuleCreate,
  ShippingCostRuleUpdate,
  ProductShippingRule,
  ProductShippingRuleCreate,
  ProductShippingRuleUpdate,
  ShippingCostPreview,
} from '@/types/shipping';

// Shipping Addresses
export const shippingAddressService = {
  // Get all shipping addresses with optional filters
  getAll: async (params?: ShippingAddressListParams): Promise<ShippingAddress[]> => {
    const searchParams = new URLSearchParams();
    
    if (params?.user_id) searchParams.append('user_id', params.user_id.toString());
    if (params?.guest_id) searchParams.append('guest_id', params.guest_id);
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = `/shipping/addresses${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<ShippingAddress[]>(url);
    return response.data;
  },

  // Get shipping address by ID
  getById: async (id: string): Promise<ShippingAddress> => {
    const response = await api.get<ShippingAddress>(`/shipping/addresses/${id}`);
    return response.data;
  },

  // Get shipping addresses for a specific user
  getByUserId: async (userId: number): Promise<ShippingAddress[]> => {
    const response = await api.get<ShippingAddress[]>(`/shipping/addresses/user/${userId}`);
    return response.data;
  },

  // Create new shipping address
  create: async (data: ShippingAddressCreate): Promise<ShippingAddress> => {
    const response = await api.post<ShippingAddress>('/shipping/addresses', data);
    return response.data;
  },

  // Update shipping address
  update: async (id: string, data: ShippingAddressUpdate): Promise<ShippingAddress> => {
    const response = await api.put<ShippingAddress>(`/shipping/addresses/${id}`, data);
    return response.data;
  },

  // Delete shipping address
  delete: async (id: string): Promise<void> => {
    await api.delete(`/shipping/addresses/${id}`);
  },
};

// Shipping Methods
export const shippingMethodService = {
  // Get all shipping methods
  getAll: async (): Promise<ShippingMethod[]> => {
    const response = await api.get<ShippingMethod[]>('/shipping/methods');
    return response.data;
  },

  // Get shipping method by ID
  getById: async (id: number): Promise<ShippingMethod> => {
    const response = await api.get<ShippingMethod>(`/shipping/methods/${id}`);
    return response.data;
  },

  // Create new shipping method
  create: async (data: ShippingMethodCreate): Promise<ShippingMethod> => {
    const response = await api.post<ShippingMethod>('/shipping/methods', data);
    return response.data;
  },

  // Update shipping method
  update: async (id: number, data: ShippingMethodUpdate): Promise<ShippingMethod> => {
    const response = await api.put<ShippingMethod>(`/shipping/methods/${id}`, data);
    return response.data;
  },

  // Delete shipping method
  delete: async (id: number): Promise<void> => {
    await api.delete(`/shipping/methods/${id}`);
  },
};

// Shipping Cost Rules
export const shippingCostRuleService = {
  // Get all cost rules for a shipping method
  getByMethodId: async (methodId: number): Promise<ShippingCostRule[]> => {
    const response = await api.get<ShippingCostRule[]>(`/shipping/methods/${methodId}/cost-rules`);
    return response.data;
  },

  // Create new cost rule for a shipping method
  create: async (methodId: number, data: Omit<ShippingCostRuleCreate, 'shipping_method_id'>): Promise<ShippingCostRule> => {
    const createData: ShippingCostRuleCreate = {
      ...data,
      shipping_method_id: methodId,
    };
    const response = await api.post<ShippingCostRule>(`/shipping/methods/${methodId}/cost-rules`, createData);
    return response.data;
  },

  // Update cost rule
  update: async (ruleId: number, data: ShippingCostRuleUpdate): Promise<ShippingCostRule> => {
    const response = await api.put<ShippingCostRule>(`/shipping/cost-rules/${ruleId}`, data);
    return response.data;
  },

  // Delete cost rule
  delete: async (ruleId: number): Promise<void> => {
    await api.delete(`/shipping/cost-rules/${ruleId}`);
  },
};

// Product Shipping Rules
export const productShippingRuleService = {
  // Get all rules for a product
  getByProductId: async (productId: number): Promise<ProductShippingRule[]> => {
    const response = await api.get<ProductShippingRule[]>(`/shipping/products/${productId}/rules`);
    return response.data;
  },

  // Create new rule for a product
  create: async (productId: number, data: Omit<ProductShippingRuleCreate, 'product_id'>): Promise<ProductShippingRule> => {
    const createData: ProductShippingRuleCreate = { ...data, product_id: productId };
    const response = await api.post<ProductShippingRule>(`/shipping/products/${productId}/rules`, createData);
    return response.data;
  },

  // Update rule
  update: async (ruleId: number, data: ProductShippingRuleUpdate): Promise<ProductShippingRule> => {
    const response = await api.put<ProductShippingRule>(`/shipping/products/rules/${ruleId}`, data);
    return response.data;
  },

  // Delete rule
  delete: async (ruleId: number): Promise<void> => {
    await api.delete(`/shipping/products/rules/${ruleId}`);
  },

  // Get cost preview
  getCostPreview: async (productId: number, methodId: number): Promise<ShippingCostPreview> => {
    const response = await api.get<ShippingCostPreview>(`/shipping/products/${productId}/cost-preview?method_id=${methodId}`);
    return response.data;
  },
};
