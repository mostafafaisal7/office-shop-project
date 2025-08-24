import { Table, Button, Space, Typography, Tag, Modal, Card, Input, Select, Row, Col, Statistic, Tooltip, Badge, Dropdown, Switch, Tree } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, MoreOutlined, TagsOutlined, CheckCircleOutlined, CloseCircleOutlined, BranchesOutlined } from '@ant-design/icons';
import { useCategories } from '@/hooks/useCategories';
import { CategoryOut } from '@/types/product';
import Link from 'next/link';
import { useState } from 'react';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Search } = Input;
const { Option } = Select;

export default function CategoryList() {
  const { 
    categories, 
    loading, 
    error, 
    response, 
    filters, 
    setFilters, 
    deleteCategory, 
    toggleCategoryStatus, 
    handleTableChange,
    categoryTree 
  } = useCategories();
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [parentFilter, setParentFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

  const showDeleteConfirm = (id: number, categoryName: string) => {
    confirm({
      title: 'Delete Category',
      content: (
        <div>
          <p>Are you sure you want to delete <strong>"{categoryName}"</strong>?</p>
          <p style={{ color: '#ff4d4f', fontSize: '14px' }}>This action cannot be undone and will remove all subcategories and associated data.</p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      width: 480,
      onOk() {
        deleteCategory(id);
      },
    });
  };

  const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    try {
      await toggleCategoryStatus(id, !currentStatus);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({
      ...filters,
      search: value || undefined,
      page: 1
    });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setFilters({
      ...filters,
      is_active: value === 'all' ? undefined : value === 'active',
      page: 1
    });
  };

  const handleParentFilter = (value: string) => {
    setParentFilter(value);
    setFilters({
      ...filters,
      parent_id: value === 'all' ? undefined : value === 'root' ? null : parseInt(value),
      page: 1
    });
  };

  // Calculate statistics
  const totalCategories = response?.total || 0;
  const activeCategories = categories?.filter(c => c.is_active).length || 0;
  const parentCategories = categories?.filter(c => !c.parent_id).length || 0;
  const childCategories = categories?.filter(c => c.parent_id).length || 0;

  const getActionMenuItems = (record: CategoryOut) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: (
        <Link href={`/dashboard/categories/${record.id}`}>
          View Details
        </Link>
      ),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: (
        <Link href={`/dashboard/categories/${record.id}/edit`}>
          Edit Category
        </Link>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'toggle-status',
      icon: record.is_active ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
      label: record.is_active ? 'Deactivate Category' : 'Activate Category',
      onClick: () => handleStatusToggle(record.id, record.is_active),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Category',
      danger: true,
      onClick: () => showDeleteConfirm(record.id, record.name),
    },
  ];

  const columns = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      sorter: true,
      render: (_: any, record: CategoryOut) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '8px',
            background: record.is_active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d9d9d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px'
          }}>
            <TagsOutlined />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: '600', 
              fontSize: '14px',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <Link 
                href={`/dashboard/categories/${record.id}`}
                style={{ color: '#1890ff', textDecoration: 'none' }}
              >
                {record.name}
              </Link>
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              marginBottom: '2px'
            }}>
              Slug: {record.slug}
            </div>
            {record.description && (
              <div style={{ 
                fontSize: '12px', 
                color: '#999',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {record.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      width: 120,
      render: (_: any, record: CategoryOut) => (
        <Tag 
          color={record.parent_id ? '#52c41a' : '#1890ff'}
          style={{ 
            borderRadius: '16px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '500',
            border: 'none'
          }}
        >
          {record.parent_id ? 'Subcategory' : 'Parent'}
        </Tag>
      ),
    },
    {
      title: 'Parent Category',
      key: 'parent',
      width: 150,
      render: (_: any, record: CategoryOut) => {
        if (!record.parent_id) return <Text type="secondary">-</Text>;
        
        const parent = categories.find(c => c.id === record.parent_id);
        return parent ? (
          <Link href={`/dashboard/categories/${parent.id}`} style={{ color: '#1890ff' }}>
            {parent.name}
          </Link>
        ) : (
          <Text type="secondary">Unknown</Text>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: CategoryOut) => (
        <Badge 
          status={record.is_active ? 'success' : 'error'} 
          text={record.is_active ? 'Active' : 'Inactive'}
          style={{ fontSize: '12px' }}
        />
      ),
    },
    {
      title: 'Active',
      key: 'is_active',
      width: 80,
      render: (_: any, record: CategoryOut) => (
        <Switch
          checked={record.is_active}
          onChange={(checked) => handleStatusToggle(record.id, !checked)}
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: CategoryOut) => (
        <Space size="small">
          <Tooltip title="Edit Category">
            <Link href={`/dashboard/categories/${record.id}/edit`}>
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                size="small"
                style={{ color: '#1890ff' }}
              />
            </Link>
          </Tooltip>
          <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']} placement="bottomRight">
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              size="small"
              style={{ color: '#666' }}
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Convert category tree to Ant Design Tree format
  const convertToTreeData = (categories: CategoryOut[]): any[] => {
    return categories.map(category => ({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{category.name}</span>
          <Badge status={category.is_active ? 'success' : 'error'} />
          <Tag color={category.parent_id ? '#52c41a' : '#1890ff'} style={{ fontSize: '11px' }}>
            {category.parent_id ? 'Sub' : 'Parent'}
          </Tag>
        </div>
      ),
      key: category.id,
      children: category.children ? convertToTreeData(category.children) : undefined,
    }));
  };

  return (
    <div style={{ padding: '0 24px' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
              Categories Management
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Manage product categories and subcategories
            </Text>
          </div>
          <Link href="/dashboard/categories/create">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              size="large"
              style={{ 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
            >
              Add New Category
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Total Categories"
                value={totalCategories}
                prefix={<TagsOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Active Categories"
                value={activeCategories}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Parent Categories"
                value={parentCategories}
                prefix={<BranchesOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Subcategories"
                value={childCategories}
                prefix={<TagsOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card style={{ borderRadius: '12px', marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} lg={8}>
              <Search
                placeholder="Search categories by name..."
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                style={{ borderRadius: '8px' }}
              />
            </Col>
            <Col xs={24} sm={6} lg={4}>
              <Select
                placeholder="Filter by status"
                size="large"
                style={{ width: '100%', borderRadius: '8px' }}
                value={statusFilter}
                onChange={handleStatusFilter}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6} lg={4}>
              <Select
                placeholder="Filter by type"
                size="large"
                style={{ width: '100%', borderRadius: '8px' }}
                value={parentFilter}
                onChange={handleParentFilter}
              >
                <Option value="all">All Types</Option>
                <Option value="root">Parent Only</Option>
                <Option value="child">Subcategories</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} lg={8}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Space.Compact>
                  <Button 
                    type={viewMode === 'table' ? 'primary' : 'default'}
                    onClick={() => setViewMode('table')}
                  >
                    Table View
                  </Button>
                  <Button 
                    type={viewMode === 'tree' ? 'primary' : 'default'}
                    onClick={() => setViewMode('tree')}
                  >
                    Tree View
                  </Button>
                </Space.Compact>
                <Button 
                  icon={<FilterOutlined />}
                  style={{ borderRadius: '8px' }}
                >
                  More Filters
                </Button>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card style={{ marginBottom: '24px', borderColor: '#ff4d4f', borderRadius: '8px' }}>
          <div style={{ color: '#ff4d4f', textAlign: 'center', padding: '20px' }}>
            <Text type="danger" style={{ fontSize: '16px' }}>{error}</Text>
          </div>
        </Card>
      )}

      {/* Categories Display */}
      <Card style={{ borderRadius: '12px', overflow: 'hidden' }}>
        {viewMode === 'table' ? (
          <Table
            columns={columns}
            dataSource={categories}
            loading={loading}
            rowKey="id"
            pagination={{
              current: response?.page,
              pageSize: response?.per_page,
              total: response?.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} categories`,
              style: { marginTop: '16px' }
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            rowClassName={(record, index) => 
              index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
            }
          />
        ) : (
          <div style={{ padding: '24px' }}>
            <Tree
              treeData={convertToTreeData(categoryTree)}
              defaultExpandAll
              showLine={{ showLeafIcon: false }}
              style={{ fontSize: '14px' }}
            />
          </div>
        )}
      </Card>

      <style jsx global>{`
        .table-row-light {
          background-color: #ffffff;
        }
        .table-row-dark {
          background-color: #fafafa;
        }
        .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          padding: 16px 12px !important;
          border-bottom: 2px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr > td {
          padding: 16px 12px !important;
          border-bottom: 1px solid #f5f5f5 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #f8f9ff !important;
        }
        .ant-table-row:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
      `}</style>
    </div>
  );
}
