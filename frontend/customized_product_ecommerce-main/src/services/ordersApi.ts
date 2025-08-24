import { Order, OrderFilters, OrderStats, TrackingInfo } from '@/types/orders';

const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://localhost:8000' // Server-side
  : '/api'; // Client-side (uses proxy)

// Helper function to get auth headers
const getAuthHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to get valid token from auth store
const getValidToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const { getValidToken } = await import('@/store/authStore');
    return await getValidToken();
  } catch (error) {
    console.error('Failed to get valid token:', error);
    return null;
  }
};

// Helper function to get token directly from auth store without validation
const getTokenFromStore = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const { useAuthStore } = await import('@/store/authStore');
    const { tokens } = useAuthStore.getState();
    return tokens?.accessToken || null;
  } catch (error) {
    console.error('Failed to get token from store:', error);
    return null;
  }
};

export const ordersApi = {
  // Get user's orders
  getUserOrders: async (): Promise<Order[]> => {
    // First try to get token directly from store to avoid additional API calls
    let token = await getTokenFromStore();
    
    // If no token in store, try to get valid token (which might refresh)
    if (!token) {
      token = await getValidToken();
      if (!token) {
        throw new Error('Please log in to view your orders');
      }
    }

    const response = await fetch(`${API_BASE_URL}/orders/user/me`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch orders';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use status-based message
        if (response.status === 401) {
          errorMessage = 'Please log in to view your orders';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to view orders';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later';
        } else {
          errorMessage = `Failed to fetch orders (${response.status})`;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Get single order by ID
  getOrderById: async (orderId: string): Promise<Order> => {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return response.json();
  },

  // Track order by order code
  trackOrder: async (orderCode: string): Promise<TrackingInfo> => {
    const response = await fetch(`${API_BASE_URL}/orders/track-your-order?order_code=${orderCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to track order');
    }

    return response.json();
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'): Promise<void> => {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
  },

  // Delete order
  deleteOrder: async (orderId: string): Promise<void> => {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to delete order');
    }
  },

  // Download invoice
  downloadInvoice: async (orderId: string): Promise<Blob> => {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    return response.blob();
  },

  // Update tracking info
  updateTracking: async (orderId: string, trackingInfo: string): Promise<void> => {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/track`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ tracking_info: trackingInfo }),
    });

    if (!response.ok) {
      throw new Error('Failed to update tracking info');
    }
  },

  // Get detailed order by ID (for order details modal)
  getDetailedOrderById: async (orderId: string): Promise<Order> => {
    // First try to get token directly from store to avoid additional API calls
    let token = await getTokenFromStore();
    
    // If no token in store, try to get valid token (which might refresh)
    if (!token) {
      token = await getValidToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch order details';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        if (response.status === 401) {
          errorMessage = 'Please log in to view order details';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to view this order';
        } else if (response.status === 404) {
          errorMessage = 'Order not found';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later';
        } else {
          errorMessage = `Failed to fetch order details (${response.status})`;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Get order statistics (calculated from orders)
  getOrderStats: async (): Promise<OrderStats> => {
    const orders = await ordersApi.getUserOrders();
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => 
      order.status === 'pending'
    ).length;
    const completedOrders = orders.filter(order => 
      order.status === 'delivered'
    ).length;
    const totalSpent = orders
      .filter(order => order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered')
      .reduce((sum, order) => sum + order.total_price, 0);
    
    return {
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      total_spent: totalSpent
    };
  },

  // Filter orders locally (since API doesn't support filtering)
  filterOrders: (orders: Order[], filters?: OrderFilters): Order[] => {
    let filteredOrders = [...orders];
    
    if (filters?.status && filters.status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status);
    }
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.id.toLowerCase().includes(searchTerm) ||
        order.items.some(item => item.product_name.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filters?.date_from) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_at) >= new Date(filters.date_from!)
      );
    }
    
    if (filters?.date_to) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_at) <= new Date(filters.date_to!)
      );
    }
    
    // Sort by creation date (newest first)
    filteredOrders.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return filteredOrders;
  },

  // Update order shipping address
  updateOrderShippingAddress: async (orderId: string, addressId: string): Promise<void> => {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/shipping-address`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ shipping_address_id: addressId }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update order shipping address';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        if (response.status === 401) {
          errorMessage = 'Please log in to update order';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to update this order';
        } else if (response.status === 404) {
          errorMessage = 'Order not found';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later';
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  // Update order shipping method
  updateOrderShippingMethod: async (orderId: string, shippingMethodId: number, shippingCost: number): Promise<void> => {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ 
        shipping_method_id: shippingMethodId
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update order shipping method';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        if (response.status === 401) {
          errorMessage = 'Please log in to update order';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to update this order';
        } else if (response.status === 404) {
          errorMessage = 'Order not found';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later';
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  // Cancel order with reason
  cancelOrder: async (orderId: string, reason: string): Promise<void> => {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Cancellation reason is required');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ reason: reason.trim() }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to cancel order';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        if (response.status === 401) {
          errorMessage = 'Please log in to cancel order';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to cancel this order';
        } else if (response.status === 404) {
          errorMessage = 'Order not found';
        } else if (response.status === 400) {
          errorMessage = 'Invalid cancellation request';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later';
        }
      }
      
      throw new Error(errorMessage);
    }
  }
};
