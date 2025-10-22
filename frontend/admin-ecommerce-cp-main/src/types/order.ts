import { BaseEntity } from './api';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentType = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';

export interface OrderCreate {
  user_id?: number;
  guest_id?: number;
  items: OrderItemCreate[];
  shipping_address_id?: number;
  payment_method_id?: number;
  notes?: string;
}

export interface OrderItemCreate {
  product_id: number;
  variation_id: number;
  customization_option_id?: number;
  quantity: number;
  unit_price: number;
  customized_images?: string;
}

export interface OrderItemRead extends BaseEntity {
  product_id: number;
  product_name: string;
  variation_id: number;
  customization_option_id?: number;
  quantity: number;
  unit_price: number;
  customized_images?: string;
  order_id: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role?: string;
    is_active?: boolean;
    is_verified?: boolean;
  };
}

export interface OrderItemDetailRead extends OrderItemRead {
  product_sku?: string;
  variation_name?: string;
  variation_attributes?: Record<string, any>;
  shipping_method_id?: number;
  shipping_address_id?: string;
  payment_method_id?: number;
  discount_rule_id?: number;
  original_unit_price?: number;
  discount_percentage?: number;
  discount_amount?: number;
  discount_type?: string;
  shipping_method?: any;
  shipping_address?: any;
  payment_method?: any;
  variation_details?: {
    id: number;
    product_id: number;
    name: string;
    sku: string;
    price: string;
    stock_quantity: number;
    low_stock_threshold: number;
    attributes: Record<string, any>;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    media?: Array<{
      id: number;
      file_path: string;
      file_name: string;
      media_type: string;
      mime_type: string;
      alt_text?: string;
      design?: boolean;
      area?: string;
      sort_order: number;
      uploaded_at: string;
    }>;
  };
  customization_details?: {
    id: number;
    client_reference_id?: string;
    user_id: number;
    product_id: number;
    variation_id: number;
    design_area: string;
    canvas_data: {
      version: string;
      objects: any[];
      background?: string;
      backgroundImage?: any;
    };
    design_metadata: {
      canvas_width: number;
      canvas_height: number;
      product_image_url?: string;
      preview_image_url?: string;
      created_at?: string;
      updated_at?: string;
      design_name?: string;
      is_completed: boolean;
    };
    design_elements: any[];
    created_at: string;
    updated_at: string;
    media?: Array<{
      id: number;
      file_path: string;
      file_name: string;
      file_size?: number;
      media_type: string;
      mime_type?: string;
      alt_text?: string;
      canvas_object_id?: string;
      layer_order: number;
      uploaded_at: string;
    }>;
  };
}

export interface OrderRead {
  id: string;
  user_id?: number;
  guest_id?: number;
  subtotal?: number;
  shipping_cost?: number;
  total_price: number;
  status: OrderStatus;
  tracking_info?: string;
  notes?: string;
  items?: OrderItemRead[];
  created_at: string;
  updated_at?: string;
}

export interface OrderDetailRead {
  id: string;
  user_id?: number;
  guest_id?: number;
  subtotal: number;
  shipping_cost: number;
  total_price: number;
  shipping_method_id?: number;
  estimated_delivery_days?: number;
  shipping_cost_breakdown?: {
    total_cost: number;
    product_breakdown: Array<{
      product_id: number;
      quantity: number;
      base_cost: number;
      applied_rules: Array<{
        rule_id: number;
        min_quantity: number;
        max_quantity: number;
        cost_adjustment: number;
        adjustment_type: string;
        priority: number;
        applicable_quantity: number;
        total_adjustment: number;
      }>;
      final_cost: number;
      rule_source: string;
    }>;
    delivery_days: number;
  };
  status: OrderStatus;
  tracking_info?: string;
  notes?: string;
  items: OrderItemDetailRead[];
  user_name?: string;
  user_email?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role?: string;
    is_active?: boolean;
    is_verified?: boolean;
  };
  shipping_address?: any;
  payment_method?: any;
  created_at: string;
  updated_at?: string;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  notes?: string;
}

export interface OrderTrackingUpdate {
  tracking_info: string;
  notes?: string;
}

export interface OrderTrackingSummary {
  order_id: string;
  status: OrderStatus;
  tracking_info?: string;
  created_at: string;
  total_price: number;
}

// Checkout Types
export interface CheckoutItem {
  product_id: number;
  variation_id: number;
  customization_option_id?: number;
  quantity: number;
  customized_images?: string;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  shipping_address_id?: number;
  payment_method_id?: number;
  guest_info?: {
    name: string;
    email: string;
    phone?: string;
  };
  notes?: string;
}

export interface CheckoutResponse {
  order_id: string;
  total_amount: number;
  payment_url?: string;
  status: string;
  message: string;
}

// Shipping Types
export interface ShippingAddressCreate {
  name: string;
  phone?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface ShippingAddressUpdate extends Partial<ShippingAddressCreate> {}

export interface ShippingAddressOut extends BaseEntity {
  name: string;
  phone?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  user_id: number;
}

export interface ShippingAddressDetail extends ShippingAddressOut {}

export interface ShippingMethodCreate {
  name: string;
  description?: string;
  price: number;
  estimated_days?: number;
  is_active: boolean;
}

export interface ShippingMethodUpdate extends Partial<ShippingMethodCreate> {}

export interface ShippingMethodOut extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  estimated_days?: number;
  is_active: boolean;
}

export interface ShippingMethodDetail extends ShippingMethodOut {}

// Payment Types
export interface PaymentMethodCreate {
  name: string;
  type: PaymentType;
  description?: string;
  is_active: boolean;
  config?: Record<string, any>;
}

export interface PaymentMethodUpdate extends Partial<PaymentMethodCreate> {}

export interface PaymentMethodOut extends BaseEntity {
  name: string;
  type: PaymentType;
  description?: string;
  is_active: boolean;
}

export interface PaymentMethodDetail extends PaymentMethodOut {
  config?: Record<string, any>;
}
