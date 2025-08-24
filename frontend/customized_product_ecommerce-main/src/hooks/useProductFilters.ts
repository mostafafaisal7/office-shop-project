"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiProduct, fetchProductsWithFilters, ProductFilters, ProductsResponse } from "@/services/api";

interface FilterState {
  q: string;
  category_id?: number;
  status: string;
  is_customizable?: boolean;
  categories: number[];
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
  tags: string[];
  sortBy: string;
  page: number;
}

interface UseProductFiltersProps {
  initialProducts?: ApiProduct[];
  initialResponse?: ProductsResponse;
  productsPerPage?: number;
  useServerFiltering?: boolean;
  initialCategoryId?: number;
  categories?: { id: number; name: string }[];
}

export const useProductFilters = ({ 
  initialProducts = [], 
  initialResponse,
  productsPerPage = 15,
  useServerFiltering = true,
  initialCategoryId,
  categories = []
}: UseProductFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for server-side filtering
  const [productsResponse, setProductsResponse] = useState<ProductsResponse>(
    initialResponse || {
      products: initialProducts,
      total: initialProducts.length,
      page: 1,
      per_page: productsPerPage,
      pages: Math.ceil(initialProducts.length / productsPerPage)
    }
  );
  const [loading, setLoading] = useState(false);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>(() => {
    const q = searchParams.get('q') || '';
    const category_id = searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : initialCategoryId;
    const status = searchParams.get('status') || 'active';
    const is_customizable = searchParams.get('is_customizable') ? searchParams.get('is_customizable') === 'true' : undefined;
    const categories = searchParams.get('categories')?.split(',').map(id => parseInt(id)).filter(Boolean) || [];
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || [];
    const sizes = searchParams.get('sizes')?.split(',').filter(Boolean) || [];
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const minPrice = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : 0;
    const maxPrice = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : 1000;
    const sortBy = searchParams.get('sort') || 'default';
    const page = parseInt(searchParams.get('page') || '1');

    return {
      q,
      category_id,
      status,
      is_customizable,
      categories,
      priceRange: [minPrice, maxPrice] as [number, number],
      colors,
      sizes,
      tags,
      sortBy,
      page
    };
  });

  // Get current products (either from server response or initial products)
  const currentProducts = useServerFiltering ? productsResponse.products : initialProducts;

  // Extract available filter options from products
  const filterOptions = useMemo(() => {
    const categoryCountMap = new Map<number, number>();
    const colors = new Set<string>();
    const sizes = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    currentProducts.forEach((product: ApiProduct) => {
      // Count products per category
      product.category_ids.forEach(categoryId => {
        categoryCountMap.set(categoryId, (categoryCountMap.get(categoryId) || 0) + 1);
      });

      // Extract price range
      const price = parseFloat(product.base_price);
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);

      // Extract colors and sizes from variations
      product.variations?.forEach((variation: any) => {
        if (variation.attributes?.color) {
          colors.add(variation.attributes.color);
        }
        if (variation.attributes?.size) {
          sizes.add(variation.attributes.size);
        }
      });

      // Extract tags
      product.tags?.forEach(tag => colors.add(tag));
    });

    // Create categories with counts
    const categoriesWithCounts = categories.map(category => ({
      id: category.id,
      name: category.name,
      count: categoryCountMap.get(category.id) || 0
    })).filter(category => category.count > 0);

    return {
      categories: categoriesWithCounts,
      colors: Array.from(colors),
      sizes: Array.from(sizes).sort((a, b) => {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
      }),
      priceRange: [Math.floor(minPrice === Infinity ? 0 : minPrice), Math.ceil(maxPrice === 0 ? 1000 : maxPrice)] as [number, number]
    };
  }, [currentProducts, categories]);

  // Fetch products with server-side filtering
  const fetchFilteredProducts = useCallback(async (filterParams: FilterState) => {
    if (!useServerFiltering) return;

    setLoading(true);
    try {
      // For multiple categories, we'll use the first selected category for server-side filtering
      // and handle multiple category filtering on the client side
      const categoryId = filterParams.categories.length > 0 ? filterParams.categories[0] : filterParams.category_id;
      
      const apiFilters: ProductFilters = {
        q: filterParams.q || undefined,
        category_id: categoryId,
        status: filterParams.status !== 'all' ? filterParams.status : undefined,
        is_customizable: filterParams.is_customizable,
        min_price: filterParams.priceRange[0] > 0 ? filterParams.priceRange[0] : undefined,
        max_price: filterParams.priceRange[1] < 1000 ? filterParams.priceRange[1] : undefined,
        tags: filterParams.tags.length > 0 ? filterParams.tags : undefined,
        sort_by: filterParams.sortBy === 'name-asc' || filterParams.sortBy === 'name-desc' ? 'name' :
                 filterParams.sortBy === 'price-low' || filterParams.sortBy === 'price-high' ? 'base_price' :
                 filterParams.sortBy === 'newest' ? 'created_at' : undefined,
        sort_order: filterParams.sortBy.includes('desc') || filterParams.sortBy === 'price-high' ? 'desc' : 'asc',
        page: filterParams.page,
        per_page: productsPerPage
      };

      const response = await fetchProductsWithFilters(apiFilters);
      setProductsResponse(response);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    } finally {
      setLoading(false);
    }
  }, [useServerFiltering, productsPerPage]);

  // Client-side filtering for fallback
  const clientFilteredProducts = useMemo(() => {
    if (useServerFiltering) return currentProducts;

    let filtered = currentProducts.filter((product: ApiProduct) => {
      // Search filter
      if (filters.q) {
        const searchTerm = filters.q.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category_id && !product.category_ids.includes(filters.category_id)) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && product.status !== filters.status) {
        return false;
      }

      // Customizable filter
      if (filters.is_customizable !== undefined && product.is_customizable !== filters.is_customizable) {
        return false;
      }

      // Categories filter
      if (filters.categories.length > 0) {
        const hasMatchingCategory = filters.categories.some(categoryId => 
          product.category_ids.includes(categoryId)
        );
        if (!hasMatchingCategory) return false;
      }

      // Price filter
      const price = parseFloat(product.base_price);
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;

      // Color filter
      if (filters.colors.length > 0) {
        const hasColor = product.variations?.some((variation: any) => 
          variation.attributes?.color && filters.colors.includes(variation.attributes.color)
        );
        if (!hasColor) return false;
      }

      // Size filter
      if (filters.sizes.length > 0) {
        const hasSize = product.variations?.some((variation: any) => 
          variation.attributes?.size && filters.sizes.includes(variation.attributes.size)
        );
        if (!hasSize) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasTags = filters.tags.some(tag => product.tags.includes(tag));
        if (!hasTags) return false;
      }

      return true;
    });

    // Sort products
    switch (filters.sortBy) {
      case 'name-asc':
        filtered.sort((a: ApiProduct, b: ApiProduct) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a: ApiProduct, b: ApiProduct) => b.name.localeCompare(a.name));
        break;
      case 'price-low':
        filtered.sort((a: ApiProduct, b: ApiProduct) => parseFloat(a.base_price) - parseFloat(b.base_price));
        break;
      case 'price-high':
        filtered.sort((a: ApiProduct, b: ApiProduct) => parseFloat(b.base_price) - parseFloat(a.base_price));
        break;
      case 'newest':
        filtered.sort((a: ApiProduct, b: ApiProduct) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        // Keep original order
        break;
    }

    return filtered;
  }, [currentProducts, filters, useServerFiltering]);

  // Paginate products for client-side filtering
  const paginatedProducts = useMemo(() => {
    if (useServerFiltering) return currentProducts;
    
    const startIndex = (filters.page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return clientFilteredProducts.slice(startIndex, endIndex);
  }, [clientFilteredProducts, filters.page, productsPerPage, useServerFiltering, currentProducts]);

  // Calculate totals
  const totalProducts = useServerFiltering ? productsResponse.total : clientFilteredProducts.length;
  const totalPages = useServerFiltering ? productsResponse.pages : Math.ceil(clientFilteredProducts.length / productsPerPage);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.q) params.set('q', filters.q);
    if (filters.category_id) params.set('category_id', filters.category_id.toString());
    if (filters.status !== 'active') params.set('status', filters.status);
    if (filters.is_customizable !== undefined) params.set('is_customizable', filters.is_customizable.toString());
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
    if (filters.colors.length > 0) params.set('colors', filters.colors.join(','));
    if (filters.sizes.length > 0) params.set('sizes', filters.sizes.join(','));
    if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
    if (filters.priceRange[0] !== 0) params.set('min_price', filters.priceRange[0].toString());
    if (filters.priceRange[1] !== 1000) params.set('max_price', filters.priceRange[1].toString());
    if (filters.sortBy !== 'default') params.set('sort', filters.sortBy);
    if (filters.page !== 1) params.set('page', filters.page.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    const currentUrl = window.location.pathname + window.location.search;
    
    // Only update URL if it's actually different
    if (currentUrl !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, router]);

  // Fetch products when filters change (server-side filtering)
  useEffect(() => {
    if (useServerFiltering) {
      fetchFilteredProducts(filters);
    }
  }, [filters, fetchFilteredProducts, useServerFiltering]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1 // Reset to page 1 when filters change (except when explicitly setting page)
    }));
  };

  const resetFilters = () => {
    setFilters({
      q: '',
      category_id: initialCategoryId,
      status: 'active',
      is_customizable: undefined,
      categories: [],
      priceRange: filterOptions.priceRange,
      colors: [],
      sizes: [],
      tags: [],
      sortBy: 'default',
      page: 1
    });
  };

  return {
    filters,
    updateFilters,
    resetFilters,
    filteredProducts: paginatedProducts,
    totalProducts,
    totalPages,
    filterOptions,
    loading
  };
};
