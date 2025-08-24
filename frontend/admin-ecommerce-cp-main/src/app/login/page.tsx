'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { LoginRequest } from '@/types/auth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyOtp, isAuthenticated, isLoading, error, clearError, otpRequired } = useAuth();
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Clear error when component mounts
    clearError();
  }, [clearError]);

  const handleSubmit = async (values: any) => {
    try {
      // Transform the form values to match backend expectations
      const loginData: LoginRequest = {
        password: values.password
      };

      // Detect if the input is email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(values.email)) {
        loginData.email = values.email;
      } else {
        loginData.phone = values.email; // Form field is named 'email' but contains phone
      }

      await login(loginData);
      if (!otpRequired) {
        router.push('/dashboard');
      }
    } catch (error) {
      // Error is handled by the auth store
      console.error('Login failed:', error);
    }
  };

  const handleOtpSubmit = async (values: { otp: string }) => {
    try {
      await verifyOtp(values.otp);
      router.push('/dashboard');
    } catch (error) {
      console.error('OTP verification failed:', error);
    }
  };

  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Admin Dashboard
          </Title>
          <Text type="secondary">
            Sign in to your admin account
          </Text>
        </div>

        {error && (
          <Alert
            message="Login Failed"
            description={error}
            type="error"
            showIcon
            closable
            onClose={clearError}
            style={{ marginBottom: 24 }}
          />
        )}

        {!otpRequired ? (
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email or Phone"
              rules={[
                { required: true, message: 'Please input your email or phone number!' },
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.reject(new Error('Email or phone is required'));
                    }
                    // Check if it's a phone number (starts with + or digits)
                    const phoneRegex = /^(\+?[0-9]{10,15}|[0-9]{10,15})$/;
                    // Check if it's an email
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    
                    if (phoneRegex.test(value) || emailRegex.test(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Please enter a valid email or phone number'));
                  }
                }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your email or phone number"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                icon={<LoginOutlined />}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            form={otpForm}
            name="otp"
            onFinish={handleOtpSubmit}
            layout="vertical"
            size="large"
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Text type="secondary">
                We've sent an OTP to your registered email/phone. Please enter it below to complete your login.
              </Text>
            </div>

            <Form.Item
              name="otp"
              label="Enter OTP"
              rules={[
                { required: true, message: 'Please input the OTP!' },
                { len: 6, message: 'OTP must be 6 digits!' }
              ]}
            >
              <Input
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
              >
                Verify OTP
              </Button>
            </Form.Item>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space direction="vertical" size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>
              Admin access only
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Contact system administrator for access
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
}
