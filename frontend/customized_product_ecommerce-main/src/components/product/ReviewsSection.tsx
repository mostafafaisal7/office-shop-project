'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiReview, fetchMoreReviews } from '@/services/api';

interface ReviewsSectionProps {
  productId: string;
  initialReviews: ApiReview[];
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<string | number, number>;
}

const ReviewsSection = ({
  productId,
  initialReviews,
  totalReviews,
  averageRating,
  ratingDistribution
}: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<ApiReview[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialReviews.length < totalReviews);
  const [currentPage, setCurrentPage] = useState(1);

  // Update hasMore when initialReviews change
  useEffect(() => {
    setHasMore(initialReviews.length < totalReviews);
  }, [initialReviews.length, totalReviews]);

  // Calculate satisfied percentage
  const satisfiedPercentage = totalReviews > 0 
    ? Math.round((
        (ratingDistribution[4] || ratingDistribution['rating_4_count'] || 0) + 
        (ratingDistribution[5] || ratingDistribution['rating_5_count'] || 0)
      ) / totalReviews * 100)
    : 0;

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const { reviews: newReviews, hasMore: moreAvailable } = await fetchMoreReviews(productId, nextPage);
      
      if (newReviews.length > 0) {
        // Filter out reviews that already exist to prevent duplicates
        const existingIds = new Set(reviews.map(review => review.id).filter(id => id != null));
        const uniqueNewReviews = newReviews.filter(review => 
          review.id == null || !existingIds.has(review.id)
        );
        
        if (uniqueNewReviews.length > 0) {
          setReviews(prev => [...prev, ...uniqueNewReviews]);
          setCurrentPage(nextPage);
        }
      }
      
      setHasMore(moreAvailable);
    } catch (error) {
      console.error('Error loading more reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="mt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Review Summary */}
        <div>
          <h3 className="text-2xl font-bold mb-6 text-gray-900">
            Reviewed by {totalReviews} Customer{totalReviews !== 1 ? 's' : ''}
          </h3>
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-4xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <div>
              <div className="flex items-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < Math.floor(averageRating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <div className="text-sm text-gray-500">
                {satisfiedPercentage}% Buyers Are Satisfied
              </div>
              <div className="text-xs text-gray-400">
                ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
              </div>
            </div>
          </div>
          
          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              // Try different possible keys for rating distribution
              const count = ratingDistribution[rating] || 
                           ratingDistribution[rating.toString()] || 
                           ratingDistribution[`${rating}_star`] || 
                           ratingDistribution[`star_${rating}`] || 
                           ratingDistribution[`rating_${rating}_count`] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm w-2">{rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Review Client</h4>
            <select className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900">
              <option>LATEST</option>
            </select>
          </div>
          
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <div key={review.id || `review-${index}-${review.user_name}-${review.created_at}`} className="border-b border-gray-200 pb-6">
                <div className="flex items-start space-x-3">
                  <img 
                    src={review.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user_name)}&background=random`} 
                    alt={review.user_name} 
                    className="w-10 h-10 rounded-full" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {review.user_name}
                      </span>
                      <div className="flex">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      {review.created_at && (
                        <span className="text-xs text-gray-400">
                          {formatDate(review.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <Button 
              className="w-full mt-6 bg-primary text-white hover:bg-primary/90"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'LOAD MORE'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsSection;
