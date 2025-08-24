import { Table, Button, Space, Typography, Tag, Avatar, Rate, Image, Badge, Tooltip, Dropdown } from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  MoreOutlined, 
  StarOutlined, 
  ShoppingOutlined 
} from '@ant-design/icons';
import { ReviewResponse, ReviewStatus } from '@/types/review';
import Link from 'next/link';

const { Text } = Typography;

interface ReviewListProps {
  reviews: ReviewResponse[];
  loading: boolean;
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onDelete: (id: number, title?: string) => void;
  pagination?: any;
  onChange?: (pagination: any, filters: any, sorter: any) => void;
}

export default function ReviewList({
  reviews,
  loading,
  selectedRowKeys,
  onSelectionChange,
  onApprove,
  onReject,
  onDelete,
  pagination,
  onChange
}: ReviewListProps) {
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
        onClick: () => onApprove(record.id),
      },
      {
        key: 'reject',
        icon: <CloseOutlined />,
        label: 'Reject Review',
        onClick: () => onReject(record.id),
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
      onClick: () => onDelete(record.id, record.title || ''),
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
              {record.media.slice(0, 2).map((media) => (
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
                  onClick={() => onApprove(record.id)}
                />
              </Tooltip>
              <Tooltip title="Reject Review">
                <Button 
                  type="text" 
                  icon={<CloseOutlined />} 
                  size="small"
                  style={{ color: '#faad14' }}
                  onClick={() => onReject(record.id)}
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
    onChange: onSelectionChange,
    getCheckboxProps: (record: ReviewResponse) => ({
      disabled: false,
      name: record.id.toString(),
    }),
  };

  return (
    <Table
      columns={columns}
      dataSource={reviews}
      loading={loading}
      rowKey="id"
      rowSelection={rowSelection}
      pagination={pagination}
      onChange={onChange}
      scroll={{ x: 1200 }}
      rowClassName={(record, index) => 
        index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
      }
    />
  );
}
