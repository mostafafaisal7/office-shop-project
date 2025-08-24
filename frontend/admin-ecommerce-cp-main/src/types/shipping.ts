export interface ShippingAddress {
  id: string;
  user_id: number | null;
  guest_id: string | null;
  full_name: string;
  phone: string;
  email: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ShippingAddressCreate {
  user_id: number | null;
  guest_id: string | null;
  full_name: string;
  phone: string;
  email: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ShippingAddressUpdate {
  full_name?: string;
  phone?: string;
  email?: string;
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  description: string | null;
  cost: number;
  delivery_days: number;
  is_active: boolean;
}

export interface ShippingMethodCreate {
  name: string;
  description?: string;
  cost: number;
  delivery_days: number;
  is_active?: boolean;
}

export interface ShippingMethodUpdate {
  name?: string;
  description?: string;
  cost?: number;
  delivery_days?: number;
  is_active?: boolean;
}

export interface ShippingAddressListParams {
  user_id?: number;
  guest_id?: string;
  skip?: number;
  limit?: number;
}

export interface ShippingCostRule {
  id: number;
  shipping_method_id: number;
  min_quantity: number;
  max_quantity: number | null;
  cost_adjustment: number;
  adjustment_type: 'per_item' | 'flat_rate';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingCostRuleCreate {
  shipping_method_id: number;
  min_quantity: number;
  max_quantity?: number | null;
  cost_adjustment: number;
  adjustment_type: 'per_item' | 'flat_rate';
  is_active?: boolean;
}

export interface ShippingCostRuleUpdate {
  min_quantity?: number;
  max_quantity?: number | null;
  cost_adjustment?: number;
  adjustment_type?: 'per_item' | 'flat_rate';
  is_active?: boolean;
}

// Product-specific shipping rules
export interface ProductShippingRule {
  id: number;
  product_id: number;
  shipping_method_id: number;
  min_quantity: number;
  max_quantity: number | null;
  cost_adjustment: number;
  adjustment_type: 'per_item' | 'flat_rate';
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  shipping_method?: ShippingMethod; // For populated data
}

export interface ProductShippingRuleCreate {
  product_id: number;
  shipping_method_id: number;
  min_quantity: number;
  max_quantity?: number | null;
  cost_adjustment: number;
  adjustment_type: 'per_item' | 'flat_rate';
  is_active?: boolean;
  priority?: number;
}

export interface ProductShippingRuleUpdate {
  min_quantity?: number;
  max_quantity?: number | null;
  cost_adjustment?: number;
  adjustment_type?: 'per_item' | 'flat_rate';
  is_active?: boolean;
  priority?: number;
}

export interface CostBreakdownItem {
  quantity_range: string;
  cost: number;
  adjustment?: number;
  adjustment_type?: 'per_item' | 'flat_rate';
  priority?: number;
  description: string;
}

export interface ShippingCostPreview {
  product_id: number;
  shipping_method_id: number;
  base_cost: number;
  delivery_days: number;
  cost_breakdown: CostBreakdownItem[];
  has_product_rules: boolean;
}
