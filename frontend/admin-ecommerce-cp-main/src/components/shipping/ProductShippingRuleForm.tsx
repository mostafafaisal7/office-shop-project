'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Select,
  InputNumber,
  Switch,
  Button,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Alert,
} from 'antd';
import { useShippingMethods } from '@/hooks/useShipping';
import type { ProductShippingRuleCreate, ProductShippingRuleUpdate } from '@/types/shipping';

const { Title, Text } = Typography;
const { Option } = Select;

interface ProductShippingRuleFormProps {
  initialValues?: Partial<ProductShippingRuleCreate>;
  onFinish: (values: Omit<ProductShippingRuleCreate, 'product_id'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

const ProductShippingRuleForm: React.FC<ProductShippingRuleFormProps> = ({
  initialValues,
  onFinish,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const { methods, loading: methodsLoading } = useShippingMethods();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: any) => {
    try {
      await onFinish(values);
      if (!isEdit) {
        form.resetFields();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const adjustmentTypeOptions = [
    { value: 'per_item', label: 'Per Item' },
    { value: 'flat_rate', label: 'Flat Rate' },
  ];

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 24 }}>
        {isEdit ? 'Edit Shipping Rule' : 'Add Shipping Rule'}
      </Title>

      <Alert
        message="Shipping Rule Configuration"
        description="Configure product-specific shipping rules to override default shipping costs based on quantity ranges."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          min_quantity: 1,
          max_quantity: null,
          cost_adjustment: 0,
          adjustment_type: 'per_item',
          is_active: true,
          priority: 1,
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="shipping_method_id"
              label="Shipping Method"
              rules={[
                { required: true, message: 'Please select a shipping method' },
              ]}
            >
              <Select
                placeholder="Select shipping method"
                loading={methodsLoading}
                showSearch
                optionFilterProp="children"
              >
                {methods.map((method) => (
                  <Option key={method.id} value={method.id}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{method.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Base Cost: ${method.cost} | {method.delivery_days} days
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="min_quantity"
              label="Minimum Quantity"
              rules={[
                { required: true, message: 'Please enter minimum quantity' },
                { type: 'number', min: 1, message: 'Minimum quantity must be at least 1' },
              ]}
            >
              <InputNumber
                min={1}
                placeholder="Enter minimum quantity"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="max_quantity"
              label="Maximum Quantity"
              help="Leave empty for no upper limit"
            >
              <InputNumber
                min={1}
                placeholder="Enter maximum quantity (optional)"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="adjustment_type"
              label="Adjustment Type"
              rules={[
                { required: true, message: 'Please select adjustment type' },
              ]}
            >
              <Select placeholder="Select adjustment type">
                {adjustmentTypeOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="cost_adjustment"
              label="Cost Adjustment"
              rules={[
                { required: true, message: 'Please enter cost adjustment' },
                { type: 'number', message: 'Cost adjustment must be a number' },
              ]}
              help="Positive values increase cost, negative values decrease cost"
            >
              <InputNumber
                placeholder="Enter cost adjustment"
                style={{ width: '100%' }}
                step={0.01}
                precision={2}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[
                { required: true, message: 'Please enter priority' },
                { type: 'number', min: 1, message: 'Priority must be at least 1' },
              ]}
              help="Lower numbers have higher priority"
            >
              <InputNumber
                min={1}
                placeholder="Enter priority"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
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
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              {isEdit ? 'Update Rule' : 'Create Rule'}
            </Button>
            <Button onClick={onCancel}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProductShippingRuleForm;
