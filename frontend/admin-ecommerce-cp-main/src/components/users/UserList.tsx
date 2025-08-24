import { Table, Button, Space, Typography, Tag, Avatar, Modal, Card, Input, Select, Row, Col, Statistic, Tooltip, Badge, Dropdown, Switch } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, MoreOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useUsers } from '@/hooks/useUsers';
import { UserListItem } from '@/types/user';
import Link from 'next/link';
import { useState } from 'react';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Search } = Input;
const { Option } = Select;

export default function UserList() {
  const { users, loading, error, response, filters, setFilters, deleteUser, toggleUserStatus, handleTableChange } = useUsers();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const showDeleteConfirm = (id: number, userName: string) => {
    confirm({
      title: 'Delete User',
      content: (
        <div>
          <p>Are you sure you want to delete <strong>"{userName}"</strong>?</p>
          <p style={{ color: '#ff4d4f', fontSize: '14px' }}>This action cannot be undone and will remove all associated data.</p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      width: 480,
      onOk() {
        deleteUser(id);
      },
    });
  };

  const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    try {
      await toggleUserStatus(id, !currentStatus);
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

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    setFilters({
      ...filters,
      role: value === 'all' ? undefined : value,
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

  // Calculate statistics
  const totalUsers = response?.total || 0;
  const activeUsers = users?.filter(u => u.is_active).length || 0;
  const verifiedUsers = users?.filter(u => u.is_verified).length || 0;
  const adminUsers = users?.filter(u => u.role === 'admin').length || 0;

  const getActionMenuItems = (record: UserListItem) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: (
        <Link href={`/dashboard/users/${record.id}`}>
          View Details
        </Link>
      ),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: (
        <Link href={`/dashboard/users/${record.id}`}>
          Edit User
        </Link>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'toggle-status',
      icon: record.is_active ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
      label: record.is_active ? 'Deactivate User' : 'Activate User',
      onClick: () => handleStatusToggle(record.id, record.is_active),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete User',
      danger: true,
      onClick: () => showDeleteConfirm(record.id, record.name),
    },
  ];

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      sorter: true,
      render: (_: any, record: UserListItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            size={48}
            style={{ 
              backgroundColor: record.is_active ? '#1890ff' : '#d9d9d9',
              color: 'white'
            }}
            icon={<UserOutlined />}
          >
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
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
                href={`/dashboard/users/${record.id}`}
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
              {record.email}
            </div>
            {record.phone && (
              <div style={{ 
                fontSize: '12px', 
                color: '#999'
              }}>
                {record.phone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      sorter: true,
      render: (role: string) => {
        const roleConfig = {
          admin: { color: '#722ed1', text: 'Admin', bg: '#bba3cbff' },
          user: { color: '#1890ff', text: 'User', bg: '#f0f5ff' },
          customer: { color: '#52c41a', text: 'Customer', bg: '#f6ffed' }
        };
        const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
        
        return (
          <Tag 
            color={config.color}
            style={{ 
              borderRadius: '16px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              background: config.bg
            }}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, record: UserListItem) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Badge 
            status={record.is_active ? 'success' : 'error'} 
            text={record.is_active ? 'Active' : 'Inactive'}
            style={{ fontSize: '12px' }}
          />
          <Badge 
            status={record.is_verified ? 'success' : 'warning'} 
            text={record.is_verified ? 'Verified' : 'Unverified'}
            style={{ fontSize: '12px' }}
          />
        </div>
      ),
    },
    {
      title: 'Active',
      key: 'is_active',
      width: 100,
      render: (_: any, record: UserListItem) => (
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
      render: (_: any, record: UserListItem) => (
        <Space size="small">
          <Tooltip title="Edit User">
            <Link href={`/dashboard/users/${record.id}`}>
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

  return (
    <div style={{ padding: '0 24px' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
              Users Management
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Manage user accounts, roles, and permissions
            </Text>
          </div>
          <Link href="/dashboard/users/create">
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
              Add New User
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Total Users"
                value={totalUsers}
                prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Active Users"
                value={activeUsers}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Verified Users"
                value={verifiedUsers}
                prefix={<UserOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Admin Users"
                value={adminUsers}
                prefix={<UserOutlined style={{ color: '#722ed1' }} />}
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
                placeholder="Search users by name or email..."
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
                placeholder="Filter by role"
                size="large"
                style={{ width: '100%', borderRadius: '8px' }}
                value={roleFilter}
                onChange={handleRoleFilter}
              >
                <Option value="all">All Roles</Option>
                <Option value="admin">Admin</Option>
                <Option value="user">User</Option>
                <Option value="customer">Customer</Option>
              </Select>
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
            <Col xs={24} sm={24} lg={8}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button 
                  icon={<FilterOutlined />}
                  style={{ borderRadius: '8px' }}
                >
                  More Filters
                </Button>
                <Button 
                  type="default"
                  style={{ borderRadius: '8px' }}
                >
                  Export
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

      {/* Users Table */}
      <Card style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{
            current: response?.page,
            pageSize: response?.per_page,
            total: response?.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} users`,
            style: { marginTop: '16px' }
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
        />
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
