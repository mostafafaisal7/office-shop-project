'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Card,
  Typography,
} from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useDiscountRules } from '@/hooks/useDiscount';
import type { DiscountRule, DiscountRuleCreate, DiscountRuleUpdate } from '@/types/discount';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

interface DiscountRuleFormProps {
  rule?: DiscountRule | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DiscountRuleForm: React.FC<DiscountRuleFormProps> = ({
  rule,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { createRule, updateRule, loading } = useDiscountRules();

  useEffect(() => {
    if (rule) {
      form.setFieldsValue({
        name: rule.name,
        description: rule.description,
        min_quantity: rule.min_quantity,
        discount_type: rule.discount_type,
        discount_value: rule.discount_value,
        is_active: rule.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        discount_type: 'percentage',
        is_active: true,
        min_quantity: 1,
      });
    }
  }, [rule, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        created_by: 1, // TODO: Get from auth context
      };

      let success = false;
      if (rule) {
        const result = await updateRule(rule.id, formData as DiscountRuleUpdate);
        success = !!result;
      } else {
        const result = await createRule(formData as DiscountRuleCreate);
        success = !!result;
      }

      if (success && onSuccess) {
        form.resetFields();
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {rule ? 'Edit Discount Rule' : 'Create Discount Rule'}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          discount_type: 'percentage',
          is_active: true,
          min_quantity: 1,
        }}
      >
        <Form.Item
          name="name"
          label="Rule Name"
          rules={[
            { required: true, message: 'Please enter rule name' },
            { min: 2, message: 'Rule name must be at least 2 characters' },
            { max: 100, message: 'Rule name must not exceed 100 characters' },
          ]}
        >
          <Input placeholder="Enter rule name (e.g., Bulk Order Discount)" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { required: true, message: 'Please enter description' },
            { max: 500, message: 'Description must not exceed 500 characters' },
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Enter rule description (e.g., Get discount when ordering 50+ items)"
          />
        </Form.Item>

        <Form.Item
          name="min_quantity"
          label="Minimum Quantity"
          rules={[
            { required: true, message: 'Please enter minimum quantity' },
            { type: 'number', min: 1, message: 'Minimum quantity must be at least 1' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter minimum quantity"
            min={1}
            max={999999}
          />
        </Form.Item>

        <Form.Item
          name="discount_type"
          label="Discount Type"
          rules={[{ required: true, message: 'Please select discount type' }]}
        >
          <Select placeholder="Select discount type">
            <Option value="percentage">Percentage (%)</Option>
            <Option value="fixed">Fixed Amount ($)</Option>
          </Select>
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.discount_type !== currentValues.discount_type}>
          {({ getFieldValue }) => (
            <Form.Item
              name="discount_value"
              label="Discount Value"
              rules={[
                { required: true, message: 'Please enter discount value' },
                { type: 'number', min: 0.01, message: 'Discount value must be greater than 0' },
                ...(getFieldValue('discount_type') === 'percentage' 
                  ? [{ type: 'number' as const, max: 100, message: 'Percentage cannot exceed 100%' }]
                  : [{ type: 'number' as const, max: 999999, message: 'Amount cannot exceed 999,999' }]
                ),
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter discount value"
                min={0.01}
                max={getFieldValue('discount_type') === 'percentage' ? 100 : 999999}
                precision={2}
                addonAfter={getFieldValue('discount_type') === 'percentage' ? '%' : '$'}
              />
            </Form.Item>
          )}
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

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              {rule ? 'Update Rule' : 'Create Rule'}
            </Button>
            <Button
              onClick={handleCancel}
              icon={<CloseOutlined />}
            >
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default DiscountRuleForm;
