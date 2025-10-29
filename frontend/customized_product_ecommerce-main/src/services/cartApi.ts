// Helper function to get customer token
const getCustomerToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Check both possible token keys (customer_access_token and accessToken)
  return localStorage.getItem('customer_access_token') || localStorage.getItem('accessToken');
};

export interface CartApiItem {
  id?: number;
  product_id: number;
  user_id?: number;
  product_name: string;
  product_price: number | string; // Allow both number and string from backend
  quantity: number;
  size?: string;
  color?: string;
  customization_id?: number;
  customized_images?: string[] | null; // Add support for preview image URLs

  // Design data (snapshot from design time - just like customized_images)
  design_canvas_data?: any;
  design_svg_data?: string;
  design_elements?: any[];
}

export interface CartApiItemWithCustomizations {
  id: number;
  user_id: number;
  guest_id?: string;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  size?: string;
  color?: string;
  customization_id?: number;
  customization_details?: {
    client_reference_id: string;
    user_id: number;
    product_id: number;
    variation_id: number;
    design_area: string;
    canvas_data: {
      version: string;
      objects: any[];
      background?: string;
      backgroundImage?: any;
    };
    design_metadata: {
      canvas_width: number;
      canvas_height: number;
      product_image_url: string;
      created_at?: string;
      updated_at?: string;
      design_name: string;
      is_completed: boolean;
    };
    design_elements: any[];
    id: number;
    created_at: string;
    updated_at: string;
    media: any[];
  };
}

export interface CartApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://localhost:8000' 
  : 'http://localhost:8000';

class CartApiService {
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CartApiResponse> {
    const startTime = performance.now();
    try {
      const token = getCustomerToken();

      // If no token available, return early for cart operations
      if (!token) {
        console.log('Cart API: No authentication token available');
        return {
          success: false,
          message: 'No authentication token available',
        };
      }

      console.log('Cart API: Making request to:', `${API_BASE_URL}${endpoint}`);
      console.log('Cart API: Request started at:', new Date().toISOString());

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      const fetchTime = performance.now() - startTime;
      console.log(`Cart API: Fetch completed in ${fetchTime.toFixed(2)}ms`);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        console.warn('Cart API: HTTP error:', errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      }

      const data = await response.json();
      console.log('Cart API: Success response:', data);
      
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      // More specific error handling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Cart API: Network error or server unavailable:', error.message);
        return {
          success: false,
          message: 'Cart service temporarily unavailable',
        };
      }
      
      console.warn('Cart API error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Get user's cart from server
  async getCart(): Promise<CartApiResponse> {
    return this.makeRequest('/cart');
  }

  // Get user's cart with customization details
  async getCartWithCustomizations(): Promise<CartApiResponse> {
    console.log('🌐 ============ cartApi.getCartWithCustomizations CALLED ============');
    console.log('🌐 Timestamp:', new Date().toISOString());

    try {
      const result = await this.makeRequest('/cart/with-customizations');

      console.log('🌐 getCartWithCustomizations response:', {
        success: result.success,
        hasData: !!result.data,
        itemCount: Array.isArray(result.data) ? result.data.length : 'N/A'
      });

      if (result.success && Array.isArray(result.data)) {
        console.log('🌐 Cart items from server:', result.data.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          size: item.size,
          quantity: item.quantity,
          customization_id: item.customization_id
        })));
      }

      console.log('🌐 ============ cartApi.getCartWithCustomizations COMPLETED ============');

      return result;
    } catch (error) {
      console.error('🌐 ❌ getCartWithCustomizations FAILED:', error);
      throw error;
    }
  }

  // Add item to server cart
  async addItem(item: Omit<CartApiItem, 'id' | 'user_id'>): Promise<CartApiResponse> {
    console.log('🌐 ============ cartApi.addItem CALLED ============');
    console.log('🌐 Timestamp:', new Date().toISOString());

    // Get user ID from useAuth hook
    const { useAuth } = await import('@/hooks/useAuth');
    const { user } = useAuth.getState();
    const userId = user?.id ? parseInt(user.id) : null;

    const payload = {
      ...item,
      user_id: userId,
    };

    console.log('🌐 Adding item to cart with payload:', {
      user_id: payload.user_id,
      product_id: payload.product_id,
      product_name: payload.product_name,
      quantity: payload.quantity,
      size: payload.size,
      customization_id: payload.customization_id,
      hasDesignData: !!payload.design_canvas_data,
      hasCustomizedImages: !!payload.customized_images
    });

    const result = await this.makeRequest('/cart', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log('🌐 addItem response:', {
      success: result.success,
      hasData: !!result.data,
      serverId: result.data?.id
    });
    console.log('🌐 ============ cartApi.addItem COMPLETED ============');

    return result;
  }

  // Update item quantity
  async updateQuantity(itemId: number, quantity: number): Promise<CartApiResponse> {
    return this.makeRequest('/cart/quantity', {
      method: 'PATCH',
      body: JSON.stringify({
        item_id: itemId,
        quantity: quantity,
      }),
    });
  }

  // Remove single item from server cart
  async removeItem(itemId: number): Promise<CartApiResponse> {
    return this.makeRequest(`/cart/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Remove multiple items from server cart
  async removeItems(itemIds: number[]): Promise<CartApiResponse> {
    return this.makeRequest('/cart/delete/bulk', {
      method: 'DELETE',
      body: JSON.stringify({
        item_ids: itemIds,
      }),
    });
  }

  // Clear entire cart
  async clearCart(): Promise<CartApiResponse> {
    return this.makeRequest('/cart/clear', {
      method: 'DELETE',
    });
  }
}

export const cartApi = new CartApiService();
