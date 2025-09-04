
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
      page: params.page || 1,
      per_page: params.per_page || params.size || params.limit || 10,
      q: params.q || params.search, // Search query
      category_id: params.category_id,
      status: params.status,
      is_customizable: params.is_customizable,
      min_price: params.min_price,
      max_price: params.max_price,
      tags: params.tags,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    };

    // Remove undefined values
    Object.keys(apiParams).forEach(key => {
      if (apiParams[key] === undefined) {
        delete apiParams[key];
      }
    });

    const response = await apiService.get<any>(
      '/products',
      { params: apiParams }
    );

    // Handle the actual API response structure
    const products = response.data?.products || [];
    const total = response.data?.total || 0;
    const page = response.data?.page || params.page || 1;
    const per_page = response.data?.per_page || params.per_page || params.size || params.limit || 10;
    const pages = response.data?.pages || Math.ceil(total / per_page);
    
    return {
      items: products,
      total: total,
      page: page,
      size: per_page,
      pages: pages,
      total_items: total,
      per_page: per_page,
    };
  }

  async getProductStats(): Promise<{ total_value: number; total_products: number; active_products: number; draft_products: number }> {
    try {
      // Try to get all products without pagination to calculate total value
      const response = await apiService.get<any>('/products', { 
        params: { limit: 1000 } // Get a large number to ensure we get all products
      });
      
      const products = response.data?.products || [];
      const totalValue = products.reduce((sum: number, product: ProductResponse) => {
        const price = typeof product.base_price === 'string' ? parseFloat(product.base_price) : (product.base_price || 0);
        return sum + price;
      }, 0);
      
      const activeProducts = products.filter((p: ProductResponse) => p.status === 'active').length;
      const draftProducts = products.filter((p: ProductResponse) => p.status === 'draft').length;
      
      return {
        total_value: totalValue,
        total_products: products.length,
        active_products: activeProducts,
        draft_products: draftProducts
      };
    } catch (error) {
      // Fallback if stats endpoint fails
      return {
        total_value: 0,
        total_products: 0,
        active_products: 0,
        draft_products: 0
      };
    }
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

  async deleteProductMedia(mediaId: number): Promise<void> {
    await apiService.delete(`/products/medias/${mediaId}`);
  }



async uploadProductMedia(productId: number, file: File, token?: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiService.post(
    `/products/${productId}/upload-image`,
    formData,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );

  return response.data;
}

}

export const productService = new ProductService();
