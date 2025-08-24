import { apiService } from './api';
import {
  OrderRead,
  OrderDetailRead,
  OrderCreate,
  OrderStatusUpdate,
  OrderTrackingUpdate,
  OrderTrackingSummary,
  OrderStatus
} from '@/types/order';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export interface OrderFilters {
  status?: OrderStatus;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  q?: string; // Search query parameter for the new API
  page?: number;
  per_page?: number;
  size?: number; // Keep for backward compatibility
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// New API response structure
interface NewOrdersResponse {
  orders: OrderRead[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

class OrderService {
  private readonly baseUrl = '/orders';
  private readonly newListUrl = '/orders/list'; // New endpoint

  // Get all orders with filters and pagination using the new endpoint
  async getAllOrders(filters: OrderFilters = {}): Promise<PaginatedResponse<OrderRead>> {
    const params = new URLSearchParams();
    
    // Map filters to the new API parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Map 'size' to 'per_page' for the new API
        if (key === 'size') {
          params.append('per_page', value.toString());
        } else {
          params.append(key, value.toString());
        }
      }
    });

    // Set default pagination if not provided
    if (!params.has('page')) {
      params.append('page', '1');
    }
    if (!params.has('per_page') && !filters.size) {
      params.append('per_page', '10');
    }

    // Set default sorting
    if (!params.has('sort_by')) {
      params.append('sort_by', 'created_at');
    }
    if (!params.has('sort_order')) {
      params.append('sort_order', 'desc');
    }

    const url = `${this.newListUrl}?${params.toString()}`;
    console.log('Making request to new endpoint:', url);
    
    const response = await apiService.get<NewOrdersResponse>(url);
    console.log('New API response:', response);
    
    // Convert new API response to the expected format
    const newResponse = response.data;
    return {
      items: newResponse.orders,
      total: newResponse.total,
      page: newResponse.page,
      size: newResponse.per_page,
      pages: newResponse.pages
    };
  }

  // Get single order by ID
  async getOrderById(orderId: string): Promise<OrderDetailRead> {
    const response = await apiService.get<OrderDetailRead>(`${this.baseUrl}/${orderId}`);
    return response.data;
  }

  // Create new order
  async createOrder(orderData: OrderCreate): Promise<OrderRead> {
    const response = await apiService.post<OrderRead>(this.baseUrl, orderData);
    return response.data;
  }

  // Update order status
  async updateOrderStatus(orderId: string, statusUpdate: OrderStatusUpdate): Promise<OrderRead> {
    const response = await apiService.patch<OrderRead>(
      `${this.baseUrl}/${orderId}/status`,
      statusUpdate
    );
    return response.data;
  }

  // Update order tracking
  async updateOrderTracking(orderId: string, trackingUpdate: OrderTrackingUpdate): Promise<OrderRead> {
    const response = await apiService.patch<OrderRead>(
      `${this.baseUrl}/${orderId}/track`,
      trackingUpdate
    );
    return response.data;
  }

  // Delete order
  async deleteOrder(orderId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${orderId}`);
  }

  // Get user's orders
  async getMyOrders(): Promise<OrderRead[]> {
    const response = await apiService.get<OrderRead[]>(`${this.baseUrl}/user/me`);
    return response.data;
  }

  // Get guest orders
  async getGuestOrders(guestId: string): Promise<OrderRead[]> {
    const response = await apiService.get<OrderRead[]>(`${this.baseUrl}/guest/${guestId}`);
    return response.data;
  }

  // Track order
  async trackOrder(orderId: string): Promise<OrderTrackingSummary> {
    const response = await apiService.get<OrderTrackingSummary>(
      `${this.baseUrl}/track-your-order?order_id=${orderId}`
    );
    return response.data;
  }

  // Download invoice
  async downloadInvoice(orderId: string): Promise<Blob> {
    const response = await apiService.get(`${this.baseUrl}/${orderId}/invoice`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get order statistics (for dashboard)
  async getOrderStats(): Promise<{
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    total_revenue: number;
    recent_orders: OrderRead[];
  }> {
    // Use the new endpoint to get stats
    const orders = await this.getAllOrders({ per_page: 1000 });
    
    const stats = {
      total_orders: orders.total || 0,
      pending_orders: orders.items.filter(order => order.status === 'pending').length,
      completed_orders: orders.items.filter(order => order.status === 'delivered').length,
      cancelled_orders: orders.items.filter(order => order.status === 'cancelled').length,
      total_revenue: orders.items
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.total_price, 0),
      recent_orders: orders.items.slice(0, 5)
    };

    return stats;
  }

  // Bulk operations
  async bulkUpdateStatus(orderIds: string[], status: OrderStatus): Promise<void> {
    const promises = orderIds.map(id => 
      this.updateOrderStatus(id, { status })
    );
    await Promise.all(promises);
  }

  async bulkDelete(orderIds: string[]): Promise<void> {
    const promises = orderIds.map(id => this.deleteOrder(id));
    await Promise.all(promises);
  }
}

export const orderService = new OrderService();
export default orderService;
