import { useState, useEffect } from 'react';
import { message } from 'antd';
import { paymentMethodService } from '@/services/payment';
import type {
  PaymentMethod,
  PaymentMethodCreate,
  PaymentMethodUpdate,
  PaymentMethodListParams,
} from '@/types/payment';

// Hook for payment methods
export const usePaymentMethods = (params?: PaymentMethodListParams) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentMethodService.getAll(params);
      setMethods(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch payment methods';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createMethod = async (data: PaymentMethodCreate): Promise<PaymentMethod | null> => {
    try {
      setLoading(true);
      const newMethod = await paymentMethodService.create(data);
      setMethods(prev => [...prev, newMethod]);
      message.success('Payment method created successfully');
      return newMethod;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create payment method';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMethod = async (id: number, data: PaymentMethodUpdate): Promise<PaymentMethod | null> => {
    try {
      setLoading(true);
      const updatedMethod = await paymentMethodService.update(id, data);
      setMethods(prev => prev.map(method => method.id === id ? updatedMethod : method));
      message.success('Payment method updated successfully');
      return updatedMethod;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update payment method';
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
      await paymentMethodService.delete(id);
      setMethods(prev => prev.filter(method => method.id !== id));
      message.success('Payment method deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete payment method';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [JSON.stringify(params)]);

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

// Hook for a single payment method
export const usePaymentMethod = (id?: number) => {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMethod = async (methodId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentMethodService.getById(methodId);
      setMethod(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch payment method';
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
