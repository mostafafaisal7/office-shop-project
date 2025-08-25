'use client';

import { create } from 'zustand';
import { designApi } from '@/services/designApi';

interface DesignData {
  design_id: string;
  user_id?: string | number | null;
  product_id: number;
  variation_id?: number;
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
    created_at: string;
    updated_at: string;
    design_name: string;
    is_completed: boolean;
  };
  design_elements: any[];
}

interface DesignState {
  designJson: Record<string, any> | null;
  productId: string | null;
  selectedObject: any | null;
  selectedVariation: { size?: string; color?: string; variationId?: number } | null;
  currentDesignArea: string;
  savedDesigns: Map<string, DesignData>;
  autoSaveEnabled: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  pendingSyncs: Set<string>;
  // Track client reference IDs for each product+variation combination (shared across all design areas)
  clientReferenceIds: Map<string, string>; // key: "productId_variationId", value: client_reference_id
  setDesignJson: (json: Record<string, any>) => void;
  setProductId: (id: string) => void;
  setSelectedObject: (object: any) => void;
  setSelectedVariation: (variation: { size?: string; color?: string; variationId?: number } | null) => void;
  setCurrentDesignArea: (area: string) => void;
  validateVariationSelection: () => { isValid: boolean; error?: string };
  saveDesignToStorage: (canvasData: any, productImageUrl: string) => void;
  loadDesignFromStorage: (productId: string, variationId: string, area: string) => DesignData | null;
  saveDesignToDatabase: (canvasData: any, productImageUrl: string) => Promise<void>;
  loadDesignFromDatabase: (productId: string, variationId: string, area: string) => Promise<DesignData | null>;
  saveDesign: (canvasData: any, productImageUrl: string) => Promise<void>;
  loadDesign: (productId: string, variationId: string, area: string) => Promise<DesignData | null>;
  migrateLocalStorageToDatabase: () => Promise<void>;
  clearLocalStorageDesigns: () => void;
  syncDesigns: () => Promise<void>;
  autoSaveDesign: (canvasData: any, productImageUrl: string) => void;
  clearDesign: () => void;
  clearStoredDesign: (productId: string, variationId: string, area: string) => void;
  getAllStoredDesigns: () => DesignData[];
  getCustomizationOptionId: (productId: string, variationId: number, designArea: string) => Promise<number | null>;
}

const STORAGE_KEY = 'ecommerce_designs';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

// Helper functions for localStorage
const saveToLocalStorage = (designs: Map<string, DesignData>) => {
  try {
    const designsArray = Array.from(designs.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designsArray));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (): Map<string, DesignData> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const designsArray = JSON.parse(stored);
      return new Map(designsArray);
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return new Map();
};

const generateDesignKey = (productId: string, variationId: string, area: string) => {
  return `${productId}_${variationId}_${area}`;
};

const generateDesignId = () => {
  return `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate a shared client reference ID key for product+variation (without area)
const generateSharedClientReferenceKey = (productId: string, variationId: string) => {
  return `${productId}_${variationId}`;
};

// Generate a deterministic client reference ID based on product+variation
const generateSharedClientReferenceId = (productId: string, variationId: string) => {
  return `design_${productId}_${variationId}_${Date.now()}`;
};

export const useDesignStore = create<DesignState>((set, get) => ({
  designJson: null,
  productId: null,
  selectedObject: null,
  selectedVariation: null,
  currentDesignArea: 'front',
  savedDesigns: loadFromLocalStorage(),
  autoSaveEnabled: true,
  syncStatus: 'idle',
  pendingSyncs: new Set<string>(),
  clientReferenceIds: new Map<string, string>(),

  setDesignJson: (json: Record<string, any>) => set({ designJson: json }),
  
  setProductId: (id: string) => set({ productId: id }),
  
  setSelectedObject: (object: any) => set({ selectedObject: object }),
  
  setSelectedVariation: (variation: { size?: string; color?: string; variationId?: number } | null) => set({ selectedVariation: variation }),
  
  setCurrentDesignArea: (area: string) => set({ currentDesignArea: area }),

  validateVariationSelection: () => {
    const state = get();
    
    if (!state.productId) {
      return { isValid: false, error: 'Product ID is required' };
    }
    
    if (!state.selectedVariation) {
      return { isValid: false, error: 'Please select a product variation before saving your design' };
    }
    
    if (!state.selectedVariation.variationId) {
      return { isValid: false, error: 'Please select a product variation before saving your design' };
    }
    
    return { isValid: true };
  },

  saveDesignToStorage: (canvasData: any, productImageUrl: string) => {
    const state = get();
    if (!state.productId) return;

    const variationId = state.selectedVariation?.size || state.selectedVariation?.color || 'default';
    const designKey = generateDesignKey(state.productId, variationId, state.currentDesignArea);
    
    const designData: DesignData = {
      design_id: generateDesignId(),
      product_id: parseInt(state.productId),
      variation_id: parseInt(variationId) || undefined,
      design_area: state.currentDesignArea,
      canvas_data: {
        version: '5.3.0',
        objects: canvasData?.objects || [],
        background: canvasData?.background || '',
        backgroundImage: canvasData?.backgroundImage || {}
      },
      design_metadata: {
        canvas_width: 600,
        canvas_height: 600,
        product_image_url: productImageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        design_name: `Design for Product ${state.productId}`,
        is_completed: false
      },
      design_elements: canvasData?.objects || []
    };

    const updatedDesigns = new Map(state.savedDesigns);
    updatedDesigns.set(designKey, designData);
    
    set({ savedDesigns: updatedDesigns });
    saveToLocalStorage(updatedDesigns);
    
    console.log('Design saved to localStorage:', designKey);
  },

  loadDesignFromStorage: (productId: string, variationId: string, area: string) => {
    const state = get();
    const designKey = generateDesignKey(productId, variationId, area);
    const design = state.savedDesigns.get(designKey);
    
    if (design) {
      console.log('Design loaded from localStorage:', designKey);
      return design;
    }
    
    return null;
  },

  autoSaveDesign: (canvasData: any, productImageUrl: string) => {
    const state = get();
    if (state.autoSaveEnabled && canvasData?.objects?.length > 0) {
      // Use the smart saveDesign method for auto-save as well
      state.saveDesign(canvasData, productImageUrl).catch(error => {
        console.error('Auto-save failed:', error);
        // Fallback to localStorage if database save fails
        state.saveDesignToStorage(canvasData, productImageUrl);
      });
    }
  },

  clearDesign: () => set({ 
    designJson: null, 
    productId: null, 
    selectedObject: null, 
    selectedVariation: null,
    currentDesignArea: 'front'
  }),

  clearStoredDesign: (productId: string, variationId: string, area: string) => {
    const state = get();
    const designKey = generateDesignKey(productId, variationId, area);
    const updatedDesigns = new Map(state.savedDesigns);
    updatedDesigns.delete(designKey);
    
    set({ savedDesigns: updatedDesigns });
    saveToLocalStorage(updatedDesigns);
    
    console.log('Design cleared from localStorage:', designKey);
  },

  getAllStoredDesigns: () => {
    const state = get();
    return Array.from(state.savedDesigns.values());
  },

  saveDesignToDatabase: async (canvasData: any, productImageUrl: string) => {
    const state = get();
    if (!state.productId) {
      throw new Error('Product ID is required to save design');
    }

    try {
      set({ syncStatus: 'syncing' });
      
      // Validate variation ID before proceeding
      let variationId: number;
      if (state.selectedVariation?.variationId) {
        variationId = state.selectedVariation.variationId;
        console.log('Using variation ID from selectedVariation:', variationId);
      } else {
        console.error('No variation ID available in selectedVariation:', state.selectedVariation);
        set({ syncStatus: 'error' });
        throw new Error('Please select a product variation before saving your design');
      }
      
      // Generate key for tracking shared client reference ID (without design area)
      const sharedKey = generateSharedClientReferenceKey(state.productId, variationId.toString());
      
      // Get existing shared client reference ID if available
      let existingClientReferenceId = state.clientReferenceIds.get(sharedKey);
      
      // If no existing client reference ID, generate a new shared one
      if (!existingClientReferenceId) {
        existingClientReferenceId = generateSharedClientReferenceId(state.productId, variationId.toString());
        console.log('Generated new shared client reference ID:', existingClientReferenceId);
      }
      
      console.log('Saving design with variation ID:', variationId, 'for area:', state.currentDesignArea);
      console.log('Using shared client reference ID:', existingClientReferenceId);
      
      const result = await designApi.saveDesignWithNewFormat(
        state.productId,
        variationId,
        state.currentDesignArea,
        canvasData,
        productImageUrl,
        existingClientReferenceId
      );
      
      // Store the shared client reference ID for future updates
      if (result.client_reference_id) {
        const updatedClientReferenceIds = new Map(state.clientReferenceIds);
        updatedClientReferenceIds.set(sharedKey, result.client_reference_id);
        set({ clientReferenceIds: updatedClientReferenceIds });
        console.log('Stored shared client reference ID for future updates:', result.client_reference_id);
      }
      
      set({ syncStatus: 'success' });
      console.log('Design saved to database with new format:', state.productId, state.currentDesignArea);
    } catch (error) {
      console.error('Failed to save design to database:', error);
      set({ syncStatus: 'error' });
      
      // If user is not authenticated, fall back to localStorage
      if (error instanceof Error && error.message.includes('User not authenticated')) {
        console.log('User not authenticated, falling back to localStorage');
        try {
          state.saveDesignToStorage(canvasData, productImageUrl);
          console.log('Design saved to localStorage as fallback');
          set({ syncStatus: 'idle' });
        } catch (localError) {
          console.error('Fallback to localStorage also failed:', localError);
        }
      }
      
      throw error;
    }
  },

  loadDesignFromDatabase: async (productId: string, variationId: string, area: string) => {
    try {
      // Convert variation ID to number
      const numericVariationId = parseInt(variationId) || 1;
      
      const designData = await designApi.loadDesignWithNewFormat(productId, numericVariationId, area);
      
      if (designData) {
        console.log('Design loaded from database with new format:', productId, area);
        
        // Store the shared client reference ID for future updates
        if (designData.client_reference_id) {
          const state = get();
          const sharedKey = generateSharedClientReferenceKey(productId, numericVariationId.toString());
          const updatedClientReferenceIds = new Map(state.clientReferenceIds);
          updatedClientReferenceIds.set(sharedKey, designData.client_reference_id);
          set({ clientReferenceIds: updatedClientReferenceIds });
          console.log('Stored shared client reference ID from loaded design:', designData.client_reference_id);
        }
        
        // Convert the response to match the expected format
        return {
          design_id: designData.id?.toString() || '',
          user_id: designData.user_id,
          product_id: designData.product_id,
          variation_id: designData.variation_id,
          design_area: designData.design_area,
          canvas_data: designData.canvas_data,
          design_metadata: {
            ...designData.design_metadata,
            created_at: designData.created_at || new Date().toISOString(),
            updated_at: designData.updated_at || new Date().toISOString()
          },
          design_elements: designData.design_elements
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load design from database:', error);
      return null;
    }
  },

  saveDesign: async (canvasData: any, productImageUrl: string) => {
    // Import auth store dynamically to avoid circular dependencies
    const { useAuthStore } = await import('@/store/authStore');
    const { isAuthenticated } = useAuthStore.getState();
    
    if (isAuthenticated) {
      // Save to database for authenticated users
      await get().saveDesignToDatabase(canvasData, productImageUrl);
    } else {
      // Save to localStorage for guest users
      get().saveDesignToStorage(canvasData, productImageUrl);
    }
  },

  loadDesign: async (productId: string, variationId: string, area: string) => {
    // Import auth store dynamically to avoid circular dependencies
    const { useAuthStore } = await import('@/store/authStore');
    const { isAuthenticated } = useAuthStore.getState();
    
    if (isAuthenticated) {
      // Load from database for authenticated users
      return await get().loadDesignFromDatabase(productId, variationId, area);
    } else {
      // Load from localStorage for guest users
      return get().loadDesignFromStorage(productId, variationId, area);
    }
  },

  migrateLocalStorageToDatabase: async () => {
    const state = get();
    const localDesigns = Array.from(state.savedDesigns.values());
    
    if (localDesigns.length === 0) {
      console.log('No localStorage designs to migrate');
      return;
    }

    try {
      set({ syncStatus: 'syncing' });
      
      let migratedCount = 0;
      let skippedCount = 0;
      
      for (const design of localDesigns) {
        try {
          // Validate design data before migration
          if (!design.product_id) {
            console.warn('Skipping design with missing product_id:', design.design_id);
            skippedCount++;
            continue;
          }
          
          // Use variation_id if available, otherwise default to 1
          const variationId = design.variation_id ? parseInt(design.variation_id.toString()) : 1;
          
          // Validate required fields
          if (!design.design_area || !design.canvas_data || !design.design_metadata?.product_image_url) {
            console.warn('Skipping design with missing required fields:', design.design_id, {
              hasDesignArea: !!design.design_area,
              hasCanvasData: !!design.canvas_data,
              hasProductImageUrl: !!design.design_metadata?.product_image_url
            });
            skippedCount++;
            continue;
          }
          
          await designApi.saveDesignWithNewFormat(
            design.product_id.toString(),
            variationId,
            design.design_area,
            design.canvas_data,
            design.design_metadata.product_image_url
          );
          
          console.log('Migrated design to database:', design.design_id);
          migratedCount++;
        } catch (error) {
          console.error('Failed to migrate design:', design.design_id, error);
          skippedCount++;
          // Continue with other designs instead of failing completely
        }
      }
      
      set({ syncStatus: 'success' });
      console.log(`Migration completed: ${migratedCount} designs migrated, ${skippedCount} designs skipped`);
    } catch (error) {
      console.error('Migration failed:', error);
      set({ syncStatus: 'error' });
      throw error;
    }
  },

  clearLocalStorageDesigns: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      set({ savedDesigns: new Map() });
      console.log('localStorage designs cleared');
    } catch (error) {
      console.error('Failed to clear localStorage designs:', error);
    }
  },

  syncDesigns: async () => {
    // Import auth store dynamically to avoid circular dependencies
    const { useAuthStore } = await import('@/store/authStore');
    const { isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping sync');
      return;
    }

    try {
      await get().migrateLocalStorageToDatabase();
      console.log('Design sync completed');
    } catch (error) {
      console.error('Design sync failed:', error);
      throw error;
    }
  },

  getCustomizationOptionId: async (productId: string, variationId: number, designArea: string) => {
    try {
      // Import auth store dynamically to avoid circular dependencies
      const { useAuthStore } = await import('@/store/authStore');
      const { isAuthenticated, user } = useAuthStore.getState();
      
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, cannot get customization option ID');
        return null;
      }

      // Use the designApi to fetch the customization option
      const designData = await designApi.loadDesignWithNewFormat(productId, variationId, designArea);
      
      if (designData && designData.id) {
        console.log('Found customization option ID:', designData.id);
        return designData.id;
      }
      
      console.log('No customization option found for:', { productId, variationId, designArea });
      return null;
    } catch (error) {
      console.error('Error getting customization option ID:', error);
      return null;
    }
  }
}));
