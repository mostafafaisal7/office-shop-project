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
  saveDesignToDatabase: (canvasData: any, productImageUrl: string, previewImageUrl?: string, svgData?: string) => Promise<void>;
  loadDesignFromDatabase: (productId: string, variationId: string, area: string) => Promise<DesignData | null>;
  saveDesign: (canvasData: any, productImageUrl: string, previewImageUrl?: string, svgData?: string) => Promise<void>;
  loadDesign: (productId: string, variationId: string, area: string) => Promise<DesignData | null>;
  migrateLocalStorageToDatabase: () => Promise<void>;
  clearLocalStorageDesigns: () => void;
  syncDesigns: () => Promise<void>;
  autoSaveDesign: (canvasData: any, productImageUrl: string) => void;
  clearDesign: () => void;
  clearStoredDesign: (productId: string, variationId: string, area: string) => void;
  getAllStoredDesigns: () => DesignData[];
  getCustomizationOptionId: (productId: string, variationId: number, designArea: string) => Promise<number | null>;
  deleteDesignFromDatabase: (productId: string, variationId: number, designArea: string) => Promise<void>;
  generateAndSaveAllPreviews: (productId: string, variationId: number, availableViews: {area: string, image: string}[]) => Promise<{[area: string]: string}>;
}

const STORAGE_KEY = 'ecommerce_designs';
const AUTO_SAVE_INTERVAL = 5000; // ⚡ OPTIMIZED: 5 seconds (matches debounce delay)

// ⚡ OPTIMIZED: Use async localStorage operations to prevent blocking main thread (for auto-save)
const saveToLocalStorage = (designs: Map<string, DesignData>) => {
  if (typeof window === 'undefined') return; // SSR-safe

  // Use requestIdleCallback to save during idle time
  const saveOperation = () => {
    try {
      const designsArray = Array.from(designs.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designsArray));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(saveOperation, { timeout: 2000 });
  } else {
    // Fallback: defer with setTimeout
    setTimeout(saveOperation, 0);
  }
};

// ⚡ CRITICAL: Synchronous save for critical operations (view switching, manual save)
// This prevents data loss during rapid view switches
const saveToLocalStorageSync = (designs: Map<string, DesignData>) => {
  if (typeof window === 'undefined') return; // SSR-safe

  try {
    const designsArray = Array.from(designs.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designsArray));
  } catch (error) {
    console.error('❌ [STORAGE SYNC] Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (): Map<string, DesignData> => {
  if (typeof window === 'undefined') return new Map(); // SSR-safe
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

  saveDesignToStorage: (canvasData: any, productImageUrl: string, syncSave: boolean = false, areaOverride?: string) => {
  const saveStartTime = performance.now();

  const state = get();
  if (!state.productId || !state.selectedVariation?.variationId) {
    console.warn('⚠️  [STORAGE] Cannot save: missing productId or variationId');
    return;
  }

  const variationIdKey = state.selectedVariation.variationId.toString();
  // ✅ FIX: Use areaOverride if provided to prevent race conditions during view switching
  const designArea = areaOverride || state.currentDesignArea;
  const designKey = generateDesignKey(state.productId, variationIdKey, designArea);

  // --- sanitize blobs before saving ---
  const sanitizeCanvasData = (data: any) => {
    if (!data) return data;

    // clone so we don't mutate original
    const cleaned = { ...data };

    if (Array.isArray(cleaned.objects)) {
      cleaned.objects = cleaned.objects.map((obj: any) => {
        // ✅ FIX: Fabric.js uses "Image" (capital I) for image type
        if (obj?.type?.toLowerCase() === "image" && obj?.src?.startsWith("blob:")) {
          console.warn("⚠️ [STORAGE] Stripping blob src before saving:", obj.src);
          obj.src = obj.savedImageUrl || ""; // fallback empty if nothing else
        }
        return obj;
      });
    }

    if (cleaned.backgroundImage?.src?.startsWith("blob:")) {
      console.warn("⚠️ [STORAGE] Removing blob backgroundImage before saving");
      delete cleaned.backgroundImage;
    }

    return cleaned;
  };

  const sanitizeStartTime = performance.now();
  const cleanedCanvasData = sanitizeCanvasData(canvasData);

  const designData: DesignData = {
    design_id: generateDesignId(),
    product_id: parseInt(state.productId),
    variation_id: parseInt(variationIdKey),
    design_area: designArea, // ✅ FIX: Use explicit area instead of state.currentDesignArea
    canvas_data: {
      version: '5.3.0',
      objects: cleanedCanvasData?.objects || [],
      background: cleanedCanvasData?.background || '',
      backgroundImage: cleanedCanvasData?.backgroundImage || {}
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
    design_elements: cleanedCanvasData?.objects || []
  };

  const updatedDesigns = new Map(state.savedDesigns);
  updatedDesigns.set(designKey, designData);

  set({ savedDesigns: updatedDesigns });

  const persistStartTime = performance.now();

  // ⚡ CRITICAL: Use synchronous save for view switching to prevent data loss
  if (syncSave) {
    saveToLocalStorageSync(updatedDesigns);
  } else {
    saveToLocalStorage(updatedDesigns);
  }

},


  clearLocalStorageDesigns: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      set({ savedDesigns: new Map() });
    } catch (error) {
      console.error('Failed to clear localStorage designs:', error);
    }
  },

  loadDesignFromStorage: (productId: string, variationId: string, area: string) => {
  const loadStartTime = performance.now();

  const state = get();
  const designKey = generateDesignKey(productId, variationId, area);
  const design = state.savedDesigns.get(designKey);

  if (design) {
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
    
  },

  getAllStoredDesigns: () => {
    const state = get();
    return Array.from(state.savedDesigns.values());
  },

  saveDesignToDatabase: async (canvasData: any, productImageUrl: string, previewImageUrl?: string, svgData?: string, areaOverride?: string) => {
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
      } else {
        console.error('No variation ID available in selectedVariation:', state.selectedVariation);
        set({ syncStatus: 'error' });
        throw new Error('Please select a product variation before saving your design');
      }

      // ✅ FIX: Use areaOverride if provided to prevent race conditions
      const designArea = areaOverride || state.currentDesignArea;

      // Generate key for tracking shared client reference ID (without design area)
      const sharedKey = generateSharedClientReferenceKey(state.productId, variationId.toString());

      // Get existing shared client reference ID if available
      let existingClientReferenceId = state.clientReferenceIds.get(sharedKey);

      // If no existing client reference ID, generate a new shared one
      if (!existingClientReferenceId) {
        existingClientReferenceId = generateSharedClientReferenceId(state.productId, variationId.toString());
      }


      // First upload the preview image to get the backend URL
      let backendPreviewUrl = previewImageUrl;
      if (previewImageUrl && variationId) {
        try {
          backendPreviewUrl = await designApi.savePreviewImageToBackend(
            previewImageUrl,
            state.productId,
            variationId,
            designArea
          );
        } catch (uploadError) {
          console.error('❌ Preview upload failed, continuing with data URL:', uploadError);
          // Continue with original preview URL if upload fails
        }
      }

      const result = await designApi.saveDesignWithNewFormat(
        state.productId,
        variationId,
        designArea,
        canvasData,
        productImageUrl,
        existingClientReferenceId,
        backendPreviewUrl || previewImageUrl,
        svgData  // Pass SVG data for print-ready designs
      );
      
      // Store the shared client reference ID for future updates
      if (result.client_reference_id) {
        const updatedClientReferenceIds = new Map(state.clientReferenceIds);
        updatedClientReferenceIds.set(sharedKey, result.client_reference_id);
        set({ clientReferenceIds: updatedClientReferenceIds });
      }
      
      set({ syncStatus: 'success' });
    } catch (error) {
      console.error('Failed to save design to database:', error);
      set({ syncStatus: 'error' });
      
      // If user is not authenticated, fall back to localStorage
      if (error instanceof Error && error.message.includes('User not authenticated')) {
        try {
          state.saveDesignToStorage(canvasData, productImageUrl);
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
        
        // Store the shared client reference ID for future updates
        if (designData.client_reference_id) {
          const state = get();
          const sharedKey = generateSharedClientReferenceKey(productId, numericVariationId.toString());
          const updatedClientReferenceIds = new Map(state.clientReferenceIds);
          updatedClientReferenceIds.set(sharedKey, designData.client_reference_id);
          set({ clientReferenceIds: updatedClientReferenceIds });
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

  saveDesign: async (canvasData: any, productImageUrl: string, previewImageUrl?: string, svgData?: string, syncSave: boolean = false, areaOverride?: string) => {
  const saveStartTime = performance.now();

  // ⚡ CRITICAL: Save to localStorage FIRST
  // Use syncSave=true for critical operations (view switching) to prevent data loss
  // ✅ FIX: Pass areaOverride to prevent race conditions during view switching
  get().saveDesignToStorage(canvasData, productImageUrl, syncSave, areaOverride);

  // ⚡ OPTIMIZED: Defer database sync to not block the UI
  // Use setTimeout to push database sync to next event loop tick
  const { useAuthStore } = await import('@/store/authStore');
  const { isAuthenticated } = useAuthStore.getState();

  if (isAuthenticated) {
    // Push to next tick so it doesn't block current operation
    setTimeout(async () => {
      const dbStartTime = performance.now();
      try {
        // ✅ FIX: Pass areaOverride to database save to prevent race conditions
        await get().saveDesignToDatabase(canvasData, productImageUrl, previewImageUrl, svgData, areaOverride);
      } catch (error) {
        console.error('❌ [SAVE DESIGN] Database sync failed:', error);
      }
    }, 0);
  }

}
,

  // ⚡ NEW: Force synchronous save to BOTH localStorage AND database
  // Use this before adding to cart to ensure design is in database
  saveDesignAndWaitForDatabase: async (
    canvasData: any,
    productImageUrl: string,
    previewImageUrl?: string,
    svgData?: string
  ) => {
    const saveStartTime = performance.now();

    // Save to localStorage first
    get().saveDesignToStorage(canvasData, productImageUrl, true);

    // WAIT for database sync to complete
    const { useAuthStore } = await import('@/store/authStore');
    const { isAuthenticated } = useAuthStore.getState();

    if (isAuthenticated) {
      const dbStartTime = performance.now();
      try {
        await get().saveDesignToDatabase(canvasData, productImageUrl, previewImageUrl, svgData);
      } catch (error) {
        console.error('❌ [SAVE & WAIT] Database sync failed:', error);
        throw error; // Re-throw to let caller know it failed
      }
    }

  },

  loadDesign: async (productId: string, variationId: string, area: string) => {
  const loadStartTime = performance.now();

  // ⚡ OPTIMIZED: ALWAYS use localStorage first for instant load
  // This makes view switching instant instead of waiting for database
  const localDesign = get().loadDesignFromStorage(productId, variationId, area);

  if (localDesign) {
    return localDesign;
  }

  // ⚡ OPTIMIZED: Only try database as fallback (rare case)
  // This only happens when design exists in database but not in localStorage
  const { useAuthStore } = await import('@/store/authStore');
  const { isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated) {
    const dbStartTime = performance.now();
    const dbDesign = await get().loadDesignFromDatabase(productId, variationId, area);
    return dbDesign;
  }

  return null;
}
,

  migrateLocalStorageToDatabase: async () => {
    const state = get();
    const localDesigns = Array.from(state.savedDesigns.values());
    
    if (localDesigns.length === 0) {
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
          
          migratedCount++;
        } catch (error) {
          console.error('Failed to migrate design:', design.design_id, error);
          skippedCount++;
          // Continue with other designs instead of failing completely
        }
      }
      
      set({ syncStatus: 'success' });
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
    } catch (error) {
      console.error('Failed to clear localStorage designs:', error);
    }
  },

  syncDesigns: async () => {
    // Import auth store dynamically to avoid circular dependencies
    const { useAuthStore } = await import('@/store/authStore');
    const { isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated) {
      return;
    }

    try {
      await get().migrateLocalStorageToDatabase();
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
        return null;
      }

      // Use the designApi to fetch the customization option
      const designData = await designApi.loadDesignWithNewFormat(productId, variationId, designArea);
      
      if (designData && designData.id) {
        return designData.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting customization option ID:', error);
      return null;
    }
  },

  deleteDesignFromDatabase: async (productId: string, variationId: number, designArea: string) => {
    try {
      // Import auth store dynamically to avoid circular dependencies
      const { useAuthStore } = await import('@/store/authStore');
      const { isAuthenticated } = useAuthStore.getState();

      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      // First get the design ID
      const designData = await designApi.loadDesignWithNewFormat(productId, variationId, designArea);

      if (!designData || !designData.id) {
        return;
      }

      // Delete from database
      await designApi.deleteCustomizationOption(designData.id);

      // Also clear from localStorage
      const state = get();
      state.clearStoredDesign(productId, variationId.toString(), designArea);

    } catch (error) {
      console.error('❌ Error deleting design:', error);
      throw error;
    }
  },

  generateAndSaveAllPreviews: async (productId: string, variationId: number, availableViews: {area: string, image: string}[]) => {
  const { previewGenerator } = await import('@/utils/previewGenerator');
  const state = get();
  const variationIdKey = variationId.toString();
  const previews: {[area: string]: string} = {};


  // ⚡ OPTIMIZED: Use loadDesignFromStorage instead of loadDesign to avoid async database calls
  const allPreviews = await previewGenerator.generatePreviewsForAllViews(
    productId,
    variationIdKey,
    availableViews,
    (prodId, varId, area) => state.loadDesignFromStorage(prodId, varId, area)
  );

  for (const [area, previewUrl] of Object.entries(allPreviews)) {
    try {
      const designData = await state.loadDesign(productId, variationIdKey, area);
      if (designData) {
        const currentViewImage = availableViews.find(v => v.area === area)?.image || '';
        await state.saveDesign(designData.canvas_data, currentViewImage, previewUrl);
        previews[area] = previewUrl;
      }
    } catch (error) {
      console.error(`Error saving preview for area ${area}:`, error);
      previews[area] = previewUrl;
    }
  }

  return previews;
},

}));
