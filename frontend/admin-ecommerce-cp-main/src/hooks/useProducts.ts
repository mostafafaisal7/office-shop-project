import { useState, useEffect, useCallback } from 'react';
import { ProductResponse, ProductUpdate } from '@/types/product';
import { productService } from '@/services/product';
import { PaginationParams, PaginatedResponse } from '@/types/api';
import { requestCache } from '@/utils/requestCache';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const useProducts = (initialParams: PaginationParams = {}) => {
  const [response, setResponse] = useState<PaginatedResponse<ProductResponse>>();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [stats, setStats] = useState<{
    total_value: number;
    total_products: number;
    active_products: number;
    draft_products: number;
  }>({
    total_value: 0,
    total_products: 0,
    active_products: 0,
    draft_products: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    per_page: 10,
    ...initialParams,
  });

  const normalizeMediaUrls = (items: ProductResponse[]): ProductResponse[] =>
    items.map((product) => ({
      ...product,
      media: (product.media || []).map((file) => ({
        ...file,
        file_path: file.file_path.startsWith('http') ? file.file_path : `${BASE_URL}${file.file_path}`,
      })),
    }));

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const cacheKey = `products-${JSON.stringify(params)}`;
      const result = await requestCache.get(cacheKey, () => productService.getProducts(params));

      const normalizedItems = normalizeMediaUrls(result.items);

      setResponse(result);
      setProducts(normalizedItems);
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
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err: any) {
      console.error('Failed to delete product:', err.response?.status, err.response?.data || err.message);
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const newParams: PaginationParams = {
      ...params,
      page: pagination.current,
      per_page: pagination.pageSize,
      sort_by: sorter.field,
      sort_order: sorter.order === 'ascend' ? 'asc' : 'desc',
      ...filters,
    };
    setParams(newParams);
  };

  const updateFilters = (newFilters: Partial<PaginationParams>) => {
    setParams((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const uploadProductMedia = async (productId: number, files: File[]) => {
    try {
      // Upload files one by one since the service expects a single file
      const uploadedFilesWithFullUrl: any[] = [];
      for (const file of files) {
        const data = await productService.uploadProductMedia(productId, file);
        const uploadedFile = data.file || data;

        // Normalize URL
        const normalizedFile = {
          ...uploadedFile,
          file_path: uploadedFile.file_path?.startsWith('http') ? uploadedFile.file_path : `${BASE_URL}${uploadedFile.file_path}`,
        };
        uploadedFilesWithFullUrl.push(normalizedFile);
      }

      if (uploadedFilesWithFullUrl.length === 0) throw new Error('Upload failed');

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, media: [...(p.media || []), ...uploadedFilesWithFullUrl] } : p
        )
      );

      return uploadedFilesWithFullUrl;
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const deleteProductMedia = async (productId: number, mediaId: number) => {
    try {
      await productService.deleteProductMedia(mediaId);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, media: (p.media || []).filter((m) => m.id !== mediaId) }
            : p
        )
      );
    } catch (err) {
      console.error('Delete media error:', err);
      throw err;
    }
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
    uploadProductMedia,
    deleteProductMedia,
  };
};
