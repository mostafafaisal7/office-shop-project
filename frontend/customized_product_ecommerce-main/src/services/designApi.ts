const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://localhost:8000' // Server-side
  : '/api'; // Client-side (uses proxy)

// New interface matching the backend's expected payload structure
export interface DesignSaveRequest {
  user_id: number | null;
  client_reference_id: string;
  product_id: number;
  variation_id: number;
  design_area: string;
  canvas_data: {
    version: string;
    objects: any[];
    background?: string;
    backgroundImage?: any;
  };
  svg_data?: string;  // Add SVG data field
  design_metadata: {
    canvas_width: number;
    canvas_height: number;
    product_image_url: string;
    design_name: string;
    is_completed: boolean;
    preview_image_url?: string;  // Add preview image URL field
  };
  design_elements: any[];
}

export interface DesignLoadResponse {
  id?: number;
  user_id: number | null;
  client_reference_id: string;
  product_id: number;
  variation_id: number;
  design_area: string;
  canvas_data: {
    version: string;
    objects: any[];
    background?: string;
    backgroundImage?: any;
  };
  design_metadata: {
    canvas_width: number;
    canvas_height: number;
    product_image_url: string;
    design_name: string;
    is_completed: boolean;
  };
  design_elements: any[];
  created_at?: string;
  updated_at?: string;
}

// Legacy interfaces for backward compatibility
export interface CustomizationOption {
  id?: number;
  product_id: number;
  option_type?: 'design' | 'text' | 'image' | 'color';
  option_name?: string;
  option_data?: {
    canvas_data?: any;
    design_area?: string;
    variation_id?: string;
    canvas_width?: number;
    canvas_height?: number;
    product_image_url?: string;
    design_elements?: any[];
    metadata?: any;
  };
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // New format fields
  client_reference_id?: string;
  user_id?: number;
  variation_id?: number;
  design_area?: string;
  canvas_data?: {
    version: string;
    objects: any[];
    background?: string;
    backgroundImage?: any;
  };
  design_metadata?: {
    canvas_width: number;
    canvas_height: number;
    product_image_url: string;
    created_at?: string;
    updated_at?: string;
    design_name: string;
    is_completed: boolean;
  };
  design_elements?: any[];
  media?: any[];
}

export interface CreateCustomizationOptionRequest {
  option_type: 'design' | 'text' | 'image' | 'color';
  option_name: string;
  option_data: {
    canvas_data?: any;
    design_area?: string;
    variation_id?: string;
    canvas_width?: number;
    canvas_height?: number;
    product_image_url?: string;
    design_elements?: any[];
    metadata?: any;
  };
  is_active?: boolean;
}

export interface UpdateCustomizationOptionRequest extends CreateCustomizationOptionRequest {
  id: number;
}

class DesignApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    // Import auth store dynamically to avoid circular dependencies
    const { useAuthStore, getValidToken } = await import('@/store/authStore');
    const { tokens, isAuthenticated } = useAuthStore.getState();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (isAuthenticated && tokens?.accessToken) {
      // Try to get a valid token (handles refresh if needed)
      try {
        const validToken = await getValidToken();
        if (validToken) {
          headers['Authorization'] = `Bearer ${validToken}`;
        } else {
          console.warn('No valid token available');
        }
      } catch (error) {
        console.error('Error getting valid token:', error);
        // Fallback to the stored token
        if (tokens?.accessToken) {
          headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
      }
    } else {
      console.warn('User not authenticated - API request will be made without authentication');
    }
    
    return headers;
  }

  private async getUserId(): Promise<number | null> {
    try {
      const { useAuthStore } = await import('@/store/authStore');
      const { isAuthenticated } = useAuthStore.getState();
      
      if (!isAuthenticated) {
        return null;
      }

      // Fetch user details from /users/me endpoint
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers,
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user details:', response.status);
        return null;
      }

      const userData = await response.json();

      return userData.id || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  private generateClientReferenceId(): string {
    return `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate a shared client reference ID based on product+variation
  private generateSharedClientReferenceId(productId: string, variationId: number): string {
    return `design_${productId}_${variationId}_${Date.now()}`;
  }

  private convertCanvasDataToDesignElements(canvasData: any): any[] {
    if (!canvasData?.objects) return [];
    
    return canvasData.objects.map((obj: any, index: number) => {
      if (obj.type === 'textbox' || obj.type === 'text') {
        return {
          type: 'text',
          content: obj.text || '',
          position: {
            x: obj.left || 0,
            y: obj.top || 0,
            z: index + 1
          },
          style: {
            fontFamily: obj.fontFamily || 'Arial',
            fontSize: obj.fontSize || 16,
            color: obj.fill || '#000000',
            bold: obj.fontWeight === 'bold' || false
          },
          dimensions: {
            width: obj.width || 200,
            height: obj.height || 50
          }
        };
      } else if (obj.type === 'image') {
        return {
          type: 'image',
          src: obj.src || '',
          position: {
            x: obj.left || 0,
            y: obj.top || 0,
            z: index + 1
          },
          style: {
            opacity: obj.opacity || 1,
            borderColor: obj.stroke || '#CCCCCC'
          },
          dimensions: {
            width: obj.width || 150,
            height: obj.height || 75
          }
        };
      }
      
      // Default for other object types
      return {
        type: obj.type || 'unknown',
        position: {
          x: obj.left || 0,
          y: obj.top || 0,
          z: index + 1
        },
        dimensions: {
          width: obj.width || 100,
          height: obj.height || 100
        }
      };
    });
  }

  // New method using the correct payload structure with create/update logic
  async saveDesignWithNewFormat(
    productId: string,
    variationId: number,
    designArea: string,
    canvasData: any,
    productImageUrl: string,
    existingClientReferenceId?: string,
    previewImageUrl?: string,
    svgData?: string
  ): Promise<DesignLoadResponse> {
    try {
      const userId = await this.getUserId();
      
      // Only save to database if user is authenticated
      if (!userId) {
        throw new Error('User not authenticated - cannot save to database');
      }

      const designElements = this.convertCanvasDataToDesignElements(canvasData);

      // ✅ FIX: Always INSERT when we have a new client_reference_id (new version)
      // If existingClientReferenceId is provided, check if it matches an existing design
      // If it doesn't match, this is a NEW version and should be INSERTed
      let clientReferenceId = existingClientReferenceId;
      let isUpdate = false;
      let existingDesign = null;

      if (!clientReferenceId) {
        // No client reference ID provided - try to find existing design for this area
        existingDesign = await this.findExistingDesign(userId, parseInt(productId), variationId, designArea);
        if (existingDesign) {
          clientReferenceId = existingDesign.client_reference_id;
          isUpdate = existingDesign.id !== undefined;
        } else {
          // Generate new client reference ID for completely new design
          clientReferenceId = this.generateSharedClientReferenceId(productId, variationId);
        }
      } else {
        // Client reference ID was explicitly provided
        // Check if this SPECIFIC client_reference_id exists in database
        existingDesign = await this.findExistingDesign(userId, parseInt(productId), variationId, designArea);

        // Only UPDATE if the existing design has the SAME client_reference_id
        // If different, this is a NEW version -> INSERT
        if (existingDesign && existingDesign.client_reference_id === clientReferenceId) {
          isUpdate = true;
        } else {
          // Different client_reference_id = new version = INSERT
          isUpdate = false;
          console.log('🆕 New version detected - will INSERT instead of UPDATE');
          console.log('  Provided client_reference_id:', clientReferenceId);
          console.log('  Existing client_reference_id:', existingDesign?.client_reference_id);
        }
      }
      
      const payload: DesignSaveRequest = {
        user_id: userId,
        client_reference_id: clientReferenceId,
        product_id: parseInt(productId),
        variation_id: variationId,
        design_area: designArea,
        canvas_data: {
          version: '5.3.0',
          objects: canvasData?.objects || [],
          background: canvasData?.background || '#FFFFFF',
          backgroundImage: canvasData?.backgroundImage || {}
        },
        svg_data: svgData || undefined,  // Include SVG data for print-ready designs
        design_metadata: {
          canvas_width: 800,
          canvas_height: 600,
          product_image_url: productImageUrl,
          design_name: `Design for ${designArea}`,
          is_completed: false,
          preview_image_url: previewImageUrl // Add preview image URL to metadata
        },
        design_elements: designElements
      };

      const headers = await this.getAuthHeaders();
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate
        ? `${API_BASE_URL}/products/users/me/options/${existingDesign?.id}`
        : `${API_BASE_URL}/products/users/me/options`;

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Provide user-friendly error messages based on status code
        let userFriendlyMessage = '';
        if (response.status === 400) {
          userFriendlyMessage = 'Invalid design data. Please check your design and try again.';
        } else if (response.status === 401) {
          userFriendlyMessage = 'You need to be logged in to save your design.';
        } else if (response.status === 403) {
          userFriendlyMessage = 'You do not have permission to save this design.';
        } else if (response.status === 404) {
          userFriendlyMessage = 'The product or variation was not found.';
        } else if (response.status >= 500) {
          userFriendlyMessage = 'Server error occurred while saving your design. Please try again later.';
        } else {
          userFriendlyMessage = `Failed to ${isUpdate ? 'update' : 'save'} design. Please try again.`;
        }
        
        throw new Error(userFriendlyMessage);
      }

      const data = await response.json();

      // Return the data with the client_reference_id for future updates
      return {
        ...data,
        client_reference_id: clientReferenceId
      };
    } catch (error) {
      console.error('Error saving design with new format:', error);
      throw error;
    }
  }

  // Helper method to find existing design
  async findExistingDesign(
    userId: number,
    productId: number,
    variationId: number,
    designArea: string
  ): Promise<DesignLoadResponse | null> {
    try {
      const headers = await this.getAuthHeaders();
      
      // First, try to find the specific design for this area
      const specificResponse = await fetch(
        `${API_BASE_URL}/products/${productId}/options?user_id=${userId}&variation_id=${variationId}&design_area=${designArea}`,
        {
          headers,
          cache: 'no-store',
        }
      );
      
      if (specificResponse.ok) {
        const specificData = await specificResponse.json();
        const designs = Array.isArray(specificData) ? specificData : [specificData];
        const matchingDesign = designs.find((design: any) => 
          design.user_id === userId &&
          design.product_id === productId &&
          design.variation_id === variationId && 
          design.design_area === designArea
        );
        
        if (matchingDesign) {
          return matchingDesign;
        }
      }
      
      // If no specific design found, look for any design with the same product+variation to get shared client_reference_id
      const generalResponse = await fetch(
        `${API_BASE_URL}/products/${productId}/options?user_id=${userId}&variation_id=${variationId}`,
        {
          headers,
          cache: 'no-store',
        }
      );
      
      if (generalResponse.ok) {
        const generalData = await generalResponse.json();
        const allDesigns = Array.isArray(generalData) ? generalData : [generalData];
        const anyMatchingDesign = allDesigns.find((design: any) => 
          design.user_id === userId &&
          design.product_id === productId &&
          design.variation_id === variationId
        );
        
        // Return the first matching design to get the shared client_reference_id
        // but mark it as not found for this specific area
        if (anyMatchingDesign) {
          return {
            ...anyMatchingDesign,
            design_area: designArea, // Override to current area
            id: undefined, // Mark as new for this area
            _hasSharedClientReferenceId: true // Flag to indicate we have shared client_reference_id
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding existing design:', error);
      return null;
    }
  }

  // New method to load designs with the new format
  async loadDesignWithNewFormat(
    productId: string,
    variationId: number,
    designArea: string
  ): Promise<DesignLoadResponse | null> {
    try {
      const userId = await this.getUserId();

      // Only load from database if user is authenticated
      if (!userId) {
        return null;
      }

      const headers = await this.getAuthHeaders();
      // ✅ FIX: Use /users/me/options endpoint to filter by current user only
      const response = await fetch(
        `${API_BASE_URL}/products/users/me/options?product_id=${productId}&variation_id=${variationId}&design_area=${designArea}`,
        {
          headers,
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to load design: ${response.status}`);
      }

      const data = await response.json();

      // The endpoint now filters by user, product, variation, and design_area
      // So we should get the exact design or an empty array
      const designs = Array.isArray(data) ? data : [data];

      if (designs.length > 0) {
        const matchingDesign = designs[0]; // Take the first (most recent) design
        console.log('✅ Design loaded successfully for current user:', matchingDesign);
        return matchingDesign;
      }

      console.log('✅ No existing design found - starting with fresh canvas');
      return null;
    } catch (error) {
      console.error('Error loading design with new format:', error);
      return null;
    }
  }

  async getCustomizationOptions(productId: string): Promise<CustomizationOption[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/products/${productId}/options`, {
        headers,
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customization options: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching customization options:', error);
      throw error;
    }
  }

  async getUserCustomizationOptions(): Promise<CustomizationOption[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/products/users/me/options`, {
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user customization options: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user customization options:', error);
      throw error;
    }
  }

  async deleteCustomizationOption(optionId: number): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/products/users/me/options/${optionId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete design: ${response.status}`);
      }

      console.log('✅ Design deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting design:', error);
      throw error;
    }
  }

  async createCustomizationOption(
    productId: string, 
    option: CreateCustomizationOptionRequest
  ): Promise<CustomizationOption> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/products/users/me/options`, {
        method: 'POST',
        headers,
        body: JSON.stringify(option),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to create customization option: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating customization option:', error);
      throw error;
    }
  }

  async getCustomizationOption(optionId: number): Promise<CustomizationOption> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/products/options/${optionId}`, {
        headers,
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customization option: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching customization option:', error);
      throw error;
    }
  }

  async updateCustomizationOption(
    optionId: number, 
    option: UpdateCustomizationOptionRequest
  ): Promise<CustomizationOption> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/products/users/me/options/${optionId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(option),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to update customization option: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating customization option:', error);
      throw error;
    }
  }

  async deleteCustomizationOption(optionId: number): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/products/options/${optionId}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete customization option: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting customization option:', error);
      throw error;
    }
  }

  // Helper method to find design option by area and variation
  async findDesignOption(
    productId: string, 
    designArea: string, 
    variationId?: string
  ): Promise<CustomizationOption | null> {
    try {
      const options = await this.getCustomizationOptions(productId);
      
      const designOption = options.find(option => 
        option.option_type === 'design' &&
        option.option_data?.design_area === designArea &&
        (option.option_data?.variation_id === variationId || 
         (!option.option_data?.variation_id && !variationId))
      );
      
      return designOption || null;
    } catch (error) {
      console.error('Error finding design option:', error);
      return null;
    }
  }

  // Helper method to save or update design
  async saveDesign(
    productId: string,
    designArea: string,
    canvasData: any,
    productImageUrl: string,
    variationId?: string
  ): Promise<CustomizationOption> {
    try {
      // First, try to find existing design option
      const existingOption = await this.findDesignOption(productId, designArea, variationId);
      
      const optionData = {
        canvas_data: canvasData,
        design_area: designArea,
        variation_id: variationId || 'default',
        canvas_width: 600,
        canvas_height: 600,
        product_image_url: productImageUrl,
        design_elements: canvasData?.objects || [],
        metadata: {
          created_at: existingOption?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          design_name: `Design for ${designArea}`,
          is_completed: false
        }
      };

      if (existingOption) {
        // Update existing option
        return await this.updateCustomizationOption(existingOption.id!, {
          id: existingOption.id!,
          option_type: 'design',
          option_name: `Design - ${designArea} - ${variationId || 'default'}`,
          option_data: optionData,
          is_active: true
        });
      } else {
        // Create new option
        return await this.createCustomizationOption(productId, {
          option_type: 'design',
          option_name: `Design - ${designArea} - ${variationId || 'default'}`,
          option_data: optionData,
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error saving design to database:', error);
      throw error;
    }
  }

  // Helper method to load design
  async loadDesign(
    productId: string,
    designArea: string,
    variationId?: string
  ): Promise<any | null> {
    try {
      const designOption = await this.findDesignOption(productId, designArea, variationId);
      
      if (designOption && designOption.option_data?.canvas_data) {
        return {
          design_id: designOption.id?.toString() || '',
          user_id: undefined, // Will be set by backend
          product_id: parseInt(productId),
          variation_id: variationId ? parseInt(variationId) : undefined,
          design_area: designArea,
          canvas_data: designOption.option_data.canvas_data,
          design_metadata: {
            canvas_width: designOption.option_data.canvas_width || 600,
            canvas_height: designOption.option_data.canvas_height || 600,
            product_image_url: designOption.option_data.product_image_url || '',
            created_at: designOption.created_at || new Date().toISOString(),
            updated_at: designOption.updated_at || new Date().toISOString(),
            design_name: designOption.option_data.metadata?.design_name || `Design for ${designArea}`,
            is_completed: designOption.option_data.metadata?.is_completed || false
          },
          design_elements: designOption.option_data.design_elements || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading design from database:', error);
      return null;
    }
  }

  // Helper method to get customization options by client_reference_id
  async getCustomizationOptionsByClientReferenceId(clientReferenceId: string): Promise<CustomizationOption[]> {
    try {
      const allOptions = await this.getUserCustomizationOptions();
      return allOptions.filter(option => option.client_reference_id === clientReferenceId);
    } catch (error) {
      console.error('Error getting customization options by client reference ID:', error);
      return [];
    }
  }

  // Helper method to save preview image to backend using admin's upload system
  async savePreviewImageToBackend(previewDataURL: string, productId: string, variationId: number | null, designArea: string): Promise<string | null> {
    try {
      // Convert data URL to blob
      const response = await fetch(previewDataURL);
      const blob = await response.blob();

      // Import the admin's upload utility
      const { uploadDesignPreview } = await import('@/utils/upload');

      // ✅ FIX: Use getValidToken() utility instead of direct localStorage access
      const { getValidToken } = await import('@/store/authStore');
      const token = await getValidToken();
      if (!token) {
        console.error('❌ No authentication token found - user may not be logged in');
        return null;
      }

      // Handle null variation ID
      const safeVariationId = variationId || 0;

      // Use admin's upload system with custom filename
      const filename = `preview_${productId}_${safeVariationId}_${designArea}_${Date.now()}.png`;

      const uploadResult = await uploadDesignPreview(blob, parseInt(productId), token, filename);

      if (uploadResult.success) {
        return uploadResult.file_url;
      } else {
        console.error('❌ Upload failed via admin system');
        return null;
      }
    } catch (error) {
      console.error('❌ Error uploading preview image via admin system:', error);
      return null;
    }
  }
}

export const designApi = new DesignApiService();
