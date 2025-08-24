import { useState, useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { discountRuleService, discountAssignmentService } from '@/services/discount';
import type {
  DiscountRule,
  DiscountRuleCreate,
  DiscountRuleUpdate,
  DiscountRuleListParams,
  DiscountAssignment,
  DiscountAssignmentCreate,
  DiscountAssignmentUpdate,
  DiscountAssignmentListParams,
  BulkDiscountAssignment,
} from '@/types/discount';

// Hook for discount rules
export const useDiscountRules = (params?: DiscountRuleListParams) => {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [JSON.stringify(params)]);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching discount rules with params:', memoizedParams);
      const response = await discountRuleService.getAll(memoizedParams);
      console.log('Discount rules response:', response);
      setRules(response.items);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Error fetching discount rules:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.detail || 'Failed to fetch discount rules';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  const createRule = async (data: DiscountRuleCreate): Promise<DiscountRule | null> => {
    try {
      setLoading(true);
      const newRule = await discountRuleService.create(data);
      setRules(prev => [...prev, newRule]);
      setTotal(prev => prev + 1);
      message.success('Discount rule created successfully');
      return newRule;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create discount rule';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateRule = async (id: number, data: DiscountRuleUpdate): Promise<DiscountRule | null> => {
    try {
      setLoading(true);
      const updatedRule = await discountRuleService.update(id, data);
      setRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
      message.success('Discount rule updated successfully');
      return updatedRule;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update discount rule';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      await discountRuleService.delete(id);
      setRules(prev => prev.filter(rule => rule.id !== id));
      setTotal(prev => prev - 1);
      message.success('Discount rule deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete discount rule';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await discountRuleService.toggle(id);
      setRules(prev => prev.map(rule => 
        rule.id === id ? { ...rule, is_active: response.is_active } : rule
      ));
      message.success(response.message);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to toggle discount rule';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    total,
    loading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
};

// Hook for a single discount rule
export const useDiscountRule = (id?: number) => {
  const [rule, setRule] = useState<DiscountRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRule = async (ruleId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await discountRuleService.getById(ruleId);
      setRule(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch discount rule';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRule(id);
    }
  }, [id]);

  return {
    rule,
    loading,
    error,
    fetchRule,
  };
};

// Hook for discount assignments
export const useDiscountAssignments = (params?: DiscountAssignmentListParams) => {
  const [assignments, setAssignments] = useState<DiscountAssignment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await discountAssignmentService.getAll(params);
      setAssignments(response.items);
      setTotal(response.total);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch discount assignments';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (data: DiscountAssignmentCreate): Promise<DiscountAssignment | null> => {
    try {
      setLoading(true);
      const newAssignment = await discountAssignmentService.create(data);
      setAssignments(prev => [...prev, newAssignment]);
      setTotal(prev => prev + 1);
      message.success('Discount assignment created successfully');
      return newAssignment;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create discount assignment';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const bulkCreateAssignments = async (data: BulkDiscountAssignment): Promise<DiscountAssignment[] | null> => {
    try {
      setLoading(true);
      const newAssignments = await discountAssignmentService.bulkCreate(data);
      setAssignments(prev => [...prev, ...newAssignments]);
      setTotal(prev => prev + newAssignments.length);
      message.success(`${newAssignments.length} discount assignments created successfully`);
      return newAssignments;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create bulk discount assignments';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (id: number, data: DiscountAssignmentUpdate): Promise<DiscountAssignment | null> => {
    try {
      setLoading(true);
      // Find the existing assignment to pass to the update function
      const existingAssignment = assignments.find(assignment => assignment.id === id);
      const updatedAssignment = await discountAssignmentService.update(id, data, existingAssignment);
      setAssignments(prev => prev.map(assignment => 
        assignment.id === id ? updatedAssignment : assignment
      ));
      message.success('Discount assignment updated successfully');
      return updatedAssignment;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update discount assignment';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      await discountAssignmentService.delete(id);
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
      setTotal(prev => prev - 1);
      message.success('Discount assignment deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete discount assignment';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [JSON.stringify(params)]);

  return {
    assignments,
    total,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    bulkCreateAssignments,
    updateAssignment,
    deleteAssignment,
  };
};

// Hook for product-specific discount assignments
export const useProductDiscountAssignments = (productId?: number) => {
  const [assignments, setAssignments] = useState<DiscountAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductAssignments = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await discountAssignmentService.getByProductId(id);
      setAssignments(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch product discount assignments';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeAssignment = async (assignmentId: number): Promise<boolean> => {
    try {
      setLoading(true);
      await discountAssignmentService.delete(assignmentId);
      setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
      message.success('Discount assignment removed successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to remove discount assignment';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addAssignment = async (data: DiscountAssignmentCreate): Promise<DiscountAssignment | null> => {
    try {
      setLoading(true);
      const newAssignment = await discountAssignmentService.create(data);
      setAssignments(prev => [...prev, newAssignment]);
      message.success('Discount assignment added successfully');
      return newAssignment;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to add discount assignment';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductAssignments(productId);
    }
  }, [productId]);

  return {
    assignments,
    loading,
    error,
    fetchProductAssignments,
    removeAssignment,
    addAssignment,
  };
};
