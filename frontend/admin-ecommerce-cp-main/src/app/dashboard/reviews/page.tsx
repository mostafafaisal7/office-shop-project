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
  Dropdown, 
  Rate,
  Image,
  Divider
} from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  EyeOutlined, 
  MoreOutlined, 
  StarOutlined, 
  UserOutlined,
  ShoppingOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useReviews } from '@/hooks/useReviews';
import { ReviewResponse, ReviewStatus } from '@/types/review';
import Link from 'next/link';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Search } = Input;
const { Option } = Select;

export default function ReviewsPage() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  
  const {
    reviews,
    loading,
    error,
    response,
    stats,
    selectedRowKeys,
    setSelectedRowKeys,
    approveReview,
    rejectReview,
    deleteReview,
    bulkApprove,
    bulkReject,
    bulkDelete,
    handleTableChange,
    refresh
  } = useReviews({
    search: searchText,
    status: statusFilter,
    rating: ratingFilter === 'all' ? undefined : ratingFilter,
    page: 1,
    per_page: 20
  });

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
        deleteReview(id);
      },
    });
  };

  const showBulkActionConfirm = (action: 'approve' | 'reject' | 'delete') => {
    const selectedIds = selectedRowKeys.map(key => Number(key));
    const actionText = action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'delete';
    const actionColor = action === 'approve' ? '#52c41a' : action === 'reject' ? '#faad14' : '#ff4d4f';
    
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
      onOk() {
        if (action === 'approve') {
          bulkApprove(selectedIds);
        } else if (action === 'reject') {
          bulkReject(selectedIds);
        } else {
          bulkDelete(selectedIds);
        }
      },
    });
  };

  const getActionMenuItems = (record: ReviewResponse) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: (
        <Link href={`/dashboard/reviews/${record.id}`}>
          View Details
        </Link>
      ),
    },
    ...(record.status === 'pending' ? [
      {
        key: 'approve',
        icon: <CheckOutlined />,
        label: 'Approve Review',
        onClick: () => approveReview(record.id),
      },
      {
        key: 'reject',
        icon: <CloseOutlined />,
        label: 'Reject Review',
        onClick: () => rejectReview(record.id),
      },
    ] : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Review',
      danger: true,
      onClick: () => showDeleteConfirm(record.id, record.title || ''),
    },
  ];

  const columns = [
    {
      title: 'Review',
      key: 'review',
      width: 350,
      render: (_: any, record: ReviewResponse) => (
        <div style={{ display: 'flex', gap: '12px' }}>
          <Avatar 
            src={record.media?.[0]?.file_path} 
            size={48}
            style={{ 
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
              flexShrink: 0
            }}
            icon={<StarOutlined />}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Rate disabled defaultValue={record.rating} style={{ fontSize: '12px' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.rating}/5
              </Text>
            </div>
            {record.title && (
              <div style={{ 
                fontWeight: '600', 
                fontSize: '14px',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                <Link 
                  href={`/dashboard/reviews/${record.id}`}
                  style={{ color: '#1890ff', textDecoration: 'none' }}
                >
                  {record.title}
                </Link>
              </div>
            )}
            {record.comment && (
              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {record.comment}
              </div>
            )}
            <div style={{ 
              fontSize: '11px', 
              color: '#999',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>By: {record.user_name || `User ${record.user_id}`}</span>
              {record.is_verified_purchase && (
                <Badge status="success" text="Verified Purchase" />
              )}
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: true,
      render: (status: ReviewStatus) => {
        const statusConfig = {
          pending: { color: '#faad14', text: 'Pending', bg: '#fffbe6' },
          approved: { color: '#52c41a', text: 'Approved', bg: '#f6ffed' },
          rejected: { color: '#ff4d4f', text: 'Rejected', bg: '#fff2f0' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        
        return (
          <Tag 
            color={config.color}
            style={{ 
              borderRadius: '16px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              background: config.bg
            }}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Helpful',
      dataIndex: 'helpful_count',
      key: 'helpful_count',
      width: 100,
      sorter: true,
      render: (count: number) => (
        <div style={{ textAlign: 'center' }}>
          <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
        </div>
      ),
    },
    {
      title: 'Media',
      key: 'media',
      width: 80,
      render: (_: any, record: ReviewResponse) => (
        <div>
          {record.media && record.media.length > 0 ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              {record.media.slice(0, 2).map((media, index) => (
                <Image
                  key={media.id}
                  src={media.file_path}
                  alt={media.alt_text || 'Review media'}
                  width={24}
                  height={24}
                  style={{ borderRadius: '4px', objectFit: 'cover' }}
                  preview={false}
                />
              ))}
              {record.media.length > 2 && (
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '4px', 
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#666'
                }}>
                  +{record.media.length - 2}
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
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      sorter: true,
      render: (date: string) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {new Date(date).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: ReviewResponse) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Tooltip title="Approve Review">
                <Button 
                  type="text" 
                  icon={<CheckOutlined />} 
                  size="small"
                  style={{ color: '#52c41a' }}
                  onClick={() => approveReview(record.id)}
                />
              </Tooltip>
              <Tooltip title="Reject Review">
                <Button 
                  type="text" 
                  icon={<CloseOutlined />} 
                  size="small"
                  style={{ color: '#faad14' }}
                  onClick={() => rejectReview(record.id)}
                />
              </Tooltip>
            </>
          )}
          <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']} placement="bottomRight">
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              size="small"
              style={{ color: '#666' }}
            />
          </Dropdown>
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
            <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
              Reviews Management
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Manage customer reviews, ratings, and feedback
            </Text>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={refresh}
              style={{ borderRadius: '8px' }}
            >
              Refresh
            </Button>
            <Link href="/dashboard/reviews/pending">
              <Button 
                type="primary" 
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                View Pending Reviews
              </Button>
            </Link>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Total Reviews"
                value={stats?.total_reviews || 0}
                prefix={<StarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Pending Reviews"
                value={stats?.pending_reviews || 0}
                prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Approved Reviews"
                value={stats?.approved_reviews || 0}
                prefix={<CheckOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Average Rating"
                value={stats?.average_rating || 0}
                precision={1}
                prefix={<StarOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: '600' }}
                suffix="/ 5"
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card style={{ borderRadius: '12px', marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} lg={8}>
              <Search
                placeholder="Search reviews by title or comment..."
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
            </Col>
            <Col xs={24} sm={6} lg={4}>
              <Select
                placeholder="Filter by status"
                size="large"
                style={{ width: '100%', borderRadius: '8px' }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Option value="all">All Status</Option>
                <Option value="pending">Pending</Option>
                <Option value="approved">Approved</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6} lg={4}>
              <Select
                placeholder="Filter by rating"
                size="large"
                style={{ width: '100%', borderRadius: '8px' }}
                value={ratingFilter}
                onChange={setRatingFilter}
              >
                <Option value="all">All Ratings</Option>
                <Option value={5}>5 Stars</Option>
                <Option value={4}>4 Stars</Option>
                <Option value={3}>3 Stars</Option>
                <Option value={2}>2 Stars</Option>
                <Option value={1}>1 Star</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} lg={8}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button 
                  icon={<FilterOutlined />}
                  style={{ borderRadius: '8px' }}
                >
                  More Filters
                </Button>
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
          dataSource={reviews}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            current: response?.page,
            pageSize: response?.per_page,
            total: response?.total_items,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} reviews`,
            style: { marginTop: '16px' }
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
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
