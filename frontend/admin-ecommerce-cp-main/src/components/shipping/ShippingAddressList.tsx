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
  Select,
  Row,
  Col,
  Typography,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useShippingAddresses } from '@/hooks/useShipping';
import type { ShippingAddress, ShippingAddressListParams } from '@/types/shipping';
import ShippingAddressForm from './ShippingAddressForm';

const { Title } = Typography;
const { Option } = Select;

interface ShippingAddressListProps {
  onEdit?: (address: ShippingAddress) => void;
  onView?: (address: ShippingAddress) => void;
}

const ShippingAddressList: React.FC<ShippingAddressListProps> = ({
  onEdit,
  onView,
}) => {
  const [params, setParams] = useState<ShippingAddressListParams>({
    skip: 0,
    limit: 20,
  });
  const [searchText, setSearchText] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);

  const {
    addresses,
    loading,
    deleteAddress,
    fetchAddresses,
  } = useShippingAddresses(params);

  const handleSearch = (value: string) => {
    setSearchText(value);
    // Note: The API doesn't seem to support text search, so we'll filter client-side
  };

  const handleUserFilter = (userId: number | undefined) => {
    setSelectedUserId(userId);
    setParams(prev => ({
      ...prev,
      user_id: userId,
      skip: 0,
    }));
  };

  const handleDelete = async (id: string) => {
    await deleteAddress(id);
  };

  const handleEdit = (address: ShippingAddress) => {
    setEditingAddress(address);
    setIsModalVisible(true);
    if (onEdit) {
      onEdit(address);
    }
  };

  const handleView = (address: ShippingAddress) => {
    if (onView) {
      onView(address);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingAddress(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    fetchAddresses();
  };

  // Filter addresses based on search text
  const filteredAddresses = addresses.filter(address =>
    !searchText || 
    address.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
    address.email.toLowerCase().includes(searchText.toLowerCase()) ||
    address.phone.includes(searchText) ||
    address.address_line.toLowerCase().includes(searchText.toLowerCase()) ||
    address.city.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<ShippingAddress> = [
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string, record: ShippingAddress) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record: ShippingAddress) => (
        <Space direction="vertical" size="small">
          <Space>
            <MailOutlined />
            <span>{record.email}</span>
          </Space>
          <Space>
            <PhoneOutlined />
            <span>{record.phone}</span>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Address',
      key: 'address',
      render: (_, record: ShippingAddress) => (
        <Space direction="vertical" size="small">
          <Space>
            <HomeOutlined />
            <span>{record.address_line}</span>
          </Space>
          <span>{record.city}, {record.state} {record.postal_code}</span>
          <span>{record.country}</span>
        </Space>
      ),
    },
    {
      title: 'User Type',
      key: 'user_type',
      render: (_, record: ShippingAddress) => (
        <Tag color={record.user_id ? 'blue' : 'orange'}>
          {record.user_id ? `User ID: ${record.user_id}` : `Guest: ${record.guest_id}`}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: ShippingAddress) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this address?"
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
              Shipping Addresses
            </Title>
          </Col>
          <Col flex="auto">
            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Input
                  placeholder="Search addresses..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 250 }}
                />
              </Col>
              <Col>
                <Select
                  placeholder="Filter by User ID"
                  value={selectedUserId}
                  onChange={handleUserFilter}
                  style={{ width: 150 }}
                  allowClear
                >
                  {/* You might want to populate this with actual user IDs */}
                  <Option value={1}>User 1</Option>
                  <Option value={2}>User 2</Option>
                </Select>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  Add Address
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredAddresses}
        rowKey="id"
        loading={loading}
        pagination={{
          total: filteredAddresses.length,
          pageSize: params.limit || 20,
          current: Math.floor((params.skip || 0) / (params.limit || 20)) + 1,
          onChange: (page, pageSize) => {
            setParams(prev => ({
              ...prev,
              skip: (page - 1) * (pageSize || 20),
              limit: pageSize || 20,
            }));
          },
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} addresses`,
        }}
      />

      <Modal
        title={editingAddress ? 'Edit Shipping Address' : 'Add Shipping Address'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <ShippingAddressForm
          address={editingAddress}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </Card>
  );
};

export default ShippingAddressList;
