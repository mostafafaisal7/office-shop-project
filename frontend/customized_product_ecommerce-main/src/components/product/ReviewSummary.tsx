import { Star } from 'lucide-react';

interface ReviewSummaryProps {
  totalReviews: number;
  averageRating: number;
  satisfiedPercentage: number;
  ratingDistribution: Record<number, number>;
}

const ReviewSummary = ({
  totalReviews,
  averageRating,
  satisfiedPercentage,
  ratingDistribution
}: ReviewSummaryProps) => {
  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-gray-900">Reviewed by {totalReviews} Customers</h3>
      <div className="flex items-center space-x-4 mb-6">
        <span className="text-4xl font-bold text-gray-900">{averageRating}</span>
        <div>
          <div className="flex items-center mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <div className="text-sm text-gray-500">{satisfiedPercentage}% Buyers Are Satisfied</div>
          <div className="text-xs text-gray-400">(31 reviews of 32 reviews)</div>
        </div>
      </div>
      
      {/* Rating Distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <span className="text-sm w-2">{rating}</span>
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full" 
                style={{ width: `${Math.min(ratingDistribution[rating] || 0, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 w-8">
              {ratingDistribution[rating] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSummary;
