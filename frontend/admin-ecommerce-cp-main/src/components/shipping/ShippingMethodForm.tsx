'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  InputNumber,
  Switch,
} from 'antd';
import {
  DollarOutlined,
} from '@ant-design/icons';
import { useShippingMethods } from '@/hooks/useShipping';
import type { ShippingMethod, ShippingMethodCreate, ShippingMethodUpdate } from '@/types/shipping';

interface ShippingMethodFormProps {
  method?: ShippingMethod | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ShippingMethodForm: React.FC<ShippingMethodFormProps> = ({
  method,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { createMethod, updateMethod, loading } = useShippingMethods();

  useEffect(() => {
    if (method) {
      form.setFieldsValue({
        name: method.name,
        description: method.description,
        cost: method.cost,
        delivery_days: method.delivery_days,
        is_active: method.is_active,
      });
    } else {
      form.resetFields();
    }
  }, [method, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        name: values.name,
        description: values.description || undefined,
        cost: values.cost,
        delivery_days: values.delivery_days,
        is_active: values.is_active ?? true,
      };

      let success = false;

      if (method) {
        // Update existing method
        const updateData: ShippingMethodUpdate = formData;
        const result = await updateMethod(method.id, updateData);
        success = !!result;
      } else {
        // Create new method
        const createData: ShippingMethodCreate = formData;
        const result = await createMethod(createData);
        success = !!result;
      }

      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        is_active: true,
      }}
    >
      <Form.Item
        name="name"
        label="Method Name"
        rules={[
          { required: true, message: 'Please enter method name' },
          { min: 2, message: 'Method name must be at least 2 characters' },
        ]}
      >
        <Input
          placeholder="Enter shipping method name (e.g., Standard Shipping)"
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        help="Optional description for the shipping method"
      >
        <Input.TextArea
          placeholder="Enter description (e.g., Delivery within 3-5 business days)"
          rows={3}
        />
      </Form.Item>

      <Form.Item
        name="cost"
        label="Shipping Cost"
        rules={[
          { required: true, message: 'Please enter shipping cost' },
          { type: 'number', min: 0, message: 'Cost must be 0 or greater' },
        ]}
      >
        <InputNumber
          placeholder="0.00"
          prefix={<DollarOutlined />}
          style={{ width: '100%' }}
          min={0}
          step={0.01}
          precision={2}
        />
      </Form.Item>

      <Form.Item
        name="delivery_days"
        label="Delivery Days"
        rules={[
          { required: true, message: 'Please enter delivery days' },
          { type: 'number', min: 1, message: 'Delivery days must be at least 1' },
        ]}
        help="Estimated number of days for delivery"
      >
        <InputNumber
          placeholder="Enter delivery days"
          style={{ width: '100%' }}
          min={1}
          max={365}
          step={1}
          precision={0}
        />
      </Form.Item>

      <Form.Item
        name="is_active"
        label="Status"
        valuePropName="checked"
      >
        <Switch
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            {method ? 'Update Method' : 'Create Method'}
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ShippingMethodForm;
