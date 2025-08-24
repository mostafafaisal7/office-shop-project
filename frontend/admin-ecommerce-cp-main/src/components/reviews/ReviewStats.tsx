import { Card, Row, Col, Statistic, Progress, Typography } from 'antd';
import { 
  StarOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  ExclamationCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { ReviewStatsResponse, ReviewSummaryResponse } from '@/types/review';

const { Title, Text } = Typography;

interface ReviewStatsProps {
  stats?: ReviewStatsResponse;
  summary?: ReviewSummaryResponse;
  loading?: boolean;
}

export default function ReviewStats({ stats, summary, loading }: ReviewStatsProps) {
  const getRatingDistribution = () => {
    if (!summary?.rating_distribution) return [];
    
    const total = summary.total_reviews;
    return [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: summary.rating_distribution[rating as keyof typeof summary.rating_distribution] || 0,
      percentage: total > 0 ? ((summary.rating_distribution[rating as keyof typeof summary.rating_distribution] || 0) / total) * 100 : 0
    }));
  };

  const ratingDistribution = getRatingDistribution();

  return (
    <div>
      {/* Global Stats */}
      {stats && (
        <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Total Reviews"
                value={stats.total_reviews}
                prefix={<StarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '600' }}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Pending Reviews"
                value={stats.pending_reviews}
                prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: '600' }}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Approved Reviews"
                value={stats.approved_reviews}
                prefix={<CheckOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: '600' }}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Average Rating"
                value={stats.average_rating}
                precision={1}
                prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: '600' }}
                suffix="/ 5"
                loading={loading}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Rating Distribution */}
      {summary && (
        <Card 
          title="Rating Distribution" 
          style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}
          loading={loading}
        >
          <div style={{ padding: '16px 0' }}>
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div 
                key={rating}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '12px',
                  gap: '12px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  minWidth: '60px'
                }}>
                  <Text strong>{rating}</Text>
                  <StarOutlined style={{ color: '#faad14', fontSize: '12px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Progress
                    percent={percentage}
                    showInfo={false}
                    strokeColor={{
                      '0%': rating >= 4 ? '#52c41a' : rating >= 3 ? '#faad14' : '#ff4d4f',
                      '100%': rating >= 4 ? '#73d13d' : rating >= 3 ? '#ffc53d' : '#ff7875',
                    }}
                    trailColor="#f0f0f0"
                    strokeWidth={8}
                    style={{ marginBottom: '2px' }}
                  />
                </div>
                <div style={{ 
                  minWidth: '80px', 
                  textAlign: 'right',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  {count} ({percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div style={{ 
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Total Reviews: <Text strong>{summary.total_reviews}</Text>
              </Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Average Rating: <Text strong style={{ color: '#722ed1' }}>{summary.average_rating.toFixed(1)}/5</Text>
              </Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Last Updated: {new Date(summary.updated_at).toLocaleDateString()}
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Insights */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#52c41a', fontSize: '24px', marginBottom: '8px' }}>
                {stats.total_reviews > 0 ? Math.round((stats.approved_reviews / stats.total_reviews) * 100) : 0}%
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Approval Rate
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#faad14', fontSize: '24px', marginBottom: '8px' }}>
                {stats.pending_reviews}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Awaiting Review
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#1890ff', fontSize: '24px', marginBottom: '8px' }}>
                {stats.rejected_reviews}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Rejected
              </Text>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
