import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Review {
  name: string;
  rating: number;
  comment: string;
  avatar: string;
}

interface ReviewListProps {
  reviews: Review[];
}

const ReviewList = ({ reviews }: ReviewListProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-semibold text-gray-900">Review Client</h4>
        <select className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900">
          <option>LATEST</option>
        </select>
      </div>
      
      <div className="space-y-6">
        {reviews.map((review, index) => (
          <div key={index} className="border-b border-gray-200 pb-6">
            <div className="flex items-start space-x-3">
              <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">{review.name}</span>
                  <div className="flex">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Button className="w-full mt-6 bg-primary text-white hover:bg-primary/90">
        LOAD MORE
      </Button>
    </div>
  );
};

export default ReviewList;