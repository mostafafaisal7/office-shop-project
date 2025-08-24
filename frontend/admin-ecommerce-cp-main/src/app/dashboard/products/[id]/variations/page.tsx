'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  Upload,
  Select,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  SettingOutlined,
  PictureOutlined,
  UploadOutlined,
  CloseOutlined,
  LoadingOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { ProductVariationResponse, ProductVariationCreate } from '@/types/product';
import { productVariationService } from '@/services/product-variations';
import { productService } from '@/services/product';
import { requestCache } from '@/utils/requestCache';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ProductVariationsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const [variations, setVariations] = useState<ProductVariationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProductVariationResponse | null>(null);
  const [form] = Form.useForm();
  const [productName, setProductName] = useState<string>('');
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [uploadingStates, setUploadingStates] = useState<{ [key: number]: boolean }>({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // Memoize cache keys to prevent unnecessary re-renders
  const cacheKeys = useMemo(() => ({
    product: `product-${productId}`,
    variations: `product-variations-${productId}`
  }), [productId]);

  const fetchProductInfo = useCallback(async () => {
    try {
      const product = await requestCache.get(
        cacheKeys.product,
        () => productService.getProductById(productId)
      );
      setProductName(product.name);
    } catch (error) {
      console.error('Failed to fetch product info:', error);
    }
  }, [productId, cacheKeys.product]);

  const fetchVariations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestCache.get(
        cacheKeys.variations,
        () => productVariationService.getVariations(productId)
      );
      setVariations(data);
    } catch (error) {
      message.error('Failed to fetch variations');
      console.error('Fetch variations error:', error);
    } finally {
      setLoading(false);
    }
  }, [productId, cacheKeys.variations]);

  // Clear cache and refetch data
  const invalidateCacheAndRefetch = useCallback(() => {
    requestCache.clear();
    fetchVariations();
  }, [fetchVariations]);

  useEffect(() => {
    if (productId && !isNaN(productId)) {
      fetchVariations();
      fetchProductInfo();
    }
  }, [productId, fetchVariations, fetchProductInfo]);

  const handleCreate = () => {
    setEditingVariation(null);
    setMediaList([]);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      stock_quantity: 0,
      low_stock_threshold: 5,
      sort_order: variations.length + 1,
    });
    setModalVisible(true);
  };

  const handleEdit = (variation: ProductVariationResponse) => {
    setEditingVariation(variation);
    setMediaList(variation.media || []);
    form.setFieldsValue({
      ...variation,
      attributes: JSON.stringify(variation.attributes, null, 2),
    });
    setModalVisible(true);
  };

  const addMediaItem = () => {
    const newMedia = {
      id: Date.now(), // temporary ID for UI
      file_path: '',
      file_name: '',
      media_type: 'image' as const,
      mime_type: 'image/jpeg',
      alt_text: '',
      design: false,
      area: 'front' as const,
      sort_order: mediaList.length + 1,
    };
    setMediaList([...mediaList, newMedia]);
  };

  const updateMediaItem = (index: number, field: string, value: any) => {
    const updatedMedia = [...mediaList];
    updatedMedia[index] = { ...updatedMedia[index], [field]: value };
    setMediaList(updatedMedia);
  };

  const removeMediaItem = (index: number) => {
    const updatedMedia = mediaList.filter((_, i) => i !== index);
    setMediaList(updatedMedia);
  };

  const handleImageUpload = async (file: File, index: number) => {
    setUploadingStates(prev => ({ ...prev, [index]: true }));
    
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
        
        // Update the media item with uploaded file info in one go to trigger re-render
        const updatedMedia = [...mediaList];
        updatedMedia[index] = {
          ...updatedMedia[index],
          file_path: uploadedFile.file_path,
          file_name: uploadedFile.file_name,
          mime_type: uploadedFile.mime_type,
          media_type: uploadedFile.media_type,
        };
        setMediaList(updatedMedia);
        
        message.success('Image uploaded successfully');
      } else {
        throw new Error('No file returned from upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload image');
    } finally {
      setUploadingStates(prev => ({ ...prev, [index]: false }));
    }
  };

  const handlePreview = (imagePath: string) => {
    setPreviewImage(imagePath);
    setPreviewVisible(true);
  };

  const handleDelete = async (variationId: number) => {
    try {
      await productVariationService.deleteVariation(productId, variationId);
      message.success('Variation deleted successfully');
      invalidateCacheAndRefetch();
    } catch (error) {
      message.error('Failed to delete variation');
      console.error('Delete variation error:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Filter out media items with empty file_path
      const validMedia = mediaList.filter(media => media.file_path && media.file_path.trim() !== '');
      
      console.log('Submitting variation with media:', validMedia);
      
      if (editingVariation) {
        // For updates, match the API payload structure
        const variationData = {
          product_id: productId,
          ...values,
          stock: values.stock_quantity, // API expects 'stock' field
          attributes: values.attributes ? JSON.parse(values.attributes) : {},
          media: validMedia.length > 0 ? validMedia.map(media => {
            const mediaItem: any = {
              file_path: media.file_path,
              file_name: media.file_name,
              media_type: media.media_type,
              mime_type: media.mime_type,
              alt_text: media.alt_text || '',
              design: media.design ? 1 : 0, // API expects numeric value
              area: media.area || 'front',
              sort_order: media.sort_order || 1,
            };
            
            // Include ID only for existing media (not temporary IDs created by Date.now())
            if (media.id && typeof media.id === 'number' && media.id < Date.now() - 1000000) {
              mediaItem.id = media.id;
            }
            
            return mediaItem;
          }) : [],
        };

        console.log('Updating variation with data:', variationData);
        await productVariationService.updateVariation(
          editingVariation.id,
          variationData
        );
        message.success('Variation updated successfully');
      } else {
        // For creation, match the API payload structure exactly
        const variationData = {
          product_id: productId,
          ...values,
          stock: values.stock_quantity, // API expects 'stock' field
          attributes: values.attributes ? JSON.parse(values.attributes) : {},
          media: validMedia.length > 0 ? validMedia.map(media => ({
            file_path: media.file_path,
            file_name: media.file_name,
            media_type: media.media_type,
            mime_type: media.mime_type,
            alt_text: media.alt_text || '',
            design: media.design ? 1 : 0, // API expects numeric value
            area: media.area || 'front',
            sort_order: media.sort_order || 1,
          })) : [],
        };

        console.log('Creating variation with data:', variationData);
        await productVariationService.createVariation(productId, variationData);
        message.success('Variation created successfully');
      }

      setModalVisible(false);
      invalidateCacheAndRefetch();
    } catch (error) {
      message.error('Failed to save variation');
      console.error('Save variation error:', error);
    }
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'media',
      key: 'media',
      width: 80,
      render: (media: any[]) => {
        const primaryImage = media && media.length > 0 ? media[0] : null;
        return primaryImage ? (
          <img
            src={primaryImage.file_path}
            alt={primaryImage.alt_text || 'Variation image'}
            style={{
              width: '50px',
              height: '50px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #d9d9d9'
            }}
          />
        ) : (
          <div
            style={{
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #d9d9d9'
            }}
          >
            <PictureOutlined style={{ color: '#bfbfbf' }} />
          </div>
        );
      },
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ProductVariationResponse) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            SKU: {record.sku}
          </Text>
          {record.media && record.media.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              <Tag color="blue">
                {record.media.length} image{record.media.length > 1 ? 's' : ''}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: any) => {
        const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
        return `$${numPrice.toFixed(2)}`;
      },
      sorter: (a: ProductVariationResponse, b: ProductVariationResponse) => {
        const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0;
        const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price) || 0;
        return priceA - priceB;
      },
    },
    {
      title: 'Stock',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      render: (stock: number, record: ProductVariationResponse) => (
        <div>
          <Text>{stock}</Text>
          {record.low_stock_threshold && stock <= record.low_stock_threshold && (
            <Tag color="red" style={{ marginLeft: '8px' }}>
              Low Stock
            </Tag>
          )}
        </div>
      ),
      sorter: (a: ProductVariationResponse, b: ProductVariationResponse) => a.stock_quantity - b.stock_quantity,
    },
    {
      title: 'Attributes',
      dataIndex: 'attributes',
      key: 'attributes',
      render: (attributes: Record<string, any>) => (
        <div>
          {Object.entries(attributes).map(([key, value]) => (
            <Tag key={key} style={{ marginBottom: '4px' }}>
              {key}: {String(value)}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ProductVariationResponse) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this variation?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <Card style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push(`/dashboard/products/${productId}`)}
                style={{ marginBottom: '16px' }}
              >
                Back to Product
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                <SettingOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                Product Variations
              </Title>
              <Text type="secondary">
                Manage variations for: {productName}
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                size="large"
              >
                Add Variation
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Info Alert */}
        <Alert
          message="Product Variations"
          description="Create different versions of your product with unique attributes, pricing, and stock levels. Each variation can have its own SKU and inventory tracking."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {/* Variations Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={variations}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} variations`,
            }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={editingVariation ? 'Edit Variation' : 'Create New Variation'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Variation Name"
                  rules={[{ required: true, message: 'Please enter variation name' }]}
                >
                  <Input placeholder="e.g., Red Large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="sku"
                  label="SKU"
                  rules={[{ required: true, message: 'Please enter SKU' }]}
                >
                  <Input placeholder="e.g., PROD-001-RED-L" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="price"
                  label="Price"
                  rules={[{ required: true, message: 'Please enter price' }]}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    prefix="$"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="stock_quantity"
                  label="Stock Quantity"
                  rules={[{ required: true, message: 'Please enter stock quantity' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="low_stock_threshold"
                  label="Low Stock Threshold"
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="5"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="attributes"
              label="Attributes (JSON)"
              help='Enter attributes as JSON, e.g., {"color": "red", "size": "large"}'
            >
              <TextArea
                rows={4}
                placeholder='{"color": "red", "size": "large"}'
              />
            </Form.Item>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="sort_order"
                  label="Sort Order"
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="1"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="is_active"
                  label="Active"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Media Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Text strong>Media Images</Text>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addMediaItem}
                >
                  Add Image
                </Button>
              </div>

              {mediaList.map((media, index) => (
                <Card
                  key={media.id || index}
                  size="small"
                  style={{ marginBottom: '12px' }}
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => removeMediaItem(index)}
                    />
                  }
                >
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12}>
                      <Text strong>Image Upload:</Text>
                      <div style={{ marginTop: '4px' }}>
                        {media.file_path ? (
                          <div style={{ position: 'relative' }}>
                            <img
                              src={media.file_path}
                              alt={media.alt_text || 'Variation image'}
                              style={{
                                width: '100%',
                                maxWidth: '200px',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                border: '1px solid #d9d9d9'
                              }}
                            />
                            <div style={{ 
                              position: 'absolute', 
                              top: '8px', 
                              right: '8px',
                              display: 'flex',
                              gap: '4px'
                            }}>
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handlePreview(media.file_path)}
                                style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none' }}
                              />
                            </div>
                          </div>
                        ) : (
                          <Upload
                            accept="image/*"
                            showUploadList={false}
                            beforeUpload={(file) => {
                              handleImageUpload(file, index);
                              return false;
                            }}
                            disabled={uploadingStates[index]}
                          >
                            <div style={{
                              width: '200px',
                              height: '120px',
                              border: '2px dashed #d9d9d9',
                              borderRadius: '6px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              backgroundColor: '#fafafa',
                              transition: 'all 0.3s'
                            }}>
                              {uploadingStates[index] ? (
                                <>
                                  <LoadingOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                  <div style={{ marginTop: '8px', color: '#666' }}>Uploading...</div>
                                </>
                              ) : (
                                <>
                                  <UploadOutlined style={{ fontSize: '24px', color: '#999' }} />
                                  <div style={{ marginTop: '8px', color: '#666' }}>Click to upload</div>
                                </>
                              )}
                            </div>
                          </Upload>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Row gutter={[8, 8]}>
                        <Col xs={24}>
                          <Text strong>Alt Text:</Text>
                          <Input
                            placeholder="e.g., Red variation image"
                            value={media.alt_text}
                            onChange={(e) => updateMediaItem(index, 'alt_text', e.target.value)}
                            style={{ marginTop: '4px' }}
                          />
                        </Col>
                        <Col xs={12}>
                          <Text strong>Media Type:</Text>
                          <Select
                            value={media.media_type}
                            onChange={(value) => updateMediaItem(index, 'media_type', value)}
                            style={{ width: '100%', marginTop: '4px' }}
                          >
                            <Select.Option value="image">Image</Select.Option>
                            <Select.Option value="video">Video</Select.Option>
                          </Select>
                        </Col>
                        <Col xs={12}>
                          <Text strong>Sort Order:</Text>
                          <InputNumber
                            min={1}
                            value={media.sort_order}
                            onChange={(value) => updateMediaItem(index, 'sort_order', value || 1)}
                            style={{ width: '100%', marginTop: '4px' }}
                          />
                        </Col>
                        <Col xs={12}>
                          <Text strong>Design:</Text>
                          <Select
                            value={media.design}
                            onChange={(value) => updateMediaItem(index, 'design', value)}
                            style={{ width: '100%', marginTop: '4px' }}
                          >
                            <Select.Option value={true}>Yes</Select.Option>
                            <Select.Option value={false}>No</Select.Option>
                          </Select>
                        </Col>
                        <Col xs={12}>
                          <Text strong>Area:</Text>
                          <Select
                            value={media.area}
                            onChange={(value) => updateMediaItem(index, 'area', value)}
                            style={{ width: '100%', marginTop: '4px' }}
                          >
                            <Select.Option value="front">FRONT</Select.Option>
                            <Select.Option value="back">BACK</Select.Option>
                            <Select.Option value="left">LEFT</Select.Option>
                            <Select.Option value="right">RIGHT</Select.Option>
                          </Select>
                        </Col>
                        {media.file_path && (
                          <Col xs={24}>
                            <Text strong>File Path:</Text>
                            <Input
                              value={media.file_path}
                              disabled
                              style={{ marginTop: '4px', backgroundColor: '#f5f5f5' }}
                            />
                          </Col>
                        )}
                      </Row>
                    </Col>
                  </Row>
                </Card>
              ))}

              {mediaList.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  border: '2px dashed #d9d9d9', 
                  borderRadius: '6px',
                  color: '#999'
                }}>
                  <PictureOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>No images added yet</div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    Click "Add Image" to add media for this variation
                  </div>
                </div>
              )}
            </div>

            <Divider />

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  {editingVariation ? 'Update' : 'Create'} Variation
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          open={previewVisible}
          title="Image Preview"
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width={600}
        >
          <Image
            src={previewImage}
            alt="Preview"
            style={{ width: '100%' }}
            preview={false}
          />
        </Modal>
      </div>
    </div>
  );
}
