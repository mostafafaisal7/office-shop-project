import { BaseEntity } from './api';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewCreate {
  product_id: number;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase?: boolean;
}

export interface ReviewUpdate {
  rating?: number;
  title?: string;
  comment?: string;
  status?: ReviewStatus;
}

export interface ReviewResponse extends BaseEntity {
  product_id: number;
  user_id: number;
  rating: number;
  title?: string;
  comment?: string;
  status: ReviewStatus;
  is_verified_purchase: boolean;
  helpful_count: number;
  user_name?: string;
  media?: ReviewMediaResponse[];
}

export interface ReviewListResponse {
  reviews: ReviewResponse[];
  total: number;
  total_items: number;
  page: number;
  per_page: number;
  total_pages: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
}

export interface ReviewMediaCreate {
  file_path: string;
  file_name: string;
  media_type: 'image' | 'video';
  mime_type: string;
  alt_text?: string;
}

export interface ReviewMediaResponse extends BaseEntity {
  file_path: string;
  file_name: string;
  media_type: 'image' | 'video';
  mime_type: string;
  alt_text?: string;
  review_id: number;
  uploaded_at: string;
}

export interface ReviewMediaUpdate {
  alt_text?: string;
}

export interface ReviewHelpfulVoteResponse {
  review_id: number;
  user_id: number;
  is_helpful: boolean;
  created_at: string;
}

export interface ReviewSummaryResponse {
  product_id: number;
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  updated_at: string;
}

export interface ReviewStatsResponse {
  total_reviews: number;
  pending_reviews: number;
  approved_reviews: number;
  rejected_reviews: number;
  average_rating: number;
}

export interface HelpfulReviewResponse extends ReviewResponse {
  helpful_votes: number;
}
