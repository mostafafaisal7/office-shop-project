import {
  ProductVariationCreate,
  ProductVariationResponse,
  ProductVariationUpdateWithID,
} from '@/types/product';
import apiService from './api';

class ProductVariationService {
  async getVariations(productId: number): Promise<ProductVariationResponse[]> {
    const response = await apiService.get<ProductVariationResponse[]>(
      `/products/${productId}/variations`
    );
    return response.data;
  }

  async createVariation(
    productId: number,
    variationData: ProductVariationCreate
  ): Promise<ProductVariationResponse> {
    const response = await apiService.post<ProductVariationResponse>(
      `/products/${productId}/variations`,
      variationData
    );
    return response.data;
  }

  async getVariationById(
    variationId: number
  ): Promise<ProductVariationResponse> {
    const response = await apiService.get<ProductVariationResponse>(
      `/products/variations/${variationId}`
    );
    return response.data;
  }

  async updateVariation(
    variationId: number,
    variationData: Partial<ProductVariationCreate>
  ): Promise<ProductVariationResponse> {
    const response = await apiService.put<ProductVariationResponse>(
      `/products/variations/${variationId}`,
      variationData
    );
    return response.data;
  }

  async deleteVariation(productId: number, variationId: number): Promise<void> {
    await apiService.delete(`/products/${productId}/variations/${variationId}`);
  }

  async bulkUpdateVariations(
    productId: number,
    variations: ProductVariationUpdateWithID[]
  ): Promise<ProductVariationResponse[]> {
    const response = await apiService.put<ProductVariationResponse[]>(
      `/products/${productId}/variations/bulk`,
      { variations }
    );
    return response.data;
  }
}

export const productVariationService = new ProductVariationService();
