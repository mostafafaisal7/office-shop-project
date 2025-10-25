/**
 * Centralized API Configuration
 *
 * Single source of truth for all API-related configuration.
 * Replaces 95+ duplicate API_BASE_URL definitions across the codebase.
 */

export const API_CONFIG = {
  /**
   * Base URL for API calls
   * - Server-side: Uses full URL
   * - Client-side: Uses Next.js API routes proxy for CORS handling
   */
  BASE_URL: typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',

  /**
   * Request timeout in milliseconds
   */
  TIMEOUT: 30000,

  /**
   * Number of retry attempts for failed requests
   */
  RETRY_ATTEMPTS: 3,

  /**
   * Retry delay in milliseconds (exponential backoff)
   */
  RETRY_DELAY: 1000,
} as const;

/**
 * API Endpoints
 * Centralized endpoint definitions for type safety and maintainability
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/password-reset-request',
    RESET_PASSWORD: '/auth/password-reset-confirm',
  },

  // Products endpoints
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: number) => `/products/${id}`,
    CATEGORIES: '/products/categories',
    SEARCH: '/products/search',
  },

  // Cart endpoints
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    UPDATE: (itemId: number) => `/cart/update/${itemId}`,
    REMOVE: (itemId: number) => `/cart/remove/${itemId}`,
    CLEAR: '/cart/clear',
    SYNC: '/cart/sync',
  },

  // Orders endpoints
  ORDERS: {
    LIST: '/orders',
    DETAIL: (id: number) => `/orders/${id}`,
    CREATE: '/orders',
    CANCEL: (id: number) => `/orders/${id}/cancel`,
  },

  // Design endpoints
  DESIGN: {
    SAVE: '/designs/save',
    LIST: '/designs/user',
    DETAIL: (id: number) => `/designs/${id}`,
    DELETE: (id: number) => `/designs/${id}`,
    UPLOAD_IMAGE: '/designs/upload-image',
  },

  // Shipping endpoints
  SHIPPING: {
    METHODS: '/shipping/methods',
    ADDRESSES: '/shipping/addresses',
    ADDRESS_DETAIL: (id: number) => `/shipping/addresses/${id}`,
    CREATE_ADDRESS: '/shipping/addresses',
    UPDATE_ADDRESS: (id: number) => `/shipping/addresses/${id}`,
    DELETE_ADDRESS: (id: number) => `/shipping/addresses/${id}`,
    SET_DEFAULT: (id: number) => `/shipping/addresses/${id}/set-default`,
    CALCULATE: '/shipping/calculate',
  },

  // Payment endpoints
  PAYMENT: {
    METHODS: '/payment/methods',
    CREATE_INTENT: '/payment/create-intent',
    CONFIRM: '/payment/confirm',
  },

  // Reviews endpoints
  REVIEWS: {
    LIST: (productId: number) => `/reviews/product/${productId}`,
    CREATE: '/reviews',
    UPDATE: (id: number) => `/reviews/${id}`,
    DELETE: (id: number) => `/reviews/${id}`,
  },

  // Upload endpoints
  UPLOAD: {
    IMAGE: '/uploads/image',
    PREVIEW: '/uploads/preview',
  },
} as const;

/**
 * HTTP Methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

/**
 * Content Types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
} as const;
