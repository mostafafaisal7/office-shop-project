import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi, CartApiItem, CartApiItemWithCustomizations } from '@/services/cartApi';
import { useAuthStore } from './authStore';
import { useAuth } from '@/hooks/useAuth';
import { previewGenerator } from '@/utils/previewGenerator';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image?: string; // Optional - fetched dynamically
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  customDesign?: boolean;
  customizationId?: number; // Reference to saved customization
  serverId?: number; // Server-side cart item ID
  isGuest?: boolean; // Track if item is from guest session
  tempCustomizationData?: any; // Temporary storage for guest users
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
  addItemFromProductPage: (productId: string, productName: string, quantity: number, price: number, size?: string, color?: string, image?: string, customizationId?: number) => Promise<void>;
}

// Helper function to generate or get guest ID
const getOrCreateGuestId = (): string => {
  if (typeof window === 'undefined') return 'guest-' + Date.now();
  
  let guestId = localStorage.getItem('guest_id');
  if (!guestId) {
    guestId = 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guest_id', guestId);
  }
  return guestId;
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
        const { isAuthenticated } = useAuth.getState();
        const id = `${item.productId}-${item.size || 'default'}-${item.color || 'default'}`;
        const existingItem = get().items.find(i => i.id === id);
        
        
        // Create item for storage
        const itemForStorage: CartItem = {
          ...item,
          id,
          isGuest: !isAuthenticated,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
        };
        
        if (isAuthenticated) {
          // Authenticated user - save to server
          try {
            const apiItem: Omit<CartApiItem, 'id' | 'user_id'> = {
              product_id: parseInt(item.productId),
              product_name: item.name,
              product_price: item.price,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              customization_id: item.customizationId,
            };
            
            const response = await cartApi.addItem(apiItem);
            if (response.success && response.data) {
              itemForStorage.serverId = response.data.id;
            } else {
              console.warn('Failed to save to server, storing locally:', response.message);
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
        if (!isAuthenticated) return;
        
        set({ isSyncing: true, isGeneratingPreviews: true });
        
        try {
          const response = await cartApi.getCart();
          if (response.success) {
            // Handle different response structures - server might return array directly or wrapped in data
            let serverData: CartApiItem[] = [];
            
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
            const serverItems: CartItem[] = serverData.map((apiItem: CartApiItem) => ({
                id: `${apiItem.product_id}-${apiItem.size || 'default'}-${apiItem.color || 'default'}`,
                productId: apiItem.product_id.toString(),
                name: apiItem.product_name,
                image: undefined,
                quantity: Number(apiItem.quantity) || 0,
                price: parseFloat(apiItem.product_price as any) || 0,
                size: apiItem.size,
                color: apiItem.color,
                customizationId: apiItem.customization_id,
                customDesign: !!apiItem.customization_id,
                serverId: apiItem.id,
                isGuest: false,
            }));
            
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
            };
            
            await cartApi.addItem(apiItem);
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
            set((state) => ({
              items: state.items.map(item => 
                item.id === itemId 
                  ? { ...item, image: previewImage }
                  : item
              ),
              previewGenerationProgress: {
                ...state.previewGenerationProgress,
                [itemId]: false
              }
            }));
            
            console.log('Generated and updated preview for cart item:', itemId);
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
            size: sq.size,
            quantity: Number(sq.quantity) || 0,
            price: Number(sq.price) || 0,
            customDesign: !!customizationId,
            customizationId: customizationId,
          };
          
          try {
            await get().addItem(item);
          } catch (error) {
            console.error('Error adding item to cart:', error);
            throw new Error('Unable to add item to cart.');
          }
        }
      },
      
      addItemFromProductPage: async (productId, productName, quantity, price, size, color, image, customizationId) => {
        const item: Omit<CartItem, 'id'> = {
          productId,
          name: productName,
          image,
          size,
          color,
          quantity: Number(quantity) || 0,
          price: Number(price) || 0,
          customDesign: !!customizationId,
          customizationId: customizationId,
        };
        
        await get().addItem(item);
      }
    }),
    {
      name: 'cart-storage',
      // Only persist essential cart data, not large images
      partialize: (state) => ({
        items: state.items.map(item => ({
          ...item,
          designImages: undefined // Exclude design images from persistence
        })),
        lastSyncTime: state.lastSyncTime
      }),
      // Custom storage to handle guest ID persistence
      storage: {
        getItem: (name: string) => {
          if (typeof window === 'undefined') return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          try {
            const parsed = JSON.parse(str);
            // Ensure guest ID exists when loading persisted state
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
