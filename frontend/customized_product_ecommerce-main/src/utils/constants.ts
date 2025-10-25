/**
 * Application Constants
 *
 * Centralized constants for use throughout the application.
 * Eliminates magic strings and numbers, making code more maintainable.
 */

/**
 * Order statuses
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

/**
 * Payment methods
 */
export const PAYMENT_METHODS = {
  CARD: 'card',
  PAYPAL: 'paypal',
  COD: 'cod',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

/**
 * Product categories
 */
export const PRODUCT_CATEGORIES = {
  TSHIRTS: 'tshirts',
  POLO: 'polo',
  HOODIES: 'hoodies',
  UNIFORMS: 'uniforms',
  CORPORATE: 'corporate',
} as const;

/**
 * User roles
 */
export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  VENDOR: 'vendor',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Design areas
 */
export const DESIGN_AREAS = {
  FRONT: 'front',
  BACK: 'back',
  LEFT_SLEEVE: 'left_sleeve',
  RIGHT_SLEEVE: 'right_sleeve',
} as const;

export type DesignArea = typeof DESIGN_AREAS[keyof typeof DESIGN_AREAS];

/**
 * Toast notification types
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
} as const;

export type ToastType = typeof TOAST_TYPES[keyof typeof TOAST_TYPES];

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  CART: 'cart',
  DESIGN_STATE: 'designState',
  THEME: 'theme',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

/**
 * File upload constraints
 */
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const;

/**
 * Validation constraints
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MIN_LENGTH: 7,
  PHONE_MAX_LENGTH: 15,
  DESCRIPTION_MAX_LENGTH: 5000,
} as const;

/**
 * Design canvas defaults
 */
export const CANVAS_DEFAULTS = {
  WIDTH: 800,
  HEIGHT: 1000,
  DEFAULT_FONT: 'Arial',
  DEFAULT_FONT_SIZE: 24,
  DEFAULT_TEXT_COLOR: '#000000',
  DEFAULT_STROKE_WIDTH: 2,
} as const;

/**
 * Currency
 */
export const CURRENCY = {
  SYMBOL: '৳',
  CODE: 'BDT',
  NAME: 'Bangladeshi Taka',
} as const;

/**
 * Routes
 */
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string | number) => `/products/${id}`,
  PRODUCT_DESIGN: (id: string | number) => `/products/${id}/design`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  LOGIN: '/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  ORDERS: '/dashboard/orders',
  PROFILE: '/dashboard/profile',
  PROJECTS: '/dashboard/projects',
} as const;

/**
 * API request timeouts (ms)
 */
export const TIMEOUTS = {
  DEFAULT: 30000,
  UPLOAD: 60000,
  LONG: 90000,
} as const;

/**
 * Debounce delays (ms)
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  RESIZE: 150,
  SCROLL: 100,
  INPUT: 300,
} as const;

/**
 * Breakpoints (matches Tailwind defaults)
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;

/**
 * Animation durations (ms)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

export default {
  ORDER_STATUS,
  PAYMENT_METHODS,
  PRODUCT_CATEGORIES,
  USER_ROLES,
  DESIGN_AREAS,
  TOAST_TYPES,
  STORAGE_KEYS,
  PAGINATION,
  FILE_UPLOAD,
  VALIDATION,
  CANVAS_DEFAULTS,
  CURRENCY,
  ROUTES,
  TIMEOUTS,
  DEBOUNCE_DELAYS,
  BREAKPOINTS,
  Z_INDEX,
  ANIMATION_DURATION,
};
