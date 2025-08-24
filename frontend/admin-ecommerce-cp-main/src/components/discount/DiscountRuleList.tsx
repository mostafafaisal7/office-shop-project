'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PercentageOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDiscountRules } from '@/hooks/useDiscount';
import type { DiscountRule } from '@/types/discount';
import DiscountRuleForm from './DiscountRuleForm';

const { Title } = Typography;
const { Option } = Select;

interface DiscountRuleListProps {
  onEdit?: (rule: DiscountRule) => void;
  onView?: (rule: DiscountRule) => void;
}

const DiscountRuleList: React.FC<DiscountRuleListProps> = ({
  onEdit,
  onView,
}) => {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null);

  // Debounce search text to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchText]);

  const {
    rules,
    total,
    loading,
    deleteRule,
    toggleRule,
    fetchRules,
  } = useDiscountRules({
    search: debouncedSearchText || undefined,
    is_active: statusFilter,
  });

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusFilter = (value: boolean | undefined) => {
    setStatusFilter(value);
  };

  const handleDelete = async (id: number) => {
    await deleteRule(id);
  };

  const handleEdit = (rule: DiscountRule) => {
    setEditingRule(rule);
    setIsModalVisible(true);
    if (onEdit) {
      onEdit(rule);
    }
  };

  const handleView = (rule: DiscountRule) => {
    if (onView) {
      onView(rule);
    }
  };

  const handleToggleActive = async (rule: DiscountRule) => {
    await toggleRule(rule.id);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingRule(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    fetchRules();
  };

  const formatDiscountValue = (value: number, type: 'percentage' | 'fixed') => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return `$${value.toFixed(2)}`;
  };

  const columns: ColumnsType<DiscountRule> = [
    {
      title: 'Rule Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <strong>{text}</strong>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <span style={{ color: '#666' }}>
          {text.length > 50 ? `${text.substring(0, 50)}...` : text}
        </span>
      ),
    },
    {
      title: 'Min Quantity',
      dataIndex: 'min_quantity',
      key: 'min_quantity',
      render: (quantity: number) => (
        <Tag color="blue">{quantity}+ items</Tag>
      ),
      sorter: (a, b) => a.min_quantity - b.min_quantity,
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record: DiscountRule) => (
        <Space>
          {record.discount_type === 'percentage' ? (
            <PercentageOutlined style={{ color: '#52c41a' }} />
          ) : (
            <DollarOutlined style={{ color: '#1890ff' }} />
          )}
          <span style={{ fontWeight: 'bold' }}>
            {formatDiscountValue(record.discount_value, record.discount_type)}
          </span>
        </Space>
      ),
      sorter: (a, b) => a.discount_value - b.discount_value,
    },
    {
      title: 'Type',
      dataIndex: 'discount_type',
      key: 'discount_type',
      render: (type: 'percentage' | 'fixed') => (
        <Tag color={type === 'percentage' ? 'green' : 'blue'}>
          {type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
        </Tag>
      ),
      filters: [
        { text: 'Percentage', value: 'percentage' },
        { text: 'Fixed Amount', value: 'fixed' },
      ],
      onFilter: (value, record) => record.discount_type === value,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: DiscountRule) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          size="small"
        />
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Created',
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
      render: (_, record: DiscountRule) => (
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
            title="Delete Discount Rule"
            description="Are you sure you want to delete this discount rule? This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
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
            <Title level={4} style={{ margin: 0 }}>
              Discount Rules
            </Title>
          </Col>
          <Col flex="auto">
            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Input
                  placeholder="Search rules..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 250 }}
                  allowClear
                />
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
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  Add Rule
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
          total: total,
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} rules`,
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingRule ? 'Edit Discount Rule' : 'Create Discount Rule'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        destroyOnClose
      >
        <DiscountRuleForm
          rule={editingRule}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </Card>
  );
};

export default DiscountRuleList;
