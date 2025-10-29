import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi, CartApiItem, CartApiItemWithCustomizations } from '@/services/cartApi';
import { useAuthStore } from './authStore';
import { useAuth } from '@/hooks/useAuth';
import { previewGenerator } from '@/utils/previewGenerator';
import { uploadPreviewToBackend } from '@/utils/uploadPreviewToBackend';


export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image?: string | string[]; // Can be single image (string) or multiple images (array) for multi-view designs
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  customDesign?: boolean;
  customizationId?: number; // Reference to saved customization
  serverId?: number; // Server-side cart item ID
  isGuest?: boolean; // Track if item is from guest session
  tempCustomizationData?: any; // Temporary storage for guest users

  // Design data (snapshot from design time - just like customized_images)
  design_canvas_data?: any; // Complete Fabric.js canvas data from all design areas
  design_svg_data?: string; // SVG data for print-ready designs
  design_elements?: any[]; // Simplified design elements list
}

interface CartStore {
  items: CartItem[];
  isOnline: boolean;
  lastSyncTime: number;
  isSyncing: boolean;
  isGeneratingPreviews: boolean;
  previewGenerationProgress: { [itemId: string]: boolean };
  
  // Core actions
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Hybrid-specific actions
  initializeCart: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  fetchCustomizationDetails: (customizationId: number) => Promise<any>;
  generatePreviewForItem: (itemId: string, customizationId: number) => Promise<void>;
  
  // Legacy methods for backward compatibility
  getTotalQuantity: () => number;
  getTotalPrice: () => number;
  getUniqueProductCount: () => number;
  addItemsFromQuantityPage: (productId: string, productName: string, sizeQuantities: any[], customizationId?: number) => Promise<void>;
  addItemFromProductPage: (productId: string, productName: string, quantity: number, price: number, size?: string, color?: string, image?: string, customizationId?: number, designData?: { canvas_data?: any, svg_data?: string, design_elements?: any[] }) => Promise<void>;
}

// Helper function to generate or get guest ID
export const getOrCreateGuestId = (): string => {
  if (typeof window === 'undefined') return 'guest-' + Date.now();

  let guestId = localStorage.getItem('guest_id');
  if (!guestId) {
    guestId = 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guest_id', guestId);
  }
  return guestId;
};

// ✅ Helper function to reliably check authentication (handles hydration timing issues)
const checkAuthentication = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check both auth store and token to handle Zustand hydration timing issues
  const authStoreAuthenticated = useAuth.getState().isAuthenticated;
  const hasToken = !!localStorage.getItem('customer_access_token');

  return authStoreAuthenticated || hasToken;
};


export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOnline: true,
      lastSyncTime: 0,
      isSyncing: false,
      isGeneratingPreviews: false,
      previewGenerationProgress: {},
      
      // Initialize cart - load from server if authenticated, ensure guest ID exists for guests
      initializeCart: async () => {
        const { isAuthenticated } = useAuth.getState();
        
        if (isAuthenticated) {
          try {
            await get().syncWithServer();
          } catch (error) {
            console.warn('Cart initialization failed for authenticated user, will continue with localStorage:', error);
            // Don't throw error, just continue with localStorage
          }
        } else {
          // For guest users, ensure guest ID exists and load any persisted cart
          const guestId = getOrCreateGuestId();
          console.log('Guest cart initialized with ID:', guestId);
          
          // Mark existing items as guest items if they aren't already marked
          const currentItems = get().items;
          if (currentItems.length > 0) {
            const updatedItems = currentItems.map(item => ({
              ...item,
              isGuest: item.isGuest !== false // Keep existing isGuest value, default to true for unmarked items
            }));
            set({ items: updatedItems });
          }
        }
      },
      
      // Helper function to generate cart item ID
      generateItemId: (productId: string, size?: string, color?: string) => {
        return `${productId}-${size || 'default'}-${color || 'default'}`;
      },
      
      // Add item with hybrid approach
      addItem: async (item) => {
        console.log('🔧 addItem called with:', item);

        // ✅ FIX: Use reliable authentication check (handles hydration timing issues)
        const isAuthenticated = checkAuthentication();

        console.log('🔧 isAuthenticated:', isAuthenticated);

        // ✅ FIX: Include customizationId in ID for custom designs to prevent overwriting
        // Custom designs with different customization IDs should be separate cart items
        const id = item.customizationId
          ? `${item.productId}-${item.size || 'default'}-${item.color || 'default'}-custom-${item.customizationId}`
          : `${item.productId}-${item.size || 'default'}-${item.color || 'default'}`;
        const existingItem = get().items.find(i => i.id === id);

        console.log('🔧 Generated ID:', id);
        console.log('🔧 Existing item:', existingItem);
        
        // Create item for storage
        const itemForStorage: CartItem = {
          ...item,
          id,
          isGuest: !isAuthenticated,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
        };
        
        console.log('🔧 Item for storage:', itemForStorage);
        
        if (isAuthenticated) {
          try {
            const apiItem: Omit<CartApiItem, 'id' | 'user_id'> = {
              product_id: parseInt(item.productId),
              product_name: item.name,
              product_price: item.price, // here price is sent to server
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              customization_id: item.customizationId,
              customized_images: item.image ? (Array.isArray(item.image) ? item.image : [item.image]) : null, // ✅ Handle both string and array formats
              // ✅ Include design data (snapshot from design time)
              design_canvas_data: item.design_canvas_data,
              design_svg_data: item.design_svg_data,
              design_elements: item.design_elements,
            };

            console.log('🔧 Sending to backend:');
            console.log('  - customized_images:', apiItem.customized_images);
            console.log('  - design_canvas_data:', apiItem.design_canvas_data ? 'Present' : 'None');
            if (apiItem.design_canvas_data) {
              console.log('    objects count:', apiItem.design_canvas_data.objects?.length || 0);
            }

            const response = await cartApi.addItem(apiItem);
            if (response.success && response.data) {
              itemForStorage.serverId = response.data.id;
              
              // Parse server price with same robust logic
              if (response.data.product_price !== null && response.data.product_price !== undefined) {
                let serverPrice = 0;
                if (typeof response.data.product_price === 'number') {
                  serverPrice = response.data.product_price;
                } else if (typeof response.data.product_price === 'string') {
                  const cleanPrice = response.data.product_price.toString().trim().replace(/[$৳,\s]/g, '');
                  const numericValue = Number(cleanPrice);
                  serverPrice = !isNaN(numericValue) && isFinite(numericValue) ? numericValue : 0;
                } else {
                  const numericValue = Number(response.data.product_price);
                  serverPrice = !isNaN(numericValue) && isFinite(numericValue) ? numericValue : 0;
                }
                itemForStorage.price = Math.max(0, serverPrice); // Ensure positive price
              }
            }
          } catch (error) {
            console.error('Failed to save to server, storing locally:', error);
          }
        

        } else {
          // For guest users, ensure guest ID exists
          getOrCreateGuestId();
        }
        
        if (existingItem) {
          // Update existing item quantity
          const newQuantity = existingItem.quantity + item.quantity;
          if (isAuthenticated && existingItem.serverId) {
            try {
              await cartApi.updateQuantity(existingItem.serverId, newQuantity);
            } catch (error) {
              console.error('Failed to update server quantity:', error);
            }
          }
          
          set((state) => ({
            items: state.items.map(i => 
              i.id === id 
                ? { ...i, quantity: newQuantity }
                : i
            )
          }));
        } else {
          // Add new item
          set((state) => ({
            items: [...state.items, itemForStorage]
          }));
        }
      },
      
      // Remove item with hybrid approach
      removeItem: async (id) => {
        const { isAuthenticated } = useAuth.getState();
        const item = get().items.find(i => i.id === id);
        
        if (isAuthenticated && item?.serverId) {
          try {
            await cartApi.removeItem(item.serverId);
          } catch (error) {
            console.error('Failed to remove from server:', error);
          }
        }
        
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },
      
      // Update quantity with hybrid approach
      updateQuantity: async (id, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(id);
          return;
        }
        
        const { isAuthenticated } = useAuth.getState();
        const item = get().items.find(i => i.id === id);
        
        if (isAuthenticated && item?.serverId) {
          try {
            await cartApi.updateQuantity(item.serverId, quantity);
          } catch (error) {
            console.error('Failed to update server quantity:', error);
          }
        }
        
        set((state) => ({
          items: state.items.map(item => 
            item.id === id ? { ...item, quantity } : item
          )
        }));
      },
      
      // Clear cart with hybrid approach
      clearCart: async () => {
        const { isAuthenticated } = useAuth.getState();
        
        if (isAuthenticated) {
          try {
            await cartApi.clearCart();
          } catch (error) {
            console.error('Failed to clear server cart:', error);
          }
        }
        
        set({ items: [] });
      },
      
      // Sync with server
      syncWithServer: async () => {
        const { isAuthenticated } = useAuth.getState();
        console.log('🔄 syncWithServer called, isAuthenticated:', isAuthenticated);
        if (!isAuthenticated) {
          console.log('🔄 Not authenticated, skipping server sync');
          return;
        }
        
        set({ isSyncing: true, isGeneratingPreviews: true });
        
        try {
          // Use getCartWithCustomizations to get preview images directly
          const response = await cartApi.getCartWithCustomizations();
          if (response.success) {
            // Handle different response structures - server might return array directly or wrapped in data
            let serverData: CartApiItemWithCustomizations[] = [];
            
            if (Array.isArray(response.data)) {
              serverData = response.data;
            } else if (response.data && Array.isArray(response.data.items)) {
              serverData = response.data.items;
            } else if (response.data && typeof response.data === 'object') {
              // If it's an object but not an array, try to extract items
              const dataKeys = Object.keys(response.data);
              const itemsKey = dataKeys.find(key => Array.isArray(response.data[key]));
              if (itemsKey) {
                serverData = response.data[itemsKey];
              }
            }
            
            // Convert server data to cart items
            // Convert server data to cart items with robust price parsing
            const serverItems: CartItem[] = serverData.map((apiItem: CartApiItemWithCustomizations) => {
              // Log raw price for debugging
              console.log('Server item raw price:', apiItem.product_price, 'type:', typeof apiItem.product_price);

              let parsedPrice = 0;

              try {
                if (apiItem.product_price !== null && apiItem.product_price !== undefined) {
                  // Handle different price formats more robustly
                  if (typeof apiItem.product_price === 'number') {
                    parsedPrice = apiItem.product_price;
                  } else if (typeof apiItem.product_price === 'string') {
                    // More robust string parsing - handle Decimal strings, currency, etc.
                    let cleanPrice = apiItem.product_price.toString().trim();
                    
                    // Remove currency symbols and common formatting
                    cleanPrice = cleanPrice.replace(/[$৳,\s]/g, '');
                    
                    // Handle scientific notation or decimal strings
                    const numericValue = Number(cleanPrice);
                    if (!isNaN(numericValue) && isFinite(numericValue)) {
                      parsedPrice = numericValue;
                    } else {
                      // Fallback: extract first valid number from string
                      const match = cleanPrice.match(/\d+\.?\d*/);
                      parsedPrice = match ? parseFloat(match[0]) : 0;
                    }
                  } else {
                    // Handle other types by converting to number
                    const numericValue = Number(apiItem.product_price);
                    parsedPrice = !isNaN(numericValue) && isFinite(numericValue) ? numericValue : 0;
                  }

                  // Ensure price is positive
                  if (parsedPrice < 0) parsedPrice = 0;
                }
              } catch (error) {
                console.warn('Failed to parse price for cart item:', apiItem.product_price, error);
                parsedPrice = 0;
              }

              console.log('Final parsed price:', parsedPrice);

              // Extract preview image(s) from multiple sources (priority order)
              let previewImages: string | string[] | undefined;
              let hasCustomDesign = false;
              
              // 1. Check customized_images array (uploaded preview images)
              if (apiItem.customized_images && apiItem.customized_images.length > 0) {
                previewImages = apiItem.customized_images.length === 1 ? apiItem.customized_images[0] : apiItem.customized_images; // Single image as string, multiple as array
                hasCustomDesign = true;
                console.log('✅ Using preview images from customized_images:', previewImages);
              } 
              // 2. Fallback to customization details metadata
              else if (apiItem.customization_details?.design_metadata?.preview_image_url) {
                previewImages = apiItem.customization_details.design_metadata.preview_image_url;
                hasCustomDesign = true;
                console.log('✅ Using preview image from customization details:', previewImages);
              } 
              // 3. Mark as custom design if has customization ID but no preview
              else if (apiItem.customization_id) {
                hasCustomDesign = true;
                console.log('⚠️ Has customization ID but no preview image URL');
              }

              return {
                id: `${apiItem.product_id}-${apiItem.size || 'default'}-${apiItem.color || 'default'}`,
                productId: apiItem.product_id.toString(),
                name: apiItem.product_name,
                image: previewImages, // Use the preview image(s) from backend - can be string or array
                quantity: Number(apiItem.quantity) || 0,
                price: parsedPrice, // ✅ robust parsed price
                size: apiItem.size,
                color: apiItem.color,
                customDesign: hasCustomDesign, // Mark as custom design if has customization
                customizationId: apiItem.customization_id,
                serverId: apiItem.id,
                isGuest: false,
                // ✅ Include design data from server (snapshot from cart)
                design_canvas_data: (apiItem as any).design_canvas_data,
                design_svg_data: (apiItem as any).design_svg_data,
                design_elements: (apiItem as any).design_elements,
              };
            });


            
            // Update state with items (without preview images yet)
            set({ 
              items: serverItems, 
              lastSyncTime: Date.now(),
              isSyncing: false 
            });
            
            // Generate preview images asynchronously for items with customizations
            const itemsWithCustomizations = serverItems.filter(item => item.customizationId);
            
            if (itemsWithCustomizations.length > 0) {
              console.log(`Starting preview generation for ${itemsWithCustomizations.length} customized items`);
              
              // Generate previews in parallel but limit concurrency to avoid overwhelming the system
              const generatePreviewsInBatches = async (items: CartItem[], batchSize: number = 3) => {
                for (let i = 0; i < items.length; i += batchSize) {
                  const batch = items.slice(i, i + batchSize);
                  await Promise.all(
                    batch.map(async (item) => {
                      if (item.customizationId) {
                        try {
                          await get().generatePreviewForItem(item.id, item.customizationId);
                        } catch (error) {
                          console.error(`Failed to generate preview for item ${item.id}:`, error);
                        }
                      }
                    })
                  );
                }
              };
              
              // Generate previews in batches
              await generatePreviewsInBatches(itemsWithCustomizations);
              
              console.log('Completed preview generation for all customized items');
            }
            
            set({ isGeneratingPreviews: false });
          } else {
            // If sync fails, just continue with current items
            console.warn('Cart sync failed, continuing with local cart:', response.message);
            set({ isSyncing: false, isGeneratingPreviews: false });
          }
        } catch (error) {
          console.warn('Failed to sync with server, continuing with local cart:', error);
          set({ isSyncing: false, isGeneratingPreviews: false });
          // Don't throw error - just continue with local cart
        }
      },
      
      // Load from server
      loadFromServer: async () => {
        await get().syncWithServer();
      },
      
      // Merge guest cart with user cart on login
      mergeGuestCart: async () => {
        const guestItems = get().items.filter(item => item.isGuest);
        if (guestItems.length === 0) return;

        console.log('🔄 Merging guest cart items:', guestItems.length);

        for (const guestItem of guestItems) {
          try {
            const apiItem: Omit<CartApiItem, 'id' | 'user_id'> = {
              product_id: parseInt(guestItem.productId),
              product_name: guestItem.name,
              product_price: guestItem.price,
              quantity: guestItem.quantity,
              size: guestItem.size,
              color: guestItem.color,
              customization_id: guestItem.customizationId,
              customized_images: guestItem.image ? (Array.isArray(guestItem.image) ? guestItem.image : [guestItem.image]) : null, // ✅ Handle both string and array formats for guest merge
              // ✅ FIX: Include design data when merging guest cart to server
              design_canvas_data: guestItem.design_canvas_data,
              design_svg_data: guestItem.design_svg_data,
              design_elements: guestItem.design_elements,
            };

            console.log('🔄 Merging guest item to server:');
            console.log('  - Product:', guestItem.name);
            console.log('  - Customization ID:', guestItem.customizationId);
            console.log('  - design_canvas_data:', guestItem.design_canvas_data ? 'Present' : 'None');
            if (guestItem.design_canvas_data) {
              console.log('    objects count:', guestItem.design_canvas_data.objects?.length || 0);
            }

            await cartApi.addItem(apiItem);
            console.log('  ✅ Guest item merged successfully');
          } catch (error) {
            console.error('Failed to merge guest item:', error);
          }
        }
        
        // Remove guest items and sync with server
        set((state) => ({
          items: state.items.filter(item => !item.isGuest)
        }));
        
        await get().syncWithServer();
      },

      // Fetch customization details from the API
      fetchCustomizationDetails: async (customizationId: number) => {
        try {
          // Import designApi dynamically to avoid circular dependencies
          const { designApi } = await import('@/services/designApi');
          const customizationOption = await designApi.getCustomizationOption(customizationId);
          return customizationOption;
        } catch (error) {
          console.error('Failed to fetch customization details:', error);
          throw error;
        }
      },

      // Generate preview for a specific cart item
      generatePreviewForItem: async (itemId: string, customizationId: number) => {
        try {
          // Mark this item as generating preview
          set((state) => ({
            previewGenerationProgress: {
              ...state.previewGenerationProgress,
              [itemId]: true
            }
          }));

          // Fetch customization details
          const customizationOption = await get().fetchCustomizationDetails(customizationId);
          
          if (customizationOption && customizationOption.canvas_data) {
            console.log('Generating preview for cart item:', itemId, 'with customization:', customizationId);
            
            // Generate preview image
            const previewImage = await previewGenerator.generatePreview(
              customizationOption.canvas_data,
              customizationOption.design_metadata.product_image_url,
              { quality: 1, multiplier: 1.5 }
            );
            
            // Update the item with the generated preview
            // Upload preview to backend first
          const previewUrl = await uploadPreviewToBackend(previewImage, 'previews'); // Upload to backend previews folder

            set((state) => ({
              items: state.items.map(item => 
                item.id === itemId 
                  ? { ...item, image: previewUrl }
                  : item
              ),
              previewGenerationProgress: {
                ...state.previewGenerationProgress,
                [itemId]: false
              }
            }));

            console.log('Generated and uploaded preview for cart item:', itemId);

          } else {
            // Mark as complete even if no preview was generated
            set((state) => ({
              previewGenerationProgress: {
                ...state.previewGenerationProgress,
                [itemId]: false
              }
            }));
          }
        } catch (error) {
          console.error('Failed to generate preview for cart item:', itemId, error);
          
          // Mark as complete with error
          set((state) => ({
            previewGenerationProgress: {
              ...state.previewGenerationProgress,
              [itemId]: false
            }
          }));
        }
      },
      
      // Utility methods
      getTotalQuantity: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getUniqueProductCount: () => {
        const uniqueProductIds = new Set(get().items.map(item => item.productId));
        return uniqueProductIds.size;
      },
      
      // Legacy methods for backward compatibility
      addItemsFromQuantityPage: async (productId, productName, sizeQuantities, customizationId) => {
        // Only process items with quantity > 0
        const validItems = sizeQuantities.filter((sq: any) => sq.quantity > 0);
        
        for (const sq of validItems) {
          const item: Omit<CartItem, 'id'> = {
            productId,
            name: productName,
            image: sq.image, // Include the preview image URL
            size: sq.size,
            quantity: Number(sq.quantity) || 0,
            price: Number(sq.price) || 0, // temporary, will be updated after sync
            customDesign: !!customizationId,
            customizationId: customizationId,
          };
          
          try {
            await get().addItem(item);

            // Immediately sync with server to get the correct price
            await get().syncWithServer();

          } catch (error) {
            console.error('Error adding item to cart:', error);
            throw new Error('Unable to add item to cart.');
          }
        }
      },

      
      addItemFromProductPage: async (productId, productName, quantity, price, size, color, image, customizationId, designData) => {
        // Debug logging
        console.log('🛒 CartStore addItemFromProductPage Debug:');
        console.log('- Product ID:', productId);
        console.log('- Product Name:', productName);
        console.log('- Quantity:', quantity, 'type:', typeof quantity);
        console.log('- Price:', price, 'type:', typeof price);
        console.log('- Size:', size);
        console.log('- Color:', color);
        console.log('- Image passed:', image);
        console.log('- Customization ID:', customizationId);
        console.log('- Design Data:', designData ? 'Provided' : 'None');
        
        // ✅ Ensure image fallback for non-customized items
        let finalImage = image;
        
        // If no image provided and no customization, try to get product/variation image
        if (!finalImage && !customizationId) {
          try {
            const { fetchProductById } = await import('@/services/api');
            const productData = await fetchProductById(productId);
            
            // Try to get variation image first if size specified
            if (size && productData.variations && productData.variations.length > 0) {
              const matchingVariation = productData.variations.find((variation: any) => {
                const attrs = variation.attributes || {};
                return attrs.size === size || attrs.Size === size;
              });
              
              if (matchingVariation && matchingVariation.media && matchingVariation.media.length > 0) {
                finalImage = matchingVariation.media[0].file_path;
                console.log('✅ Using variation image:', finalImage);
              }
            }
            
            // Fallback to product default image
            if (!finalImage && productData.media && productData.media.length > 0) {
              const primaryMedia = productData.media.find((m: any) => m.is_primary) || productData.media[0];
              finalImage = primaryMedia.file_path;
              console.log('✅ Using product default image:', finalImage);
            }
          } catch (error) {
            console.warn('Failed to fetch product image for fallback:', error);
          }
        }
        
        const item: Omit<CartItem, 'id'> = {
          productId,
          name: productName,
          image: finalImage, // Use fallback image if needed
          size,
          color,
          quantity: Number(quantity) || 0,
          price: Number(price) || 0,
          customDesign: !!customizationId,
          customizationId: customizationId,
          // Add design data (snapshot from design time)
          design_canvas_data: designData?.canvas_data,
          design_svg_data: designData?.svg_data,
          design_elements: designData?.design_elements,
        };

        console.log('- Final item object with image and design data:', item);
        if (designData) {
          console.log('- Design canvas objects:', designData.canvas_data?.objects?.length || 0);
        }

        try {
          await get().addItem(item);
          await get().syncWithServer();
        } catch (error) {
          console.error('Error adding item to cart:', error);
          throw new Error('Unable to add item to cart.');
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items.map(item => ({
          ...item,
          designImages: undefined
        })),
        lastSyncTime: state.lastSyncTime
      }),
      storage: {
        getItem: (name: string) => {
          if (typeof window === 'undefined') return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const parsed = JSON.parse(str);
            if (parsed.state && parsed.state.items) {
              getOrCreateGuestId();
            }
            return parsed;
          } catch {
            return null;
          }
        },
        setItem: (name: string, value: any) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name: string) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
        }
      }
    }
  )
);
