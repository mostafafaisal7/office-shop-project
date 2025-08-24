'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  TagsOutlined,
  StarOutlined,
  TruckOutlined,
  CreditCardOutlined,
  PercentageOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';
import { MenuItem } from '@/types/common';

const { Sider } = Layout;
const { Title } = Typography;

const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    label: 'Dashboard',
    icon: <DashboardOutlined />,
    path: '/dashboard',
  },
  {
    key: '/dashboard/products',
    label: 'Products',
    icon: <ShoppingOutlined />,
    path: '/dashboard/products',
  },
  {
    key: '/dashboard/orders',
    label: 'Orders',
    icon: <ShoppingCartOutlined />,
    path: '/dashboard/orders',
  },
  {
    key: '/dashboard/users',
    label: 'Users',
    icon: <UserOutlined />,
    path: '/dashboard/users',
  },
  {
    key: '/dashboard/categories',
    label: 'Categories',
    icon: <TagsOutlined />,
    path: '/dashboard/categories',
  },
  {
    key: '/dashboard/reviews',
    label: 'Reviews',
    icon: <StarOutlined />,
    path: '/dashboard/reviews',
  },
  {
    key: 'shipping',
    label: 'Shipping',
    icon: <TruckOutlined />,
    children: [
      {
        key: '/dashboard/shipping/addresses',
        label: 'Addresses',
        path: '/dashboard/shipping/addresses',
      },
      {
        key: '/dashboard/shipping/methods',
        label: 'Methods',
        path: '/dashboard/shipping/methods',
      },
    ],
  },
  {
    key: 'discounts',
    label: 'Discounts',
    icon: <PercentageOutlined />,
    children: [
      {
        key: '/dashboard/discounts',
        label: 'Rules',
        path: '/dashboard/discounts',
      },
      {
        key: '/dashboard/discounts/assignments',
        label: 'Assignments',
        path: '/dashboard/discounts/assignments',
      },
    ],
  },
  {
    key: '/dashboard/payment/methods',
    label: 'Payment Methods',
    icon: <CreditCardOutlined />,
    path: '/dashboard/payment/methods',
  },
  {
    key: '/dashboard/settings',
    label: 'Settings',
    icon: <SettingOutlined />,
    path: '/dashboard/settings',
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function AdminSidebar({ collapsed, onCollapse }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    // Set selected menu item based on current path
    const currentPath = pathname;
    setSelectedKeys([currentPath]);

    // Set open keys for submenus
    if (currentPath.startsWith('/dashboard/shipping')) {
      setOpenKeys(['shipping']);
    } else if (currentPath.startsWith('/dashboard/discounts')) {
      setOpenKeys(['discounts']);
    }
  }, [pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const menuItem = findMenuItemByKey(menuItems, key);
    if (menuItem?.path) {
      router.push(menuItem.path);
    }
  };

  const findMenuItemByKey = (items: MenuItem[], key: string): MenuItem | null => {
    for (const item of items) {
      if (item.key === key) {
        return item;
      }
      if (item.children) {
        const found = findMenuItemByKey(item.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const convertMenuItems = (items: MenuItem[]): any[] => {
    return items.map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children ? convertMenuItems(item.children) : undefined,
    }));
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={256}
      className="admin-sidebar"
      theme="dark"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid #303030',
        }}
      >
        {!collapsed ? (
          <Title
            level={4}
            style={{
              color: '#fff',
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Admin CP
          </Title>
        ) : (
          <Title
            level={4}
            style={{
              color: '#fff',
              margin: 0,
              fontSize: 16,
            }}
          >
            AC
          </Title>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        onClick={handleMenuClick}
        items={convertMenuItems(menuItems)}
        style={{
          border: 'none',
          height: 'calc(100vh - 64px - 48px)', // Subtract header and trigger height
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid #303030',
          background: '#002140',
          cursor: 'pointer',
        }}
        onClick={() => onCollapse(!collapsed)}
      >
        {collapsed ? <MenuUnfoldOutlined style={{ color: '#fff' }} /> : <MenuFoldOutlined style={{ color: '#fff' }} />}
      </div>
    </Sider>
  );
}
