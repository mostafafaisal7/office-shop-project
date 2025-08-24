'use client';

import { Typography } from 'antd';
import { OrderList } from '@/components/orders/OrderList';
import { useOrders } from '@/hooks/useOrders';

const { Title, Text } = Typography;

export default function OrdersPage() {
  const ordersData = useOrders();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Orders Management
        </Title>
        <Text type="secondary">
          View and manage customer orders, update status, and track shipments.
        </Text>
      </div>

      <OrderList ordersData={ordersData} />
    </div>
  );
}
