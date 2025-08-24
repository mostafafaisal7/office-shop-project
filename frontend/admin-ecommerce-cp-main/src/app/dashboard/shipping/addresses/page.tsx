'use client';

import React from 'react';
import { Card, Typography, Breadcrumb } from 'antd';
import { HomeOutlined, TruckOutlined } from '@ant-design/icons';
import ShippingAddressList from '@/components/shipping/ShippingAddressList';

const { Title } = Typography;

const ShippingAddressesPage: React.FC = () => {
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
            title: 'Addresses',
          },
        ]}
      />

      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TruckOutlined />
          Shipping Addresses
        </Title>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Manage shipping addresses for users and guests
        </p>
      </div>

      <ShippingAddressList />
    </div>
  );
};

export default ShippingAddressesPage;
