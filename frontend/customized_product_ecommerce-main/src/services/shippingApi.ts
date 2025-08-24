import { getValidToken } from '@/store/authStore';

const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://localhost:8000' // Server-side
  : '/api'; // Client-side (uses proxy)

export interface ShippingAddress {
  user_id: number;
  guest_id: null;
  full_name: string;
  phone: string;
  email: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  description: string;
  cost: number;
  base_cost?: number; // Keep for backward compatibility
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingCostCalculation {
  shipping_method_id: number;
  base_cost: number;
  total_quantity: number;
  applied_rules: {
    rule_id: number;
    min_quantity: number;
    max_quantity: number;
    cost_adjustment: number;
    adjustment_type: string;
    applicable_quantity: number;
    total_adjustment: number;
  }[];
  final_cost: number;
  delivery_days: number;
}

export interface ProductShippingCostCalculation {
  shipping_method_id: number;
  total_cost: number;
  product_breakdown: {
    product_id: number;
    quantity: number;
    base_cost: number;
    applied_rules: any[];
    final_cost: number;
    rule_source: string;
  }[];
  delivery_days: number;
}

export interface ShippingCostPreview {
  shipping_method_id: number;
  cost_ranges: {
    min_quantity: number;
    max_quantity: number | null;
    cost_per_item: number;
    total_cost_example: number;
  }[];
}

export interface ShippingProductCostRequest {
  shipping_method_id: number;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export interface ShippingApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const shippingApi = {
  async createShippingAddress(shippingData: ShippingAddress): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      const response = await fetch(`${API_BASE_URL}/shipping/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(shippingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: data.message || 'Shipping address saved successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error creating shipping address:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save shipping address',
      };
    }
  },

  async getUserShippingAddresses(userId: number): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      const response = await fetch(`${API_BASE_URL}/shipping/addresses/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: 'Shipping addresses retrieved successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error fetching shipping addresses:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch shipping addresses',
      };
    }
  },

  async getShippingMethods(): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      const response = await fetch(`${API_BASE_URL}/shipping/methods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: 'Shipping methods retrieved successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch shipping methods',
      };
    }
  },

  async getShippingMethod(methodId: number): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      const response = await fetch(`${API_BASE_URL}/shipping/methods/${methodId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: 'Shipping method retrieved successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error fetching shipping method:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch shipping method',
      };
    }
  },

  /**
   * @deprecated Use calculateProductShippingCost instead. This endpoint is deprecated.
   */
  async calculateShippingCost(shippingMethodId: number, totalQuantity: number): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      const response = await fetch(`${API_BASE_URL}/shipping/calculate-cost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          shipping_method_id: shippingMethodId,
          total_quantity: totalQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: 'Shipping cost calculated successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to calculate shipping cost',
      };
    }
  },

  async calculateProductShippingCost(request: ShippingProductCostRequest): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      const response = await fetch(`${API_BASE_URL}/shipping/calculate-product-cost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: 'Product shipping cost calculated successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error calculating product shipping cost:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to calculate product shipping cost',
      };
    }
  },

  async getShippingCostPreview(methodId: number): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      const response = await fetch(`${API_BASE_URL}/shipping/methods/${methodId}/cost-preview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: 'Shipping cost preview retrieved successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error fetching shipping cost preview:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch shipping cost preview',
      };
    }
  },

  async updateShippingAddress(addressId: string, shippingData: Partial<ShippingAddress>): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      const response = await fetch(`${API_BASE_URL}/shipping/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(shippingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: data.message || 'Shipping address updated successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error updating shipping address:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update shipping address',
      };
    }
  },

  async deleteShippingAddress(addressId: string): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      const response = await fetch(`${API_BASE_URL}/shipping/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: 'Shipping address deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting shipping address:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete shipping address',
      };
    }
  },

  async getShippingAddress(addressId: string): Promise<ShippingApiResponse> {
    try {
      const token = await getValidToken();
      
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      const response = await fetch(`${API_BASE_URL}/shipping/addresses/${addressId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: 'Shipping address retrieved successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error fetching shipping address:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch shipping address',
      };
    }
  },
};
