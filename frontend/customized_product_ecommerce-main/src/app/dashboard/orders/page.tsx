'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ordersApi } from '@/services/ordersApi';
import { Order, OrderFilters, OrderStats } from '@/types/orders';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { shippingApi, ShippingMethod, ProductShippingCostCalculation } from '@/services/shippingApi';
import ShippingAddressEditModal from '@/components/orders/ShippingAddressEditModal';
import ShippingMethodSelector from '@/components/orders/ShippingMethodSelector';

export default function OrdersPage() {
  const { showToast } = useToast();
  const { theme, resolvedTheme } = useTheme();
  const { user, tokens, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showAddressEditModal, setShowAddressEditModal] = useState(false);
  const [showShippingMethodSelector, setShowShippingMethodSelector] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const fetchedOrders = await ordersApi.getUserOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (orders.length === 0) {
      setStats(null);
      return;
    }

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
    
    setStats({
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      total_spent: totalSpent
    });
  };

  const filterOrders = () => {
    const filters: OrderFilters = {
      status: statusFilter,
      search: searchTerm
    };
    const filtered = ordersApi.filterOrders(orders, filters);
    setFilteredOrders(filtered);
  };

  const handleViewOrder = async (order: Order) => {
    try {
      // Fetch detailed order information
      const detailedOrder = await ordersApi.getDetailedOrderById(order.id);
      setSelectedOrder(detailedOrder);
      setShowOrderDetails(true);
    } catch (error) {
      console.error('Error loading detailed order:', error);
      showToast('Failed to load order details', 'error');
      // Fallback to basic order info
      setSelectedOrder(order);
      setShowOrderDetails(true);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const blob = await ordersApi.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Invoice downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast('Failed to download invoice', 'error');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
    setCancelReason('');
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel || !cancelReason.trim()) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }

    try {
      setIsCancelling(true);
      await ordersApi.cancelOrder(orderToCancel, cancelReason.trim());
      showToast('Order cancelled successfully', 'success');
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancelReason('');
      loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast(error instanceof Error ? error.message : 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
    setCancelReason('');
  };

  // Handle shipping address update
  const handleAddressUpdated = async (updatedAddress: any) => {
    if (!selectedOrder) return;

    try {
      setIsUpdatingOrder(true);
      
      // Update the selected order with new address
      setSelectedOrder({
        ...selectedOrder,
        shipping_address: updatedAddress
      });

      // Update the orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, shipping_address: updatedAddress }
            : order
        )
      );

      showToast('Shipping address updated successfully', 'success');
    } catch (error) {
      console.error('Error updating address in UI:', error);
      showToast('Failed to update address display', 'error');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Handle shipping address deletion
  const handleAddressDeleted = async () => {
    if (!selectedOrder) return;

    try {
      setIsUpdatingOrder(true);
      
      // Note: In a real scenario, you might want to handle this differently
      // since deleting the shipping address might require selecting a new one
      showToast('Shipping address deleted successfully', 'success');
      
      // Refresh the order details
      const refreshedOrder = await ordersApi.getDetailedOrderById(selectedOrder.id);
      setSelectedOrder(refreshedOrder);
      
      // Update the orders list
      loadOrders();
    } catch (error) {
      console.error('Error handling address deletion:', error);
      showToast('Failed to refresh order after address deletion', 'error');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Handle shipping method update
  const handleShippingMethodUpdated = async (
    method: ShippingMethod, 
    cost: number, 
    costData: ProductShippingCostCalculation | null
  ) => {
    if (!selectedOrder) return;

    try {
      setIsUpdatingOrder(true);
      
      // Update order shipping method via API
      await ordersApi.updateOrderShippingMethod(selectedOrder.id, method.id, cost);
      
      // Calculate new total price
      const subtotal = selectedOrder.subtotal || selectedOrder.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const newTotalPrice = subtotal + cost;
      
      // Update the selected order
      const updatedOrder = {
        ...selectedOrder,
        shipping_method_id: method.id,
        shipping_cost: cost,
        total_price: newTotalPrice,
        shipping_cost_breakdown: costData ? {
          total_cost: costData.total_cost,
          product_breakdown: costData.product_breakdown,
          delivery_days: costData.delivery_days
        } : selectedOrder.shipping_cost_breakdown,
        estimated_delivery_days: costData?.delivery_days || selectedOrder.estimated_delivery_days
      };
      
      setSelectedOrder(updatedOrder);

      // Update the orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, shipping_method_id: method.id, shipping_cost: cost, total_price: newTotalPrice }
            : order
        )
      );

      showToast(`Shipping method updated to ${method.name}`, 'success');
    } catch (error) {
      console.error('Error updating shipping method:', error);
      showToast('Failed to update shipping method', 'error');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Check if order can be edited (only pending and paid orders)
  const canEditOrder = (order: Order) => {
    return order.status === 'pending' || order.status === 'paid';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'paid':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your orders</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.total_orders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.pending_orders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.completed_orders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-card-foreground">{formatCurrency(stats.total_spent)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-input bg-background text-foreground rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={loadOrders}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No orders found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'You haven\'t placed any orders yet.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => window.location.href = '/'}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors duration-200"
            >
              Start Shopping
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-card rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        Order #{order.id.slice(0, 8)}...
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-card-foreground">
                      {formatCurrency(order.total_price)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={item.id} className="flex items-center bg-muted rounded-lg px-3 py-2">
                        <Package className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm text-foreground">
                          {item.product_name} × {item.quantity}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex items-center bg-muted rounded-lg px-3 py-2">
                        <span className="text-sm text-muted-foreground">
                          +{order.items.length - 3} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking Info */}
                {order.tracking_info && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Tracking Information</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{order.tracking_info}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="inline-flex items-center px-3 py-2 border border-input shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    
                    {(order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') && (
                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        className="inline-flex items-center px-3 py-2 border border-input shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Invoice
                      </button>
                    )}
                  </div>

                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="inline-flex items-center px-3 py-2 border border-destructive shadow-sm text-sm leading-4 font-medium rounded-md text-destructive bg-background hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-lg bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Order #{selectedOrder.id.slice(0, 8)}...
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Placed on {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Order Status & Timeline */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Order Status</h4>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-2 capitalize">{selectedOrder.status}</span>
                  </div>
                </div>
                
                {/* Status Timeline */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    {['pending', 'paid', 'shipped', 'delivered'].map((status, index) => {
                      const isCompleted = ['pending', 'paid', 'shipped', 'delivered'].indexOf(selectedOrder.status) >= index;
                      const isCurrent = selectedOrder.status === status;
                      const isCancelled = selectedOrder.status === 'cancelled';
                      
                      return (
                        <div key={status} className="flex flex-col items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            isCancelled ? 'bg-red-100 border-red-300 text-red-600' :
                            isCompleted ? 'bg-green-100 border-green-300 text-green-600' :
                            isCurrent ? 'bg-blue-100 border-blue-300 text-blue-600' :
                            'bg-gray-100 border-gray-300 text-gray-400'
                          }`}>
                            {isCancelled ? <XCircle className="h-4 w-4" /> :
                             isCompleted ? <CheckCircle className="h-4 w-4" /> :
                             status === 'pending' ? <Clock className="h-4 w-4" /> :
                             status === 'paid' ? <DollarSign className="h-4 w-4" /> :
                             status === 'shipped' ? <Truck className="h-4 w-4" /> :
                             <Package className="h-4 w-4" />}
                          </div>
                          <span className={`text-xs mt-2 capitalize ${
                            isCompleted || isCurrent ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'
                          }`}>
                            {status}
                          </span>
                          {index < 3 && (
                            <div className={`absolute top-4 h-0.5 ${
                              index < ['pending', 'paid', 'shipped', 'delivered'].indexOf(selectedOrder.status) ? 'bg-green-300' : 'bg-gray-300'
                            }`} style={{
                              left: `${(index + 1) * 25 - 12.5}%`,
                              width: '25%'
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                  {/* Items Details */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Order Items ({selectedOrder.items.length})
                    </h4>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                          {/* Product Image with Dynamic Priority Logic */}
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {(() => {
                              // Priority 1: Custom design preview from customized_images
                              if (item.customized_images) {
                                try {
                                  const customImages = typeof item.customized_images === 'string' 
                                    ? JSON.parse(item.customized_images) 
                                    : item.customized_images;
                                  
                                  if (Array.isArray(customImages) && customImages.length > 0) {
                                    const imageUrl = typeof customImages[0] === 'string' 
                                      ? customImages[0] 
                                      : customImages[0]?.url || customImages[0]?.file_path;
                                    
                                    if (imageUrl) {
                                      return (
                                        <img
                                          src={imageUrl}
                                          alt={`${item.product_name} (Custom Design)`}
                                          className="w-full h-full object-cover"
                                        />
                                      );
                                    }
                                  }
                                } catch (error) {
                                  console.warn('Failed to parse customized_images:', error);
                                }
                              }
                              
                              // Priority 2: Variation image
                              if (item.variation_details?.media && item.variation_details.media.length > 0) {
                                return (
                                  <img
                                    src={item.variation_details.media[0].file_path}
                                    alt={item.variation_details.media[0].alt_text || `${item.product_name} (${item.variation_details.name})`}
                                    className="w-full h-full object-cover"
                                  />
                                );
                              }
                              
                              // Priority 3: Default fallback
                              return <Package className="h-8 w-8 text-gray-400" />;
                            })()}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.product_name}
                            </h5>
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Product ID: #{item.product_id}
                              </p>
                              {item.variation_details && (
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Variation: {item.variation_details.name} (SKU: {item.variation_details.sku})
                                  </p>
                                  {item.variation_details.attributes && (
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(item.variation_details.attributes).map(([key, value]) => (
                                        <span
                                          key={key}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                        >
                                          {key}: {value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {item.customization_option_id && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Customization: #{item.customization_option_id}
                                </p>
                              )}
                              {item.customized_images && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Custom Images:</p>
                                  <div className="flex space-x-2">
                                    {JSON.parse(item.customized_images).map((image: string, index: number) => (
                                      <img
                                        key={index}
                                        src={image}
                                        alt={`Custom design ${index + 1}`}
                                        className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-600"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {item.discount_amount && (
                                <div className="mt-1">
                                  <p className="text-xs text-green-600 dark:text-green-400">
                                    Discount: -{formatCurrency(item.discount_amount)} 
                                    {item.discount_percentage && ` (${item.discount_percentage}%)`}
                                  </p>
                                  {item.original_unit_price && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
                                      Original: {formatCurrency(item.original_unit_price)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(item.unit_price)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                              {formatCurrency(item.unit_price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary Sidebar */}
                <div className="space-y-6">
                  {/* Payment Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="text-gray-900 dark:text-white">
                          {formatCurrency(selectedOrder.subtotal || selectedOrder.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                        <span className="text-gray-900 dark:text-white">
                          {formatCurrency(selectedOrder.shipping_cost || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                        <span className="text-gray-900 dark:text-white">Included</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div className="flex justify-between">
                          <span className="text-base font-semibold text-gray-900 dark:text-white">Total:</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(selectedOrder.total_price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Order ID</p>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedOrder.id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Order Date</p>
                        <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Method</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedOrder.payment_method?.name || 'N/A'}
                        </p>
                        {selectedOrder.payment_method?.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedOrder.payment_method.description}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Status</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedOrder.status === 'paid' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : selectedOrder.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {selectedOrder.status === 'paid' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? 'Paid' :
                           selectedOrder.status === 'pending' ? 'Pending' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Shipping Information</h4>
                      {canEditOrder(selectedOrder) && (
                        <button
                          onClick={() => setShowShippingMethodSelector(true)}
                          disabled={isUpdatingOrder}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                          {isUpdatingOrder ? 'Updating...' : 'Edit Method'}
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Shipping Method</p>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {selectedOrder.shipping_method ? (
                            <div>
                              <p className="font-medium">{selectedOrder.shipping_method.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {selectedOrder.shipping_method.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ID: #{selectedOrder.shipping_method.id}
                              </p>
                            </div>
                          ) : (
                            <p>#{selectedOrder.shipping_method_id}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Shipping Cost</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(selectedOrder.shipping_cost || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estimated Delivery</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedOrder.status === 'delivered' ? 'Delivered' : 
                           selectedOrder.estimated_delivery_days ? `${selectedOrder.estimated_delivery_days} business days` : 
                           '5-7 business days'}
                        </p>
                      </div>
                      {selectedOrder.tracking_info && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tracking Number</p>
                          <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedOrder.tracking_info}</p>
                        </div>
                      )}
                      {selectedOrder.shipping_cost_breakdown && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Shipping Breakdown</p>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            <p>Total Cost: {formatCurrency(selectedOrder.shipping_cost_breakdown.total_cost)}</p>
                            <p>Delivery Days: {selectedOrder.shipping_cost_breakdown.delivery_days}</p>
                            {selectedOrder.shipping_cost_breakdown.product_breakdown.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Product Breakdown:</p>
                                {selectedOrder.shipping_cost_breakdown.product_breakdown.map((breakdown, index) => (
                                  <div key={index} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600 mb-1">
                                    <p>Product #{breakdown.product_id} - Qty: {breakdown.quantity}</p>
                                    <p>Base Cost: {formatCurrency(breakdown.base_cost)} → Final: {formatCurrency(breakdown.final_cost)}</p>
                                    {breakdown.applied_rules.length > 0 && (
                                      <p className="text-gray-500">Rules Applied: {breakdown.applied_rules.length}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Shipping Address</p>
                          {canEditOrder(selectedOrder) && selectedOrder.shipping_address && (
                            <button
                              onClick={() => setShowAddressEditModal(true)}
                              disabled={isUpdatingOrder}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium disabled:opacity-50"
                            >
                              {isUpdatingOrder ? 'Updating...' : 'Edit'}
                            </button>
                          )}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {selectedOrder.shipping_address ? (
                            <div>
                              <p>{selectedOrder.shipping_address.full_name}</p>
                              <p>{selectedOrder.shipping_address.address_line}</p>
                              <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}</p>
                              <p>{selectedOrder.shipping_address.country}</p>
                              {selectedOrder.shipping_address.phone && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Phone: {selectedOrder.shipping_address.phone}
                                </p>
                              )}
                              {selectedOrder.shipping_address.email && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Email: {selectedOrder.shipping_address.email}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p>Address ID: {selectedOrder.shipping_address_id || 'N/A'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Full address details not available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                {(selectedOrder.status === 'paid' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') && (
                  <button
                    onClick={() => handleDownloadInvoice(selectedOrder.id)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </button>
                )}
                
                {selectedOrder.tracking_info && (
                  <button
                    onClick={() => window.open(`https://track.example.com/${selectedOrder.tracking_info}`, '_blank')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Track Package
                  </button>
                )}

                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleCancelOrder(selectedOrder.id);
                      setShowOrderDetails(false);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </button>
                )}

                <button
                  onClick={() => window.location.href = '/contact'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Address Edit Modal */}
      {showAddressEditModal && selectedOrder && selectedOrder.shipping_address && (
        <ShippingAddressEditModal
          isOpen={showAddressEditModal}
          onClose={() => setShowAddressEditModal(false)}
          address={{
            id: selectedOrder.shipping_address_id || '',
            full_name: selectedOrder.shipping_address.full_name,
            phone: selectedOrder.shipping_address.phone,
            email: selectedOrder.shipping_address.email,
            address_line: selectedOrder.shipping_address.address_line,
            city: selectedOrder.shipping_address.city,
            state: selectedOrder.shipping_address.state,
            postal_code: selectedOrder.shipping_address.postal_code,
            country: selectedOrder.shipping_address.country
          }}
          onAddressUpdated={handleAddressUpdated}
          onAddressDeleted={handleAddressDeleted}
          allowDelete={false} // Don't allow deleting the shipping address from order
        />
      )}

      {/* Shipping Method Selector Modal */}
      {showShippingMethodSelector && selectedOrder && (
        <ShippingMethodSelector
          isOpen={showShippingMethodSelector}
          onClose={() => setShowShippingMethodSelector(false)}
          currentMethodId={selectedOrder.shipping_method_id}
          currentCost={selectedOrder.shipping_cost || 0}
          orderItems={selectedOrder.items}
          onMethodSelected={handleShippingMethodUpdated}
        />
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white dark:bg-gray-800">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cancel Order
                </h3>
                <button
                  onClick={closeCancelModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Please provide a reason for cancelling this order. This will help us improve our service.
                </p>
                
                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="changed my mind"
                      checked={cancelReason === 'changed my mind'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Changed my mind</span>
                  </label>
                  
                  <label className="block">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="found better price elsewhere"
                      checked={cancelReason === 'found better price elsewhere'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Found better price elsewhere</span>
                  </label>
                  
                  <label className="block">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="delivery taking too long"
                      checked={cancelReason === 'delivery taking too long'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Delivery taking too long</span>
                  </label>
                  
                  <label className="block">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="ordered by mistake"
                      checked={cancelReason === 'ordered by mistake'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ordered by mistake</span>
                  </label>
                  
                  <label className="block">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="other"
                      checked={cancelReason === 'other'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Other</span>
                  </label>
                  
                  {cancelReason === 'other' && (
                    <div className="mt-2">
                      <textarea
                        placeholder="Please specify your reason..."
                        value={cancelReason === 'other' ? '' : cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeCancelModal}
                  disabled={isCancelling}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={isCancelling || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cancelling...
                    </div>
                  ) : (
                    'Cancel Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
