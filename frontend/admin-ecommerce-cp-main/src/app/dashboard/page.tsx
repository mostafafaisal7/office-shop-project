'use client';

import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag, Space, Button } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  ShoppingOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/useOrders';
import { useUsers } from '@/hooks/useUsers';
import { useProducts } from '@/hooks/useProducts';
import { useReviews } from '@/hooks/useReviews';
import { orderService } from '@/services/order';
import { OrderRead } from '@/types/order';

const { Title, Text } = Typography;

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  pendingReviews: number;
  lowStockProducts: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    pendingReviews: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRead[]>([]);

  // Fetch data using hooks
  const { users, response: usersResponse } = useUsers();
  const { products, response: productsResponse } = useProducts({ page: 1, per_page: 1000 });
  const { stats: reviewStats } = useReviews({ status: 'pending', per_page: 1000 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch order statistics
        const orderStats = await orderService.getOrderStats();
        
        // Calculate low stock products from variations
        const lowStockCount = products.reduce((count, product) => {
          if (product.variations && product.variations.length > 0) {
            // Check variations for low stock
            const lowStockVariations = product.variations.filter(variation => 
              variation.stock_quantity < (variation.low_stock_threshold || 10)
            );
            return count + lowStockVariations.length;
          }
          return count;
        }, 0);
        
        // Calculate dashboard statistics
        const dashboardStats: DashboardStats = {
          totalOrders: orderStats.total_orders,
          totalRevenue: orderStats.total_revenue,
          totalUsers: usersResponse?.total || users.length,
          totalProducts: productsResponse?.total || products.length,
          pendingOrders: orderStats.pending_orders,
          pendingReviews: reviewStats?.pending_reviews || 0,
          lowStockProducts: lowStockCount,
        };

        setStats(dashboardStats);
        setRecentOrders(orderStats.recent_orders);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch when we have some data from hooks
    if (users.length > 0 || products.length > 0) {
      fetchDashboardData();
    } else if (!loading) {
      // If hooks are not loading but no data, still try to fetch order stats
      fetchDashboardData();
    }
  }, [users, products, usersResponse, productsResponse, reviewStats]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      paid: 'blue',
      shipped: 'purple',
      delivered: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'default';
  };

  const orderColumns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Button type="link" onClick={() => router.push(`/dashboard/orders/${id}`)}>
          {id}
        </Button>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (userId: number, record: OrderRead) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {userId ? `User ID: ${userId}` : record.guest_id ? `Guest: ${record.guest_id}` : 'Unknown'}
          </div>
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (total: number) => `$${total.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ textTransform: 'capitalize' }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: OrderRead) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/dashboard/orders/${record.id}`)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => router.push(`/dashboard/orders/${record.id}`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Dashboard Overview
        </Title>
        <Text type="secondary">
          Welcome back! Here's what's happening with your store today.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={stats.pendingOrders}
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Reviews"
              value={stats.pendingReviews}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Low Stock Products"
              value={stats.lowStockProducts}
              valueStyle={{ color: '#ff4d4f' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card
        title="Recent Orders"
        extra={
          <Button type="primary" onClick={() => router.push('/dashboard/orders')}>
            View All Orders
          </Button>
        }
      >
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          loading={loading}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
