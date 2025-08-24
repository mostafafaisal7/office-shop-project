import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, Switch, Space, Row, Col, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { userService } from '@/services/user';
import { UserCreateRequest } from '@/types/user';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const { Option } = Select;

interface UserFormProps {
  userId?: number;
  initialData?: any;
  isEdit?: boolean;
}

export default function UserForm({ userId, initialData, isEdit = false }: UserFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    try {
      if (isEdit && userId) {
        // Update user - prepare update data
        const updateData: any = {
          name: values.name,
          email: values.email,
          phone: values.phone,
          role: values.role,
          is_active: values.is_active,
          is_verified: values.is_verified,
        };

        // Only include password if it's provided
        if (values.password && values.password.trim()) {
          updateData.password = values.password;
        }

        await userService.updateUser(userId, updateData);
        message.success('User updated successfully');
        router.push(`/dashboard/users/${userId}`);
      } else {
        // Create user
        const userData: UserCreateRequest = {
          name: values.name,
          email: values.email,
          password: values.password,
          phone: values.phone,
          role: values.role || 'user',
          is_active: values.is_active !== undefined ? values.is_active : true,
        };
        
        const response = await userService.createUser(userData);
        message.success('User created successfully');
        router.push('/dashboard/users');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} user`;
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        <div style={{ marginTop: '16px' }}>
          <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
            {isEdit ? 'Edit User' : 'Create New User'}
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            {isEdit ? 'Update user information and settings' : 'Add a new user to the system'}
          </Text>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="User Information" style={{ borderRadius: '12px' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={initialData}
              size="large"
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Full Name"
                    name="name"
                    rules={[
                      { required: true, message: 'Please enter the full name' },
                      { min: 2, message: 'Name must be at least 2 characters' }
                    ]}
                  >
                    <Input 
                      placeholder="Enter full name"
                      prefix={<UserOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Email Address"
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter the email address' },
                      { type: 'email', message: 'Please enter a valid email address' }
                    ]}
                  >
                    <Input 
                      placeholder="Enter email address"
                      type="email"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Phone Number"
                    name="phone"
                    rules={[
                      { pattern: /^[+]?[\d\s\-\(\)]+$/, message: 'Please enter a valid phone number' }
                    ]}
                  >
                    <Input 
                      placeholder="Enter phone number (optional)"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Role"
                    name="role"
                    rules={[
                      { required: true, message: 'Please select a role' }
                    ]}
                  >
                    <Select placeholder="Select user role">
                      {/* <Option value="user">User</Option> */}
                      <Option value="admin">Admin</Option>
                      <Option value="customer">Customer</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={isEdit ? "New Password (Optional)" : "Password"}
                    name="password"
                    rules={[
                      { required: !isEdit, message: 'Please enter a password' },
                      { min: 6, message: 'Password must be at least 6 characters' }
                    ]}
                    extra={isEdit ? "Leave blank to keep current password" : undefined}
                  >
                    <Input.Password 
                      placeholder={isEdit ? "Enter new password (optional)" : "Enter password"}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={isEdit ? "Confirm New Password" : "Confirm Password"}
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: !isEdit, message: 'Please confirm the password' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const password = getFieldValue('password');
                          if (!password && !value) {
                            // Both empty is OK for edit mode
                            return Promise.resolve();
                          }
                          if (!value || password === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords do not match'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                      placeholder={isEdit ? "Confirm new password" : "Confirm password"}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Account Status"
                    name="is_active"
                    valuePropName="checked"
                    extra="Toggle to activate or deactivate the user account"
                  >
                    <Switch 
                      checkedChildren="Active" 
                      unCheckedChildren="Inactive"
                      defaultChecked={true}
                    />
                  </Form.Item>
                </Col>
                {isEdit && (
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Email Verification"
                      name="is_verified"
                      valuePropName="checked"
                      extra="Toggle email verification status"
                    >
                      <Switch 
                        checkedChildren="Verified" 
                        unCheckedChildren="Unverified"
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SaveOutlined />}
                    size="large"
                    style={{ 
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    {isEdit ? 'Update User' : 'Create User'}
                  </Button>
                  <Link href="/dashboard/users">
                    <Button size="large" style={{ borderRadius: '8px' }}>
                      Cancel
                    </Button>
                  </Link>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Guidelines" style={{ borderRadius: '12px' }}>
            <Space direction="vertical" size="middle">
              <div>
                <Text strong>User Roles:</Text>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li><Text type="secondary">Admin: Full system access</Text></li>
                  {/* <li><Text type="secondary">User: Standard user access</Text></li> */}
                  <li><Text type="secondary">Customer: Customer-specific features</Text></li>
                </ul>
              </div>
              
              <div>
                <Text strong>Password Requirements:</Text>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li><Text type="secondary">Minimum 6 characters</Text></li>
                  <li><Text type="secondary">Mix of letters and numbers recommended</Text></li>
                </ul>
              </div>

              <div>
                <Text strong>Account Status:</Text>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li><Text type="secondary">Active: User can log in and access the system</Text></li>
                  <li><Text type="secondary">Inactive: User account is disabled</Text></li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
