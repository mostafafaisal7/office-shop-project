'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Space,
  InputNumber,
  Select,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useShippingAddresses } from '@/hooks/useShipping';
import type { ShippingAddress, ShippingAddressCreate, ShippingAddressUpdate } from '@/types/shipping';

const { Option } = Select;

interface ShippingAddressFormProps {
  address?: ShippingAddress | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({
  address,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { createAddress, updateAddress, loading } = useShippingAddresses();

  useEffect(() => {
    if (address) {
      form.setFieldsValue({
        user_id: address.user_id,
        guest_id: address.guest_id,
        full_name: address.full_name,
        phone: address.phone,
        email: address.email,
        address_line: address.address_line,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
      });
    } else {
      form.resetFields();
    }
  }, [address, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        user_id: values.user_id || null,
        guest_id: values.guest_id || null,
        full_name: values.full_name,
        phone: values.phone,
        email: values.email,
        address_line: values.address_line,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        country: values.country,
      };

      let success = false;

      if (address) {
        // Update existing address
        const updateData: ShippingAddressUpdate = {
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          address_line: formData.address_line,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
        };
        const result = await updateAddress(address.id, updateData);
        success = !!result;
      } else {
        // Create new address
        const createData: ShippingAddressCreate = formData;
        const result = await createAddress(createData);
        success = !!result;
      }

      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'Japan',
    'Bangladesh',
    'India',
    'Pakistan',
    'China',
    'Brazil',
    'Mexico',
    // Add more countries as needed
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        country: 'Bangladesh', // Default country
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="user_id"
            label="User ID"
            help="Leave empty for guest addresses"
          >
            <InputNumber
              placeholder="Enter user ID"
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="guest_id"
            label="Guest ID"
            help="Leave empty for user addresses"
          >
            <Input
              placeholder="Enter guest ID"
              prefix={<UserOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="full_name"
        label="Full Name"
        rules={[
          { required: true, message: 'Please enter full name' },
          { min: 2, message: 'Full name must be at least 2 characters' },
        ]}
      >
        <Input
          placeholder="Enter full name"
          prefix={<UserOutlined />}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              placeholder="Enter email address"
              prefix={<MailOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { min: 10, message: 'Phone number must be at least 10 digits' },
            ]}
          >
            <Input
              placeholder="Enter phone number"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="address_line"
        label="Address Line"
        rules={[
          { required: true, message: 'Please enter address' },
          { min: 5, message: 'Address must be at least 5 characters' },
        ]}
      >
        <Input.TextArea
          placeholder="Enter full address"
          rows={2}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="city"
            label="City"
            rules={[
              { required: true, message: 'Please enter city' },
            ]}
          >
            <Input
              placeholder="Enter city"
              prefix={<HomeOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="state"
            label="State/Province"
            rules={[
              { required: true, message: 'Please enter state/province' },
            ]}
          >
            <Input
              placeholder="Enter state or province"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="postal_code"
            label="Postal Code"
            rules={[
              { required: true, message: 'Please enter postal code' },
            ]}
          >
            <Input
              placeholder="Enter postal code"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="country"
        label="Country"
        rules={[
          { required: true, message: 'Please select country' },
        ]}
      >
        <Select
          placeholder="Select country"
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)
              ?.toLowerCase()
              ?.includes(input.toLowerCase())
          }
        >
          {countries.map(country => (
            <Option key={country} value={country}>
              {country}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            {address ? 'Update Address' : 'Create Address'}
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ShippingAddressForm;
