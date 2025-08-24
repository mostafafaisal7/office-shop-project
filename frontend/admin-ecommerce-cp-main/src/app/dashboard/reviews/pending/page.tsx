'use client';

import { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Avatar, 
  Modal, 
  Card, 
  Input, 
  Select, 
  Row, 
  Col, 
  Statistic, 
  Tooltip, 
  Badge, 
  Rate,
  Image,
  Alert
} from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  EyeOutlined, 
  StarOutlined, 
  ShoppingOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { usePendingReviews } from '@/hooks/useReviews';
import { useReviews } from '@/hooks/useReviews';
import { ReviewResponse } from '@/types/review';
import Link from 'next/link';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Search } = Input;
const { Option } = Select;

export default function PendingReviewsPage() {
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  const {
    reviews: pendingReviews,
    loading,
    error,
    response,
    refresh
  } = usePendingReviews({
    page: 1,
    per_page: 50
  });

  // Use the main reviews hook for actions
  const {
    approveReview,
    rejectReview,
    deleteReview,
    bulkApprove,
    bulkReject,
    bulkDelete
  } = useReviews({ autoFetch: false });

  const handleApprove = async (id: number) => {
    await approveReview(id);
    refresh();
  };

  const handleReject = async (id: number) => {
    await rejectReview(id);
    refresh();
  };

  const handleDelete = async (id: number) => {
    await deleteReview(id);
    refresh();
  };

  const showBulkActionConfirm = (action: 'approve' | 'reject' | 'delete') => {
    const selectedIds = selectedRowKeys.map(key => Number(key));
    const actionText = action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'delete';
    
    confirm({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Reviews`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to {actionText} <strong>{selectedIds.length}</strong> selected reviews?</p>
          {action === 'delete' && (
            <p style={{ color: '#ff4d4f', fontSize: '14px' }}>This action cannot be undone.</p>
          )}
        </div>
      ),
      okText: actionText.charAt(0).toUpperCase() + actionText.slice(1),
      okType: action === 'delete' ? 'danger' : 'primary',
      cancelText: 'Cancel',
      width: 480,
      async onOk() {
        if (action === 'approve') {
          await bulkApprove(selectedIds);
        } else if (action === 'reject') {
          await bulkReject(selectedIds);
        } else {
          await bulkDelete(selectedIds);
        }
        setSelectedRowKeys([]);
        refresh();
      },
    });
  };

  const showDeleteConfirm = (id: number, reviewTitle: string) => {
    confirm({
      title: 'Delete Review',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete this review?</p>
          {reviewTitle && <p><strong>"{reviewTitle}"</strong></p>}
          <p style={{ color: '#ff4d4f', fontSize: '14px' }}>This action cannot be undone.</p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      width: 480,
      onOk() {
        handleDelete(id);
      },
    });
  };

  // Filter reviews based on search text
  const filteredReviews = pendingReviews.filter(review => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      review.title?.toLowerCase().includes(searchLower) ||
      review.comment?.toLowerCase().includes(searchLower) ||
      review.user_name?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: 'Review Details',
      key: 'review',
      width: 400,
      render: (_: any, record: ReviewResponse) => (
        <div style={{ display: 'flex', gap: '12px' }}>
          <Avatar 
            src={record.media?.[0]?.file_path} 
            size={56}
            style={{ 
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
              flexShrink: 0
            }}
            icon={<StarOutlined />}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Rate disabled defaultValue={record.rating} style={{ fontSize: '14px' }} />
              <Text strong style={{ fontSize: '14px' }}>
                {record.rating}/5
              </Text>
            </div>
            {record.title && (
              <div style={{ 
                fontWeight: '600', 
                fontSize: '15px',
                marginBottom: '6px',
                color: '#1890ff'
              }}>
                <Link 
                  href={`/dashboard/reviews/${record.id}`}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {record.title}
                </Link>
              </div>
            )}
            {record.comment && (
              <div style={{ 
                fontSize: '13px', 
                color: '#666',
                marginBottom: '6px',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {record.comment}
              </div>
            )}
            <div style={{ 
              fontSize: '12px', 
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span>By: {record.user_name || `User ${record.user_id}`}</span>
              {record.is_verified_purchase && (
                <Badge status="success" text="Verified Purchase" />
              )}
              <span>{new Date(record.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 120,
      render: (productId: number) => (
        <Link href={`/dashboard/products/${productId}`}>
          <Button type="link" size="small" icon={<ShoppingOutlined />}>
            Product {productId}
          </Button>
        </Link>
      ),
    },
    {
      title: 'Media',
      key: 'media',
      width: 100,
      render: (_: any, record: ReviewResponse) => (
        <div>
          {record.media && record.media.length > 0 ? (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {record.media.slice(0, 3).map((media) => (
                <Image
                  key={media.id}
                  src={media.file_path}
                  alt={media.alt_text || 'Review media'}
                  width={32}
                  height={32}
                  style={{ borderRadius: '4px', objectFit: 'cover' }}
                  preview={{
                    src: media.file_path
                  }}
                />
              ))}
              {record.media.length > 3 && (
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '4px', 
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#666'
                }}>
                  +{record.media.length - 3}
                </div>
              )}
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>No media</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: ReviewResponse) => (
        <Space size="small" direction="vertical" style={{ width: '100%' }}>
          <Space size="small">
            <Tooltip title="Approve Review">
              <Button 
                type="primary"
                icon={<CheckOutlined />} 
                size="small"
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
            </Tooltip>
            <Tooltip title="Reject Review">
              <Button 
                icon={<CloseOutlined />} 
                size="small"
                style={{ color: '#faad14', borderColor: '#faad14' }}
                onClick={() => handleReject(record.id)}
              >
                Reject
              </Button>
            </Tooltip>
          </Space>
          <Space size="small">
            <Link href={`/dashboard/reviews/${record.id}`}>
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                size="small"
              >
                View Details
              </Button>
            </Link>
            <Button 
              type="text"
              danger
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => showDeleteConfirm(record.id, record.title || '')}
            >
              Delete
            </Button>
          </Space>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: ReviewResponse) => ({
      disabled: false,
      name: record.id.toString(),
    }),
  };

  return (
    <div style={{ padding: '0 24px' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
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
                Pending Reviews
              </Title>
            </div>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Review and moderate pending customer reviews
            </Text>
          </div>
          <Button 
            icon={<ReloadOutlined />}
            onClick={refresh}
            style={{ borderRadius: '8px' }}
          >
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Pending Reviews"
                value={pendingReviews.length}
                prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="With Media"
                value={pendingReviews.filter(r => r.media && r.media.length > 0).length}
                prefix={<StarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Verified Purchases"
                value={pendingReviews.filter(r => r.is_verified_purchase).length}
                prefix={<CheckOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Search and Filters */}
        <Card style={{ borderRadius: '12px', marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={16}>
              <Search
                placeholder="Search pending reviews by title, comment, or user..."
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Text type="secondary">
                  Showing {filteredReviews.length} of {pendingReviews.length} reviews
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 && (
          <Card style={{ borderRadius: '12px', marginBottom: '24px', borderColor: '#1890ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text strong style={{ color: '#1890ff' }}>
                {selectedRowKeys.length} reviews selected
              </Text>
              <Space>
                <Button 
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => showBulkActionConfirm('approve')}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Approve Selected
                </Button>
                <Button 
                  icon={<CloseOutlined />}
                  onClick={() => showBulkActionConfirm('reject')}
                  style={{ color: '#faad14', borderColor: '#faad14' }}
                >
                  Reject Selected
                </Button>
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => showBulkActionConfirm('delete')}
                >
                  Delete Selected
                </Button>
              </Space>
            </div>
          </Card>
        )}

        {/* Info Alert */}
        {pendingReviews.length === 0 && !loading && (
          <Alert
            message="No Pending Reviews"
            description="Great! There are no reviews waiting for moderation at the moment."
            type="success"
            showIcon
            style={{ marginBottom: '24px', borderRadius: '8px' }}
          />
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card style={{ marginBottom: '24px', borderColor: '#ff4d4f', borderRadius: '8px' }}>
          <div style={{ color: '#ff4d4f', textAlign: 'center', padding: '20px' }}>
            <Text type="danger" style={{ fontSize: '16px' }}>{error}</Text>
          </div>
        </Card>
      )}

      {/* Reviews Table */}
      <Card style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={filteredReviews}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} pending reviews`,
            style: { marginTop: '16px' }
          }}
          scroll={{ x: 800 }}
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
        />
      </Card>

      <style jsx global>{`
        .table-row-light {
          background-color: #ffffff;
        }
        .table-row-dark {
          background-color: #fafafa;
        }
        .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          padding: 16px 12px !important;
          border-bottom: 2px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr > td {
          padding: 16px 12px !important;
          border-bottom: 1px solid #f5f5f5 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #f8f9ff !important;
        }
        .ant-table-row:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
      `}</style>
    </div>
  );
}
