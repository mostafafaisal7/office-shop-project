export interface VariationMedia {
  id: number;
  file_path: string;
  file_name: string;
  media_type: string;
  mime_type: string;
  alt_text: string;
  design: boolean;
  area: string;
  sort_order: number;
  uploaded_at: string;
}

export interface VariationDetails {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  price: string;
  stock_quantity: number;
  low_stock_threshold: number;
  attributes: {
    size?: string;
    color?: string;
    [key: string]: any;
  };
  is_active: boolean;
  sort_order: number;
  created_at: string;
  media: VariationMedia[];
}

export interface ShippingRule {
  rule_id: number;
  min_quantity: number;
  max_quantity: number;
  cost_adjustment: number;
  adjustment_type: string;
  priority: number;
  applicable_quantity: number;
  total_adjustment: number;
}

export interface ShippingProductBreakdown {
  product_id: number;
  quantity: number;
  base_cost: number;
  applied_rules: ShippingRule[];
  final_cost: number;
  rule_source: string;
}

export interface ShippingCostBreakdown {
  total_cost: number;
  product_breakdown: ShippingProductBreakdown[];
  delivery_days: number;
}

export interface ShippingMethod {
  id: number;
  name: string;
  description: string;
  cost: number;
  base_cost?: number; // Keep for backward compatibility
  is_active: boolean;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  type: string;
}

export interface ShippingAddress {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  variation_id: number | null;
  customization_option_id: number | null;
  customized_images: string | null;
  quantity: number;
  unit_price: number;
  shipping_method_id: number;
  discount_rule_id: number | null;
  original_unit_price: number | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  discount_type: string | null;
  shipping_method: ShippingMethod | null;
  variation_details: VariationDetails | null;
}

export interface Order {
  id: string;
  user_id: number;
  guest_id: number | null;
  subtotal: number;
  shipping_cost: number;
  total_price: number;
  shipping_method_id: number;
  estimated_delivery_days: number;
  shipping_cost_breakdown: ShippingCostBreakdown;
  payment_method_id: number;
  shipping_address_id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  tracking_info: string | null;
  created_at: string;
  items: OrderItem[];
  payment_method?: PaymentMethod;
  shipping_method?: ShippingMethod;
  shipping_address?: ShippingAddress;
}

export interface DetailedOrder extends Order {
  // This interface can be used for the detailed order response
}

export interface TrackingInfo {
  order_id: string;
  status: string;
  tracking_info: string | null;
  created_at: string;
  subtotal: number;
}

export interface OrderFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_spent: number;
}
