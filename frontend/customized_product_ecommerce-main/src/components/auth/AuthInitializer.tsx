"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export const AuthInitializer: React.FC = () => {
  const { initializeAuth, isAuthenticated } = useAuthStore();
  const { initializeCart } = useCartStore();

  useEffect(() => {
    // Initialize auth on app startup
    initializeAuth();
  }, [initializeAuth]);

  // Initialize cart only when user becomes authenticated (not on every page load)
  useEffect(() => {
    if (isAuthenticated) {
      // Add a small delay to ensure auth is fully settled
      const timer = setTimeout(() => {
        // Make cart initialization completely non-blocking
        initializeCart().catch(error => {
          console.warn('Cart initialization failed, continuing with localStorage:', error);
          // Don't throw or block - just continue with localStorage
        });
      }, 500); // Increased delay to ensure auth is fully ready
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, initializeCart]);

  // This component doesn't render anything
  return null;
};
