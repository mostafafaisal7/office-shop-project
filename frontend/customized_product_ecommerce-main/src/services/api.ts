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

export async function fetchProducts(): Promise<ApiProduct[]> {
  const startTime = performance.now();
  console.log('🚀 [API] fetchProducts - Starting request...');
  console.log(`📡 [API] URL: ${API_BASE_URL}/products/`);

  try {
    const fetchStart = performance.now();
    const response = await fetch(`${API_BASE_URL}/products/`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    const fetchEnd = performance.now();
    console.log(`⏱️  [API] Fetch completed in ${(fetchEnd - fetchStart).toFixed(2)}ms`);
    console.log(`📊 [API] Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ [API] Request failed with status: ${response.status}`);
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const parseStart = performance.now();
    const data = await response.json();
    const parseEnd = performance.now();
    console.log(`⏱️  [API] JSON parsing: ${(parseEnd - parseStart).toFixed(2)}ms`);
    console.log(`📦 [API] Data received:`, Array.isArray(data) ? `${data.length} products` : typeof data);

    // Handle new API response format with pagination
    if (data.products && Array.isArray(data.products)) {
      const totalTime = performance.now() - startTime;
      console.log(`✅ [API] fetchProducts completed in ${totalTime.toFixed(2)}ms - ${data.products.length} products`);
      return data.products;
    }

    // Fallback for old format (direct array)
    if (Array.isArray(data)) {
      const totalTime = performance.now() - startTime;
      console.log(`✅ [API] fetchProducts completed in ${totalTime.toFixed(2)}ms - ${data.length} products`);
      return data;
    }

    throw new Error('Invalid API response format');
  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(`❌ [API] fetchProducts failed after ${totalTime.toFixed(2)}ms:`, error);
    throw error;
  }
}

export async function fetchProductsWithFilters(filters: ProductFilters = {}): Promise<ProductsResponse> {
  const startTime = performance.now();
  console.log('🚀 [API] fetchProductsWithFilters - Starting request...', filters);

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
    console.log(`📡 [API] URL: ${url}`);

    const fetchStart = performance.now();
    const response = await fetch(url, {
      next: { revalidate: 120 }, // Cache for 2 minutes (shorter for dynamic filters)
    });
    const fetchEnd = performance.now();
    console.log(`⏱️  [API] Fetch: ${(fetchEnd - fetchStart).toFixed(2)}ms | Status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ [API] Request failed: ${response.status}`);
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const parseStart = performance.now();
    const data = await response.json();
    const parseEnd = performance.now();
    console.log(`⏱️  [API] JSON parsing: ${(parseEnd - parseStart).toFixed(2)}ms`);

    const result = {
      products: data.products || [],
      total: data.total || 0,
      page: data.page || 1,
      per_page: data.per_page || 20,
      pages: data.pages || 1
    };

    const totalTime = performance.now() - startTime;
    console.log(`✅ [API] fetchProductsWithFilters completed in ${totalTime.toFixed(2)}ms - ${result.products.length}/${result.total} products`);
    return result;
  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(`❌ [API] fetchProductsWithFilters failed after ${totalTime.toFixed(2)}ms:`, error);
    throw error;
  }
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/`, {
      next: { revalidate: 600 }, // Cache for 10 minutes (categories change infrequently)
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
  const startTime = performance.now();
  console.log(`🚀 [API] fetchProductById - Starting request for product ${id}...`);

  try {
    // NOTE: Using cache: 'no-store' to bypass Next.js 2MB cache limit
    // Some products with many variations can exceed this limit
    // This ensures all your product data and features work correctly
    const fetchStart = performance.now();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      cache: 'no-store', // Disable caching to avoid 2MB limit errors
    });
    const fetchEnd = performance.now();
    console.log(`⏱️  [API] Fetch: ${(fetchEnd - fetchStart).toFixed(2)}ms | Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`);
    }

    const parseStart = performance.now();
    const data = await response.json();
    const parseEnd = performance.now();
    console.log(`⏱️  [API] JSON parsing: ${(parseEnd - parseStart).toFixed(2)}ms`);

    const totalTime = performance.now() - startTime;
    console.log(`✅ [API] fetchProductById completed in ${totalTime.toFixed(2)}ms - Product: ${data.name}`);

    return data;
  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(`❌ [API] fetchProductById failed after ${totalTime.toFixed(2)}ms:`, error);
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
      next: { revalidate: 300 }, // Cache for 5 minutes
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
      next: { revalidate: 300 }, // Cache for 5 minutes
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

/**
 * NEW FUNCTION: Fetch related products efficiently
 * Only fetches products from same category, limits results
 * MUCH FASTER than fetching all products
 */
export async function fetchRelatedProducts(productId: number, categoryIds: number[], limit: number = 4): Promise<ProductGridItem[]> {
  try {
    if (!categoryIds || categoryIds.length === 0) {
      return [];
    }

    // Fetch products from the same category with pagination
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
