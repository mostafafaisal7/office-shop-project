import { useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { categoryService, CategoryFilters } from '@/services/category';
import { CategoryOut } from '@/types/product';
import { PaginatedResponse } from '@/types/api';
import { requestCache } from '@/utils/requestCache';

interface UseCategoriesReturn {
  categories: CategoryOut[];
  loading: boolean;
  error: string | null;
  response: PaginatedResponse<CategoryOut> | null;
  filters: CategoryFilters;
  setFilters: (filters: CategoryFilters) => void;
  refreshCategories: () => void;
  deleteCategory: (id: number) => Promise<void>;
  toggleCategoryStatus: (id: number, isActive: boolean) => Promise<void>;
  handleTableChange: (pagination: any, filters: any, sorter: any) => void;
  categoryTree: CategoryOut[];
  parentCategories: CategoryOut[];
  loadParentCategories: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const { message } = App.useApp();
  const [categories, setCategories] = useState<CategoryOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PaginatedResponse<CategoryOut> | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryOut[]>([]);
  const [parentCategories, setParentCategories] = useState<CategoryOut[]>([]);
  const [filters, setFilters] = useState<CategoryFilters>({
    page: 1,
    per_page: 10,
    sort_by: 'id',
    sort_order: 'desc'
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cacheKey = `categories-${JSON.stringify(filters)}`;
      const result = await requestCache.get(cacheKey, () => categoryService.getCategories(filters));
      
      if (result) {
        setCategories(result.items);
        setResponse(result);
        
        // Build category tree for hierarchical display
        const tree = categoryService.buildCategoryTree(result.items);
        setCategoryTree(tree);
        
        // Extract parent categories from the same result to avoid duplicate API calls
        const parents = result.items.filter(category => !category.parent_id);
        setParentCategories(parents);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch categories';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadParentCategories = useCallback(async () => {
    // Only load parent categories if we don't have any categories yet
    // This prevents duplicate API calls since fetchCategories already loads parent categories
    if (categories.length === 0) {
      try {
        const cacheKey = 'parent-categories';
        const parents = await requestCache.get(cacheKey, () => categoryService.getParentCategories());
        setParentCategories(parents);
      } catch (err: any) {
        console.error('Failed to load parent categories:', err);
      }
    }
  }, [categories.length]);

  const refreshCategories = useCallback(() => {
    fetchCategories();
    loadParentCategories();
  }, [fetchCategories, loadParentCategories]);

  const deleteCategory = useCallback(async (id: number) => {
    try {
      await categoryService.deleteCategory(id);
      message.success('Category deleted successfully');
      refreshCategories();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete category';
      message.error(errorMessage);
      throw err;
    }
  }, [refreshCategories, message]);

  const toggleCategoryStatus = useCallback(async (id: number, isActive: boolean) => {
    try {
      await categoryService.updateCategory(id, { is_active: isActive });
      message.success(`Category ${isActive ? 'activated' : 'deactivated'} successfully`);
      refreshCategories();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update category status';
      message.error(errorMessage);
      throw err;
    }
  }, [refreshCategories, message]);

  const handleTableChange = useCallback((pagination: any, tableFilters: any, sorter: any) => {
    const newFilters: CategoryFilters = {
      ...filters,
      page: pagination.current,
      per_page: pagination.pageSize,
    };

    if (sorter.field) {
      newFilters.sort_by = sorter.field;
      newFilters.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    setFilters(newFilters);
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    response,
    filters,
    setFilters,
    refreshCategories,
    deleteCategory,
    toggleCategoryStatus,
    handleTableChange,
    categoryTree,
    parentCategories,
    loadParentCategories,
  };
}
