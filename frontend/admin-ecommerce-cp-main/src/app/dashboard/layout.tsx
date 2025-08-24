'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, ConfigProvider, Spin } from 'antd';
import { useAuth, initializeAuth } from '@/hooks/useAuth';
import { useTheme, getAntdTheme, initializeTheme } from '@/hooks/useTheme';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';

const { Content } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { mode, collapsed, toggleSidebar } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize theme first (synchronous)
        initializeTheme();
        
        // Then initialize auth (asynchronous)
        await initializeAuth();
      } catch (error) {
        console.error('Dashboard initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      console.log('Redirecting to login - not authenticated');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isInitialized, router]);

  // Show loading while initializing or checking auth
  if (!isInitialized || isLoading) {
    return (
      <div className="loading-container full-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check if user is admin
  if (user && user.role !== "admin") {
    return (
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider theme={getAntdTheme(mode)}>
      <Layout className="admin-layout">
        <AdminSidebar
          collapsed={collapsed}
          onCollapse={toggleSidebar}
        />
        
        <Layout
          className={`admin-content ${collapsed ? 'sidebar-collapsed' : ''}`}
          style={{
            marginLeft: collapsed ? 80 : 256,
            transition: 'all 0.2s',
          }}
        >
          <AdminHeader
            collapsed={collapsed}
            onCollapse={toggleSidebar}
          />
          
          <Content className="admin-main">
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
