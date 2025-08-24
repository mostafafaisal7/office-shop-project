import { Card, Button, Space, Typography, Tag, Avatar, Rate, Image, Badge, Tooltip } from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  StarOutlined, 
  UserOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  LikeOutlined
} from '@ant-design/icons';
import { ReviewResponse, ReviewStatus } from '@/types/review';
import Link from 'next/link';

const { Text, Paragraph } = Typography;

interface ReviewCardProps {
  review: ReviewResponse;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onDelete?: (id: number, title?: string) => void;
  showActions?: boolean;
}

export default function ReviewCard({
  review,
  onApprove,
  onReject,
  onDelete,
  showActions = true
}: ReviewCardProps) {
  const getStatusConfig = (status: ReviewStatus) => {
    const configs = {
      pending: { color: '#faad14', text: 'Pending', bg: '#fffbe6' },
      approved: { color: '#52c41a', text: 'Approved', bg: '#f6ffed' },
      rejected: { color: '#ff4d4f', text: 'Rejected', bg: '#fff2f0' }
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(review.status);

  return (
    <Card
      style={{ 
        borderRadius: '12px',
        marginBottom: '16px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            src={review.media?.[0]?.file_path} 
            size={48}
            style={{ 
              borderRadius: '8px',
              border: '1px solid #f0f0f0'
            }}
            icon={<StarOutlined />}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Rate disabled defaultValue={review.rating} style={{ fontSize: '16px' }} />
              <Text strong style={{ fontSize: '16px' }}>
                {review.rating}/5
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#666' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserOutlined />
                {review.user_name || `User ${review.user_id}`}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CalendarOutlined />
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          {review.is_verified_purchase && (
            <Badge status="success" text="Verified" />
          )}
        </div>
      </div>

      {/* Review Content */}
      <div style={{ marginBottom: '16px' }}>
        {review.title && (
          <div style={{ 
            fontWeight: '600', 
            fontSize: '16px',
            marginBottom: '8px',
            color: '#1890ff'
          }}>
            <Link 
              href={`/dashboard/reviews/${review.id}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {review.title}
            </Link>
          </div>
        )}
        {review.comment && (
          <Paragraph 
            style={{ 
              fontSize: '14px', 
              lineHeight: '1.6',
              margin: 0,
              color: '#333'
            }}
            ellipsis={{ rows: 3, expandable: true, symbol: 'Read more' }}
          >
            {review.comment}
          </Paragraph>
        )}
      </div>

      {/* Review Media */}
      {review.media && review.media.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {review.media.slice(0, 4).map((media) => (
              <div key={media.id} style={{ position: 'relative' }}>
                <Image
                  src={media.file_path}
                  alt={media.alt_text || 'Review media'}
                  width={80}
                  height={80}
                  style={{ 
                    borderRadius: '6px', 
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
                    top: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontSize: '9px'
                  }}>
                    VIDEO
                  </div>
                )}
              </div>
            ))}
            {review.media.length > 4 && (
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '6px', 
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#666',
                border: '1px solid #e0e0e0'
              }}>
                +{review.media.length - 4} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '16px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LikeOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '13px' }}>
              {review.helpful_count} helpful
            </Text>
          </div>
          <Link href={`/dashboard/products/${review.product_id}`}>
            <Button type="link" size="small" icon={<ShoppingOutlined />} style={{ padding: 0 }}>
              Product {review.product_id}
            </Button>
          </Link>
        </div>

        {showActions && (
          <Space size="small">
            {review.status === 'pending' && (
              <>
                <Tooltip title="Approve Review">
                  <Button 
                    type="primary"
                    icon={<CheckOutlined />} 
                    size="small"
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    onClick={() => onApprove?.(review.id)}
                  >
                    Approve
                  </Button>
                </Tooltip>
                <Tooltip title="Reject Review">
                  <Button 
                    icon={<CloseOutlined />} 
                    size="small"
                    style={{ color: '#faad14', borderColor: '#faad14' }}
                    onClick={() => onReject?.(review.id)}
                  >
                    Reject
                  </Button>
                </Tooltip>
              </>
            )}
            <Link href={`/dashboard/reviews/${review.id}`}>
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                size="small"
              >
                View
              </Button>
            </Link>
            <Button 
              type="text"
              danger
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => onDelete?.(review.id, review.title || '')}
            >
              Delete
            </Button>
          </Space>
        )}
      </div>
    </Card>
  );
}
