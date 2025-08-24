'use client';

// Utility to clean up invalid blob URLs from localStorage
export const cleanupLocalStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear the specific design storage key
    localStorage.removeItem('ecommerce_designs');
    console.log('Cleared ecommerce_designs from localStorage');
    
    // Also clear any other potential blob-related storage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value && value.includes('blob:http://localhost:3000')) {
          localStorage.removeItem(key);
          console.log(`Cleared localStorage key with invalid blob URL: ${key}`);
        }
      } catch (error) {
        console.warn(`Error checking localStorage key ${key}:`, error);
      }
    });
    
    console.log('localStorage cleanup completed');
  } catch (error) {
    console.error('Error during localStorage cleanup:', error);
  }
};

// Function to check if current host matches stored blob URLs
export const hasInvalidBlobUrls = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const currentHost = window.location.host;
    const stored = localStorage.getItem('ecommerce_designs');
    
    if (stored) {
      return stored.includes('blob:') && !stored.includes(currentHost);
    }
  } catch (error) {
    console.error('Error checking for invalid blob URLs:', error);
  }
  
  return false;
};

// Auto-cleanup on import (runs when module is loaded)
if (typeof window !== 'undefined') {
  // Check if we need to clean up on page load
  const currentHost = window.location.host;
  const stored = localStorage.getItem('ecommerce_designs');
  
  if (stored && stored.includes('blob:http://localhost:3000') && currentHost !== 'localhost:3000') {
    console.log('Detected invalid blob URLs from different port, cleaning up...');
    cleanupLocalStorage();
  }
}
