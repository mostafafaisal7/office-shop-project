// Base API Response Types
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  total_items?: number;
  per_page?: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  size?: number;
  limit?: number;
  skip?: number;
  search?: string;
  q?: string; // Search query for text search across name, description, SKU
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  status?: string;
  category_id?: number;
  is_customizable?: boolean;
  min_price?: number;
  max_price?: number;
  tags?: string;
  [key: string]: any;
}

// Common Types
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at?: string;
}

// Validation Error
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}
