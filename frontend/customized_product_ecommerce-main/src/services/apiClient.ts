/**
 * Base API Client
 *
 * Centralized HTTP client that consolidates:
 * - 36+ duplicate header construction patterns
 * - Token management logic
 * - Error handling and response normalization
 * - Request/response interceptors
 *
 * All service files should extend this base class.
 */

import { API_CONFIG, HTTP_METHODS, CONTENT_TYPES } from '@/config/api';

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Request options
 */
export interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  method?: keyof typeof HTTP_METHODS;
  body?: any;
  requiresAuth?: boolean;
  contentType?: string;
  skipJsonParse?: boolean;
}

/**
 * Get valid auth token
 * Dynamically imports authStore to avoid circular dependencies
 */
async function getValidToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { getValidToken } = await import('@/store/authStore');
    return await getValidToken();
  } catch (error) {
    console.error('Failed to get valid token:', error);
    return null;
  }
}

/**
 * Base API Client Class
 */
export class BaseApiClient {
  protected baseURL: string;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Build request headers
   * Consolidates 36+ duplicate header construction patterns
   */
  protected async buildHeaders(options: RequestOptions = {}): Promise<HeadersInit> {
    const headers: HeadersInit = {};

    // Set content type (default to JSON)
    if (options.contentType !== CONTENT_TYPES.FORM_DATA) {
      headers['Content-Type'] = options.contentType || CONTENT_TYPES.JSON;
    }

    // Add authorization header if auth is required
    if (options.requiresAuth !== false) {
      const token = await getValidToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Merge with custom headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  /**
   * Build request URL
   */
  protected buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Parse response body
   */
  protected async parseResponse<T>(response: Response, skipJsonParse: boolean = false): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (skipJsonParse) {
      return response as any;
    }

    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    const text = await response.text();
    return text as any;
  }

  /**
   * Handle API errors
   * Normalizes error responses from the backend
   */
  protected handleError(error: any, endpoint: string): never {
    console.error(`API Error [${endpoint}]:`, error);

    if (error.response) {
      // HTTP error response
      throw new Error(error.response.message || `Request failed with status ${error.response.status}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error - please check your connection');
    } else {
      // Other errors
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Make HTTP request
   * Core method that all API calls go through
   */
  protected async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const {
        method = HTTP_METHODS.GET,
        body,
        requiresAuth,
        contentType,
        skipJsonParse,
        ...fetchOptions
      } = options;

      // Build URL
      const url = this.buildURL(endpoint);

      // Build headers
      const headers = await this.buildHeaders({ requiresAuth, contentType, headers: options.headers });

      // Build request body
      let requestBody: BodyInit | undefined;
      if (body) {
        if (contentType === CONTENT_TYPES.FORM_DATA) {
          requestBody = body; // FormData is already properly formatted
        } else if (typeof body === 'object') {
          requestBody = JSON.stringify(body);
        } else {
          requestBody = body;
        }
      }

      // Make request
      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
        ...fetchOptions,
      });

      // Parse response
      const data = await this.parseResponse<T>(response, skipJsonParse);

      // Handle HTTP errors
      if (!response.ok) {
        return {
          success: false,
          error: (data as any)?.detail || (data as any)?.message || `Request failed with status ${response.status}`,
          message: (data as any)?.detail || (data as any)?.message,
          errors: (data as any)?.errors,
        };
      }

      // Return successful response
      return {
        success: true,
        data,
        message: (data as any)?.message,
      };
    } catch (error: any) {
      console.error(`Request error [${endpoint}]:`, error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        message: error.message,
      };
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */

  protected async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = params ? this.buildURL(endpoint, params) : endpoint;
    return this.request<T>(url, { ...options, method: HTTP_METHODS.GET });
  }

  protected async post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: HTTP_METHODS.POST, body });
  }

  protected async put<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: HTTP_METHODS.PUT, body });
  }

  protected async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: HTTP_METHODS.PATCH, body });
  }

  protected async delete<T = any>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: HTTP_METHODS.DELETE });
  }

  /**
   * Upload file with FormData
   */
  protected async uploadFile<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return this.request<T>(endpoint, {
      ...options,
      method: HTTP_METHODS.POST,
      body: formData,
      contentType: CONTENT_TYPES.FORM_DATA,
    });
  }
}

/**
 * Default API client instance
 */
export const apiClient = new BaseApiClient();

/**
 * Type-safe API client with generic response handling
 */
export default apiClient;
