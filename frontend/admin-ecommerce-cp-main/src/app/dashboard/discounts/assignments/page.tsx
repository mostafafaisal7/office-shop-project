'use client';

import React from 'react';
import { Card, Typography, Breadcrumb } from 'antd';
import { HomeOutlined, PercentageOutlined, LinkOutlined } from '@ant-design/icons';
import DiscountAssignmentList from '@/components/discount/DiscountAssignmentList';

const { Title } = Typography;

const DiscountAssignmentsPage: React.FC = () => {
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
            title: 'Assignments',
          },
        ]}
      />

      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LinkOutlined />
          Discount Assignments
        </Title>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Assign discount rules to products and manage existing assignments
        </p>
      </div>

      <DiscountAssignmentList />
    </div>
  );
};

export default DiscountAssignmentsPage;
