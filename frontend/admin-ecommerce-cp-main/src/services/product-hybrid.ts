import {
  ProductCreate,
  ProductResponse,
  ProductUpdate,
} from '@/types/product';
import { PaginatedResponse, PaginationParams } from '@/types/api';
import apiService from './api';

class ProductService {
  async getProducts(
    params: PaginationParams = { page: 1, per_page: 10 }
  ): Promise<PaginatedResponse<ProductResponse>> {
    // Convert frontend pagination params to API params
    const apiParams: Record<string, any> = {
      skip: params.skip || ((params.page || 1) - 1) * (params.per_page || params.size || params.limit || 10),
      limit: params.per_page || params.size || params.limit || 10,
      search: params.search,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
      status: params.status,
    };

    // Remove undefined values
    Object.keys(apiParams).forEach(key => {
      if (apiParams[key] === undefined) {
        delete apiParams[key];
      }
    });

    const response = await apiService.get<ProductResponse[]>(
      '/products',
      { params: apiParams }
    );

    // Transform API response to match frontend expectations
    const products = response.data || [];
    const page = params.page || 1;
    const per_page = params.per_page || params.size || params.limit || 10;
    
    return {
      items: products,
      total: products.length,
      page: page,
      size: per_page,
      pages: Math.ceil(products.length / per_page),
      total_items: products.length,
      per_page: per_page,
    };
  }

  async createProduct(productData: ProductCreate): Promise<ProductResponse> {
    const response = await apiService.post<ProductResponse>(
      '/products',
      productData
    );
    return response.data;
  }

  async getProductById(id: number): Promise<ProductResponse> {
    try {
      // Try to get all data in one call
      const response = await apiService.get<ProductResponse>(`/products/${id}`);
      const product = response.data;

      // Check if the response includes all necessary nested data
      const hasVariations = product.variations !== undefined;
      const hasMedia = product.media !== undefined;
      const hasOptions = product.customization_options !== undefined;

      // If any data is missing, fetch it separately
      if (!hasVariations || !hasMedia || !hasOptions) {
        console.warn('Product data incomplete, fetching missing data separately');
        
        const promises = [];
        if (!hasVariations) {
          promises.push(apiService.get(`/products/${id}/variations`));
        }
        if (!hasMedia) {
          promises.push(apiService.get(`/products/${id}/medias`));
        }
        if (!hasOptions) {
          promises.push(apiService.get(`/products/${id}/options`));
        }

        const results = await Promise.allSettled(promises);
        let resultIndex = 0;

        if (!hasVariations && results[resultIndex]?.status === 'fulfilled') {
          product.variations = (results[resultIndex] as PromiseFulfilledResult<any>).value.data;
        }
        resultIndex++;

        if (!hasMedia && results[resultIndex]?.status === 'fulfilled') {
          product.media = (results[resultIndex] as PromiseFulfilledResult<any>).value.data;
        }
        resultIndex++;

        if (!hasOptions && results[resultIndex]?.status === 'fulfilled') {
          product.customization_options = (results[resultIndex] as PromiseFulfilledResult<any>).value.data;
        }
      }

      return product;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw error;
    }
  }

  async updateProduct(
    id: number,
    productData: ProductUpdate
  ): Promise<ProductResponse> {
    const response = await apiService.put<ProductResponse>(
      `/products/${id}`,
      productData
    );
    return response.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await apiService.delete(`/products/${id}`);
  }
}

export const productService = new ProductService();
