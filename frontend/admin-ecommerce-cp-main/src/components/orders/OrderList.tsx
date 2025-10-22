'use client';

import React, { useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  Modal,
  Form,
  Typography,
  Tooltip,
  Badge,
  Dropdown,
  MenuProps,
  message,
  Statistic,
  Avatar,
  Checkbox,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  MoreOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import { OrderRead, OrderStatus } from '@/types/order';
import { UseOrdersReturn } from '@/hooks/useOrders';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;
const { confirm } = Modal;

interface OrderListProps {
  ordersData: UseOrdersReturn;
}

const statusColors: Record<OrderStatus, string> = {
  pending: '#faad14',
  paid: '#1890ff',
  shipped: '#722ed1',
  delivered: '#52c41a',
  cancelled: '#ff4d4f',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusBgColors: Record<OrderStatus, string> = {
  pending: '#f0ad4e',
  paid: '#0275d8',
  shipped: '#722ed1ff',
  delivered: '#5cb85c',
  cancelled: '#d9534f',
};

export const OrderList: React.FC<OrderListProps> = ({ ordersData }) => {
  const router = useRouter();
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRead | null>(null);
  const [statusForm] = Form.useForm();
  const [trackingForm] = Form.useForm();
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const {
    orders,
    loading,
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
  } = ordersData;

  // Calculate statistics
  const totalOrders = pagination.total || 0;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
  const totalRevenue = orders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + (order.total_price || 0), 0);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setFilters({ q: searchValue || undefined, page: 1 });
    }, 500),
    [setFilters]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleTableChange = (paginationConfig: any, filtersConfig: any, sorter: any) => {
    const newFilters: any = {
      page: paginationConfig.current,
      per_page: paginationConfig.pageSize,
    };

    if (sorter.field) {
      newFilters.sort_by = sorter.field;
      newFilters.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    fetchOrders(newFilters);
  };

  const handleStatusFilter = (status: OrderStatus | undefined) => {
    setStatusFilter(status);
    setFilters({ status, page: 1 });
  };

  const handleDateRangeFilter = (dates: any) => {
    setDateRange(dates);
    if (dates && dates.length === 2) {
      setFilters({
        date_from: dates[0].format('YYYY-MM-DD'),
        date_to: dates[1].format('YYYY-MM-DD'),
        page: 1,
      });
    } else {
      setFilters({ date_from: undefined, date_to: undefined, page: 1 });
    }
  };

  const clearAllFilters = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setDateRange(null);
    setFilters({
      q: undefined,
      status: undefined,
      date_from: undefined,
      date_to: undefined,
      page: 1,
    });
  };

  const handleStatusUpdate = async (values: { status: OrderStatus; notes?: string }) => {
    if (!selectedOrder) return;

    try {
      await updateOrderStatus(selectedOrder.id, values.status, values.notes);
      setStatusModalVisible(false);
      setSelectedOrder(null);
      statusForm.resetFields();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleTrackingUpdate = async (values: { tracking_info: string; notes?: string }) => {
    if (!selectedOrder) return;

    try {
      await updateOrderTracking(selectedOrder.id, values.tracking_info, values.notes);
      setTrackingModalVisible(false);
      setSelectedOrder(null);
      trackingForm.resetFields();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const showDeleteConfirm = (orderId: string) => {
    confirm({
      title: 'Delete Order',
      content: (
        <div>
          <p>Are you sure you want to delete order <strong>#{orderId.slice(-8)}</strong>?</p>
          <p style={{ color: '#ff4d4f', fontSize: '14px' }}>This action cannot be undone and will remove all associated data.</p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      width: 480,
      onOk() {
        deleteOrder(orderId);
      },
    });
  };

  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    if (selectedOrders.length === 0) {
      message.warning('Please select orders to update');
      return;
    }

    try {
      await bulkUpdateStatus(selectedOrders, status);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      message.warning('Please select orders to delete');
      return;
    }

    confirm({
      title: 'Delete Selected Orders',
      content: (
        <div>
          <p>Are you sure you want to delete <strong>{selectedOrders.length}</strong> selected orders?</p>
          <p style={{ color: '#ff4d4f', fontSize: '14px' }}>This action cannot be undone.</p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      width: 480,
      onOk() {
        bulkDelete(selectedOrders);
      },
    });
  };

  const getOrderActions = (record: OrderRead): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => router.push(`/dashboard/orders/${record.id}`),
    },
    {
      key: 'status',
      icon: <EditOutlined />,
      label: 'Update Status',
      onClick: () => {
        setSelectedOrder(record);
        setStatusModalVisible(true);
      },
    },
    {
      key: 'tracking',
      icon: <EditOutlined />,
      label: 'Update Tracking',
      onClick: () => {
        setSelectedOrder(record);
        setTrackingModalVisible(true);
      },
    },
    {
      key: 'invoice',
      icon: <DownloadOutlined />,
      label: 'Download Invoice',
      onClick: () => downloadInvoice(record.id),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => showDeleteConfirm(record.id),
    },
  ];

  const bulkActions: MenuProps['items'] = [
    {
      key: 'status-pending',
      label: 'Mark as Pending',
      onClick: () => handleBulkStatusUpdate('pending'),
    },
    {
      key: 'status-paid',
      label: 'Mark as Paid',
      onClick: () => handleBulkStatusUpdate('paid'),
    },
    {
      key: 'status-shipped',
      label: 'Mark as Shipped',
      onClick: () => handleBulkStatusUpdate('shipped'),
    },
    {
      key: 'status-delivered',
      label: 'Mark as Delivered',
      onClick: () => handleBulkStatusUpdate('delivered'),
    },
    {
      key: 'status-cancelled',
      label: 'Mark as Cancelled',
      onClick: () => handleBulkStatusUpdate('cancelled'),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete Selected',
      danger: true,
      onClick: handleBulkDelete,
    },
  ];

  const columns = [
    {
      title: 'Order',
      key: 'order',
      width: 280,
      render: (_: any, record: OrderRead) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            size={48}
            style={{ 
              backgroundColor: '#f0f2ff',
              color: '#1890ff',
              borderRadius: '8px',
              border: '1px solid #d6e4ff'
            }}
            icon={<ShoppingCartOutlined />}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: '600', 
              fontSize: '14px',
              marginBottom: '4px',
            }}>
              <Button
                type="link"
                onClick={() => router.push(`/dashboard/orders/${record.id}`)}
                style={{ padding: 0, height: 'auto', fontWeight: '600', fontSize: '14px' }}
              >
                #{record.id.slice(-8)}
              </Button>
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              marginBottom: '2px'
            }}>
              {record.user_id ? `Customer ID: ${record.user_id}` : 'Guest Order'}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#999'
            }}>
              {dayjs(record.created_at).format('MMM DD, YYYY HH:mm')}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 180,
      render: (_: any, record: OrderRead) => (
        <div>
          <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '4px' }}>
            {record.user_name || 'Guest Customer'}
          </div>
          {record.user_id && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {record.user_id}
            </Text>
          )}
          {record.user_email && (
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
              {record.user_email}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 120,
      sorter: true,
      render: (price: number) => (
        <div style={{ fontWeight: '600', fontSize: '14px', color: '#52c41a' }}>
          ${price?.toFixed(2) || '0.00'}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => (
        <Tag 
          color={statusColors[status]}
          style={{ 
            borderRadius: '16px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '500',
            border: 'none',
            background: statusBgColors[status]
          }}
        >
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: 80,
      render: (items: any[]) => (
        <Badge 
          count={items?.length || 0} 
          showZero 
          style={{ backgroundColor: '#1890ff' }}
        />
      ),
    },
    {
      title: 'Tracking',
      dataIndex: 'tracking_info',
      key: 'tracking_info',
      width: 150,
      render: (tracking: string) => (
        tracking ? (
          <Tooltip title={tracking}>
            <Text 
              ellipsis 
              style={{ 
                maxWidth: 120, 
                fontSize: '12px',
                padding: '4px 8px',
                backgroundColor: '#f0f2ff',
                borderRadius: '4px',
                border: '1px solid #d6e4ff'
              }}
            >
              {tracking}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>No tracking</Text>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: OrderRead) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              style={{ color: '#1890ff' }}
              onClick={() => router.push(`/dashboard/orders/${record.id}`)}
            />
          </Tooltip>
          <Dropdown menu={{ items: getOrderActions(record) }} trigger={['click']} placement="bottomRight">
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              size="small"
              style={{ color: '#666' }}
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedOrders,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedOrders(selectedRowKeys as string[]);
    },
  };

  return (
    <div style={{ padding: '0 24px' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
              Orders Management
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              View and manage customer orders, update status, and track shipments
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={refreshOrders}
            loading={loading}
            size="large"
            style={{ 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            Refresh Orders
          </Button>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Total Orders"
                value={totalOrders}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Pending Orders"
                value={pendingOrders}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Delivered Orders"
                value={deliveredOrders}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Total Revenue"
                value={totalRevenue}
                prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
                precision={2}
                valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card style={{ borderRadius: '12px', marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} lg={8}>
              <Input
                placeholder="Search orders by ID, customer, or notes..."
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={handleSearchChange}
                style={{ borderRadius: '8px' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select
                placeholder="Filter by status"
                size="large"
                style={{ width: '100%', borderRadius: '8px' }}
                value={statusFilter}
                onChange={handleStatusFilter}
                allowClear
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <Option key={value} value={value}>
                    <Tag color={statusColors[value as OrderStatus]} style={{ margin: 0 }}>
                      {label}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <RangePicker
                size="large"
                style={{ width: '100%', borderRadius: '8px' }}
                value={dateRange}
                onChange={handleDateRangeFilter}
                placeholder={['Start Date', 'End Date']}
              />
            </Col>
            <Col xs={24} sm={24} lg={6}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  style={{ borderRadius: '8px' }}
                  type={showAdvancedFilters ? 'primary' : 'default'}
                >
                  Advanced
                </Button>
                <Button 
                  icon={<ClearOutlined />}
                  onClick={clearAllFilters}
                  style={{ borderRadius: '8px' }}
                >
                  Clear All
                </Button>
              </div>
            </Col>
          </Row>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f0f2ff', borderRadius: '8px' }}>
              <Row align="middle">
                <Col flex="auto">
                  <Text strong style={{ color: '#1890ff' }}>
                    {selectedOrders.length} orders selected
                  </Text>
                </Col>
                <Col>
                  <Space>
                    <Dropdown menu={{ items: bulkActions }} trigger={['click']}>
                      <Button type="primary" style={{ borderRadius: '6px' }}>
                        Bulk Actions
                      </Button>
                    </Dropdown>
                    <Button onClick={clearSelection} style={{ borderRadius: '6px' }}>
                      Clear Selection
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
          )}
        </Card>
      </div>

      {/* Orders Table */}
      <Card style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} orders`,
            style: { marginTop: '16px' }
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
        />
      </Card>

      {/* Status Update Modal */}
      <Modal
        title="Update Order Status"
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          setSelectedOrder(null);
          statusForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleStatusUpdate}
          initialValues={{ status: selectedOrder?.status }}
        >
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select size="large" style={{ borderRadius: '8px' }}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <Option key={value} value={value}>
                  <Tag color={statusColors[value as OrderStatus]} style={{ margin: 0 }}>
                    {label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes (Optional)">
            <Input.TextArea 
              rows={3} 
              placeholder="Add notes about this status change..." 
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setStatusModalVisible(false)} style={{ borderRadius: '6px' }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" style={{ borderRadius: '6px' }}>
                Update Status
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Tracking Update Modal */}
      <Modal
        title="Update Tracking Information"
        open={trackingModalVisible}
        onCancel={() => {
          setTrackingModalVisible(false);
          setSelectedOrder(null);
          trackingForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={trackingForm}
          layout="vertical"
          onFinish={handleTrackingUpdate}
          initialValues={{ tracking_info: selectedOrder?.tracking_info }}
        >
          <Form.Item
            name="tracking_info"
            label="Tracking Number"
            rules={[{ required: true, message: 'Please enter tracking information' }]}
          >
            <Input 
              placeholder="Enter tracking number or URL..." 
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes (Optional)">
            <Input.TextArea 
              rows={3} 
              placeholder="Add notes about this tracking update..." 
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setTrackingModalVisible(false)} style={{ borderRadius: '6px' }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" style={{ borderRadius: '6px' }}>
                Update Tracking
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .table-row-light {
          background-color: #ffffff;
        }
        .table-row-dark {
          background-color: #fafafa;
        }
        .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          padding: 16px 12px !important;
          border-bottom: 2px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr > td {
          padding: 16px 12px !important;
          border-bottom: 1px solid #f5f5f5 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #f8f9ff !important;
        }
        .ant-table-row:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
      `}</style>
    </div>
  );
};

export default OrderList;
