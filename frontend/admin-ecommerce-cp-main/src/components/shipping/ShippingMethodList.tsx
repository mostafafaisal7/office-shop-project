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
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DollarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useShippingMethods } from '@/hooks/useShipping';
import type { ShippingMethod } from '@/types/shipping';
import ShippingMethodForm from './ShippingMethodForm';
import ShippingCostRuleList from './ShippingCostRuleList';

const { Title } = Typography;

interface ShippingMethodListProps {
  onEdit?: (method: ShippingMethod) => void;
  onView?: (method: ShippingMethod) => void;
}

const ShippingMethodList: React.FC<ShippingMethodListProps> = ({
  onEdit,
  onView,
}) => {
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [isRulesModalVisible, setIsRulesModalVisible] = useState(false);
  const [selectedMethodForRules, setSelectedMethodForRules] = useState<ShippingMethod | null>(null);

  const {
    methods,
    loading,
    deleteMethod,
    updateMethod,
    fetchMethods,
  } = useShippingMethods();

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDelete = async (id: number) => {
    await deleteMethod(id);
  };

  const handleEdit = (method: ShippingMethod) => {
    setEditingMethod(method);
    setIsModalVisible(true);
    if (onEdit) {
      onEdit(method);
    }
  };

  const handleView = (method: ShippingMethod) => {
    if (onView) {
      onView(method);
    }
  };

  const handleToggleActive = async (method: ShippingMethod) => {
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

  const handleManageRules = (method: ShippingMethod) => {
    setSelectedMethodForRules(method);
    setIsRulesModalVisible(true);
  };

  const handleRulesModalClose = () => {
    setIsRulesModalVisible(false);
    setSelectedMethodForRules(null);
  };

  // Filter methods based on search text
  const filteredMethods = methods.filter(method =>
    !searchText || 
    method.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (method.description && method.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns: ColumnsType<ShippingMethod> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string | null) => (
        <span>{text || 'No description'}</span>
      ),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => (
        <Space>
          <DollarOutlined />
          <span>${cost.toFixed(2)}</span>
        </Space>
      ),
      sorter: (a, b) => a.cost - b.cost,
    },
    {
      title: 'Delivery Days',
      dataIndex: 'delivery_days',
      key: 'delivery_days',
      render: (days: number) => (
        <span>{days} {days === 1 ? 'day' : 'days'}</span>
      ),
      sorter: (a, b) => a.delivery_days - b.delivery_days,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: ShippingMethod) => (
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
      render: (_, record: ShippingMethod) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={() => handleManageRules(record)}
          >
            Manage Rules
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this shipping method?"
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
              Shipping Methods
            </Title>
          </Col>
          <Col flex="auto">
            <Row gutter={[16, 16]} justify="end">
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
      />

      <Modal
        title={editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={500}
      >
        <ShippingMethodForm
          method={editingMethod}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>

      <Modal
        title="Manage Cost Rules"
        open={isRulesModalVisible}
        onCancel={handleRulesModalClose}
        footer={null}
        width={900}
      >
        {selectedMethodForRules && (
          <ShippingCostRuleList
            methodId={selectedMethodForRules.id}
            methodName={selectedMethodForRules.name}
          />
        )}
      </Modal>
    </Card>
  );
};

export default ShippingMethodList;
