import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShippingInfo {
  full_name: string;
  phone: string;
  email: string;
  country: string;
  division: string;
  district: string;
  thana: string;
  postal_code: string;
  delivery_address: string;
}

export interface GuestCheckoutContext {
  fromCheckout: boolean;
  originalPath: string;
  shippingData: ShippingInfo | null;
  timestamp: number;
}

interface ShippingStore {
  shippingInfo: ShippingInfo | null;
  redirectAfterAuth: string | null;
  guestCheckoutContext: GuestCheckoutContext | null;
  
  // Actions
  setShippingInfo: (info: ShippingInfo) => void;
  clearShippingInfo: () => void;
  setRedirectAfterAuth: (path: string) => void;
  clearRedirectAfterAuth: () => void;
  getRedirectPath: () => string;
  
  // Guest checkout specific actions
  setGuestCheckoutContext: (context: GuestCheckoutContext) => void;
  clearGuestCheckoutContext: () => void;
  getAutoFillData: () => { email?: string; phone?: string } | null;
  isFromCheckout: () => boolean;
  getStoredShippingData: () => ShippingInfo | null;
  shouldRestoreCheckoutData: () => boolean;
}

const defaultShippingInfo: ShippingInfo = {
  full_name: '',
  phone: '',
  email: '',
  country: 'Bangladesh',
  division: 'Dhaka',
  district: '',
  thana: '',
  postal_code: '',
  delivery_address: '',
};

export const useShippingStore = create<ShippingStore>()(
  persist(
    (set, get) => ({
      shippingInfo: null,
      redirectAfterAuth: null,
      guestCheckoutContext: null,

      setShippingInfo: (info: ShippingInfo) => {
        set({ shippingInfo: info });
      },

      clearShippingInfo: () => {
        set({ shippingInfo: null });
      },

      setRedirectAfterAuth: (path: string) => {
        set({ redirectAfterAuth: path });
      },

      clearRedirectAfterAuth: () => {
        set({ redirectAfterAuth: null });
      },

      getRedirectPath: () => {
        const { redirectAfterAuth } = get();
        return redirectAfterAuth || '/';
      },

      // Guest checkout specific actions
      setGuestCheckoutContext: (context: GuestCheckoutContext) => {
        console.log('Setting guest checkout context:', context);
        set({ guestCheckoutContext: context });
      },

      clearGuestCheckoutContext: () => {
        console.log('Clearing guest checkout context');
        set({ guestCheckoutContext: null });
      },

      getAutoFillData: () => {
        const { guestCheckoutContext, shippingInfo } = get();
        
        // If we have guest checkout context, use that data
        if (guestCheckoutContext?.shippingData) {
          return {
            email: guestCheckoutContext.shippingData.email || undefined,
            phone: guestCheckoutContext.shippingData.phone || undefined,
          };
        }
        
        // Fallback to current shipping info
        if (shippingInfo) {
          return {
            email: shippingInfo.email || undefined,
            phone: shippingInfo.phone || undefined,
          };
        }
        
        return null;
      },

      isFromCheckout: () => {
        const { guestCheckoutContext } = get();
        return guestCheckoutContext?.fromCheckout || false;
      },

      // New method to get full shipping data for restoration
      getStoredShippingData: () => {
        const { guestCheckoutContext, shippingInfo } = get();
        
        // Priority: guest checkout context first, then regular shipping info
        if (guestCheckoutContext?.shippingData) {
          console.log('Returning guest checkout shipping data:', guestCheckoutContext.shippingData);
          return guestCheckoutContext.shippingData;
        }
        
        if (shippingInfo) {
          console.log('Returning regular shipping info:', shippingInfo);
          return shippingInfo;
        }
        
        console.log('No stored shipping data found');
        return null;
      },

      // Method to check if we should restore data
      shouldRestoreCheckoutData: () => {
        const { guestCheckoutContext } = get();
        return !!(guestCheckoutContext?.fromCheckout && guestCheckoutContext?.shippingData);
      },
    }),
    {
      name: 'shipping-storage',
      partialize: (state) => ({
        shippingInfo: state.shippingInfo,
        redirectAfterAuth: state.redirectAfterAuth,
        guestCheckoutContext: state.guestCheckoutContext,
      }),
    }
  )
);
