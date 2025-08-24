'use client';

import React from 'react';
import { Card, Typography, Breadcrumb } from 'antd';
import { HomeOutlined, PercentageOutlined } from '@ant-design/icons';
import DiscountRuleList from '@/components/discount/DiscountRuleList';

const { Title } = Typography;

const DiscountRulesPage: React.FC = () => {
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
            title: 'Discounts',
          },
          {
            title: 'Rules',
          },
        ]}
      />

      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PercentageOutlined />
          Discount Rules
        </Title>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Create and manage discount rules based on quantity thresholds
        </p>
      </div>

      <DiscountRuleList />
    </div>
  );
};

export default DiscountRulesPage;
