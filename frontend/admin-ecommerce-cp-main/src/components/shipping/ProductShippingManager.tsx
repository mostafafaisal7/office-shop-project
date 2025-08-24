'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Empty,
  Alert,
  Tabs,
  Divider,
  Select,
} from 'antd';
import {
  PlusOutlined,
  SendOutlined,
  CalculatorOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useProductShippingRules, useShippingMethods } from '@/hooks/useShipping';
import ProductShippingRuleForm from './ProductShippingRuleForm';
import ProductShippingRuleList from './ProductShippingRuleList';
import ShippingCostPreview from './ShippingCostPreview';

const { Title } = Typography;
const { Option } = Select;

interface ProductShippingManagerProps {
  productId: number;
  productName?: string;
}

const ProductShippingManager: React.FC<ProductShippingManagerProps> = ({
  productId,
  productName,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  const [selectedMethodId, setSelectedMethodId] = useState<number | undefined>(undefined);

  const {
    rules,
    loading,
    costPreviews,
    createRule,
    updateRule,
    deleteRule,
    fetchRules,
    fetchCostPreview,
  } = useProductShippingRules(productId);

  const { methods, loading: methodsLoading } = useShippingMethods();

  // Set default method when methods are loaded
  useEffect(() => {
    if (methods.length > 0 && !selectedMethodId) {
      setSelectedMethodId(methods[0].id);
    }
  }, [methods, selectedMethodId]);

  // Fetch cost preview when tab changes or method is selected
  useEffect(() => {
    if (activeTab === 'preview' && selectedMethodId) {
      fetchCostPreview(productId, selectedMethodId);
    }
  }, [activeTab, productId, selectedMethodId]);

  const handleCreateRule = async (values: any) => {
    const result = await createRule(productId, values);
    if (result) {
      setIsModalVisible(false);
      // Refresh cost preview if it's the active tab and method is selected
      if (activeTab === 'preview' && selectedMethodId) {
        fetchCostPreview(productId, selectedMethodId);
      }
    }
  };

  const handleUpdateRule = async (ruleId: number, values: any) => {
    const result = await updateRule(ruleId, values);
    if (result) {
      // Refresh cost preview if it's the active tab and method is selected
      if (activeTab === 'preview' && selectedMethodId) {
        fetchCostPreview(productId, selectedMethodId);
      }
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    const result = await deleteRule(ruleId);
    if (result) {
      // Refresh cost preview if it's the active tab and method is selected
      if (activeTab === 'preview' && selectedMethodId) {
        fetchCostPreview(productId, selectedMethodId);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleRefreshPreview = () => {
    if (selectedMethodId) {
      fetchCostPreview(productId, selectedMethodId);
    }
  };

  const handleMethodChange = (methodId: number) => {
    setSelectedMethodId(methodId);
    if (activeTab === 'preview') {
      fetchCostPreview(productId, methodId);
    }
  };

  const activeRulesCount = rules.filter(rule => rule.is_active).length;
  const currentPreview = selectedMethodId ? costPreviews[selectedMethodId] : undefined;

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          <SendOutlined style={{ marginRight: 8 }} />
          Product Shipping Rules
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Add Shipping Rule
        </Button>
      </div>

      {productName && (
        <Alert
          message={`Managing shipping rules for: ${productName}`}
          description={`${activeRulesCount} active rule(s) configured`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'rules',
            label: (
              <span>
                <SettingOutlined />
                Shipping Rules ({rules.length})
              </span>
            ),
            children: rules.length === 0 ? (
              <Empty
                description="No shipping rules configured for this product"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  Add First Shipping Rule
                </Button>
              </Empty>
            ) : (
              <>
                <Alert
                  message="Shipping Rules Overview"
                  description={`This product has ${rules.length} shipping rule(s) configured. Rules are applied based on quantity ranges and priority order.`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <ProductShippingRuleList
                  rules={rules}
                  loading={loading}
                  onEdit={handleUpdateRule}
                  onDelete={handleDeleteRule}
                  productId={productId}
                />
              </>
            ),
          },
          {
            key: 'preview',
            label: (
              <span>
                <CalculatorOutlined />
                Cost Preview
              </span>
            ),
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <span>Select Shipping Method:</span>
                    <Select
                      value={selectedMethodId}
                      onChange={handleMethodChange}
                      loading={methodsLoading}
                      style={{ minWidth: 200 }}
                      placeholder="Select a shipping method"
                    >
                      {methods.map(method => (
                        <Option key={method.id} value={method.id}>
                          {method.name} (${method.cost})
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </div>
                
                {selectedMethodId && currentPreview ? (
                  <ShippingCostPreview
                    costPreview={currentPreview}
                    loading={loading}
                    onRefresh={handleRefreshPreview}
                    productName={productName}
                  />
                ) : (
                  <Alert
                    message="Select a shipping method to view cost preview"
                    type="info"
                    showIcon
                  />
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={`Add Shipping Rule - ${productName || 'Product'}`}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={700}
        destroyOnClose
      >
        <ProductShippingRuleForm
          onFinish={handleCreateRule}
          onCancel={handleModalClose}
          loading={loading}
        />
      </Modal>
    </Card>
  );
};

export default ProductShippingManager;
