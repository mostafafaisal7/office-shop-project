import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { reviewService } from '@/services/review';
import { 
  ReviewResponse, 
  ReviewListResponse, 
  ReviewStatsResponse,
  ReviewStatus 
} from '@/types/review';

interface UseReviewsParams {
  page?: number;
  per_page?: number;
  status?: ReviewStatus | 'all';
  product_id?: number;
  user_id?: number;
  rating?: number;
  search?: string;
  autoFetch?: boolean;
}

interface UseReviewsReturn {
  reviews: ReviewResponse[];
  loading: boolean;
  error: string | null;
  response: ReviewListResponse | null;
  stats: ReviewStatsResponse | null;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  fetchReviews: () => Promise<void>;
  fetchStats: () => Promise<void>;
  approveReview: (id: number) => Promise<void>;
  rejectReview: (id: number) => Promise<void>;
  deleteReview: (id: number) => Promise<void>;
  bulkApprove: (ids: number[]) => Promise<void>;
  bulkReject: (ids: number[]) => Promise<void>;
  bulkDelete: (ids: number[]) => Promise<void>;
  handleTableChange: (pagination: any, filters: any, sorter: any) => void;
  refresh: () => Promise<void>;
}

export function useReviews(params: UseReviewsParams = {}): UseReviewsReturn {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ReviewListResponse | null>(null);
  const [stats, setStats] = useState<ReviewStatsResponse | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Use ref to store current params to avoid dependency issues
  const currentParamsRef = useRef<UseReviewsParams>(params);
  
  // Update ref when params change
  useEffect(() => {
    currentParamsRef.current = params;
  }, [params]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        ...currentParamsRef.current,
        status: currentParamsRef.current.status === 'all' ? undefined : currentParamsRef.current.status,
      };
      
      const data = await reviewService.getReviews(queryParams);
      setResponse(data);
      setReviews(data.reviews || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch reviews';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await reviewService.getGlobalReviewStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch review stats:', err);
    }
  }, []);

  const approveReview = useCallback(async (id: number) => {
    try {
      await reviewService.approveReview(id);
      message.success('Review approved successfully');
      await fetchReviews();
      await fetchStats();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to approve review';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchReviews, fetchStats]);

  const rejectReview = useCallback(async (id: number) => {
    try {
      await reviewService.rejectReview(id);
      message.success('Review rejected successfully');
      await fetchReviews();
      await fetchStats();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reject review';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchReviews, fetchStats]);

  const deleteReview = useCallback(async (id: number) => {
    try {
      await reviewService.deleteReview(id);
      message.success('Review deleted successfully');
      await fetchReviews();
      await fetchStats();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete review';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchReviews, fetchStats]);

  const bulkApprove = useCallback(async (ids: number[]) => {
    try {
      await reviewService.bulkApproveReviews(ids);
      message.success(`${ids.length} reviews approved successfully`);
      setSelectedRowKeys([]);
      await fetchReviews();
      await fetchStats();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to approve reviews';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchReviews, fetchStats]);

  const bulkReject = useCallback(async (ids: number[]) => {
    try {
      await reviewService.bulkRejectReviews(ids);
      message.success(`${ids.length} reviews rejected successfully`);
      setSelectedRowKeys([]);
      await fetchReviews();
      await fetchStats();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reject reviews';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchReviews, fetchStats]);

  const bulkDelete = useCallback(async (ids: number[]) => {
    try {
      await reviewService.bulkDeleteReviews(ids);
      message.success(`${ids.length} reviews deleted successfully`);
      setSelectedRowKeys([]);
      await fetchReviews();
      await fetchStats();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete reviews';
      message.error(errorMessage);
      throw err;
    }
  }, [fetchReviews, fetchStats]);

  const handleTableChange = useCallback((pagination: any, filters: any, sorter: any) => {
    // Update the ref directly and trigger a fetch
    currentParamsRef.current = {
      ...currentParamsRef.current,
      page: pagination.current,
      per_page: pagination.pageSize,
    };
    
    fetchReviews();
  }, [fetchReviews]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchReviews(), fetchStats()]);
  }, [fetchReviews, fetchStats]);

  // Auto-fetch on mount and when key params change
  useEffect(() => {
    if (params.autoFetch !== false) {
      fetchReviews();
      fetchStats();
    }
  }, [
    params.page,
    params.per_page,
    params.status,
    params.product_id,
    params.user_id,
    params.rating,
    params.search,
    params.autoFetch,
    fetchReviews,
    fetchStats
  ]);

  return {
    reviews,
    loading,
    error,
    response,
    stats,
    selectedRowKeys,
    setSelectedRowKeys,
    fetchReviews,
    fetchStats,
    approveReview,
    rejectReview,
    deleteReview,
    bulkApprove,
    bulkReject,
    bulkDelete,
    handleTableChange,
    refresh,
  };
}

// Hook for pending reviews specifically
export function usePendingReviews(params: { page?: number; per_page?: number; product_id?: number } = {}) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ReviewListResponse | null>(null);
  
  // Use ref to store current params
  const paramsRef = useRef(params);
  
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const fetchPendingReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reviewService.getPendingReviews(paramsRef.current);
      setResponse(data);
      setReviews(data.reviews || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch pending reviews';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingReviews();
  }, [params.page, params.per_page, params.product_id, fetchPendingReviews]);

  return {
    reviews,
    loading,
    error,
    response,
    fetchPendingReviews,
    refresh: fetchPendingReviews,
  };
}

// Hook for single review
export function useReview(reviewId: number | null) {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = useCallback(async () => {
    if (!reviewId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await reviewService.getReview(reviewId);
      setReview(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch review';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetchReview();
  }, [reviewId, fetchReview]);

  return {
    review,
    loading,
    error,
    fetchReview,
    refresh: fetchReview,
  };
}
