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
      total: products.length, // This might need to be adjusted based on actual API response
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
    // Single API call to get all product data including variations, media, and options
    const response = await apiService.get<ProductResponse>(`/products/${id}`);
    return response.data;
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

  // Keep separate methods for specific use cases where you might need only specific data
  async getProductVariations(id: number) {
    const response = await apiService.get(`/products/${id}/variations`);
    return response.data;
  }

  async getProductMedia(id: number) {
    const response = await apiService.get(`/products/${id}/medias`);
    return response.data;
  }

  async getProductOptions(id: number) {
    const response = await apiService.get(`/products/${id}/options`);
    return response.data;
  }
}

export const productService = new ProductService();
