'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Tag,
  Card,
  Input,
  Row,
  Col,
  Typography,
  Modal,
  Select,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDiscountAssignments, useDiscountRules } from '@/hooks/useDiscount';
import type { DiscountAssignment } from '@/types/discount';
import DiscountAssignmentForm from './DiscountAssignmentForm';

const { Title } = Typography;
const { Option } = Select;

interface DiscountAssignmentListProps {
  onEdit?: (assignment: DiscountAssignment) => void;
  onView?: (assignment: DiscountAssignment) => void;
}

const DiscountAssignmentList: React.FC<DiscountAssignmentListProps> = ({
  onEdit,
  onView,
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [ruleFilter, setRuleFilter] = useState<number | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBulkModalVisible, setIsBulkModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<DiscountAssignment | null>(null);

  const {
    assignments,
    total,
    loading,
    deleteAssignment,
    fetchAssignments,
  } = useDiscountAssignments({
    is_active: statusFilter,
    discount_rule_id: ruleFilter,
  });

  const { rules } = useDiscountRules();

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusFilter = (value: boolean | undefined) => {
    setStatusFilter(value);
  };

  const handleRuleFilter = (value: number | undefined) => {
    setRuleFilter(value);
  };

  const handleDelete = async (id: number) => {
    await deleteAssignment(id);
  };

  const handleEdit = (assignment: DiscountAssignment) => {
    setEditingAssignment(assignment);
    setIsModalVisible(true);
    if (onEdit) {
      onEdit(assignment);
    }
  };

  const handleView = (assignment: DiscountAssignment) => {
    if (onView) {
      onView(assignment);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingAssignment(null);
  };

  const handleBulkModalClose = () => {
    setIsBulkModalVisible(false);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    handleBulkModalClose();
    fetchAssignments();
  };

  const formatDiscountValue = (value: number, type: 'percentage' | 'fixed') => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Filter assignments based on search text
  const filteredAssignments = (assignments || []).filter(assignment =>
    !searchText || 
    (assignment.product_name && assignment.product_name.toLowerCase().includes(searchText.toLowerCase())) ||
    (assignment.discount_rule?.name && assignment.discount_rule.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  const menuItems = [
    {
      key: 'single',
      icon: <UserOutlined />,
      label: 'Single Assignment',
      onClick: () => setIsModalVisible(true),
    },
    {
      key: 'bulk',
      icon: <TeamOutlined />,
      label: 'Bulk Assignment',
      onClick: () => setIsBulkModalVisible(true),
    },
  ];

  const columns: ColumnsType<DiscountAssignment> = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record: DiscountAssignment) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.product_name || `Product ID: ${record.product_id}`}
          </div>
          {record.product_sku && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              SKU: {record.product_sku}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.product_name || '').localeCompare(b.product_name || ''),
    },
    {
      title: 'Discount Rule',
      key: 'discount_rule',
      render: (_, record: DiscountAssignment) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.discount_rule?.name || `Rule ID: ${record.discount_rule_id}`}
          </div>
          {record.discount_rule && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              {formatDiscountValue(record.discount_rule.discount_value, record.discount_rule.discount_type)} 
              {' '}(Min: {record.discount_rule.min_quantity} items)
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Discount Details',
      key: 'discount_details',
      render: (_, record: DiscountAssignment) => {
        if (!record.discount_rule) return '-';
        
        return (
          <Space direction="vertical" size="small">
            <Tag color={record.discount_rule.discount_type === 'percentage' ? 'green' : 'blue'}>
              {formatDiscountValue(record.discount_rule.discount_value, record.discount_rule.discount_type)}
            </Tag>
            <Tag color="orange">
              Min: {record.discount_rule.min_quantity} items
            </Tag>
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
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Assigned Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <span>{new Date(date).toLocaleDateString()}</span>
      ),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: DiscountAssignment) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Remove Discount Assignment"
            description="Are you sure you want to remove this discount assignment?"
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
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Discount Assignments
            </Title>
          </Col>
          <Col flex="auto">
            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Input
                  placeholder="Search assignments..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 250 }}
                  allowClear
                />
              </Col>
              <Col>
                <Select
                  placeholder="Filter by rule"
                  value={ruleFilter}
                  onChange={handleRuleFilter}
                  style={{ width: 200 }}
                  allowClear
                >
                  {(rules || []).map(rule => (
                    <Option key={rule.id} value={rule.id}>
                      {rule.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="Filter by status"
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  style={{ width: 150 }}
                  allowClear
                >
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
                </Select>
              </Col>
              <Col>
                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Assign Discount <MoreOutlined />
                  </Button>
                </Dropdown>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredAssignments}
        rowKey="id"
        loading={loading}
        pagination={{
          total: total,
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} assignments`,
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <DiscountAssignmentForm
          assignment={editingAssignment}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
          mode="single"
        />
      </Modal>

      <Modal
        title="Bulk Assign Discount Rule"
        open={isBulkModalVisible}
        onCancel={handleBulkModalClose}
        footer={null}
        width={700}
        destroyOnHidden
      >
        <DiscountAssignmentForm
          onSuccess={handleFormSuccess}
          onCancel={handleBulkModalClose}
          mode="bulk"
        />
      </Modal>
    </Card>
  );
};

export default DiscountAssignmentList;
