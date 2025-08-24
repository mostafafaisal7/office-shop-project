export const API_BASE_URL = '/api';

export const ORDER_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending', color: 'orange' },
  { label: 'Paid', value: 'paid', color: 'blue' },
  { label: 'Shipped', value: 'shipped', color: 'purple' },
  { label: 'Delivered', value: 'delivered', color: 'green' },
  { label: 'Cancelled', value: 'cancelled', color: 'red' },
];

export const PRODUCT_STATUS_OPTIONS = [
  { label: 'Active', value: 'active', color: 'green' },
  { label: 'Inactive', value: 'inactive', color: 'red' },
  { label: 'Draft', value: 'draft', color: 'orange' },
];

export const REVIEW_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending', color: 'orange' },
  { label: 'Approved', value: 'approved', color: 'green' },
  { label: 'Rejected', value: 'rejected', color: 'red' },
];

export const PAYMENT_TYPE_OPTIONS = [
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Debit Card', value: 'debit_card' },
  { label: 'PayPal', value: 'paypal' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cash on Delivery', value: 'cash_on_delivery' },
];

export const MEDIA_TYPE_OPTIONS = [
  { label: 'Image', value: 'image' },
  { label: 'Video', value: 'video' },
];

export const AREA_TYPE_OPTIONS = [
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
];

export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const THEME_COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
};

export const SIDEBAR_WIDTH = 256;
export const HEADER_HEIGHT = 64;

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'admin_access_token',
  REFRESH_TOKEN: 'admin_refresh_token',
  USER: 'admin_user',
  THEME: 'admin_theme',
  SIDEBAR_COLLAPSED: 'admin_sidebar_collapsed',
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/dashboard/products',
  ORDERS: '/dashboard/orders',
  USERS: '/dashboard/users',
  CATEGORIES: '/dashboard/categories',
  REVIEWS: '/dashboard/reviews',
  SHIPPING: '/dashboard/shipping',
  PAYMENT: '/dashboard/payment',
  SETTINGS: '/dashboard/settings',
};

export const PERMISSIONS = {
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  ORDERS_VIEW: 'orders:view',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_DELETE: 'orders:delete',
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  REVIEWS_VIEW: 'reviews:view',
  REVIEWS_APPROVE: 'reviews:approve',
  REVIEWS_DELETE: 'reviews:delete',
};
