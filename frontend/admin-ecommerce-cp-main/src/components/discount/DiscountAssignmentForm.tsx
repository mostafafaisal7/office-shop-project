'use client';

import React, { useEffect, useState } from 'react';
import {
  Form,
  Select,
  Switch,
  Button,
  Space,
  Card,
  Typography,
  Divider,
  Alert,
} from 'antd';
import { SaveOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { useDiscountAssignments, useDiscountRules } from '@/hooks/useDiscount';
import { useProducts } from '@/hooks/useProducts';
import type { 
  DiscountAssignment, 
  DiscountAssignmentCreate, 
  BulkDiscountAssignment 
} from '@/types/discount';

const { Option } = Select;
const { Title } = Typography;

interface DiscountAssignmentFormProps {
  assignment?: DiscountAssignment | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: 'single' | 'bulk';
}

const DiscountAssignmentForm: React.FC<DiscountAssignmentFormProps> = ({
  assignment,
  onSuccess,
  onCancel,
  mode = 'single',
}) => {
  const [form] = Form.useForm();
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedRule, setSelectedRule] = useState<number | undefined>();

  const { createAssignment, bulkCreateAssignments, updateAssignment, loading } = useDiscountAssignments();
  const { rules } = useDiscountRules({ is_active: true });
  const { products } = useProducts();

  useEffect(() => {
    if (assignment) {
      form.setFieldsValue({
        product_id: assignment.product_id,
        discount_rule_id: assignment.discount_rule_id,
        is_active: assignment.is_active,
      });
      setSelectedProducts([assignment.product_id]);
      setSelectedRule(assignment.discount_rule_id);
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
      });
      setSelectedProducts([]);
      setSelectedRule(undefined);
    }
  }, [assignment, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        assigned_by: 1, // TODO: Get from auth context
      };

      let success = false;

      if (assignment) {
        // Update existing assignment using the correct API endpoints
        const result = await updateAssignment(assignment.id, {
          is_active: formData.is_active,
        });
        success = !!result;
      } else if (mode === 'bulk' && selectedProducts.length > 1) {
        // Bulk assignment
        const bulkData: BulkDiscountAssignment = {
          product_ids: selectedProducts,
          discount_rule_id: formData.discount_rule_id,
          assigned_by: formData.assigned_by,
        };
        const result = await bulkCreateAssignments(bulkData);
        success = !!result;
      } else {
        // Single assignment
        const singleData: DiscountAssignmentCreate = {
          product_id: mode === 'bulk' ? selectedProducts[0] : formData.product_id,
          discount_rule_id: formData.discount_rule_id,
          is_active: formData.is_active,
          assigned_by: formData.assigned_by,
        };
        const result = await createAssignment(singleData);
        success = !!result;
      }

      if (success && onSuccess) {
        form.resetFields();
        setSelectedProducts([]);
        setSelectedRule(undefined);
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedProducts([]);
    setSelectedRule(undefined);
    if (onCancel) {
      onCancel();
    }
  };

  const handleProductChange = (value: number | number[]) => {
    const products = Array.isArray(value) ? value : [value];
    setSelectedProducts(products);
  };

  const handleRuleChange = (value: number) => {
    setSelectedRule(value);
  };

  const getSelectedRule = () => {
    return rules.find(rule => rule.id === selectedRule);
  };

  const getSelectedProductNames = () => {
    return selectedProducts
      .map(id => products.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {assignment 
            ? 'Edit Discount Assignment' 
            : mode === 'bulk' 
              ? 'Bulk Assign Discount Rule' 
              : 'Assign Discount Rule'
          }
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          is_active: true,
        }}
      >
        {mode === 'bulk' ? (
          <Form.Item
            name="product_ids"
            label="Select Products"
            rules={[{ required: true, message: 'Please select at least one product' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select products to assign discount rule"
              onChange={handleProductChange}
              showSearch
              style={{ width: '100%' }}
            >
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} {product.sku && `(${product.sku})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          <Form.Item
            name="product_id"
            label="Select Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder="Select product to assign discount rule"
              showSearch
              disabled={!!assignment}
            >
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} {product.sku && `(${product.sku})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="discount_rule_id"
          label="Select Discount Rule"
          rules={[{ required: true, message: 'Please select a discount rule' }]}
        >
          <Select
            placeholder="Select discount rule to assign"
            onChange={handleRuleChange}
            disabled={!!assignment}
          >
            {rules.map(rule => (
              <Option key={rule.id} value={rule.id}>
                {rule.name} - {rule.discount_type === 'percentage' ? `${rule.discount_value}%` : `$${rule.discount_value}`} 
                {' '}(Min: {rule.min_quantity} items)
              </Option>
            ))}
          </Select>
        </Form.Item>

        {!assignment && (
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
        )}

        {assignment && (
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
        )}

        {/* Preview Section */}
        {(selectedProducts.length > 0 && selectedRule) && (
          <>
            <Divider />
            <Alert
              message="Assignment Preview"
              description={
                <div>
                  <p><strong>Products:</strong> {getSelectedProductNames()}</p>
                  <p><strong>Rule:</strong> {getSelectedRule()?.name}</p>
                  <p><strong>Discount:</strong> {getSelectedRule()?.discount_type === 'percentage' 
                    ? `${getSelectedRule()?.discount_value}%` 
                    : `$${getSelectedRule()?.discount_value}`} off for orders with {getSelectedRule()?.min_quantity}+ items</p>
                  {mode === 'bulk' && (
                    <p><strong>Total Products:</strong> {selectedProducts.length}</p>
                  )}
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </>
        )}

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={assignment ? <SaveOutlined /> : <PlusOutlined />}
            >
              {assignment 
                ? 'Update Assignment' 
                : mode === 'bulk' 
                  ? `Assign to ${selectedProducts.length} Products` 
                  : 'Create Assignment'
              }
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

export default DiscountAssignmentForm;
