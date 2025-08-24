'use client';

import React from 'react';
import { Card, Typography, Breadcrumb } from 'antd';
import { HomeOutlined, SendOutlined } from '@ant-design/icons';
import ShippingMethodList from '@/components/shipping/ShippingMethodList';

const { Title } = Typography;

const ShippingMethodsPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb
        style={{ marginBottom: '24px' }}
        items={[
          {
            href: '/dashboard',
            title: <HomeOutlined />,
          },
          {
            title: 'Shipping',
          },
          {
            title: 'Methods',
          },
        ]}
      />

      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SendOutlined />
          Shipping Methods
        </Title>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Manage shipping methods and their costs
        </p>
      </div>

      <ShippingMethodList />
    </div>
  );
};

export default ShippingMethodsPage;
