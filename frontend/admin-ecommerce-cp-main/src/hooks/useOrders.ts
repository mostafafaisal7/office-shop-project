import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { orderService, OrderFilters } from '@/services/order';
import {
  OrderRead,
  OrderDetailRead,
  OrderStatus,
  OrderStatusUpdate,
  OrderTrackingUpdate
} from '@/types/order';
import { PaginatedResponse } from '@/types/api';

export interface UseOrdersReturn {
  orders: OrderRead[];
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  filters: OrderFilters;
  selectedOrders: string[];
  // Actions
  fetchOrders: (newFilters?: Partial<OrderFilters>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  updateOrderTracking: (orderId: string, trackingInfo: string, notes?: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  bulkUpdateStatus: (orderIds: string[], status: OrderStatus) => Promise<void>;
  bulkDelete: (orderIds: string[]) => Promise<void>;
  downloadInvoice: (orderId: string) => Promise<void>;
  setFilters: (filters: Partial<OrderFilters>) => void;
  setSelectedOrders: (orderIds: string[]) => void;
  clearSelection: () => void;
  refreshOrders: () => Promise<void>;
}

export const useOrders = (initialFilters: OrderFilters = {}): UseOrdersReturn => {
  const [orders, setOrders] = useState<OrderRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFiltersState] = useState<OrderFilters>({
    page: 1,
    per_page: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialFilters,
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const fetchOrders = useCallback(async (newFilters?: Partial<OrderFilters>) => {
    setLoading(true);
    setError(null);

    try {
      const currentFilters = newFilters ? { ...filters, ...newFilters } : filters;
      console.log('Fetching orders with filters:', currentFilters);
      
      const response: PaginatedResponse<OrderRead> = await orderService.getAllOrders(currentFilters);
      console.log('Orders response:', response);
      
      setOrders(response.items || []);
      setPagination({
        current: currentFilters.page || 1,
        pageSize: currentFilters.per_page || currentFilters.size || 10,
        total: response.total || 0,
      });

      if (newFilters) {
        setFiltersState(currentFilters);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch orders';
      setError(errorMessage);
      message.error(`Error fetching orders: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, notes?: string) => {
    try {
      const statusUpdate: OrderStatusUpdate = { status, notes };
      await orderService.updateOrderStatus(orderId, statusUpdate);
      
      message.success(`Order status updated to ${status}`);
      await fetchOrders();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update order status';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchOrders]);

  const updateOrderTracking = useCallback(async (orderId: string, trackingInfo: string, notes?: string) => {
    try {
      const trackingUpdate: OrderTrackingUpdate = { tracking_info: trackingInfo, notes };
      await orderService.updateOrderTracking(orderId, trackingUpdate);
      
      message.success('Order tracking updated successfully');
      await fetchOrders();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update order tracking';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchOrders]);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      await orderService.deleteOrder(orderId);
      message.success('Order deleted successfully');
      await fetchOrders();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete order';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchOrders]);

  const bulkUpdateStatus = useCallback(async (orderIds: string[], status: OrderStatus) => {
    try {
      await orderService.bulkUpdateStatus(orderIds, status);
      message.success(`${orderIds.length} orders updated to ${status}`);
      setSelectedOrders([]);
      await fetchOrders();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update orders';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchOrders]);

  const bulkDelete = useCallback(async (orderIds: string[]) => {
    try {
      await orderService.bulkDelete(orderIds);
      message.success(`${orderIds.length} orders deleted successfully`);
      setSelectedOrders([]);
      await fetchOrders();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete orders';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchOrders]);

  const downloadInvoice = useCallback(async (orderId: string) => {
    try {
      const blob = await orderService.downloadInvoice(orderId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Invoice downloaded successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to download invoice';
      message.error(errorMessage);
      throw err;
    }
  }, []);

  const setFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFiltersState(updatedFilters);
    fetchOrders(updatedFilters);
  }, [filters, fetchOrders]);

  const clearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  const refreshOrders = useCallback(() => {
    return fetchOrders();
  }, [fetchOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    pagination,
    filters,
    selectedOrders,
    fetchOrders,
    updateOrderStatus,
    updateOrderTracking,
    deleteOrder,
    bulkUpdateStatus,
    bulkDelete,
    downloadInvoice,
    setFilters,
    setSelectedOrders,
    clearSelection,
    refreshOrders,
  };
};

export default useOrders;
