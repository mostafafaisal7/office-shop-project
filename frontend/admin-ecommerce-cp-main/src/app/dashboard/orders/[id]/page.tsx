'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Descriptions,
  Table,
  Modal,
  Input,
  Select,
  message,
  Spin,
  Alert,
  Divider,
  Avatar,
  Timeline,
  Statistic
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DownloadOutlined,
  TruckOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { OrderDetailRead, OrderStatus, OrderItemDetailRead } from '@/types/order';
import { orderService } from '../../../../services/order';
import PreviewCarousel from '@/components/PreviewCarousel';

const { Title, Text } = Typography;
const { Option } = Select;

const statusColors: Record<OrderStatus, string> = {
  pending: 'orange',
  paid: 'blue',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  paid: <DollarOutlined />,
  shipped: <TruckOutlined />,
  delivered: <CheckCircleOutlined />,
  cancelled: <CloseCircleOutlined />,
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetailRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [trackingInfo, setTrackingInfo] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
      setNewStatus(orderData.status);
      setTrackingInfo(orderData.tracking_info || '');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch order details';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;
    
    try {
      await orderService.updateOrderStatus(order.id, { status: newStatus, notes: statusNotes });
      message.success(`Order status updated to ${newStatus}`);
      setStatusModalVisible(false);
      setStatusNotes('');
      await fetchOrderDetails();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update order status';
      message.error(errorMessage);
    }
  };

  const handleTrackingUpdate = async () => {
    if (!order) return;
    
    try {
      await orderService.updateOrderTracking(order.id, { tracking_info: trackingInfo, notes: statusNotes });
      message.success('Order tracking updated successfully');
      setTrackingModalVisible(false);
      setStatusNotes('');
      await fetchOrderDetails();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update order tracking';
      message.error(errorMessage);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    
    try {
      const blob = await orderService.downloadInvoice(order.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Invoice downloaded successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to download invoice';
      message.error(errorMessage);
    }
  };

  const itemColumns: ColumnsType<OrderItemDetailRead> = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => {
        // Enhanced Dynamic image logic with comprehensive priority handling:
        // 1. Custom design preview (from customized_images field - either custom preview or product fallback)
        // 2. Variation image (from variation_details.media)
        // 3. Default placeholder
        let imageUrl = null;
        let imageAlt = record.product_name;
        let isCustomDesign = false;

        // Priority 1: Check customized_images field (contains either custom previews OR product fallback images)
        console.log('🔍 Admin Order Item Debug:', {
          productName: record.product_name,
          customizedImages: record.customized_images,
          customizedImagesType: typeof record.customized_images,
          customizationOptionId: record.customization_option_id,
          variationDetails: record.variation_details
        });

        if (record.customized_images) {
          try {
            let customImages;
            
            // Handle both string and array formats
            if (typeof record.customized_images === 'string') {
              try {
                customImages = JSON.parse(record.customized_images);
                console.log('📋 Parsed customized_images from string:', customImages);
              } catch (parseError) {
                // If parse fails, treat as single URL string
                customImages = [record.customized_images];
                console.log('📋 Using customized_images as single URL:', customImages);
              }
            } else if (Array.isArray(record.customized_images)) {
              customImages = record.customized_images;
              console.log('📋 Using customized_images as array:', customImages);
            }

            // Extract image URL from various possible formats
            if (Array.isArray(customImages) && customImages.length > 0) {
              const customImage = customImages[0];
              let rawCustomUrl;
              
              if (typeof customImage === 'string') {
                rawCustomUrl = customImage;
                console.log('✅ Using image URL from customized_images:', rawCustomUrl);
              } else if (customImage && typeof customImage === 'object') {
                rawCustomUrl = customImage.url || customImage.file_path || customImage.image_url || customImage.preview_url;
                console.log('✅ Using object image URL from customized_images:', rawCustomUrl);
              }
              
              if (rawCustomUrl) {
                // Convert relative URLs to full URLs
                if (!rawCustomUrl.startsWith('http')) {
                  if (rawCustomUrl.startsWith('/static/')) {
                    imageUrl = `http://127.0.0.1:8000${rawCustomUrl}`;
                  } else if (rawCustomUrl.startsWith('/images/')) {
                    imageUrl = `http://127.0.0.1:8000/static/products/${rawCustomUrl.replace('/images/products/', '')}`;
                  } else {
                    imageUrl = rawCustomUrl;
                  }
                } else {
                  imageUrl = rawCustomUrl;
                }
                
                // Determine if this is a custom design or product fallback
                isCustomDesign = !!record.customization_option_id;
                imageAlt = isCustomDesign ? `${record.product_name} (Custom Design)` : record.product_name;
                
                console.log('🎨 Using image from customized_images:', imageUrl, 'isCustom:', isCustomDesign);
              }
            }
          } catch (error) {
            console.warn('❌ Failed to process customized_images:', error);
          }
        }
        
        // Priority 2: Variation image (only if no custom design found)
        if (!imageUrl && record.variation_details?.media?.[0]) {
          let rawImageUrl = record.variation_details.media[0].file_path;
          
          // Convert relative URLs to full URLs
          if (rawImageUrl && !rawImageUrl.startsWith('http')) {
            if (rawImageUrl.startsWith('/images/')) {
              // Convert /images/products/xyz to full URL
              imageUrl = `http://127.0.0.1:8000/static/products/${rawImageUrl.replace('/images/products/', '')}`;
            } else if (rawImageUrl.startsWith('/static/')) {
              // Already a static path, add base URL
              imageUrl = `http://127.0.0.1:8000${rawImageUrl}`;
            } else {
              imageUrl = rawImageUrl;
            }
          } else {
            imageUrl = rawImageUrl;
          }
          
          imageAlt = record.variation_details.media[0].alt_text || `${record.product_name} (${record.variation_details.name})`;
          console.log('📷 Using variation image:', imageUrl, '(from raw:', rawImageUrl, ')');
        } else if (!imageUrl) {
          console.log('⚠️ No variation media found for:', record.product_name);
          console.log('Variation details:', record.variation_details);
        }

        // Priority 3: Default product placeholder (if no other image found)
        if (!imageUrl) {
          console.log('🔍 No product images found, showing placeholder');
          // Set a default placeholder - we'll handle this in the component render
        }

        console.log('🖼️ Final image decision:', { 
          imageUrl, 
          imageAlt, 
          isCustomDesign,
          willShowImage: !!imageUrl
        });

        // Determine the final images to display (either custom previews or product image)
        let finalImages: string | string[];
        if (record.customized_images && Array.isArray(record.customized_images) && record.customized_images.length > 0) {
          // Process customized images array to get proper URLs
          const processedImages = record.customized_images.map((img: any) => {
            if (typeof img === 'string') {
              return img;
            } else if (img && typeof img === 'object') {
              return img.url || img.file_path || img.image_url || img.preview_url;
            }
            return '';
          }).filter(Boolean);
          
          finalImages = processedImages.length === 1 ? processedImages[0] : processedImages;
        } else if (imageUrl) {
          finalImages = imageUrl;
        } else if (record.variation_details?.media?.[0]) {
          // Fallback to variation image
          let rawImageUrl = record.variation_details.media[0].file_path;
          if (rawImageUrl && !rawImageUrl.startsWith('http')) {
            if (rawImageUrl.startsWith('/images/')) {
              finalImages = `http://127.0.0.1:8000/static/products/${rawImageUrl.replace('/images/products/', '')}`;
            } else if (rawImageUrl.startsWith('/static/')) {
              finalImages = `http://127.0.0.1:8000${rawImageUrl}`;
            } else {
              finalImages = rawImageUrl;
            }
          } else {
            finalImages = rawImageUrl || '';
          }
        } else {
          // Final fallback to placeholder
          finalImages = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=64&h=64&fit=crop";
        }

        return (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* Product Image with PreviewCarousel for multiple images */}
            <PreviewCarousel
              images={finalImages}
              alt={imageAlt}
              size={64}
              showThumbnails={true}
              style={{}}
            />
            <div style={{ flex: 1 }}>
              <Text strong>{record.product_name}</Text>
              {record.variation_details && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Variation: {record.variation_details.name}
                  </Text>
                </div>
              )}
              {record.variation_details?.sku && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    SKU: {record.variation_details.sku}
                  </Text>
                </div>
              )}
              {record.variation_details?.attributes && (
                <div style={{ marginTop: 4 }}>
                  {Object.entries(record.variation_details.attributes).map(([key, value]) => (
                    <Tag key={key} style={{ marginBottom: 2, fontSize: '11px' }}>
                      {key}: {value}
                    </Tag>
                  ))}
                </div>
              )}
              {record.customization_option_id && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Customization ID: {record.customization_option_id}
                  </Text>
                </div>
              )}
              {isCustomDesign && (
                <div>
                  <Tag color="green" style={{ fontSize: '11px', marginTop: 2 }}>
                    Custom Design Applied
                  </Tag>
                </div>
              )}
              {!imageUrl && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: '10px', color: '#ff6b6b' }}>
                    Debug: No image URL found
                  </Text>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Stock Info',
      key: 'stock',
      width: 120,
      render: (_, record) => (
        <div>
          {record.variation_details && (
            <>
              <div>
                <Text style={{ fontSize: '12px' }}>
                  Stock: {record.variation_details.stock_quantity}
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Low: {record.variation_details.low_stock_threshold}
                </Text>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (quantity: number) => (
        <Text strong>{quantity}</Text>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 140,
      render: (_, record) => (
        <div>
          <div>
            <Text strong>${record.unit_price.toFixed(2)}</Text>
          </div>
          {record.variation_details?.price && parseFloat(record.variation_details.price) !== record.unit_price && (
            <div>
              <Text type="secondary" style={{ fontSize: '11px', textDecoration: 'line-through' }}>
                ${parseFloat(record.variation_details.price).toFixed(2)}
              </Text>
            </div>
          )}
          {record.discount_amount && (
            <div>
              <Text type="success" style={{ fontSize: '11px' }}>
                -{record.discount_type === 'percentage' ? `${record.discount_percentage}%` : `$${record.discount_amount}`}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Design',
      key: 'design',
      width: 180,
      render: (_, record) => {
        const hasDesign = record.customization_option_id || record.design_svg_data || record.design_elements;

        if (!hasDesign) {
          return <Text type="secondary" style={{ fontSize: '11px' }}>No customization</Text>;
        }

        const handleDownloadFile = async (fileType: 'svg' | 'canvas' | 'elements') => {
          try {
            const response = await fetch(
              `/api/orders/${order.id}/items/${record.id}/download-${fileType}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
              }
            );

            if (!response.ok) {
              message.error(`${fileType.toUpperCase()} file not available for this item`);
              return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Set filename based on file type
            const extension = fileType === 'svg' ? 'svg' : 'json';
            link.download = `order_${order.id}_item_${record.id}_${fileType}.${extension}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            message.success(`${fileType.toUpperCase()} file downloaded successfully`);
          } catch (error) {
            console.error('Download error:', error);
            message.error(`Failed to download ${fileType.toUpperCase()}`);
          }
        };

        // Count different element types
        const elementCounts = {
          text: 0,
          image: 0,
          shape: 0,
          other: 0
        };

        record.design_elements?.forEach((el: any) => {
          if (el.type === 'text' || el.type === 'i-text' || el.type === 'textbox') {
            elementCounts.text++;
          } else if (el.type === 'image') {
            elementCounts.image++;
          } else if (el.type === 'rect' || el.type === 'circle' || el.type === 'triangle' || el.type === 'path') {
            elementCounts.shape++;
          } else {
            elementCounts.other++;
          }
        });

        const totalElements = record.design_elements?.length || 0;

        return (
          <div>
            <Tag color="purple" style={{ fontSize: '10px', marginBottom: 4 }}>
              Custom Design
            </Tag>

            {totalElements > 0 && (
              <div style={{ marginTop: 4, marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                  Total: {totalElements} element{totalElements > 1 ? 's' : ''}
                </Text>
                {elementCounts.text > 0 && (
                  <Text type="secondary" style={{ fontSize: '9px', display: 'block' }}>
                    • Text: {elementCounts.text}
                  </Text>
                )}
                {elementCounts.image > 0 && (
                  <Text type="secondary" style={{ fontSize: '9px', display: 'block' }}>
                    • Images: {elementCounts.image}
                  </Text>
                )}
                {elementCounts.shape > 0 && (
                  <Text type="secondary" style={{ fontSize: '9px', display: 'block' }}>
                    • Shapes: {elementCounts.shape}
                  </Text>
                )}
              </div>
            )}

            <div style={{ marginTop: 6 }}>
              {record.design_svg_data && (
                <Button
                  size="small"
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadFile('svg')}
                  style={{ padding: 0, fontSize: '10px', display: 'block', marginBottom: 2 }}
                >
                  SVG
                </Button>
              )}
              {record.design_canvas_data && (
                <Button
                  size="small"
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadFile('canvas')}
                  style={{ padding: 0, fontSize: '10px', display: 'block', marginBottom: 2 }}
                >
                  Canvas JSON
                </Button>
              )}
              {record.design_elements && record.design_elements.length > 0 && (
                <Button
                  size="small"
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadFile('elements')}
                  style={{ padding: 0, fontSize: '10px', display: 'block' }}
                >
                  Elements JSON
                </Button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      render: (_, record) => (
        <Text strong>${(record.quantity * record.unit_price).toFixed(2)}</Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: 16 }}
        >
          Back to Orders
        </Button>
        <Alert
          message="Error"
          description={error || 'Order not found'}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const orderTimeline = [
    {
      color: 'green',
      children: (
        <div>
          <Text strong>Order Created</Text>
          <br />
          <Text type="secondary">{dayjs(order.created_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
        </div>
      ),
    },
    ...(order.status !== 'pending' ? [{
      color: statusColors[order.status],
      children: (
        <div>
          <Text strong>Status: {order.status.toUpperCase()}</Text>
          <br />
          <Text type="secondary">{order.updated_at ? dayjs(order.updated_at).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}</Text>
        </div>
      ),
    }] : []),
    ...(order.tracking_info ? [{
      color: 'blue',
      children: (
        <div>
          <Text strong>Tracking Added</Text>
          <br />
          <Text type="secondary">{order.tracking_info}</Text>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            Back to Orders
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            Order #{order.id.slice(-8)}
          </Title>
          <Tag
            color={statusColors[order.status]}
            icon={statusIcons[order.status]}
            style={{ fontSize: '14px', padding: '4px 12px' }}
          >
            {order.status.toUpperCase()}
          </Tag>
        </Space>
      </div>

      {/* Action Buttons */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setStatusModalVisible(true)}
          >
            Update Status
          </Button>
          <Button
            icon={<TruckOutlined />}
            onClick={() => setTrackingModalVisible(true)}
          >
            Update Tracking
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadInvoice}
          >
            Download Invoice
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Space>
      </Card>

      <Row gutter={16}>
        {/* Order Summary */}
        <Col xs={24} lg={16}>
          <Card title="Order Summary" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Total Amount"
                  value={order.total_price}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Items Count"
                  value={order.items.length}
                  prefix={<ShoppingCartOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Order Date"
                  value={dayjs(order.created_at).format('MMM DD, YYYY')}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* Order Items */}
          <Card title="Order Items">
            <Table
              columns={itemColumns}
              dataSource={order.items}
              rowKey="id"
              pagination={false}
              summary={(pageData) => {
                const total = pageData.reduce(
                  (sum, record) => sum + record.quantity * record.unit_price,
                  0
                );
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <Text strong>Subtotal</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong>${order.subtotal.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>

          {/* Order Breakdown */}
          <Card title="Order Breakdown" style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Subtotal">
                <Text strong>${order.subtotal.toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Shipping Cost">
                <Text strong>${order.shipping_cost.toFixed(2)}</Text>
              </Descriptions.Item>
              {order.estimated_delivery_days && (
                <Descriptions.Item label="Estimated Delivery">
                  <Text>{order.estimated_delivery_days} days</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Total">
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  ${order.total_price.toFixed(2)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Shipping Cost Breakdown */}
          {order.shipping_cost_breakdown && (
            <Card title="Shipping Cost Details" style={{ marginTop: 16 }}>
              <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Total Shipping Cost">
                  <Text strong>${order.shipping_cost_breakdown.total_cost.toFixed(2)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Delivery Days">
                  <Text>{order.shipping_cost_breakdown.delivery_days} days</Text>
                </Descriptions.Item>
              </Descriptions>
              
              {order.shipping_cost_breakdown.product_breakdown && order.shipping_cost_breakdown.product_breakdown.length > 0 && (
                <div>
                  <Title level={5}>Product-specific Shipping Rules</Title>
                  {order.shipping_cost_breakdown.product_breakdown.map((breakdown, index) => (
                    <Card key={index} size="small" style={{ marginBottom: 8 }}>
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="Product ID">
                          {breakdown.product_id}
                        </Descriptions.Item>
                        <Descriptions.Item label="Quantity">
                          {breakdown.quantity}
                        </Descriptions.Item>
                        <Descriptions.Item label="Base Cost">
                          ${breakdown.base_cost.toFixed(2)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Final Cost">
                          <Text strong>${breakdown.final_cost.toFixed(2)}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Rule Source">
                          <Tag color="blue">{breakdown.rule_source}</Tag>
                        </Descriptions.Item>
                      </Descriptions>
                      
                      {breakdown.applied_rules && breakdown.applied_rules.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Text strong style={{ fontSize: '12px' }}>Applied Rules:</Text>
                          {breakdown.applied_rules.map((rule, ruleIndex) => (
                            <div key={ruleIndex} style={{ marginLeft: 16, marginTop: 4 }}>
                              <Text style={{ fontSize: '11px' }}>
                                Rule #{rule.rule_id}: {rule.min_quantity}-{rule.max_quantity} qty, 
                                {rule.adjustment_type === 'per_item' ? ' per item' : ''} 
                                adjustment: {rule.cost_adjustment > 0 ? '+' : ''}${rule.cost_adjustment.toFixed(2)}
                                (Total: {rule.total_adjustment > 0 ? '+' : ''}${rule.total_adjustment.toFixed(2)})
                              </Text>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </Col>

        {/* Order Details Sidebar */}
        <Col xs={24} lg={8}>
          {/* Customer Information */}
          {/* <Card title="Customer Information" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <div>
                  <div>
                    <Text strong>
                      {order.user_name || (order.user_id ? `User #${order.user_id}` : 'Guest')}
                    </Text>
                  </div>
                  {order.user_email && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {order.user_email}
                      </Text>
                    </div>
                  )}
                  {order.guest_id && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Guest ID: {order.guest_id}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </Space>
          </Card> */}

          <Card title="Customer Information" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <div>
                  <div>
                    <Text strong>
                      {order.user?.name || (order.user_id ? `User #${order.user_id}` : 'Guest')}
                    </Text>
                  </div>
                  {order.user?.email && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {order.user.email}
                      </Text>
                    </div>
                  )}
                  {order.guest_id && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Guest ID: {order.guest_id}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </Space>
          </Card>

        


          {/* Shipping Address */}
          {order.shipping_address && (
            // <Card title="Shipping Address" style={{ marginBottom: 16 }}>
            //   <div>
            //     <Text>{order.shipping_address.name}</Text>
            //     <br />
            //     <Text type="secondary">
            //       {order.shipping_address.address_line_1}
            //       {order.shipping_address.address_line_2 && (
            //         <>, {order.shipping_address.address_line_2}</>
            //       )}
            //       <br />
            //       {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
            //       <br />
            //       {order.shipping_address.country}
            //     </Text>
            //     {order.shipping_address.phone && (
            //       <>
            //         <br />
            //         <Text type="secondary">Phone: {order.shipping_address.phone}</Text>
            //       </>
            //     )}
            //   </div>
            // </Card>
            <Card title="Shipping Address" style={{ marginBottom: 16 }}>
            <div>
              <Text strong>Recipient:</Text> {order.shipping_address.full_name}
              <br />
              {order.shipping_address.phone && (
                <>
                  <Text strong>Phone:</Text> {order.shipping_address.phone}
                </>
              )}
              {order.shipping_address.email && (
                <>
                  <br />
                  <Text strong>Email:</Text> {order.shipping_address.email}
                  <br />
                </>
              )}
              <br />
              <Text strong>Delivery Address:</Text> {order.shipping_address.delivery_address}
              <br />
              <Text strong>Postal Code:</Text> {order.shipping_address.postal_code}
              <br />
              <Text strong>District:</Text> {order.shipping_address.district}
              <br />
              <Text strong>Division:</Text> {order.shipping_address.division}
              <br />
              <Text strong>Country:</Text> {order.shipping_address.country}
              
            </div>
          </Card>

          )}

          {/* Payment Method */}
          {order.payment_method && (
            <Card title="Payment Method" style={{ marginBottom: 16 }}>
              <Text>{order.payment_method.name}</Text>
              <br />
              <Text type="secondary">{order.payment_method.type}</Text>
            </Card>
          )}

          {/* Order Timeline */}
          <Card title="Order Timeline">
            <Timeline items={orderTimeline} />
          </Card>
        </Col>
      </Row>

      {/* Status Update Modal */}
      <Modal
        title="Update Order Status"
        open={statusModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => {
          setStatusModalVisible(false);
          setStatusNotes('');
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Order ID: </Text>
            <Text code>#{order.id.slice(-8)}</Text>
          </div>
          <div>
            <Text strong>Current Status: </Text>
            <Tag color={statusColors[order.status]}>
              {order.status.toUpperCase()}
            </Tag>
          </div>
          <div>
            <Text strong>New Status:</Text>
            <Select
              value={newStatus}
              onChange={setNewStatus}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="pending">Pending</Option>
              <Option value="paid">Paid</Option>
              <Option value="shipped">Shipped</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </div>
          <div>
            <Text strong>Notes (Optional):</Text>
            <Input.TextArea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Add notes about this status change..."
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      {/* Tracking Update Modal */}
      <Modal
        title="Update Order Tracking"
        open={trackingModalVisible}
        onOk={handleTrackingUpdate}
        onCancel={() => {
          setTrackingModalVisible(false);
          setStatusNotes('');
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Order ID: </Text>
            <Text code>#{order.id.slice(-8)}</Text>
          </div>
          <div>
            <Text strong>Current Tracking: </Text>
            <Text>{order.tracking_info || 'No tracking info'}</Text>
          </div>
          <div>
            <Text strong>Tracking Information:</Text>
            <Input
              value={trackingInfo}
              onChange={(e) => setTrackingInfo(e.target.value)}
              placeholder="Enter tracking number or URL..."
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text strong>Notes (Optional):</Text>
            <Input.TextArea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Add notes about this tracking update..."
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
