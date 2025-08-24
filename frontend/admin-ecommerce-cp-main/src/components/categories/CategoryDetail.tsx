'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Tag, Badge, Descriptions, Alert, Divider, Statistic, Row, Col } from 'antd';
import { EditOutlined, ArrowLeftOutlined, TagsOutlined, DeleteOutlined, BranchesOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import Link from 'next/link';
import { categoryService } from '@/services/category';
import { CategoryOut } from '@/types/product';

const { Title, Text, Paragraph } = Typography;

interface CategoryDetailProps {
  categoryId: number;
}

export default function CategoryDetail({ categoryId }: CategoryDetailProps) {
  const router = useRouter();
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryOut | null>(null);
  const [parentCategory, setParentCategory] = useState<CategoryOut | null>(null);
  const [childCategories, setChildCategories] = useState<CategoryOut[]>([]);

  useEffect(() => {
    loadCategoryData();
  }, [categoryId]);

  const loadCategoryData = async () => {
    setLoading(true);
    try {
      // Load main category
      const categoryData = await categoryService.getCategory(categoryId);
      setCategory(categoryData);

      // Load parent category if exists
      if (categoryData.parent_id) {
        try {
          const parentData = await categoryService.getCategory(categoryData.parent_id);
          setParentCategory(parentData);
        } catch (error) {
          console.error('Failed to load parent category:', error);
        }
      }

      // Load child categories
      try {
        const allCategories = await categoryService.getAllCategories();
        const children = allCategories.filter(cat => cat.parent_id === categoryId);
        setChildCategories(children);
      } catch (error) {
        console.error('Failed to load child categories:', error);
      }

    } catch (error: any) {
      message.error('Failed to load category data');
      router.push('/dashboard/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/categories');
  };

  const handleEdit = () => {
    router.push(`/dashboard/categories/${categoryId}/edit`);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text>Loading category details...</Text>
      </div>
    );
  }

  if (!category) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert
          message="Category Not Found"
          description="The requested category could not be found."
          type="error"
          showIcon
        />
        <Button 
          type="primary" 
          onClick={handleBack}
          style={{ marginTop: '16px' }}
        >
          Back to Categories
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginBottom: '16px' }}
        >
          Back to Categories
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: category.is_active 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px'
            }}>
              <TagsOutlined />
            </div>
            <div>
              <Title level={1} style={{ margin: 0, marginBottom: '8px' }}>
                {category.name}
              </Title>
              <Space size="middle">
                <Badge 
                  status={category.is_active ? 'success' : 'error'} 
                  text={category.is_active ? 'Active' : 'Inactive'}
                />
                <Tag color={category.parent_id ? '#52c41a' : '#1890ff'}>
                  {category.parent_id ? 'Subcategory' : 'Parent Category'}
                </Tag>
                <Text type="secondary">ID: {category.id}</Text>
              </Space>
            </div>
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={handleEdit}
              size="large"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              Edit Category
            </Button>
          </Space>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={[24, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="Child Categories"
              value={childCategories.length}
              prefix={<BranchesOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="Sort Order"
              value={category.sort_order || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="Status"
              value={category.is_active ? 'Active' : 'Inactive'}
              valueStyle={{ color: category.is_active ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Category Information */}
        <Col xs={24} lg={16}>
          <Card title="Category Information" style={{ borderRadius: '12px' }}>
            <Descriptions column={1}>
              <Descriptions.Item label="Name">
                <Text strong style={{ fontSize: '16px' }}>{category.name}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Slug">
                <Text code style={{ fontSize: '14px' }}>{category.slug}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Description">
                {category.description ? (
                  <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                    {category.description}
                  </Paragraph>
                ) : (
                  <Text type="secondary">No description provided</Text>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label="Parent Category">
                {parentCategory ? (
                  <Link href={`/dashboard/categories/${parentCategory.id}`}>
                    <Button type="link" style={{ padding: 0, fontSize: '14px' }}>
                      {parentCategory.name}
                    </Button>
                  </Link>
                ) : (
                  <Text type="secondary">None (Top-level category)</Text>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label="Status">
                <Badge 
                  status={category.is_active ? 'success' : 'error'} 
                  text={category.is_active ? 'Active' : 'Inactive'}
                />
              </Descriptions.Item>
              
              <Descriptions.Item label="Sort Order">
                <Text>{category.sort_order || 0}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Created">
                <Text>{category.created_at ? new Date(category.created_at).toLocaleString() : 'N/A'}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Last Updated">
                <Text>{category.updated_at ? new Date(category.updated_at).toLocaleString() : 'N/A'}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Child Categories */}
          <Card 
            title={`Child Categories (${childCategories.length})`}
            style={{ borderRadius: '12px', marginBottom: '24px' }}
          >
            {childCategories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {childCategories.map(child => (
                  <div 
                    key={child.id}
                    style={{
                      padding: '12px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <Link href={`/dashboard/categories/${child.id}`}>
                        <Text strong style={{ color: '#1890ff' }}>{child.name}</Text>
                      </Link>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {child.slug}
                      </Text>
                    </div>
                    <Badge 
                      status={child.is_active ? 'success' : 'error'} 
                      text={child.is_active ? 'Active' : 'Inactive'}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">No child categories</Text>
            )}
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ borderRadius: '12px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={handleEdit}
                block
                size="large"
              >
                Edit Category
              </Button>
              
              <Link href="/dashboard/categories/create">
                <Button 
                  icon={<TagsOutlined />}
                  block
                  size="large"
                >
                  Create Child Category
                </Button>
              </Link>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Button 
                danger
                icon={<DeleteOutlined />}
                block
                size="large"
                disabled={childCategories.length > 0}
              >
                Delete Category
              </Button>
              
              {childCategories.length > 0 && (
                <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                  Cannot delete category with child categories
                </Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
