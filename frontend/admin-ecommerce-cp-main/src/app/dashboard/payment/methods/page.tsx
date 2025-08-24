'use client';

import React from 'react';
import { Card, Typography, Breadcrumb } from 'antd';
import { HomeOutlined, CreditCardOutlined } from '@ant-design/icons';
import PaymentMethodList from '@/components/payment/PaymentMethodList';

const { Title } = Typography;

const PaymentMethodsPage: React.FC = () => {
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
            title: 'Payment',
          },
          {
            title: 'Methods',
          },
        ]}
      />

      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCardOutlined />
          Payment Methods
        </Title>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Manage payment methods, processing fees, and supported currencies
        </p>
      </div>

      <PaymentMethodList />
    </div>
  );
};

export default PaymentMethodsPage;
