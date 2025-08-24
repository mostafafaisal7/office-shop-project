'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  InputNumber,
  Switch,
  Select,
} from 'antd';
import {
  DollarOutlined,
} from '@ant-design/icons';
import { useShippingCostRules } from '@/hooks/useShipping';
import type { ShippingCostRule, ShippingCostRuleCreate, ShippingCostRuleUpdate } from '@/types/shipping';

const { Option } = Select;

interface ShippingCostRuleFormProps {
  methodId: number;
  rule?: ShippingCostRule | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ShippingCostRuleForm: React.FC<ShippingCostRuleFormProps> = ({
  methodId,
  rule,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { createRule, updateRule, loading } = useShippingCostRules(methodId);

  useEffect(() => {
    if (rule) {
      form.setFieldsValue({
        min_quantity: rule.min_quantity,
        max_quantity: rule.max_quantity,
        cost_adjustment: rule.cost_adjustment,
        adjustment_type: rule.adjustment_type,
        is_active: rule.is_active,
      });
    } else {
      form.resetFields();
    }
  }, [rule, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        min_quantity: values.min_quantity,
        max_quantity: values.max_quantity || null,
        cost_adjustment: values.cost_adjustment,
        adjustment_type: values.adjustment_type,
        is_active: values.is_active ?? true,
      };

      let success = false;

      if (rule) {
        // Update existing rule
        const updateData: ShippingCostRuleUpdate = formData;
        const result = await updateRule(rule.id, updateData);
        success = !!result;
      } else {
        // Create new rule
        const createData: Omit<ShippingCostRuleCreate, 'shipping_method_id'> = formData;
        const result = await createRule(methodId, createData);
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
        adjustment_type: 'per_item',
        is_active: true,
      }}
    >
      <Form.Item
        name="min_quantity"
        label="Minimum Quantity"
        rules={[
          { required: true, message: 'Please enter minimum quantity' },
          { type: 'number', min: 1, message: 'Minimum quantity must be at least 1' },
        ]}
        help="Minimum quantity for this rule to apply"
      >
        <InputNumber
          placeholder="Enter minimum quantity"
          style={{ width: '100%' }}
          min={1}
          step={1}
          precision={0}
        />
      </Form.Item>

      <Form.Item
        name="max_quantity"
        label="Maximum Quantity"
        help="Maximum quantity for this rule (leave empty for no limit)"
      >
        <InputNumber
          placeholder="Enter maximum quantity (optional)"
          style={{ width: '100%' }}
          min={1}
          step={1}
          precision={0}
        />
      </Form.Item>

      <Form.Item
        name="adjustment_type"
        label="Adjustment Type"
        rules={[
          { required: true, message: 'Please select adjustment type' },
        ]}
        help="How the cost adjustment should be applied"
      >
        <Select placeholder="Select adjustment type">
          <Option value="per_item">Per Item</Option>
          <Option value="flat_rate">Flat Rate</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="cost_adjustment"
        label="Cost Adjustment"
        rules={[
          { required: true, message: 'Please enter cost adjustment' },
          { type: 'number', message: 'Cost adjustment must be a number' },
        ]}
        help="Amount to adjust the shipping cost (can be positive or negative)"
      >
        <InputNumber
          placeholder="0.00"
          prefix={<DollarOutlined />}
          style={{ width: '100%' }}
          step={0.01}
          precision={2}
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
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ShippingCostRuleForm;
