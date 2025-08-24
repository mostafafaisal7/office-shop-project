import { apiService as api } from './api';
import { requestCache } from '@/utils/requestCache';
import type {
  DiscountRule,
  DiscountRuleCreate,
  DiscountRuleUpdate,
  DiscountRuleListParams,
  DiscountRuleListResponse,
  DiscountAssignment,
  DiscountAssignmentCreate,
  DiscountAssignmentUpdate,
  DiscountAssignmentListParams,
  DiscountAssignmentListResponse,
  BulkDiscountAssignment,
  ToggleDiscountRuleResponse,
} from '@/types/discount';

// Discount Rules Service
export const discountRuleService = {
  // Get all discount rules with optional filters and pagination
  getAll: async (params?: DiscountRuleListParams): Promise<DiscountRuleListResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    const queryString = searchParams.toString();
    const url = `/discounts/rules${queryString ? `?${queryString}` : ''}`;
    
    // Use request cache to prevent duplicate API calls
    const cacheKey = `discount-rules-${url}`;
    const response = await requestCache.get(cacheKey, () => api.get<any>(url));
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      // Simple array response
      return {
        items: response.data,
        total: response.data.length,
        skip: 0,
        limit: response.data.length,
      };
    } else if (response.data.rules) {
      // API returns { rules: [...], total: number, page: number, per_page: number }
      return {
        items: response.data.rules,
        total: response.data.total,
        skip: (response.data.page - 1) * response.data.per_page,
        limit: response.data.per_page,
      };
    } else if (response.data.items) {
      // Standard format { items: [...], total: number, skip: number, limit: number }
      return response.data;
    }
    
    // Fallback for unexpected format
    return {
      items: [],
      total: 0,
      skip: 0,
      limit: 0,
    };
  },

  // Get discount rule by ID
  getById: async (id: number): Promise<DiscountRule> => {
    const response = await api.get<DiscountRule>(`/discounts/rules/${id}`);
    return response.data;
  },

  // Create new discount rule
  create: async (data: DiscountRuleCreate): Promise<DiscountRule> => {
    const response = await api.post<DiscountRule>('/discounts/rules/', data);
    return response.data;
  },

  // Update discount rule
  update: async (id: number, data: DiscountRuleUpdate): Promise<DiscountRule> => {
    console.log('Updating discount rule:', id, data);
    try {
      // Try with trailing slash first
      let response;
      try {
        response = await api.put<DiscountRule>(`/discounts/rules/${id}/`, data);
      } catch (trailingSlashError: any) {
        if (trailingSlashError.response?.status === 405) {
          // Try without trailing slash
          response = await api.put<DiscountRule>(`/discounts/rules/${id}`, data);
        } else {
          throw trailingSlashError;
        }
      }
      console.log('Update successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Update failed:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Delete discount rule
  delete: async (id: number): Promise<void> => {
    await api.delete(`/discounts/rules/${id}`);
  },

  // Toggle discount rule active status
  toggle: async (id: number): Promise<ToggleDiscountRuleResponse> => {
    const response = await api.patch<ToggleDiscountRuleResponse>(`/discounts/rules/${id}/toggle`);
    return response.data;
  },
};

// Discount Assignments Service
export const discountAssignmentService = {
  // Get all discount assignments with optional filters and pagination
  getAll: async (params?: DiscountAssignmentListParams): Promise<DiscountAssignmentListResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.product_id) searchParams.append('product_id', params.product_id.toString());
    if (params?.discount_rule_id) searchParams.append('discount_rule_id', params.discount_rule_id.toString());
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    const queryString = searchParams.toString();
    const url = `/discounts/assignments${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<any>(url);
    
    // Helper function to normalize assignment data
    const normalizeAssignment = (assignment: any): DiscountAssignment => ({
      ...assignment,
      // Map 'rule' property to 'discount_rule' if it exists
      discount_rule: assignment.rule || assignment.discount_rule,
      // Map 'assigned_at' to 'created_at' if it exists (for date column compatibility)
      created_at: assignment.assigned_at || assignment.created_at,
      // Remove the original properties to avoid confusion
      rule: undefined,
      assigned_at: undefined,
    });
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      // Simple array response
      const normalizedItems = response.data.map(normalizeAssignment);
      return {
        items: normalizedItems,
        total: normalizedItems.length,
        skip: 0,
        limit: normalizedItems.length,
      };
    } else if (response.data.assignments) {
      // API returns { assignments: [...], total: number, page: number, per_page: number }
      const normalizedItems = response.data.assignments.map(normalizeAssignment);
      return {
        items: normalizedItems,
        total: response.data.total,
        skip: (response.data.page - 1) * response.data.per_page,
        limit: response.data.per_page,
      };
    } else if (response.data.items) {
      // Standard format { items: [...], total: number, skip: number, limit: number }
      const normalizedItems = response.data.items.map(normalizeAssignment);
      return {
        ...response.data,
        items: normalizedItems,
      };
    }
    
    // Fallback for unexpected format
    return {
      items: [],
      total: 0,
      skip: 0,
      limit: 0,
    };
  },

  // Get discount assignment by ID
  getById: async (id: number): Promise<DiscountAssignment> => {
    const response = await api.get<any>(`/discounts/assignments/${id}`);
    return {
      ...response.data,
      discount_rule: response.data.rule || response.data.discount_rule,
      created_at: response.data.assigned_at || response.data.created_at,
      rule: undefined,
      assigned_at: undefined,
    };
  },

  // Get assignments for a specific product
  getByProductId: async (productId: number): Promise<DiscountAssignment[]> => {
    const response = await api.get<any[]>(`/discounts/assignments/product/${productId}`);
    return response.data.map((assignment: any) => ({
      ...assignment,
      discount_rule: assignment.rule || assignment.discount_rule,
      created_at: assignment.assigned_at || assignment.created_at,
      rule: undefined,
      assigned_at: undefined,
    }));
  },

  // Create new discount assignment
  create: async (data: DiscountAssignmentCreate): Promise<DiscountAssignment> => {
    const response = await api.post<any>('/discounts/assignments/', data);
    return {
      ...response.data,
      discount_rule: response.data.rule || response.data.discount_rule,
      created_at: response.data.assigned_at || response.data.created_at,
      rule: undefined,
      assigned_at: undefined,
    };
  },

  // Bulk assign discount rule to multiple products
  bulkCreate: async (data: BulkDiscountAssignment): Promise<DiscountAssignment[]> => {
    const response = await api.post<any[]>('/discounts/assignments/bulk', data);
    return response.data.map((assignment: any) => ({
      ...assignment,
      discount_rule: assignment.rule || assignment.discount_rule,
      created_at: assignment.assigned_at || assignment.created_at,
      rule: undefined,
      assigned_at: undefined,
    }));
  },


  // Update discount assignment - use rule update approach since assignment endpoints may not support PUT
  update: async (id: number, data: DiscountAssignmentUpdate, existingAssignment?: DiscountAssignment): Promise<DiscountAssignment> => {
    console.log('Updating assignment:', id, data, existingAssignment);
    
    // If we have the existing assignment data, use it to avoid GET request
    let assignment = existingAssignment;
    
    if (!assignment) {
      try {
        // Try to get assignment data only if not provided
        assignment = await discountAssignmentService.getById(id);
      } catch (getError: any) {
        if (getError.response?.status === 405) {
          throw new Error('Cannot update assignment: Assignment data not available and GET endpoint not supported');
        }
        throw getError;
      }
    }
    
    if (!assignment.discount_rule) {
      throw new Error('Assignment does not have an associated discount rule');
    }

    // Prepare the update data for the discount rule
    const ruleUpdateData: DiscountRuleUpdate = {
      name: assignment.discount_rule.name,
      description: assignment.discount_rule.description,
      min_quantity: assignment.discount_rule.min_quantity,
      discount_type: assignment.discount_rule.discount_type,
      discount_value: assignment.discount_rule.discount_value,
      is_active: data.is_active !== undefined ? data.is_active : assignment.discount_rule.is_active,
    };

    console.log('Updating rule with data:', assignment.discount_rule_id, ruleUpdateData);

    // Update the discount rule using the PUT endpoint
    await discountRuleService.update(assignment.discount_rule_id, ruleUpdateData);
    
    // Return the updated assignment with new status
    return {
      ...assignment,
      is_active: ruleUpdateData.is_active || false,
      discount_rule: {
        ...assignment.discount_rule,
        is_active: ruleUpdateData.is_active || false,
      },
    };
  },

  // Delete discount assignment
  delete: async (id: number): Promise<void> => {
    await api.delete(`/discounts/assignments/${id}`);
  },

  // Remove assignment by product and rule
  removeByProductAndRule: async (productId: number, ruleId: number): Promise<void> => {
    await api.delete(`/discounts/assignments/product/${productId}/rule/${ruleId}`);
  },
};
