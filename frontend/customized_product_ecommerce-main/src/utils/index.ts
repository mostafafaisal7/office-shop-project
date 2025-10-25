/**
 * Utility exports
 *
 * Centralized exports for all utility functions
 * Usage: import { formatPrice, validateEmail, setLocalStorage } from '@/utils';
 */

// Validation utilities
export * from './validation';

// Formatting utilities
export * from './formatters';

// Constants
export * from './constants';

// Storage utilities
export * from './storage';

// Re-export existing utilities
export { default as cartHelpers } from './cartHelpers';
export { default as imageUtils } from './imageUtils';
export { previewGenerator } from './previewGenerator';
export { uploadPreviewToBackend } from './uploadPreviewToBackend';
