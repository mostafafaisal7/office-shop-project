'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Tag,
  Typography,
  Modal,
  Tooltip,
  Badge,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  ShoppingOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ProductShippingRule } from '@/types/shipping';
import ProductShippingRuleForm from './ProductShippingRuleForm';

const { Text } = Typography;

interface ProductShippingRuleListProps {
  rules: ProductShippingRule[];
  loading: boolean;
  onEdit: (ruleId: number, data: any) => Promise<void>;
  onDelete: (ruleId: number) => Promise<void>;
  productId: number;
}

const ProductShippingRuleList: React.FC<ProductShippingRuleListProps> = ({
  rules,
  loading,
  onEdit,
  onDelete,
  productId,
}) => {
  const [editingRule, setEditingRule] = useState<ProductShippingRule | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleEdit = (rule: ProductShippingRule) => {
    setEditingRule(rule);
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async (values: any) => {
    if (editingRule) {
      await onEdit(editingRule.id, values);
      setIsEditModalVisible(false);
      setEditingRule(null);
    }
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingRule(null);
  };

  const formatCostAdjustment = (value: number, type: 'per_item' | 'flat_rate') => {
    const sign = value >= 0 ? '+' : '';
    const formattedValue = `${sign}$${value.toFixed(2)}`;
    
    if (type === 'per_item') {
      return `${formattedValue} per item`;
    }
    return `${formattedValue} flat`;
  };

  const formatQuantityRange = (minQty: number, maxQty: number | null) => {
    if (maxQty === null) {
      return `${minQty}+`;
    }
    return `${minQty}-${maxQty}`;
  };

  const columns: ColumnsType<ProductShippingRule> = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a, b) => a.priority - b.priority,
      render: (priority: number) => (
        <Badge count={priority} color="blue" />
      ),
    },
    {
      title: 'Shipping Method',
      key: 'shipping_method',
      render: (_, record: ProductShippingRule) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.shipping_method?.name || `Method ID: ${record.shipping_method_id}`}
          </div>
          {record.shipping_method && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              Base: ${record.shipping_method.cost} | {record.shipping_method.delivery_days} days
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Quantity Range',
      key: 'quantity_range',
      render: (_, record: ProductShippingRule) => (
        <Tag icon={<ShoppingOutlined />} color="geekblue">
          {formatQuantityRange(record.min_quantity, record.max_quantity)}
        </Tag>
      ),
    },
    {
      title: 'Cost Adjustment',
      key: 'cost_adjustment',
      render: (_, record: ProductShippingRule) => {
        const isIncrease = record.cost_adjustment >= 0;
        return (
          <Space>
            <DollarOutlined style={{ color: isIncrease ? '#52c41a' : '#ff4d4f' }} />
            <Text style={{ 
              color: isIncrease ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold' 
            }}>
              {formatCostAdjustment(record.cost_adjustment, record.adjustment_type)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record: ProductShippingRule) => (
        <Space size="small">
          <Tooltip title="Edit rule">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Shipping Rule"
            description="Are you sure you want to delete this shipping rule?"
            onConfirm={() => onDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete rule">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
        locale={{
          emptyText: 'No shipping rules configured for this product',
        }}
      />

      <Modal
        title="Edit Shipping Rule"
        open={isEditModalVisible}
        onCancel={handleEditCancel}
        footer={null}
        width={700}
        destroyOnClose
      >
        {editingRule && (
          <ProductShippingRuleForm
            initialValues={{
              shipping_method_id: editingRule.shipping_method_id,
              min_quantity: editingRule.min_quantity,
              max_quantity: editingRule.max_quantity,
              cost_adjustment: editingRule.cost_adjustment,
              adjustment_type: editingRule.adjustment_type,
              is_active: editingRule.is_active,
              priority: editingRule.priority,
            }}
            onFinish={handleEditSubmit}
            onCancel={handleEditCancel}
            loading={loading}
            isEdit={true}
          />
        )}
      </Modal>
    </>
  );
};

export default ProductShippingRuleList;
