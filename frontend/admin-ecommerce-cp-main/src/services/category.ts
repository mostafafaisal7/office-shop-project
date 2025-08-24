import { CategoryOut, CategoryCreate, CategoryUpdate } from '@/types/product';
import { PaginatedResponse, PaginationParams } from '@/types/api';
import apiService from './api';

export interface CategoryFilters extends PaginationParams {
  parent_id?: number | null;
  is_active?: boolean;
}

export interface CategoryListResponse {
  categories: CategoryOut[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  total_items: number;
}

class CategoryService {
  async getCategories(
    params: CategoryFilters = { page: 1, per_page: 100 }
  ): Promise<PaginatedResponse<CategoryOut>> {
    // Convert frontend pagination params to API params
    const apiParams: Record<string, any> = {
      skip: params.skip || ((params.page || 1) - 1) * (params.per_page || params.size || params.limit || 100),
      limit: params.per_page || params.size || params.limit || 100,
      search: params.search,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
      parent_id: params.parent_id,
      is_active: params.is_active,
    };

    // Remove undefined values
    Object.keys(apiParams).forEach(key => {
      if (apiParams[key] === undefined) {
        delete apiParams[key];
      }
    });

    const response = await apiService.get<CategoryOut[]>(
      '/categories',
      { params: apiParams }
    );

    // Transform API response to match frontend expectations
    const categories = response.data || [];
    const page = params.page || 1;
    const per_page = params.per_page || params.size || params.limit || 100;
    
    return {
      items: categories,
      total: categories.length,
      page: page,
      size: per_page,
      pages: Math.ceil(categories.length / per_page),
      total_items: categories.length,
      per_page: per_page,
    };
  }

  async getAllCategories(): Promise<CategoryOut[]> {
    const response = await apiService.get<CategoryOut[]>('/categories');
    return response.data || [];
  }

  async getCategory(id: number): Promise<CategoryOut> {
    const response = await apiService.get<CategoryOut>(`/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CategoryCreate): Promise<CategoryOut> {
    const response = await apiService.post<CategoryOut>('/categories', data);
    return response.data;
  }

  async updateCategory(id: number, data: CategoryUpdate): Promise<CategoryOut> {
    const response = await apiService.put<CategoryOut>(`/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await apiService.delete(`/categories/${id}`);
  }

  // Helper method to build category tree
  buildCategoryTree(categories: CategoryOut[]): CategoryOut[] {
    const categoryMap = new Map<number, CategoryOut & { children?: CategoryOut[] }>();
    const rootCategories: CategoryOut[] = [];
    const processedIds = new Set<number>();

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree structure with circular reference protection
    categories.forEach(category => {
      // Skip if already processed to prevent infinite loops
      if (processedIds.has(category.id)) {
        return;
      }

      const categoryWithChildren = categoryMap.get(category.id);
      if (!categoryWithChildren) return;

      // Check for circular reference (category cannot be its own parent)
      if (category.parent_id === category.id) {
        console.warn(`Circular reference detected: Category ${category.id} cannot be its own parent`);
        rootCategories.push(categoryWithChildren);
        processedIds.add(category.id);
        return;
      }
      
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        // Additional check to prevent deeper circular references
        let currentParentId: number | null = category.parent_id;
        const visitedIds = new Set<number>([category.id]);
        let hasCircularRef = false;

        // Traverse up the parent chain to detect cycles
        while (currentParentId) {
          if (visitedIds.has(currentParentId)) {
            hasCircularRef = true;
            break;
          }
          visitedIds.add(currentParentId);
          const parentCategory = categoryMap.get(currentParentId);
          currentParentId = parentCategory?.parent_id || null;
        }

        if (hasCircularRef) {
          console.warn(`Circular reference detected in category hierarchy for category ${category.id}`);
          rootCategories.push(categoryWithChildren);
        } else {
          const parent = categoryMap.get(category.parent_id)!;
          parent.children!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }

      processedIds.add(category.id);
    });

    return rootCategories;
  }

  // Helper method to get parent categories (for dropdown)
  async getParentCategories(): Promise<CategoryOut[]> {
    const allCategories = await this.getAllCategories();
    return allCategories.filter(category => !category.parent_id);
  }
}

export const categoryService = new CategoryService();
