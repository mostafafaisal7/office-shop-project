export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_users: number;
  total_products: number;
  pending_orders: number;
  pending_reviews: number;
  low_stock_products: number;
  recent_orders: any[];
}

export interface TableFilters {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

export interface BreadcrumbItem {
  title: string;
  path?: string;
}

export interface UploadFile {
  uid: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  response?: any;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}
