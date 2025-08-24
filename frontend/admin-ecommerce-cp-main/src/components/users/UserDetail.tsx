import { useState, useEffect } from 'react';
import { Card, Typography, Avatar, Tag, Button, Space, Row, Col, Descriptions, Switch, message, Spin, Alert } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { userService } from '@/services/user';
import { UserDetail as UserDetailType } from '@/types/user';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface UserDetailProps {
  userId: number;
}

export default function UserDetail({ userId }: UserDetailProps) {
  const [user, setUser] = useState<UserDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.getUserById(userId);
      // Handle both nested (response.data.data) and direct (response.data) response formats
      let userData: UserDetailType | null = null;
      
      if (response.data) {
        // Check if response.data has a 'data' property (nested format)
        if ('data' in response.data && response.data.data) {
          userData = response.data.data as UserDetailType;
        } else {
          // Direct format - response.data is the user data
          userData = response.data as UserDetailType;
        }
      }
      
      if (userData && userData.id) {
        setUser(userData);
      } else {
        setError('User not found');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch user details';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (isActive: boolean) => {
    if (!user) return;
    
    setUpdating(true);
    try {
      await userService.toggleUserStatus(user.id, isActive);
      setUser({ ...user, is_active: isActive });
      message.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update user status';
      message.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    try {
      await userService.deleteUser(user.id);
      message.success('User deleted successfully');
      router.push('/dashboard/users');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete user';
      message.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error || 'User not found'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => router.push('/dashboard/users')}>
              Back to Users
            </Button>
          }
        />
      </div>
    );
  }

  const getRoleConfig = (role: string) => {
    const roleConfig = {
      admin: { color: '#722ed1', text: 'Admin', bg: '#bba3cbff' },
      user: { color: '#1890ff', text: 'User', bg: '#f0f5ff' },
      customer: { color: '#52c41a', text: 'Customer', bg: '#f6ffed' }
    };
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
  };

  const roleConfig = getRoleConfig(user.role);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Link href="/dashboard/users">
            <Button icon={<ArrowLeftOutlined />} type="text">
              Back to Users
            </Button>
          </Link>
        </Space>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
              User Details
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              View and manage user information
            </Text>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
            >
              Edit User
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />}
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* User Profile Card */}
        <Col xs={24} lg={8}>
          <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Avatar 
              size={120}
              style={{ 
                backgroundColor: user.is_active ? '#1890ff' : '#d9d9d9',
                color: 'white',
                marginBottom: '16px'
              }}
              icon={<UserOutlined />}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            
            <Title level={3} style={{ marginBottom: '8px' }}>
              {user.name}
            </Title>
            
            <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '16px' }}>
              {user.email}
            </Text>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Tag 
                color={roleConfig.color}
                style={{ 
                  borderRadius: '16px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  background: roleConfig.bg
                }}
              >
                {roleConfig.text}
              </Tag>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status</div>
                  <Tag color={user.is_active ? 'success' : 'error'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Verified</div>
                  <Tag color={user.is_verified ? 'success' : 'warning'}>
                    {user.is_verified ? 'Verified' : 'Unverified'}
                  </Tag>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <Text>Account Status:</Text>
                <Switch
                  checked={user.is_active}
                  onChange={handleStatusToggle}
                  loading={updating}
                  checkedChildren={<CheckCircleOutlined />}
                  unCheckedChildren={<CloseCircleOutlined />}
                />
              </div>
            </Space>
          </Card>
        </Col>

        {/* User Information */}
        <Col xs={24} lg={16}>
          <Card title="User Information" style={{ borderRadius: '12px' }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Full Name" span={2}>
                {user.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {user.phone || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag 
                  color={roleConfig.color}
                  style={{ 
                    borderRadius: '12px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    border: 'none',
                    background: roleConfig.bg
                  }}
                >
                  {roleConfig.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Account Status">
                <Tag color={user.is_active ? 'success' : 'error'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Email Verification">
                <Tag color={user.is_verified ? 'success' : 'warning'}>
                  {user.is_verified ? 'Verified' : 'Unverified'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="User ID">
                #{user.id}
              </Descriptions.Item>
              {user.created_at && (
                <Descriptions.Item label="Created At" span={2}>
                  {new Date(user.created_at).toLocaleString()}
                </Descriptions.Item>
              )}
              {user.updated_at && (
                <Descriptions.Item label="Last Updated" span={2}>
                  {new Date(user.updated_at).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Additional sections can be added here for order history, activity logs, etc. */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <Card title="Recent Activity" style={{ borderRadius: '12px' }}>
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              <Text type="secondary">Activity tracking will be implemented here</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
