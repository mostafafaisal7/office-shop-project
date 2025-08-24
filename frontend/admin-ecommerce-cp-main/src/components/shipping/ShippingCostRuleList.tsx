'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Modal,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useShippingCostRules } from '@/hooks/useShipping';
import type { ShippingCostRule } from '@/types/shipping';
import ShippingCostRuleForm from './ShippingCostRuleForm';

const { Title } = Typography;

interface ShippingCostRuleListProps {
  methodId: number;
  methodName: string;
}

const ShippingCostRuleList: React.FC<ShippingCostRuleListProps> = ({
  methodId,
  methodName,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingCostRule | null>(null);

  const {
    rules,
    loading,
    deleteRule,
    updateRule,
    fetchRules,
  } = useShippingCostRules(methodId);

  const handleDelete = async (id: number) => {
    await deleteRule(id);
  };

  const handleEdit = (rule: ShippingCostRule) => {
    setEditingRule(rule);
    setIsModalVisible(true);
  };

  const handleToggleActive = async (rule: ShippingCostRule) => {
    await updateRule(rule.id, { is_active: !rule.is_active });
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingRule(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    fetchRules(methodId);
  };

  const getAdjustmentTypeDisplay = (type: string) => {
    switch (type) {
      case 'per_item':
        return <Tag color="blue">Per Item</Tag>;
      case 'fixed':
        return <Tag color="green">Fixed Amount</Tag>;
      case 'percentage':
        return <Tag color="orange">Percentage</Tag>;
      default:
        return <Tag>{type}</Tag>;
    }
  };

  const getQuantityRangeDisplay = (minQty: number, maxQty: number | null) => {
    if (maxQty === null) {
      return `${minQty}+`;
    }
    return `${minQty} - ${maxQty}`;
  };

  const getCostAdjustmentDisplay = (adjustment: number, type: string) => {
    const prefix = adjustment >= 0 ? '+' : '';
    const suffix = type === 'percentage' ? '%' : '';
    const symbol = type === 'percentage' ? '' : '$';
    
    return (
      <Space>
        <DollarOutlined />
        <span style={{ color: adjustment >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {prefix}{symbol}{adjustment.toFixed(2)}{suffix}
        </span>
      </Space>
    );
  };

  const columns: ColumnsType<ShippingCostRule> = [
    {
      title: 'Quantity Range',
      key: 'quantity_range',
      render: (_, record: ShippingCostRule) => (
        <span>{getQuantityRangeDisplay(record.min_quantity, record.max_quantity)}</span>
      ),
      sorter: (a, b) => a.min_quantity - b.min_quantity,
    },
    {
      title: 'Adjustment Type',
      dataIndex: 'adjustment_type',
      key: 'adjustment_type',
      render: (type: string) => getAdjustmentTypeDisplay(type),
      filters: [
        { text: 'Per Item', value: 'per_item' },
        { text: 'Fixed Amount', value: 'fixed' },
        { text: 'Percentage', value: 'percentage' },
      ],
      onFilter: (value, record) => record.adjustment_type === value,
    },
    {
      title: 'Cost Adjustment',
      dataIndex: 'cost_adjustment',
      key: 'cost_adjustment',
      render: (adjustment: number, record: ShippingCostRule) => 
        getCostAdjustmentDisplay(adjustment, record.adjustment_type),
      sorter: (a, b) => a.cost_adjustment - b.cost_adjustment,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: ShippingCostRule) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: ShippingCostRule) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this cost rule?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Title level={5} style={{ margin: 0 }}>
              Cost Rules for {methodName}
            </Title>
          </Col>
          <Col flex="auto">
            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  Add Cost Rule
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        loading={loading}
        pagination={{
          total: rules.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} rules`,
        }}
        size="small"
      />

      <Modal
        title={editingRule ? 'Edit Cost Rule' : 'Add Cost Rule'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <ShippingCostRuleForm
          methodId={methodId}
          rule={editingRule}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </Card>
  );
};

export default ShippingCostRuleList;
