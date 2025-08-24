'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Popconfirm,
  Tag,
  Typography,
  Modal,
  Empty,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  PercentageOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useProductDiscountAssignments } from '@/hooks/useDiscount';
import type { DiscountAssignment } from '@/types/discount';
import DiscountAssignmentForm from './DiscountAssignmentForm';

const { Title } = Typography;

interface ProductDiscountManagerProps {
  productId: number;
  productName?: string;
}

const ProductDiscountManager: React.FC<ProductDiscountManagerProps> = ({
  productId,
  productName,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const {
    assignments,
    loading,
    removeAssignment,
    fetchProductAssignments,
  } = useProductDiscountAssignments(productId);

  const handleDelete = async (assignmentId: number) => {
    await removeAssignment(assignmentId);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    fetchProductAssignments(productId);
  };

  const formatDiscountValue = (value: number, type: 'percentage' | 'fixed') => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return `$${value.toFixed(2)}`;
  };

  const columns: ColumnsType<DiscountAssignment> = [
    {
      title: 'Rule Name',
      key: 'rule_name',
      render: (_, record: DiscountAssignment) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.discount_rule?.name || `Rule ID: ${record.discount_rule_id}`}
          </div>
          {record.discount_rule?.description && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.discount_rule.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record: DiscountAssignment) => {
        if (!record.discount_rule) return '-';
        
        return (
          <Space>
            {record.discount_rule.discount_type === 'percentage' ? (
              <PercentageOutlined style={{ color: '#52c41a' }} />
            ) : (
              <DollarOutlined style={{ color: '#1890ff' }} />
            )}
            <span style={{ fontWeight: 'bold' }}>
              {formatDiscountValue(record.discount_rule.discount_value, record.discount_rule.discount_type)}
            </span>
          </Space>
        );
      },
    },
    {
      title: 'Min Quantity',
      key: 'min_quantity',
      render: (_, record: DiscountAssignment) => (
        <Tag color="blue">
          {record.discount_rule?.min_quantity || 0}+ items
        </Tag>
      ),
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
      render: (_, record: DiscountAssignment) => (
        <Popconfirm
          title="Remove Discount"
          description="Are you sure you want to remove this discount from the product?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes, Remove"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
          >
            Remove
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          Product Discounts
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Add Discount
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Empty
          description="No discount rules assigned to this product"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Assign Discount Rule
          </Button>
        </Empty>
      ) : (
        <>
          <Alert
            message="Active Discounts"
            description={`This product has ${assignments.filter(a => a.is_active).length} active discount rule(s) assigned.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Table
            columns={columns}
            dataSource={assignments}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        </>
      )}

      <Modal
        title={`Assign Discount to ${productName || 'Product'}`}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        destroyOnClose
      >
        <DiscountAssignmentForm
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
          mode="single"
        />
      </Modal>
    </Card>
  );
};

export default ProductDiscountManager;
