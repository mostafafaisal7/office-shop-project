import { Form, Input, Button, Select, InputNumber, Switch, Row, Col, Divider, Upload, Tag, Card, Space, Typography, Alert, Tooltip, Spin, Steps, Progress, message, Popconfirm } from 'antd';
import { UploadOutlined, PlusOutlined, InfoCircleOutlined, SaveOutlined, ArrowLeftOutlined, DollarOutlined, TagsOutlined, SettingOutlined, CameraOutlined, GlobalOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { ProductCreate, ProductUpdate, ProductResponse, CategoryOut, ProductMediaCreate, ProductMediaResponse } from '@/types/product';
import { categoryService } from '@/services/category';
import { productService } from '@/services/product';
import { useRouter, useParams } from 'next/navigation';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/common/RichTextEditor'), { ssr: false });


const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Step } = Steps;

interface ProductFormProps {
  initialValues?: ProductCreate | ProductUpdate | ProductResponse;
  onFinish: (values: ProductCreate | ProductUpdate) => void;
  loading: boolean;
}

export default function ProductForm({ initialValues, onFinish, loading }: ProductFormProps) {
  const router = useRouter();
  const params = useParams();
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [categories, setCategories] = useState<CategoryOut[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<ProductMediaCreate[]>([]);
  const [existingMedia, setExistingMedia] = useState<ProductMediaResponse[]>([]);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);

  // Calculate form completion percentage
  const [formProgress, setFormProgress] = useState(0);

  // Set default values for the form
  const defaultValues = {
    status: 'active',
    is_customizable: false,
    weight: 0,
    category_ids: [],
    ...initialValues,
  };

  const handleFormFinish = (values: any) => {
    // Validate required fields
    if (!values.name || !values.sku || !values.base_price) {
      message.error('Please fill in all required fields: Name, SKU, and Base Price');
      return;
    }

    // Ensure base_price is a valid number greater than 0
    const basePrice = parseFloat(values.base_price);
    if (isNaN(basePrice) || basePrice <= 0) {
      message.error('Base price must be a valid number greater than 0');
      return;
    }

    // Transform form data to match API requirements
    const formData = {
      ...values,
      base_price: basePrice, // Ensure it's a number
      tags: tags || [],
      category_ids: values.category_ids || [],
      // Send newly uploaded media without ID fields (backend doesn't need them)
      media: uploadedMedia.length > 0 ? uploadedMedia.map(media => {
        // Remove any ID field from media objects
        const { id, ...mediaWithoutId } = media as any;
        return mediaWithoutId;
      }) : [],
      dimensions: values.dimensions ? {
        length: parseFloat(values.dimensions?.length) || 0,
        width: parseFloat(values.dimensions?.width) || 0,
        height: parseFloat(values.dimensions?.height) || 0,
      } : null,
      weight: values.weight ? parseFloat(values.weight) : null,
    };

    // Remove undefined values but keep null values for optional fields
    Object.keys(formData).forEach(key => {
      if (formData[key] === undefined) {
        delete formData[key];
      }
    });

    console.log('Submitting product data:', formData); // Debug log
    onFinish(formData);
  };

  // Handle file upload
  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.files && result.files.length > 0) {
        const uploadedFile = result.files[0];
        
        // Add to uploaded media array
        setUploadedMedia(prev => [...prev, {
          ...uploadedFile,
          is_primary: prev.length === 0 && existingMedia.length === 0, // First image is primary if no existing media
        }]);
        
        message.success(`${file.name} uploaded successfully`);
        onSuccess(result, file);
      } else {
        throw new Error('No files in response');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error(`Failed to upload ${file.name}`);
      onError(error);
    }
  };

  // Handle file list change
  const handleFileListChange = (info: any) => {
    let newFileList = [...info.fileList];
    
    // Limit to 10 files
    newFileList = newFileList.slice(-10);
    
    // Update file list
    setFileList(newFileList);
    
    // Update form field
    form.setFieldsValue({ media: newFileList });
  };

  // Handle file removal
  const handleRemove = (file: UploadFile) => {
    // Remove from uploaded media array
    setUploadedMedia(prev => prev.filter((_, index) => index !== fileList.indexOf(file)));
    return true;
  };

  const handleTagClose = (removedTag: string) => {
    const newTags = tags.filter(tag => tag !== removedTag);
    setTags(newTags);
    form.setFieldsValue({ tags: newTags });
  };

  const handleTagAdd = () => {
    if (inputValue && tags.indexOf(inputValue) === -1) {
      const newTags = [...tags, inputValue];
      setTags(newTags);
      form.setFieldsValue({ tags: newTags });
    }
    setInputVisible(false);
    setInputValue('');
  };

  const handleGoBack = () => {
    router.push('/dashboard/products');
  };

  // Calculate form completion
  const calculateProgress = () => {
    const values = form.getFieldsValue();
    const requiredFields = ['name', 'sku', 'base_price'];
    const optionalFields = ['description', 'short_description', 'features', 'category_ids', 'weight'];
    
    let completed = 0;
    const total = requiredFields.length + optionalFields.length;
    
    requiredFields.forEach(field => {
      if (values[field]) completed++;
    });
    
    optionalFields.forEach(field => {
      if (values[field] && (Array.isArray(values[field]) ? values[field].length > 0 : true)) {
        completed++;
      }
    });
    
    return Math.round((completed / total) * 100);
  };

  // Update progress on form change
  const handleFormChange = () => {
    const progress = calculateProgress();
    setFormProgress(progress);
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const categoriesData = await categoryService.getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Initialize existing media and progress
  useEffect(() => {
    if (initialValues && 'media' in initialValues && initialValues.media) {
      setExistingMedia(initialValues.media as ProductMediaResponse[]);
    }
    const progress = calculateProgress();
    setFormProgress(progress);
  }, [initialValues]);

  // Handle existing media deletion
  const handleDeleteExistingMedia = async (mediaId: number) => {
    setDeletingMediaId(mediaId);
    try {
      await productService.deleteProductMedia(mediaId);
      setExistingMedia(prev => prev.filter(media => media.id !== mediaId));
      message.success('Image deleted successfully');
    } catch (error) {
      console.error('Delete media error:', error);
      message.error('Failed to delete image. Please try again.');
    } finally {
      setDeletingMediaId(null);
    }
  };

  const steps = [
    {
      title: 'Basic Info',
      icon: <InfoCircleOutlined />,
    },
    {
      title: 'Pricing',
      icon: <DollarOutlined />,
    },
    {
      title: 'Details',
      icon: <SettingOutlined />,
    },
    {
      title: 'Media & SEO',
      icon: <CameraOutlined />,
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      {/* Header Section */}
      <Card 
        style={{ 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white'
        }}
        styles={{ body: { padding: '32px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleGoBack}
              style={{ 
                marginBottom: '16px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white'
              }}
              ghost
            >
              Back to Products
            </Button>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              {initialValues ? 'Edit Product' : 'Create New Product'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
              {initialValues ? 'Update your product information' : 'Add a new product to your catalog'}
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text style={{ color: 'white', fontSize: '14px' }}>Form Completion</Text>
            </div>
            <Progress 
              type="circle" 
              percent={formProgress} 
              size={80}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              trailColor="rgba(255,255,255,0.3)"
            />
          </div>
        </div>
      </Card>

      {/* Progress Steps */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>
      </Card>

      <Form 
        form={form}
        layout="vertical" 
        onFinish={handleFormFinish} 
        initialValues={defaultValues}
        onValuesChange={handleFormChange}
        size="large"
      >
        {/* Basic Information Card */}
        <Card 
          title={
            <Space>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <span>Basic Information</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
          extra={
            <Tooltip title="Essential product information">
              <InfoCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          }
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="name"
                label={
                  <Space>
                    <span>Product Name</span>
                    <Text type="danger">*</Text>
                  </Space>
                }
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input 
                  placeholder="Enter a descriptive product name" 
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="sku"
                label={
                  <Space>
                    <span>SKU (Stock Keeping Unit)</span>
                    <Text type="danger">*</Text>
                    <Tooltip title="Unique identifier for inventory tracking">
                      <InfoCircleOutlined style={{ color: '#999' }} />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: 'Please enter product SKU' }]}
              >
                <Input 
                  placeholder="e.g., PROD-001" 
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="short_description" 
            label="Short Description"
            getValueFromEvent={(content) => content}
          >
            <RichTextEditor 
              value={form.getFieldValue('short_description')} 
              onChange={(content) => form.setFieldsValue({ short_description: content })} 
            />
          </Form.Item>

          <Form.Item 
            name="features" 
            label="Product Features"
            getValueFromEvent={(content) => content}
          >
            <RichTextEditor 
              value={form.getFieldValue('features')} 
              onChange={(content) => form.setFieldsValue({ features: content })} 
            />
          </Form.Item>

          <Form.Item 
            name="description" 
            label="Product Description"
            getValueFromEvent={(content) => content}
          >
            <RichTextEditor 
              value={form.getFieldValue('description')} 
              onChange={(content) => form.setFieldsValue({ description: content })} 
            />
          </Form.Item>

        </Card>

        {/* Pricing and Status Card */}
        <Card 
          title={
            <Space>
              <DollarOutlined style={{ color: '#52c41a' }} />
              <span>Pricing & Status</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="base_price"
                label={
                  <Space>
                    <span>Base Price</span>
                    <Text type="danger">*</Text>
                  </Space>
                }
                rules={[{ required: true, message: 'Please enter product price' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  placeholder="0.00"
                  prefix="$"
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="status" label="Product Status">
                <Select 
                  placeholder="Select status"
                  style={{ borderRadius: '8px' }}
                >
                  <Option value="active">
                    <Space>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#52c41a' }}></div>
                      Active
                    </Space>
                  </Option>
                  <Option value="inactive">
                    <Space>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4d4f' }}></div>
                      Inactive
                    </Space>
                  </Option>
                  <Option value="draft">
                    <Space>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#faad14' }}></div>
                      Draft
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="is_customizable" 
                label="Allow Customization" 
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '-16px', display: 'block' }}>
                Enable product customization
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Physical Properties Card */}
        <Card 
          title={
            <Space>
              <SettingOutlined style={{ color: '#722ed1' }} />
              <span>Physical Properties</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Alert
            message="Shipping Information"
            description="These details help calculate shipping costs and ensure proper packaging."
            type="info"
            showIcon
            style={{ marginBottom: '24px', borderRadius: '8px' }}
          />
          
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="weight" label="Weight (kg)">
                <InputNumber 
                  min={0} 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  placeholder="0.0"
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name={['dimensions', 'length']} label="Length (cm)">
                <InputNumber 
                  min={0} 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  placeholder="0.0"
                  precision={1}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name={['dimensions', 'width']} label="Width (cm)">
                <InputNumber 
                  min={0} 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  placeholder="0.0"
                  precision={1}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name={['dimensions', 'height']} label="Height (cm)">
                <InputNumber 
                  min={0} 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  placeholder="0.0"
                  precision={1}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Categories and Tags Card */}
        <Card 
          title={
            <Space>
              <TagsOutlined style={{ color: '#fa8c16' }} />
              <span>Categories & Tags</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Form.Item name="category_ids" label="Product Categories">
            <Select
              mode="multiple"
              placeholder="Select categories for better organization"
              style={{ borderRadius: '8px' }}
              loading={categoriesLoading}
              optionLabelProp="label"
            >
              {categories.map((category) => (
                <Option key={category.id} value={category.id} label={category.name}>
                  <Space>
                    <TagsOutlined />
                    {category.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Product Tags
            </label>
            <Text type="secondary" style={{ fontSize: '12px', marginBottom: '12px', display: 'block' }}>
              Add tags to help customers find your product
            </Text>
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: '8px', 
              padding: '12px',
              minHeight: '60px',
              background: '#fafafa'
            }}>
              {tags.map((tag, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => handleTagClose(tag)}
                  style={{ 
                    marginBottom: '8px',
                    borderRadius: '16px',
                    padding: '4px 12px'
                  }}
                  color="blue"
                >
                  {tag}
                </Tag>
              ))}
              {inputVisible ? (
                <Input
                  type="text"
                  size="small"
                  style={{ width: '120px', borderRadius: '16px' }}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleTagAdd}
                  onPressEnter={handleTagAdd}
                  placeholder="Enter tag"
                />
              ) : (
                <Tag
                  onClick={() => setInputVisible(true)}
                  style={{ 
                    background: '#fff', 
                    borderStyle: 'dashed',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    cursor: 'pointer'
                  }}
                >
                  <PlusOutlined /> Add Tag
                </Tag>
              )}
            </div>
            <Form.Item name="tags" hidden>
              <Input />
            </Form.Item>
          </div>
        </Card>

        {/* Media Upload Card */}
        <Card 
          title={
            <Space>
              <CameraOutlined style={{ color: '#eb2f96' }} />
              <span>Product Images</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Alert
            message="Image Guidelines"
            description="Upload high-quality images (recommended: 1200x1200px). The first image will be used as the primary product image."
            type="info"
            showIcon
            style={{ marginBottom: '24px', borderRadius: '8px' }}
          />
          
          <Form.Item name="media" label="Upload Images" valuePropName="fileList">
            <Upload
              listType="picture-card"
              multiple
              fileList={fileList}
              customRequest={handleUpload}
              onChange={handleFileListChange}
              onRemove={handleRemove}
              accept="image/*"
              style={{ borderRadius: '8px' }}
            >
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <CameraOutlined style={{ fontSize: '32px', color: '#999', marginBottom: '8px' }} />
                <div style={{ marginTop: 8, color: '#666' }}>Upload Images</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  JPG, PNG up to 10MB
                </div>
              </div>
            </Upload>
          </Form.Item>

          {/* Display existing media if editing */}
          {existingMedia.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <Title level={5}>Current Images</Title>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: '16px',
                marginTop: '16px'
              }}>
                {existingMedia.map((media, index) => (
                  <div 
                    key={media.id} 
                    style={{ 
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <img 
                      src={media.file_path} 
                      alt={media.alt_text || `Product image ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'cover'
                      }}
                    />
                    {media.is_primary && (
                      <Tag 
                        color="blue" 
                        style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          left: '8px', 
                          fontSize: '10px',
                          borderRadius: '4px'
                        }}
                      >
                        Primary
                      </Tag>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                    }}>
                      <Popconfirm
                        title="Delete Image"
                        description="Are you sure you want to delete this image?"
                        onConfirm={() => handleDeleteExistingMedia(media.id)}
                        okText="Yes"
                        cancelText="No"
                        placement="topRight"
                      >
                        <Button
                          type="primary"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          loading={deletingMediaId === media.id}
                          style={{
                            borderRadius: '4px',
                            minWidth: '32px',
                            height: '24px',
                            fontSize: '12px'
                          }}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* SEO Card */}
        <Card 
          title={
            <Space>
              <GlobalOutlined style={{ color: '#13c2c2' }} />
              <span>SEO Optimization</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Alert
            message="Search Engine Optimization"
            description="Optimize your product for search engines to improve visibility and ranking."
            type="info"
            showIcon
            style={{ marginBottom: '24px', borderRadius: '8px' }}
          />
          
          <Row gutter={[24, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item name="seo_title" label="SEO Title">
                <Input 
                  placeholder="Optimized title for search engines"
                  style={{ borderRadius: '8px' }}
                  showCount
                  maxLength={60}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Recommended: 50-60 characters
                </Text>
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="seo_description" label="SEO Description">
                <TextArea 
                  rows={3} 
                  placeholder="Meta description for search results"
                  style={{ borderRadius: '8px' }}
                  showCount
                  maxLength={160}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Recommended: 150-160 characters
                </Text>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Additional Information Cards for Editing */}
        {initialValues && 'variations' in initialValues && (
          <Card 
            title={
              <Space>
                <SettingOutlined style={{ color: '#722ed1' }} />
                <span>Product Variations</span>
              </Space>
            }
            style={{ marginBottom: '24px' }}
            extra={
              <Button 
                type="primary" 
                ghost
                onClick={() => router.push(`/dashboard/products/${params.id}/variations`)}
              >
                Manage Variations
              </Button>
            }
          >
            {initialValues.variations && initialValues.variations.length > 0 ? (
              <div>
                <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                  This product has {initialValues.variations.length} variation(s)
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {initialValues.variations.slice(0, 5).map((variation, index) => (
                    <Tag 
                      key={('id' in variation ? String(variation.id) : `variation-${index}`)} 
                      style={{ 
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                      color="purple"
                    >
                      {variation.name} - ${variation.price}
                    </Tag>
                  ))}
                  {initialValues.variations.length > 5 && (
                    <Tag style={{ padding: '8px 12px', borderRadius: '6px' }}>
                      +{initialValues.variations.length - 5} more
                    </Tag>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text type="secondary">No variations found for this product</Text>
                <br />
                <Button type="link" style={{ padding: 0, marginTop: '8px' }}>
                  Add Variations
                </Button>
              </div>
            )}
          </Card>
        )}

        {initialValues && 'customization_options' in initialValues && (
          <Card 
            title={
              <Space>
                <SettingOutlined style={{ color: '#fa541c' }} />
                <span>Customization Options</span>
              </Space>
            }
            style={{ marginBottom: '24px' }}
            extra={
              <Button 
                type="primary" 
                ghost
                onClick={() => router.push(`/dashboard/products/${params.id}/options`)}
              >
                Manage Options
              </Button>
            }
          >
            {initialValues.customization_options && initialValues.customization_options.length > 0 ? (
              <div>
                <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                  This product has {initialValues.customization_options.length} customization option(s)
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {initialValues.customization_options.slice(0, 5).map((option, index) => (
                    <Tag 
                      key={('id' in option ? String(option.id) : `option-${index}`)} 
                      style={{ 
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                      color="orange"
                    >
                      {option.name} ({option.type})
                    </Tag>
                  ))}
                  {initialValues.customization_options.length > 5 && (
                    <Tag style={{ padding: '8px 12px', borderRadius: '6px' }}>
                      +{initialValues.customization_options.length - 5} more
                    </Tag>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text type="secondary">No customization options found for this product</Text>
                <br />
                <Button type="link" style={{ padding: 0, marginTop: '8px' }}>
                  Add Options
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Shipping Rules Card for Editing */}
        {initialValues && 'id' in initialValues && (
          <Card 
            title={
              <Space>
                <SendOutlined style={{ color: '#1890ff' }} />
                <span>Shipping Rules</span>
              </Space>
            }
            style={{ marginBottom: '24px' }}
            extra={
              <Button 
                type="primary" 
                ghost
                onClick={() => router.push(`/dashboard/products/${params.id}/shipping`)}
              >
                Manage Shipping Rules
              </Button>
            }
          >
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text type="secondary">Configure product-specific shipping rules</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Override default shipping costs based on quantity ranges and shipping methods
              </Text>
              <br />
              <Button 
                type="link" 
                style={{ padding: 0, marginTop: '8px' }}
                onClick={() => router.push(`/dashboard/products/${params.id}/shipping`)}
              >
                Configure Shipping Rules
              </Button>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <Text type="secondary">
                {formProgress < 100 ? 
                  `Complete ${100 - formProgress}% more for better product listing` : 
                  'Your product is ready to publish!'
                }
              </Text>
            </div>
            <Space size="middle">
              <Button 
                size="large" 
                onClick={handleGoBack}
                style={{ borderRadius: '8px' }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                size="large"
                icon={<SaveOutlined />}
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                {initialValues ? 'Update Product' : 'Create Product'}
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </div>
  );
}
