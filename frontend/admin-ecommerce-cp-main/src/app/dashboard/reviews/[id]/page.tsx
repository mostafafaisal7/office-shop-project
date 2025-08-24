'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Avatar, 
  Modal, 
  Row, 
  Col, 
  Statistic, 
  Tooltip, 
  Badge, 
  Rate,
  Image,
  Divider,
  Descriptions,
  Alert,
  Spin
} from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  StarOutlined, 
  UserOutlined,
  ShoppingOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  LikeOutlined,
  DislikeOutlined,
  CalendarOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useReview } from '@/hooks/useReviews';
import { useReviews } from '@/hooks/useReviews';
import { ReviewResponse } from '@/types/review';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id ? Number(params.id) : null;
  
  const {
    review,
    loading,
    error,
    refresh
  } = useReview(reviewId);

  const {
    approveReview,
    rejectReview,
    deleteReview
  } = useReviews({ autoFetch: false });

  const handleApprove = async () => {
    if (!review) return;
    try {
      await approveReview(review.id);
      refresh();
    } catch (error) {
      console.error('Failed to approve review:', error);
    }
  };

  const handleReject = async () => {
    if (!review) return;
    try {
      await rejectReview(review.id);
      refresh();
    } catch (error) {
      console.error('Failed to reject review:', error);
    }
  };

  const showDeleteConfirm = () => {
    if (!review) return;
    
    confirm({
      title: 'Delete Review',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete this review?</p>
          {review.title && <p><strong>"{review.title}"</strong></p>}
          <p style={{ color: '#ff4d4f', fontSize: '14px' }}>This action cannot be undone.</p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      width: 480,
      async onOk() {
        try {
          await deleteReview(review.id);
          router.push('/dashboard/reviews');
        } catch (error) {
          console.error('Failed to delete review:', error);
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div style={{ padding: '0 24px' }}>
        <Card style={{ borderRadius: '12px', borderColor: '#ff4d4f' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
            <Title level={3} style={{ color: '#ff4d4f' }}>
              {error || 'Review not found'}
            </Title>
            <Link href="/dashboard/reviews">
              <Button type="primary" style={{ marginTop: '16px' }}>
                Back to Reviews
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { color: '#faad14', text: 'Pending', bg: '#fffbe6' },
      approved: { color: '#52c41a', text: 'Approved', bg: '#f6ffed' },
      rejected: { color: '#ff4d4f', text: 'Rejected', bg: '#fff2f0' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const statusConfig = getStatusConfig(review.status);

  return (
    <div style={{ padding: '0 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Link href="/dashboard/reviews">
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />}
                  style={{ padding: '4px 8px' }}
                >
                  Back to Reviews
                </Button>
              </Link>
              <Title level={2} style={{ margin: 0 }}>
                Review Details
              </Title>
            </div>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Review ID: {review.id}
            </Text>
          </div>
          <Space>
            {review.status === 'pending' && (
              <>
                <Button 
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleApprove}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Approve
                </Button>
                <Button 
                  icon={<CloseOutlined />}
                  onClick={handleReject}
                  style={{ color: '#faad14', borderColor: '#faad14' }}
                >
                  Reject
                </Button>
              </>
            )}
            <Button 
              danger
              icon={<DeleteOutlined />}
              onClick={showDeleteConfirm}
            >
              Delete
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Main Review Content */}
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <Avatar 
                src={review.media?.[0]?.file_path} 
                size={64}
                style={{ 
                  borderRadius: '12px',
                  border: '1px solid #f0f0f0',
                  flexShrink: 0
                }}
                icon={<StarOutlined />}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Rate disabled defaultValue={review.rating} style={{ fontSize: '18px' }} />
                  <Text strong style={{ fontSize: '18px' }}>
                    {review.rating}/5
                  </Text>
                  <Tag 
                    color={statusConfig.color}
                    style={{ 
                      borderRadius: '16px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: 'none',
                      background: statusConfig.bg
                    }}
                  >
                    {statusConfig.text}
                  </Tag>
                </div>
                {review.title && (
                  <Title level={3} style={{ margin: '0 0 12px 0', color: '#1890ff' }}>
                    {review.title}
                  </Title>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#666' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserOutlined />
                    {review.user_name || `User ${review.user_id}`}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CalendarOutlined />
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  {review.is_verified_purchase && (
                    <Badge status="success" text="Verified Purchase" />
                  )}
                </div>
              </div>
            </div>

            {review.comment && (
              <div style={{ marginBottom: '20px' }}>
                <Title level={5} style={{ marginBottom: '8px' }}>Review Comment</Title>
                <Paragraph style={{ 
                  fontSize: '15px', 
                  lineHeight: '1.6',
                  background: '#fafafa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0'
                }}>
                  {review.comment}
                </Paragraph>
              </div>
            )}

            {/* Review Media */}
            {review.media && review.media.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <Title level={5} style={{ marginBottom: '12px' }}>
                  Review Media ({review.media.length})
                </Title>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {review.media.map((media) => (
                    <div key={media.id} style={{ position: 'relative' }}>
                      <Image
                        src={media.file_path}
                        alt={media.alt_text || 'Review media'}
                        width={120}
                        height={120}
                        style={{ 
                          borderRadius: '8px', 
                          objectFit: 'cover',
                          border: '1px solid #f0f0f0'
                        }}
                        preview={{
                          src: media.file_path
                        }}
                      />
                      {media.media_type === 'video' && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          VIDEO
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Helpful Votes */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LikeOutlined style={{ color: '#52c41a' }} />
                <Text strong>{review.helpful_count}</Text>
                <Text type="secondary">people found this helpful</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Review Information */}
          <Card title="Review Information" style={{ borderRadius: '12px', marginBottom: '24px' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Review ID">
                <Text code>{review.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag 
                  color={statusConfig.color}
                  style={{ 
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    border: 'none',
                    background: statusConfig.bg
                  }}
                >
                  {statusConfig.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Rating">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Rate disabled defaultValue={review.rating} style={{ fontSize: '14px' }} />
                  <Text>{review.rating}/5</Text>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Helpful Votes">
                <Badge count={review.helpful_count} showZero style={{ backgroundColor: '#52c41a' }} />
              </Descriptions.Item>
              <Descriptions.Item label="Verified Purchase">
                {review.is_verified_purchase ? (
                  <Badge status="success" text="Yes" />
                ) : (
                  <Badge status="default" text="No" />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(review.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {review.updated_at ? new Date(review.updated_at).toLocaleString() : 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* User Information */}
          <Card title="User Information" style={{ borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Avatar size={48} icon={<UserOutlined />} />
              <div>
                <Text strong style={{ display: 'block' }}>
                  {review.user_name || `User ${review.user_id}`}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  User ID: {review.user_id}
                </Text>
              </div>
            </div>
            <Link href={`/dashboard/users/${review.user_id}`}>
              <Button type="link" size="small" style={{ padding: 0 }}>
                View User Profile →
              </Button>
            </Link>
          </Card>

          {/* Product Information */}
          <Card title="Product Information" style={{ borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Avatar size={48} icon={<ShoppingOutlined />} />
              <div>
                <Text strong style={{ display: 'block' }}>
                  Product {review.product_id}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Product ID: {review.product_id}
                </Text>
              </div>
            </div>
            <Link href={`/dashboard/products/${review.product_id}`}>
              <Button type="link" size="small" style={{ padding: 0 }}>
                View Product Details →
              </Button>
            </Link>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ borderRadius: '12px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {review.status === 'pending' && (
                <>
                  <Button 
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleApprove}
                    style={{ width: '100%', background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Approve Review
                  </Button>
                  <Button 
                    icon={<CloseOutlined />}
                    onClick={handleReject}
                    style={{ width: '100%', color: '#faad14', borderColor: '#faad14' }}
                  >
                    Reject Review
                  </Button>
                </>
              )}
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={showDeleteConfirm}
                style={{ width: '100%' }}
              >
                Delete Review
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
