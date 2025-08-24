import {
  CustomizationOptionCreate,
  CustomizationOptionResponse,
  CustomizationOptionUpdateWithID,
} from '@/types/product';
import apiService from './api';

class ProductCustomizationService {
  async getCustomizationOptions(productId: number): Promise<CustomizationOptionResponse[]> {
    const response = await apiService.get<CustomizationOptionResponse[]>(
      `/products/${productId}/options`
    );
    return response.data;
  }

  async createCustomizationOption(
    productId: number,
    optionData: CustomizationOptionCreate
  ): Promise<CustomizationOptionResponse> {
    const response = await apiService.post<CustomizationOptionResponse>(
      `/products/${productId}/options`,
      optionData
    );
    return response.data;
  }

  async getCustomizationOptionById(
    optionId: number
  ): Promise<CustomizationOptionResponse> {
    const response = await apiService.get<CustomizationOptionResponse>(
      `/products/options/${optionId}`
    );
    return response.data;
  }

  async updateCustomizationOption(
    optionId: number,
    optionData: Partial<CustomizationOptionCreate>
  ): Promise<CustomizationOptionResponse> {
    const response = await apiService.put<CustomizationOptionResponse>(
      `/products/options/${optionId}`,
      optionData
    );
    return response.data;
  }

  async deleteCustomizationOption(optionId: number): Promise<void> {
    await apiService.delete(`/products/options/${optionId}`);
  }

  async bulkUpdateCustomizationOptions(
    productId: number,
    options: CustomizationOptionUpdateWithID[]
  ): Promise<CustomizationOptionResponse[]> {
    const response = await apiService.put<CustomizationOptionResponse[]>(
      `/products/${productId}/options/bulk`,
      { options }
    );
    return response.data;
  }

  // Get all customization options (user projects) for a specific product
  async getAllUserProjectsForProduct(productId: number): Promise<CustomizationOptionResponse[]> {
    const response = await apiService.get<CustomizationOptionResponse[]>(
      `/products/${productId}/options`
    );
    return response.data;
  }
}

export const productCustomizationService = new ProductCustomizationService();
