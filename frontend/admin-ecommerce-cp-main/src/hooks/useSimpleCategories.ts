import { useState, useEffect } from 'react';
import { categoryService } from '@/services/category';
import { CategoryOut } from '@/types/product';
import { requestCache } from '@/utils/requestCache';

export function useSimpleCategories() {
  const [categories, setCategories] = useState<CategoryOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const cacheKey = 'all-categories';
        const categoriesData = await requestCache.get(cacheKey, () => categoryService.getAllCategories());
        setCategories(categoriesData);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch categories';
        setError(errorMessage);
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []); // Empty dependency array - only fetch once on mount

  return {
    categories,
    loading,
    error,
  };
}
