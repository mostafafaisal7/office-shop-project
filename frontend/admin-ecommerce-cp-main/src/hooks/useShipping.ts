import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { shippingAddressService, shippingMethodService, shippingCostRuleService, productShippingRuleService } from '@/services/shipping';
import type {
  ShippingAddress,
  ShippingAddressCreate,
  ShippingAddressUpdate,
  ShippingAddressListParams,
  ShippingMethod,
  ShippingMethodCreate,
  ShippingMethodUpdate,
  ShippingCostRule,
  ShippingCostRuleCreate,
  ShippingCostRuleUpdate,
  ProductShippingRule,
  ProductShippingRuleCreate,
  ProductShippingRuleUpdate,
  ShippingCostPreview,
} from '@/types/shipping';

// Hook for shipping addresses
export const useShippingAddresses = (params?: ShippingAddressListParams) => {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shippingAddressService.getAll(params);
      setAddresses(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch shipping addresses';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (data: ShippingAddressCreate): Promise<ShippingAddress | null> => {
    try {
      setLoading(true);
      const newAddress = await shippingAddressService.create(data);
      setAddresses(prev => [...prev, newAddress]);
      message.success('Shipping address created successfully');
      return newAddress;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create shipping address';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (id: string, data: ShippingAddressUpdate): Promise<ShippingAddress | null> => {
    try {
      setLoading(true);
      const updatedAddress = await shippingAddressService.update(id, data);
      setAddresses(prev => prev.map(addr => addr.id === id ? updatedAddress : addr));
      message.success('Shipping address updated successfully');
      return updatedAddress;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update shipping address';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await shippingAddressService.delete(id);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      message.success('Shipping address deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete shipping address';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [JSON.stringify(params)]);

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
  };
};

// Hook for a single shipping address
export const useShippingAddress = (id?: string) => {
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddress = async (addressId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await shippingAddressService.getById(addressId);
      setAddress(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch shipping address';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAddress(id);
    }
  }, [id]);

  return {
    address,
    loading,
    error,
    fetchAddress,
  };
};

// Hook for shipping methods
export const useShippingMethods = () => {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shippingMethodService.getAll();
      setMethods(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch shipping methods';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createMethod = async (data: ShippingMethodCreate): Promise<ShippingMethod | null> => {
    try {
      setLoading(true);
      const newMethod = await shippingMethodService.create(data);
      setMethods(prev => [...prev, newMethod]);
      message.success('Shipping method created successfully');
      return newMethod;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create shipping method';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMethod = async (id: number, data: ShippingMethodUpdate): Promise<ShippingMethod | null> => {
    try {
      setLoading(true);
      const updatedMethod = await shippingMethodService.update(id, data);
      setMethods(prev => prev.map(method => method.id === id ? updatedMethod : method));
      message.success('Shipping method updated successfully');
      return updatedMethod;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update shipping method';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteMethod = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      await shippingMethodService.delete(id);
      setMethods(prev => prev.filter(method => method.id !== id));
      message.success('Shipping method deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete shipping method';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  return {
    methods,
    loading,
    error,
    fetchMethods,
    createMethod,
    updateMethod,
    deleteMethod,
  };
};

// Hook for a single shipping method
export const useShippingMethod = (id?: number) => {
  const [method, setMethod] = useState<ShippingMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMethod = async (methodId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await shippingMethodService.getById(methodId);
      setMethod(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch shipping method';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMethod(id);
    }
  }, [id]);

  return {
    method,
    loading,
    error,
    fetchMethod,
  };
};

// Hook for shipping cost rules
export const useShippingCostRules = (methodId?: number) => {
  const [rules, setRules] = useState<ShippingCostRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await shippingCostRuleService.getByMethodId(id);
      setRules(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch cost rules';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (id: number, data: Omit<ShippingCostRuleCreate, 'shipping_method_id'>): Promise<ShippingCostRule | null> => {
    try {
      setLoading(true);
      const newRule = await shippingCostRuleService.create(id, data);
      setRules(prev => [...prev, newRule]);
      message.success('Cost rule created successfully');
      return newRule;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create cost rule';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateRule = async (ruleId: number, data: ShippingCostRuleUpdate): Promise<ShippingCostRule | null> => {
    try {
      setLoading(true);
      const updatedRule = await shippingCostRuleService.update(ruleId, data);
      setRules(prev => prev.map(rule => rule.id === ruleId ? updatedRule : rule));
      message.success('Cost rule updated successfully');
      return updatedRule;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update cost rule';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: number): Promise<boolean> => {
    try {
      setLoading(true);
      await shippingCostRuleService.delete(ruleId);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      message.success('Cost rule deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete cost rule';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (methodId) {
      fetchRules(methodId);
    }
  }, [methodId]);

  return {
    rules,
    loading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
  };
};

// Hook for product shipping rules
export const useProductShippingRules = (productId: number) => {
  const [rules, setRules] = useState<ProductShippingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [costPreviews, setCostPreviews] = useState<Record<number, ShippingCostPreview>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRules = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productShippingRuleService.getByProductId(id);
      setRules(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch product shipping rules';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (id: number, data: Omit<ProductShippingRuleCreate, 'product_id'>): Promise<ProductShippingRule | null> => {
    try {
      setLoading(true);
      const newRule = await productShippingRuleService.create(id, data);
      setRules(prev => [...prev, newRule]);
      message.success('Product shipping rule created successfully');
      return newRule;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create product shipping rule';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateRule = async (ruleId: number, data: ProductShippingRuleUpdate): Promise<ProductShippingRule | null> => {
    try {
      setLoading(true);
      const updatedRule = await productShippingRuleService.update(ruleId, data);
      setRules(prev => prev.map(rule => rule.id === ruleId ? updatedRule : rule));
      message.success('Product shipping rule updated successfully');
      return updatedRule;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update product shipping rule';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: number): Promise<boolean> => {
    try {
      setLoading(true);
      await productShippingRuleService.delete(ruleId);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      message.success('Product shipping rule deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete product shipping rule';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchCostPreviewInternal = async (id: number, methodId: number) => {
    // Prevent multiple simultaneous calls
    if (previewLoading) return;
    
    try {
      setPreviewLoading(true);
      setError(null);
      const data = await productShippingRuleService.getCostPreview(id, methodId);
      setCostPreviews(prev => ({ ...prev, [methodId]: data }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch cost preview';
      setError(errorMessage);
      // Only show error message if it's not a 422 (which might be expected)
      if (err.response?.status !== 422) {
        message.error(errorMessage);
      }
      setCostPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[methodId];
        return newPreviews;
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Debounced version of fetchCostPreview
  const fetchCostPreview = useCallback((id: number, methodId: number) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      fetchCostPreviewInternal(id, methodId);
    }, 500); // 500ms debounce
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (productId) {
      fetchRules(productId);
    }
  }, [productId]);

  return {
    rules,
    loading: loading || previewLoading,
    error,
    costPreviews,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    fetchCostPreview,
  };
};
