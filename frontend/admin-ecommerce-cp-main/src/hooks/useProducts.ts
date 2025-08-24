
import { useState, useEffect, useCallback } from 'react';
import { ProductResponse, ProductUpdate } from '@/types/product';
import { productService } from '@/services/product';
import { PaginationParams, PaginatedResponse } from '@/types/api';
import { requestCache } from '@/utils/requestCache';

export const useProducts = (initialParams: PaginationParams = {}) => {
  const [response, setResponse] = useState<PaginatedResponse<ProductResponse>>();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [stats, setStats] = useState<{ total_value: number; total_products: number; active_products: number; draft_products: number }>({
    total_value: 0,
    total_products: 0,
    active_products: 0,
    draft_products: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    per_page: 10,
    ...initialParams,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const cacheKey = `products-${JSON.stringify(params)}`;
      const result = await requestCache.get(cacheKey, () => productService.getProducts(params));
      setResponse(result);
      setProducts(result.items);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const fetchStats = useCallback(async () => {
    try {
      const statsResult = await productService.getProductStats();
      setStats(statsResult);
    } catch (err) {
      console.error('Failed to fetch product stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  const updateProduct = async (id: number, data: ProductUpdate) => {
    try {
      const updatedProduct = await productService.updateProduct(id, data);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? updatedProduct : p))
      );
    } catch (err) {
      setError('Failed to update product');
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const newParams: PaginationParams = {
      ...params, // Keep existing params
      page: pagination.current,
      per_page: pagination.pageSize,
      sort_by: sorter.field,
      sort_order: sorter.order === 'ascend' ? 'asc' : 'desc',
      ...filters,
    };
    setParams(newParams);
  };

  const updateFilters = (newFilters: Partial<PaginationParams>) => {
    setParams(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  return {
    response,
    products,
    stats,
    loading,
    error,
    params,
    setParams,
    fetchProducts,
    fetchStats,
    updateProduct,
    deleteProduct,
    handleTableChange,
    updateFilters,
  };
};
