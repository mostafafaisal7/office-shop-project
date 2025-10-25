/**
 * Optimized API Service
 *
 * Major performance improvements:
 * - Added proper caching with revalidation
 * - Reduced unnecessary data fetching
 * - Better error handling
 * - Optimized for Next.js 14 App Router
 */

const API_BASE_URL = typeof window === 'undefined'
  ? 'http://127.0.0.1:8000' // Server-side: direct connection
  : '/api'; // Client-side: use Next.js proxy

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

/**
 * Fetch all products (used for listing)
 * OPTIMIZED: Added 5-minute cache revalidation
 */
export async function fetchProducts(): Promise<ApiProduct[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
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

/**
 * Fetch products with filters and pagination
 * OPTIMIZED: Added 2-minute cache revalidation for filtered results
 */
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
      next: { revalidate: 120 }, // Cache for 2 minutes (shorter for dynamic filters)
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

/**
 * Fetch all categories
 * OPTIMIZED: Added 10-minute cache (categories change infrequently)
 */
export async function fetchCategories(): Promise<ApiCategory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/`, {
      next: { revalidate: 600 }, // Cache for 10 minutes
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

/**
 * Fetch category by slug
 * OPTIMIZED: Added 10-minute cache
 */
export async function fetchCategoryBySlug(slug: string): Promise<ApiCategory> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/slug/${slug}`, {
      next: { revalidate: 600 }, // Cache for 10 minutes
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

/**
 * Transform full product to grid item format
 */
export function transformProductForGrid(product: ApiProduct): ProductGridItem {
  const primaryMedia = product.media.find(m => m.is_primary) || product.media[0];

  return {
    id: product.id,
    name: product.name,
    price: `৳${product.base_price}`,
    image: primaryMedia?.file_path || '/placeholder-image.jpg'
  };
}

/**
 * Fetch single product by ID
 * OPTIMIZED: Added 3-minute cache for individual products
 */
export async function fetchProductById(id: string): Promise<ApiProduct> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      next: { revalidate: 180 }, // Cache for 3 minutes
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

/**
 * Fetch product reviews
 * OPTIMIZED: Added 5-minute cache for reviews
 */
export async function fetchProductReviews(productId: string): Promise<ReviewsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product reviews: ${response.status}`);
    }

    const data = await response.json();

    // Mock reviews if not available from API
    const mockReviews = {
      reviews: [],
      total_count: 0,
      average_rating: 0,
      rating_distribution: {},
      helpful_reviews: []
    };

    return data.reviews || mockReviews;
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    // Return empty reviews instead of throwing
    return {
      reviews: [],
      total_count: 0,
      average_rating: 0,
      rating_distribution: {},
      helpful_reviews: []
    };
  }
}

/**
 * NEW: Fetch related products efficiently
 * Only fetches products from same category, limits results
 */
export async function fetchRelatedProducts(productId: number, categoryIds: number[], limit: number = 4): Promise<ProductGridItem[]> {
  try {
    if (!categoryIds || categoryIds.length === 0) {
      return [];
    }

    // Fetch products from the same category
    const response = await fetchProductsWithFilters({
      category_id: categoryIds[0],
      per_page: limit + 1, // +1 to account for excluding current product
      status: 'active'
    });

    // Transform and filter out current product
    return response.products
      .filter(p => p.id !== productId)
      .slice(0, limit)
      .map(transformProductForGrid);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}
