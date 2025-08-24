'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Switch,
  InputNumber,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Divider,
} from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import type { PaymentMethod, PaymentMethodCreate, PaymentMethodUpdate, PaymentType } from '@/types/payment';
import { usePaymentMethods } from '@/hooks/usePayment';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface PaymentMethodFormProps {
  method?: PaymentMethod | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  method,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { createMethod, updateMethod, loading } = usePaymentMethods();

  useEffect(() => {
    if (method) {
      form.setFieldsValue({
        name: method.name,
        type: method.type,
        description: method.description,
        is_active: method.is_active,
        processing_fee: method.processing_fee,
        min_amount: method.min_amount,
        max_amount: method.max_amount,
        supported_currencies: method.supported_currencies,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
        processing_fee: 0,
        supported_currencies: ['USD'],
      });
    }
  }, [method, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: PaymentMethodCreate | PaymentMethodUpdate = {
        name: values.name,
        type: values.type,
        description: values.description || null,
        is_active: values.is_active ?? true,
        processing_fee: values.processing_fee || 0,
        min_amount: values.min_amount || null,
        max_amount: values.max_amount || null,
        supported_currencies: values.supported_currencies || ['USD'],
      };

      let success = false;
      if (method) {
        const result = await updateMethod(method.id, formData);
        success = !!result;
      } else {
        const result = await createMethod(formData as PaymentMethodCreate);
        success = !!result;
      }

      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const paymentTypes = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash_on_delivery', label: 'Cash on Delivery' },
    { value: 'digital_wallet', label: 'Digital Wallet' },
    { value: 'cryptocurrency', label: 'Cryptocurrency' },
    { value: 'other', label: 'Other' },
  ];

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
    'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'KRW'
  ];

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 24 }}>
        {method ? 'Edit Payment Method' : 'Add Payment Method'}
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          is_active: true,
          processing_fee: 0,
          supported_currencies: ['USD'],
        }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="Method Name"
              rules={[
                { required: true, message: 'Please enter method name' },
                { min: 2, message: 'Name must be at least 2 characters' },
                { max: 100, message: 'Name must not exceed 100 characters' },
              ]}
            >
              <Input placeholder="e.g., Visa Credit Card" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="type"
              label="Payment Type"
              rules={[{ required: true, message: 'Please select payment type' }]}
            >
              <Select placeholder="Select payment type">
                {paymentTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea
            rows={3}
            placeholder="Optional description of the payment method"
            maxLength={500}
          />
        </Form.Item>

        <Divider />

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="processing_fee"
              label="Processing Fee (%)"
              rules={[
                { required: true, message: 'Please enter processing fee' },
                { type: 'number', min: 0, max: 100, message: 'Fee must be between 0 and 100%' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                step={0.01}
                precision={2}
                placeholder="0.00"
                addonAfter="%"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="min_amount"
              label="Minimum Amount"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                precision={2}
                placeholder="No minimum"
                addonBefore="$"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="max_amount"
              label="Maximum Amount"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                precision={2}
                placeholder="No maximum"
                addonBefore="$"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={16}>
            <Form.Item
              name="supported_currencies"
              label="Supported Currencies"
              rules={[{ required: true, message: 'Please select at least one currency' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select supported currencies"
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                }
              >
                {currencies.map(currency => (
                  <Option key={currency} value={currency}>
                    {currency}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
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

        <Divider />

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              {method ? 'Update Method' : 'Create Method'}
            </Button>
            <Button
              onClick={onCancel}
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

export default PaymentMethodForm;
