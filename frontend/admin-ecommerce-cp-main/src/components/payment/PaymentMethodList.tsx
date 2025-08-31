'use client';

import React, { useState,useEffect } from 'react';
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
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CreditCardOutlined,
  PercentageOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usePaymentMethods } from '@/hooks/usePayment';
import type { PaymentMethod, PaymentType } from '@/types/payment';
import PaymentMethodForm from './PaymentMethodForm';

const { Title } = Typography;
const { Option } = Select;

interface PaymentMethodListProps {
  onEdit?: (method: PaymentMethod) => void;
  onView?: (method: PaymentMethod) => void;
}

const PaymentMethodList: React.FC<PaymentMethodListProps> = ({
  onEdit,
  onView,
}) => {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<PaymentType | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const {
    methods,
    loading,
    deleteMethod,
    updateMethod,
    fetchMethods,
  } = usePaymentMethods();

  React.useEffect(() => {
  console.log("Fetched methods:", methods);
}, [methods]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleTypeFilter = (value: PaymentType | undefined) => {
    setTypeFilter(value);
  };

  const handleDelete = async (id: number) => {
    await deleteMethod(id);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setIsModalVisible(true);
    if (onEdit) {
      onEdit(method);
    }
  };

  const handleView = (method: PaymentMethod) => {
    if (onView) {
      onView(method);
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    await updateMethod(method.id, { is_active: !method.is_active });
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingMethod(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    fetchMethods();
  };

  // Filter methods based on search text and type
  const filteredMethods = methods.filter(method => {
    const matchesSearch = !searchText || 
      method.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (method.description && method.description.toLowerCase().includes(searchText.toLowerCase())) ||
      method.type.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesType = !typeFilter || method.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getPaymentTypeColor = (type: PaymentType): string => {
    const colors: Record<PaymentType, string> = {
      credit_card: 'blue',
      debit_card: 'cyan',
      paypal: 'purple',
      bank_transfer: 'green',
      cash_on_delivery: 'orange',
      digital_wallet: 'magenta',
      cryptocurrency: 'gold',
      other: 'default',
    };
    return colors[type] || 'default';
  };

  const getPaymentTypeLabel = (type: PaymentType): string => {
    const labels: Record<PaymentType, string> = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      paypal: 'PayPal',
      bank_transfer: 'Bank Transfer',
      cash_on_delivery: 'Cash on Delivery',
      digital_wallet: 'Digital Wallet',
      cryptocurrency: 'Cryptocurrency',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const columns: ColumnsType<PaymentMethod> = [
    {
      title: 'Method Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: PaymentMethod) => (
        <Space>
          <CreditCardOutlined />
          <div>
            <strong>{text}</strong>
            {record.description && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.description}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: PaymentType) => (
        <Tag color={getPaymentTypeColor(type)}>
          {getPaymentTypeLabel(type)}
        </Tag>
      ),
      filters: [
        { text: 'Credit Card', value: 'credit_card' },
        { text: 'Debit Card', value: 'debit_card' },
        { text: 'PayPal', value: 'paypal' },
        { text: 'Bank Transfer', value: 'bank_transfer' },
        { text: 'Cash on Delivery', value: 'cod' },
        { text: 'Digital Wallet', value: 'digital_wallet' },
        { text: 'Cryptocurrency', value: 'cryptocurrency' },
        { text: 'Other', value: 'other' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Processing Fee',
      dataIndex: 'processing_fee',
      key: 'processing_fee',
      render: (fee: number) => (
        <Space>
          <PercentageOutlined />
          <span>{(fee || 0).toFixed(2)}%</span>
        </Space>
      ),
      sorter: (a, b) => (a.processing_fee || 0) - (b.processing_fee || 0),
    },
    {
      title: 'Limits',
      key: 'limits',
      render: (_, record: PaymentMethod) => (
        <div style={{ fontSize: '12px' }}>
          {record.min_amount && (
            <div>Min: ${record.min_amount.toFixed(2)}</div>
          )}
          {record.max_amount && (
            <div>Max: ${record.max_amount.toFixed(2)}</div>
          )}
          {!record.min_amount && !record.max_amount && (
            <span style={{ color: '#666' }}>No limits</span>
          )}
        </div>
      ),
    },
    {
      title: 'Currencies',
      dataIndex: 'supported_currencies',
      key: 'supported_currencies',
      render: (currencies: string[]) => (
        <div>
          {currencies && currencies.length > 0 ? (
            <>
              {currencies.slice(0, 3).map(currency => (
                <Tag key={currency} style={{ margin: '1px', fontSize: '11px' }}>
                  {currency}
                </Tag>
              ))}
              {currencies.length > 3 && (
                <Tooltip title={currencies.slice(3).join(', ')}>
                  <Tag style={{ margin: '1px', fontSize: '11px' }}>
                    +{currencies.length - 3}
                  </Tag>
                </Tooltip>
              )}
            </>
          ) : (
            <span style={{ color: '#666', fontSize: '12px' }}>No currencies</span>
          )}
        </div>
      ),
    },
    // {
    //   title: 'Status',
    //   dataIndex: 'is_active',
    //   key: 'is_active',
    //   render: (isActive: boolean, record: PaymentMethod) => (
    //     <Switch
    //       checked={isActive}
    //       onChange={() => handleToggleActive(record)}
    //       checkedChildren="Active"
    //       unCheckedChildren="Inactive"
    //     />
    //   ),
    //   filters: [
    //     { text: 'Active', value: true },
    //     { text: 'Inactive', value: false },
    //   ],
    //   onFilter: (value, record) => record.is_active === value,
    // },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: PaymentMethod) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this payment method?"
            description="This action cannot be undone."
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
            <Title level={4} style={{ margin: 0 }}>
              Payment Methods
            </Title>
          </Col>
          <Col flex="auto">
            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Select
                  placeholder="Filter by type"
                  allowClear
                  style={{ width: 150 }}
                  value={typeFilter}
                  onChange={handleTypeFilter}
                >
                  <Option value="card">Credit/Debit Card</Option>
                  <Option value="paypal">PayPal</Option>
                  <Option value="cod">Cash on Delivery</Option>
                  {/* <Option value="credit_card">Credit Card</Option>
                  <Option value="debit_card">Debit Card</Option>
                  <Option value="paypal">PayPal</Option>
                  <Option value="bank_transfer">Bank Transfer</Option>
                  <Option value="cod">Cash on Delivery</Option>
                  <Option value="digital_wallet">Digital Wallet</Option>
                  <Option value="cryptocurrency">Cryptocurrency</Option>
                  <Option value="other">Other</Option> */}
                </Select>
              </Col>
              <Col>
                <Input
                  placeholder="Search methods..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 250 }}
                />
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  Add Method
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredMethods}
        rowKey="id"
        loading={loading}
        pagination={{
          total: filteredMethods.length,
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} methods`,
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <PaymentMethodForm
          method={editingMethod}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </Card>
  );
};

export default PaymentMethodList;
