'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Select, Switch, Button, Card, Typography, Space, Alert, Divider } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, TagsOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { categoryService } from '@/services/category';
import { CategoryOut, CategoryCreate, CategoryUpdate } from '@/types/product';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CategoryFormProps {
  categoryId?: number;
  mode: 'create' | 'edit';
}

export default function CategoryForm({ categoryId, mode }: CategoryFormProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<CategoryOut | null>(null);
  const [parentCategories, setParentCategories] = useState<CategoryOut[]>([]);
  const [slugGenerated, setSlugGenerated] = useState(true);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Load category data for edit mode
  useEffect(() => {
    if (mode === 'edit' && categoryId) {
      loadCategory();
    }
  }, [mode, categoryId]);

  // Load parent categories
  useEffect(() => {
    loadParentCategories();
  }, []);

  const loadCategory = async () => {
    if (!categoryId) return;
    
    setLoading(true);
    try {
      const data = await categoryService.getCategory(categoryId);
      setCategory(data);
      
      // Set form values
      form.setFieldsValue({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        parent_id: data.parent_id || undefined,
        is_active: data.is_active,
        sort_order: data.sort_order || 0,
      });
      
      setSlugGenerated(false); // Don't auto-generate slug for existing categories
    } catch (error: any) {
      message.error('Failed to load category data');
      router.push('/dashboard/categories');
    } finally {
      setLoading(false);
    }
  };

  const loadParentCategories = async () => {
    try {
      const categories = await categoryService.getParentCategories();
      // Filter out current category if editing to prevent circular reference
      const filteredCategories = categoryId 
        ? categories.filter(cat => cat.id !== categoryId)
        : categories;
      
      // Additional safety check to prevent circular references
      const safeCategories = filteredCategories.filter(cat => {
        // Don't allow a category to be its own parent
        if (categoryId && cat.id === categoryId) return false;
        // Don't allow selecting a child category as parent (basic check)
        if (categoryId && cat.parent_id === categoryId) return false;
        return true;
      });
      
      setParentCategories(safeCategories);
    } catch (error) {
      console.error('Failed to load parent categories:', error);
      // Set empty array on error to prevent undefined state
      setParentCategories([]);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    
    // Auto-generate slug only if it hasn't been manually edited
    if (slugGenerated && name) {
      const newSlug = generateSlug(name);
      form.setFieldValue('slug', newSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value;
    
    // Mark slug as manually edited if user types in it
    if (slug !== generateSlug(form.getFieldValue('name') || '')) {
      setSlugGenerated(false);
    }
    
    // Validate slug format
    const validSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (validSlug !== slug) {
      form.setFieldValue('slug', validSlug);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    
    try {
      const formData: CategoryCreate | CategoryUpdate = {
        name: values.name.trim(),
        slug: values.slug?.trim() || undefined,
        description: values.description?.trim() || undefined,
        parent_id: values.parent_id || undefined,
        is_active: values.is_active ?? true,
        sort_order: values.sort_order || 0,
      };

      if (mode === 'create') {
        await categoryService.createCategory(formData as CategoryCreate);
        message.success('Category created successfully');
      } else if (categoryId) {
        await categoryService.updateCategory(categoryId, formData as CategoryUpdate);
        message.success('Category updated successfully');
      }

      router.push('/dashboard/categories');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${mode} category`;
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/categories');
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text>Loading category data...</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleCancel}
          style={{ marginBottom: '16px' }}
        >
          Back to Categories
        </Button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            <TagsOutlined />
          </div>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {mode === 'create' ? 'Create New Category' : `Edit Category: ${category?.name}`}
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {mode === 'create' 
                ? 'Add a new category to organize your products' 
                : 'Update category information and settings'
              }
            </Text>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card style={{ borderRadius: '12px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
            sort_order: 0,
          }}
          size="large"
        >
          {/* Basic Information */}
          <div style={{ marginBottom: '32px' }}>
            <Title level={4} style={{ marginBottom: '16px' }}>Basic Information</Title>
            
            <Form.Item
              name="name"
              label="Category Name"
              rules={[
                { required: true, message: 'Please enter category name' },
                { min: 2, message: 'Category name must be at least 2 characters' },
                { max: 100, message: 'Category name must not exceed 100 characters' }
              ]}
            >
              <Input 
                placeholder="Enter category name (e.g., Electronics, Clothing)"
                onChange={handleNameChange}
              />
            </Form.Item>

            <Form.Item
              name="slug"
              label="URL Slug"
              rules={[
                { pattern: /^[a-z0-9-]*$/, message: 'Slug can only contain lowercase letters, numbers, and hyphens' }
              ]}
              extra="URL-friendly version of the name. Leave empty to auto-generate from name."
            >
              <Input 
                placeholder="category-slug"
                onChange={handleSlugChange}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[
                { max: 500, message: 'Description must not exceed 500 characters' }
              ]}
            >
              <TextArea 
                rows={4}
                placeholder="Enter category description (optional)"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </div>

          <Divider />

          {/* Category Hierarchy */}
          <div style={{ marginBottom: '32px' }}>
            <Title level={4} style={{ marginBottom: '16px' }}>Category Hierarchy</Title>
            
            <Form.Item
              name="parent_id"
              label="Parent Category"
              extra="Select a parent category to create a subcategory. Leave empty for top-level category."
            >
              <Select
                placeholder="Select parent category (optional)"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {parentCategories.map(parent => (
                  <Option key={parent.id} value={parent.id}>
                    {parent.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Divider />

          {/* Settings */}
          <div style={{ marginBottom: '32px' }}>
            <Title level={4} style={{ marginBottom: '16px' }}>Settings</Title>
            
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

            <Form.Item
              name="sort_order"
              label="Sort Order"
              rules={[
                { type: 'number', min: 0, message: 'Sort order must be 0 or greater' }
              ]}
              extra="Lower numbers appear first. Use 0 for default ordering."
            >
              <Input 
                type="number" 
                min={0}
                placeholder="0"
              />
            </Form.Item>
          </div>

          {/* API Information Alert */}
          <Alert
            message="API Information"
            description={
              <div>
                <p><strong>Required:</strong> Only the category name is required.</p>
                <p><strong>Auto-generated Slug:</strong> If you don't provide a slug, it will be automatically generated from the name.</p>
                <p><strong>Admin Required:</strong> Creating and editing categories requires admin privileges.</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button 
              size="large" 
              onClick={handleCancel}
              style={{ minWidth: '120px' }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={submitting}
              icon={<SaveOutlined />}
              size="large"
              style={{ 
                minWidth: '120px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {mode === 'create' ? 'Create Category' : 'Update Category'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
