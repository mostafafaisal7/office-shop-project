import { apiService } from './api';
import { 
  ReviewResponse, 
  ReviewCreate, 
  ReviewUpdate, 
  ReviewListResponse,
  ReviewMediaCreate,
  ReviewMediaResponse,
  ReviewMediaUpdate,
  ReviewHelpfulVoteResponse,
  ReviewSummaryResponse,
  ReviewStatsResponse,
  HelpfulReviewResponse
} from '@/types/review';

export class ReviewService {
  private baseUrl = '/reviews';

  // Basic CRUD Operations
  async createReview(data: ReviewCreate): Promise<ReviewResponse> {
    const response = await apiService.post<ReviewResponse>(this.baseUrl + '/', data);
    return response.data;
  }

  async getReviews(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    product_id?: number;
    user_id?: number;
    rating?: number;
    search?: string;
  }): Promise<ReviewListResponse> {
    const response = await apiService.get<ReviewListResponse>(this.baseUrl + '/', { params });
    return response.data;
  }

  async getReview(reviewId: number): Promise<ReviewResponse> {
    const response = await apiService.get<ReviewResponse>(`${this.baseUrl}/${reviewId}`);
    return response.data;
  }

  async updateReview(reviewId: number, data: ReviewUpdate): Promise<ReviewResponse> {
    const response = await apiService.put<ReviewResponse>(`${this.baseUrl}/${reviewId}`, data);
    return response.data;
  }

  async deleteReview(reviewId: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${reviewId}`);
  }

  // Product-specific reviews
  async getProductReviews(productId: number, params?: {
    page?: number;
    per_page?: number;
    status?: string;
    rating?: number;
  }): Promise<ReviewListResponse> {
    const response = await apiService.get<ReviewListResponse>(
      `${this.baseUrl}/products/${productId}/reviews`,
      { params }
    );
    return response.data;
  }

  async getProductReviewSummary(productId: number): Promise<ReviewSummaryResponse> {
    const response = await apiService.get<ReviewSummaryResponse>(
      `${this.baseUrl}/products/${productId}/summary`
    );
    return response.data;
  }

  async getProductReviewStats(productId: number): Promise<ReviewStatsResponse> {
    const response = await apiService.get<ReviewStatsResponse>(
      `${this.baseUrl}/products/${productId}/stats`
    );
    return response.data;
  }

  async getMostHelpfulReviews(productId: number, params?: {
    limit?: number;
  }): Promise<HelpfulReviewResponse[]> {
    const response = await apiService.get<HelpfulReviewResponse[]>(
      `${this.baseUrl}/product/${productId}/helpful`,
      { params }
    );
    return response.data;
  }

  async refreshProductReviewSummary(productId: number): Promise<ReviewSummaryResponse> {
    const response = await apiService.put<ReviewSummaryResponse>(
      `${this.baseUrl}/products/${productId}/summary/refresh`
    );
    return response.data;
  }

  // User-specific reviews
  async getUserReviews(userId: number, params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }): Promise<ReviewListResponse> {
    const response = await apiService.get<ReviewListResponse>(
      `${this.baseUrl}/users/${userId}/reviews`,
      { params }
    );
    return response.data;
  }

  async getMyReviews(params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }): Promise<ReviewListResponse> {
    const response = await apiService.get<ReviewListResponse>(
      `${this.baseUrl}/users/me/reviews`,
      { params }
    );
    return response.data;
  }

  // Review Media Management
  async createReviewMedia(reviewId: number, data: ReviewMediaCreate): Promise<ReviewMediaResponse> {
    const response = await apiService.post<ReviewMediaResponse>(
      `${this.baseUrl}/${reviewId}/media`,
      data
    );
    return response.data;
  }

  async getReviewMedia(mediaId: number): Promise<ReviewMediaResponse> {
    const response = await apiService.get<ReviewMediaResponse>(`${this.baseUrl}/media/${mediaId}`);
    return response.data;
  }

  async updateReviewMedia(mediaId: number, data: ReviewMediaUpdate): Promise<ReviewMediaResponse> {
    const response = await apiService.put<ReviewMediaResponse>(
      `${this.baseUrl}/media/${mediaId}`,
      data
    );
    return response.data;
  }

  async deleteReviewMedia(mediaId: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/media/${mediaId}`);
  }

  // Review Voting
  async voteHelpful(reviewId: number, isHelpful: boolean): Promise<ReviewHelpfulVoteResponse> {
    const response = await apiService.post<ReviewHelpfulVoteResponse>(
      `${this.baseUrl}/${reviewId}/helpful`,
      { is_helpful: isHelpful }
    );
    return response.data;
  }

  async getReviewVotes(reviewId: number): Promise<ReviewHelpfulVoteResponse[]> {
    const response = await apiService.get<ReviewHelpfulVoteResponse[]>(
      `${this.baseUrl}/${reviewId}/votes`
    );
    return response.data;
  }

  // Admin Operations
  async approveReview(reviewId: number): Promise<ReviewResponse> {
    const response = await apiService.put<ReviewResponse>(`${this.baseUrl}/${reviewId}/approve`);
    return response.data;
  }

  async rejectReview(reviewId: number): Promise<ReviewResponse> {
    const response = await apiService.put<ReviewResponse>(`${this.baseUrl}/${reviewId}/reject`);
    return response.data;
  }

  async getPendingReviews(params?: {
    page?: number;
    per_page?: number;
    product_id?: number;
  }): Promise<ReviewListResponse> {
    const response = await apiService.get<ReviewListResponse>(
      `${this.baseUrl}/admin/pending`,
      { params }
    );
    return response.data;
  }

  async getGlobalReviewStats(): Promise<ReviewStatsResponse> {
    const response = await apiService.get<ReviewStatsResponse>(`${this.baseUrl}/stats/global`);
    return response.data;
  }

  // Bulk Operations
  async bulkApproveReviews(reviewIds: number[]): Promise<void> {
    await Promise.all(reviewIds.map(id => this.approveReview(id)));
  }

  async bulkRejectReviews(reviewIds: number[]): Promise<void> {
    await Promise.all(reviewIds.map(id => this.rejectReview(id)));
  }

  async bulkDeleteReviews(reviewIds: number[]): Promise<void> {
    await Promise.all(reviewIds.map(id => this.deleteReview(id)));
  }
}

export const reviewService = new ReviewService();
