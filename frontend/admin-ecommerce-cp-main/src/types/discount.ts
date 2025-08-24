export interface DiscountRule {
  id: number;
  name: string;
  description: string;
  min_quantity: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DiscountRuleCreate {
  name: string;
  description: string;
  min_quantity: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active?: boolean;
  created_by: number;
}

export interface DiscountRuleUpdate {
  name?: string;
  description?: string;
  min_quantity?: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  is_active?: boolean;
}

export interface DiscountRuleListParams {
  skip?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export interface DiscountAssignment {
  id: number;
  product_id: number;
  discount_rule_id: number;
  is_active: boolean;
  assigned_by: number;
  created_at: string;
  updated_at: string;
  // Populated fields
  product_name?: string;
  product_sku?: string;
  discount_rule?: DiscountRule;
}

export interface DiscountAssignmentCreate {
  product_id: number;
  discount_rule_id: number;
  is_active?: boolean;
  assigned_by: number;
}

export interface DiscountAssignmentUpdate {
  is_active?: boolean;
}

export interface BulkDiscountAssignment {
  product_ids: number[];
  discount_rule_id: number;
  assigned_by: number;
}

export interface DiscountAssignmentListParams {
  skip?: number;
  limit?: number;
  product_id?: number;
  discount_rule_id?: number;
  is_active?: boolean;
}

export interface ToggleDiscountRuleResponse {
  id: number;
  is_active: boolean;
  message: string;
}

// API Response types
export interface DiscountRuleListResponse {
  items: DiscountRule[];
  total: number;
  skip: number;
  limit: number;
}

export interface DiscountAssignmentListResponse {
  items: DiscountAssignment[];
  total: number;
  skip: number;
  limit: number;
}
