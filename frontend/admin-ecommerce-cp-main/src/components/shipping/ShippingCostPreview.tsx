'use client';

import React from 'react';
import {
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Button,
  Alert,
  Divider,
  Descriptions,
} from 'antd';
import {
  DollarOutlined,
  CalculatorOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ShippingCostPreview, CostBreakdownItem } from '@/types/shipping';

const { Title, Text } = Typography;

interface ShippingCostPreviewProps {
  costPreview: ShippingCostPreview;
  loading: boolean;
  onRefresh: () => void;
  productName?: string;
}

const ShippingCostPreviewComponent: React.FC<ShippingCostPreviewProps> = ({
  costPreview,
  loading,
  onRefresh,
  productName,
}) => {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatAdjustment = (adjustment: number, type?: string) => {
    if (!adjustment) return null;
    const sign = adjustment >= 0 ? '+' : '';
    const formattedValue = `${sign}${formatCurrency(adjustment)}`;
    
    if (type === 'per_item') {
      return `${formattedValue} per item`;
    }
    return `${formattedValue} flat`;
  };

  const columns: ColumnsType<CostBreakdownItem> = [
    {
      title: 'Quantity Range',
      dataIndex: 'quantity_range',
      key: 'quantity_range',
      render: (range: string) => (
        <Tag color="blue">{range}</Tag>
      ),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => (
        <Space>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <Text strong>{formatCurrency(cost)}</Text>
        </Space>
      ),
    },
    {
      title: 'Adjustment',
      key: 'adjustment',
      render: (_, record: CostBreakdownItem) => {
        if (!record.adjustment) {
          return <Tag color="default">No adjustment</Tag>;
        }
        
        const isIncrease = record.adjustment >= 0;
        return (
          <Space direction="vertical" size="small">
            <Tag color={isIncrease ? 'green' : 'red'}>
              {formatAdjustment(record.adjustment, record.adjustment_type)}
            </Tag>
            {record.priority && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Priority: {record.priority}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => (
        <Text type="secondary">{description}</Text>
      ),
    },
  ];

  const hasCustomRules = costPreview.has_product_rules;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <CalculatorOutlined style={{ marginRight: 8 }} />
          Shipping Cost Preview
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={loading}
          size="small"
        >
          Refresh
        </Button>
      </div>

      {productName && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Cost calculations for: <Text strong>{productName}</Text>
        </Text>
      )}

      <Descriptions
        bordered
        size="small"
        column={2}
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'method',
            label: 'Shipping Method ID',
            children: <Tag color="blue">{costPreview.shipping_method_id}</Tag>,
          },
          {
            key: 'base_cost',
            label: 'Base Cost',
            children: (
              <Space>
                <DollarOutlined style={{ color: '#1890ff' }} />
                <Text strong>{formatCurrency(costPreview.base_cost)}</Text>
              </Space>
            ),
          },
          {
            key: 'delivery',
            label: 'Delivery Days',
            children: (
              <Space>
                <ClockCircleOutlined style={{ color: '#52c41a' }} />
                <Text>{costPreview.delivery_days} days</Text>
              </Space>
            ),
          },
          {
            key: 'rules',
            label: 'Custom Rules',
            children: hasCustomRules ? (
              <Tag color="green" icon={<InfoCircleOutlined />}>
                Active
              </Tag>
            ) : (
              <Tag color="default">None</Tag>
            ),
          },
        ]}
      />

      {hasCustomRules && (
        <Alert
          message="Custom Shipping Rules Active"
          description="This product has custom shipping rules that modify the default shipping costs based on quantity ranges."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Title level={5} style={{ marginBottom: 16 }}>
        Cost Breakdown by Quantity
      </Title>

      {costPreview.cost_breakdown.length === 0 ? (
        <Alert
          message="No Cost Breakdown Available"
          description="Unable to calculate shipping cost breakdown. Please ensure shipping methods are configured."
          type="warning"
          showIcon
        />
      ) : (
        <Table
          columns={columns}
          dataSource={costPreview.cost_breakdown.map((item, index) => ({ ...item, _key: `${item.quantity_range}-${index}` }))}
          rowKey="_key"
          loading={loading}
          pagination={false}
          size="small"
          locale={{
            emptyText: 'No cost breakdown data available',
          }}
        />
      )}

      <Divider />
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        <Text type="secondary">
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          Cost preview shows how shipping rules affect the final shipping cost for this product.
          Adjustments are applied based on quantity ranges and rule priority.
        </Text>
      </div>
    </Card>
  );
};

export default ShippingCostPreviewComponent;
