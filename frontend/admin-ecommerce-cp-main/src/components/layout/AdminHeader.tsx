'use client';

import { useState } from 'react';
import { Layout, Space, Button, Dropdown, Avatar, Typography, Switch, Badge, Popover } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'next/navigation';

const { Header } = Layout;
const { Text } = Typography;

interface AdminHeaderProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function AdminHeader({ collapsed, onCollapse }: AdminHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const [notificationCount] = useState(3); // Mock notification count

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => router.push('/dashboard/settings'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push('/dashboard/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const notificationContent = (
    <div style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>Notifications</Text>
      </div>
      <div style={{ padding: 8 }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5' }}>
          <Text strong style={{ fontSize: 12, color: '#1890ff' }}>New Order</Text>
          <br />
          <Text style={{ fontSize: 12 }}>Order #12345 has been placed</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>2 minutes ago</Text>
        </div>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5' }}>
          <Text strong style={{ fontSize: 12, color: '#52c41a' }}>Product Review</Text>
          <br />
          <Text style={{ fontSize: 12 }}>New 5-star review received</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>1 hour ago</Text>
        </div>
        <div style={{ padding: '8px 12px' }}>
          <Text strong style={{ fontSize: 12, color: '#faad14' }}>Low Stock Alert</Text>
          <br />
          <Text style={{ fontSize: 12 }}>School Uniform - Red Small is low on stock</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>3 hours ago</Text>
        </div>
      </div>
      <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Button type="link" size="small">View All Notifications</Button>
      </div>
    </div>
  );

  return (
    <Header className="admin-header">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed)}
          className="header-icon"
          style={{
            fontSize: '16px',
            width: 64,
            height: 64,
          }}
        />
      </div>

      <Space size="middle">
        {/* Theme Toggle */}
        <Space>
          <SunOutlined style={{ color: mode === 'light' ? '#1890ff' : '#8c8c8c' }} />
          <Switch
            checked={mode === 'dark'}
            onChange={toggleTheme}
            size="small"
          />
          <MoonOutlined style={{ color: mode === 'dark' ? '#1890ff' : '#8c8c8c' }} />
        </Space>

        {/* Notifications */}
        {/* <Popover
          content={notificationContent}
          title={null}
          trigger="click"
          placement="bottomRight"
        >
          <Badge count={notificationCount} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              className="header-icon"
              style={{ 
                fontSize: '16px'
              }}
            />
          </Badge>
        </Popover> */}

        {/* User Menu */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Text 
                strong 
                className="header-user-name"
                style={{ 
                  fontSize: 14, 
                  lineHeight: 1.2
                }}
              >
                {user?.name || 'Admin User'}
              </Text>
              <Text 
                className="header-user-role"
                style={{ 
                  fontSize: 12, 
                  lineHeight: 1.2
                }}
              >
                Administrator
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
