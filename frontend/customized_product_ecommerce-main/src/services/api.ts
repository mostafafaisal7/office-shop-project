// Use environment variable for API URL
// Server-side: direct connection to backend
// Client-side: use Next.js proxy
const API_BASE_URL = typeof window === 'undefined'
  ? (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')
  : '/api';

export interface ApiProduct {
  id: number;
  name: string;
  description: string;
  short_description: string;
  sku: string;
  base_price: string;
  status: string;
  is_customizable: boolean;
  weight: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
  seo_title: string;
  seo_description: string;
  category_ids: number[];
  created_at: string;
  updated_at: string;
  variations: any[];
  customization_options: any[];
  media: {
    file_path: string;
    file_name: string;
    file_size?: number;
    media_type: string;
    mime_type: string;
    alt_text: string;
    is_primary: boolean;
    sort_order: number;
    id: number;
    product_id: number;
    uploaded_at: string;
  }[];
}

export interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  slug?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  children?: ApiCategory[];
}

export interface ProductGridItem {
  id: number;
  name: string;
  price: string;
  image: string;
}

export interface ProductsResponse {
  products: ApiProduct[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ProductFilters {
  q?: string;
  category_id?: number;
  status?: string;
  is_customizable?: boolean;
  min_price?: number;
  max_price?: number;
  tags?: string[];
  sort_by?: 'name' | 'price' | 'base_price' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/`, {
      cache: 'no-store', // Ensure fresh data for SSR
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle new API response format with pagination
    if (data.products && Array.isArray(data.products)) {
      return data.products;
    }
    
    // Fallback for old format (direct array)
    if (Array.isArray(data)) {
      return data;
    }
    
    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function fetchProductsWithFilters(filters: ProductFilters = {}): Promise<ProductsResponse> {
  try {
    const params = new URLSearchParams();
    
    // Add search and filter parameters
    if (filters.q) params.append('q', filters.q);
    if (filters.category_id) params.append('category_id', filters.category_id.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.is_customizable !== undefined) params.append('is_customizable', filters.is_customizable.toString());
    if (filters.min_price) params.append('min_price', filters.min_price.toString());
    if (filters.max_price) params.append('max_price', filters.max_price.toString());
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    
    const url = `${API_BASE_URL}/products/${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      cache: 'no-store', // Ensure fresh data for SSR
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Ensure we return the expected format
    return {
      products: data.products || [],
      total: data.total || 0,
      page: data.page || 1,
      per_page: data.per_page || 20,
      pages: data.pages || 1
    };
  } catch (error) {
    console.error('Error fetching products with filters:', error);
    throw error;
  }
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/`, {
      cache: 'no-store', // Ensure fresh data for SSR
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<ApiCategory> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/slug/${slug}`, {
      cache: 'no-store', // Ensure fresh data for SSR
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch category: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    throw error;
  }
}

export function transformProductForGrid(product: ApiProduct): ProductGridItem {
  const primaryMedia = product.media.find(m => m.is_primary) || product.media[0];
  
  return {
    id: product.id,
    name: product.name,
    price: `৳${product.base_price}`,
    image: primaryMedia?.file_path || '/placeholder-image.jpg'
  };
}

export async function fetchProductById(id: string): Promise<ApiProduct> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      cache: 'no-store', // Ensure fresh data for SSR
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export interface ApiReview {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  avatar?: string;
  created_at: string;
  is_helpful?: boolean;
}

export interface ReviewsResponse {
  reviews: ApiReview[];
  total_count: number;
  average_rating: number;
  rating_distribution: Record<string | number, number>;
  helpful_reviews: ApiReview[];
}

export async function fetchProductReviews(productId: string): Promise<ReviewsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product reviews: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Use review summary from API response if available
    const reviewSummary = data.review_summary || {};
    
    // Extract rating distribution from review summary
    const ratingDistribution = {
      rating_1_count: reviewSummary.rating_1_count || 0,
      rating_2_count: reviewSummary.rating_2_count || 0,
      rating_3_count: reviewSummary.rating_3_count || 0,
      rating_4_count: reviewSummary.rating_4_count || 0,
      rating_5_count: reviewSummary.rating_5_count || 0,
      // Also include numeric keys for backward compatibility
      1: reviewSummary.rating_1_count || 0,
      2: reviewSummary.rating_2_count || 0,
      3: reviewSummary.rating_3_count || 0,
      4: reviewSummary.rating_4_count || 0,
      5: reviewSummary.rating_5_count || 0
    };
    
    return {
      reviews: data.helpful_reviews || [],
      total_count: reviewSummary.total_reviews || (data.helpful_reviews ? data.helpful_reviews.length : 0),
      average_rating: reviewSummary.average_rating || 0,
      rating_distribution: ratingDistribution,
      helpful_reviews: data.helpful_reviews || []
    };
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    throw error;
  }
}

export async function fetchMoreReviews(productId: string, page: number = 1, limit: number = 10): Promise<{ reviews: ApiReview[]; hasMore: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/products/${productId}/reviews?page=${page}&limit=${limit}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch more reviews: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      reviews: data.reviews || [],
      hasMore: data.has_more || false
    };
  } catch (error) {
    console.error('Error fetching more reviews:', error);
    return { reviews: [], hasMore: false };
  }
}

export interface DiscountResponse {
  applicable: boolean;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  rule_name: string;
  rule_id: number;
  min_quantity_met: number;
}

export async function calculateDiscount(productId: number, quantity: number): Promise<DiscountResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/discounts/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: quantity
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to calculate discount: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calculating discount:', error);
    return null;
  }
}

export function groupProductsByCategory(products: ApiProduct[], categories: ApiCategory[]) {
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  const grouped = new Map<number, { category: ApiCategory; products: ApiProduct[] }>();
  
  products.forEach(product => {
    product.category_ids.forEach(categoryId => {
      const category = categoryMap.get(categoryId);
      if (category) {
        if (!grouped.has(categoryId)) {
          grouped.set(categoryId, { category, products: [] });
        }
        grouped.get(categoryId)!.products.push(product);
      }
    });
  });
  
  return Array.from(grouped.values());
}
