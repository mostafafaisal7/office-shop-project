/**
 * useAsyncOperation Hook
 *
 * Consolidates 29+ duplicate try-catch-finally-showToast patterns across the codebase.
 * Provides consistent error handling, loading states, and user feedback for async operations.
 *
 * Usage:
 * ```tsx
 * const { execute, isLoading } = useAsyncOperation();
 *
 * const handleLogin = async () => {
 *   await execute(
 *     () => authApi.login(credentials),
 *     {
 *       successMessage: 'Login successful!',
 *       errorMessage: 'Login failed. Please try again.',
 *       onSuccess: (data) => router.push('/dashboard'),
 *       onError: (error) => console.error(error),
 *     }
 *   );
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';

export interface AsyncOperationOptions<T = any> {
  /**
   * Success message to display (if any)
   */
  successMessage?: string;

  /**
   * Error message to display (if any)
   */
  errorMessage?: string;

  /**
   * Callback to run on success
   */
  onSuccess?: (data: T) => void | Promise<void>;

  /**
   * Callback to run on error
   */
  onError?: (error: Error) => void | Promise<void>;

  /**
   * Callback to run finally (success or error)
   */
  onFinally?: () => void | Promise<void>;

  /**
   * Whether to show toast notifications
   * @default true
   */
  showToast?: boolean;

  /**
   * Custom error parser
   */
  parseError?: (error: any) => string;
}

export interface UseAsyncOperationReturn {
  /**
   * Execute an async operation with error handling
   */
  execute: <T = any>(
    operation: () => Promise<T>,
    options?: AsyncOperationOptions<T>
  ) => Promise<T | undefined>;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Clear error
   */
  clearError: () => void;

  /**
   * Reset state (loading and error)
   */
  reset: () => void;
}

/**
 * Parse error message from various error formats
 */
function parseErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return error.error;
  }

  if (error?.detail) {
    return error.detail;
  }

  return 'An unexpected error occurred';
}

/**
 * Hook for handling async operations with loading states and error handling
 */
export function useAsyncOperation(): UseAsyncOperationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const execute = useCallback(
    async <T = any>(
      operation: () => Promise<T>,
      options: AsyncOperationOptions<T> = {}
    ): Promise<T | undefined> => {
      const {
        successMessage,
        errorMessage,
        onSuccess,
        onError,
        onFinally,
        showToast: shouldShowToast = true,
        parseError: customParseError,
      } = options;

      try {
        setIsLoading(true);
        setError(null);

        const result = await operation();

        // Show success toast if message provided
        if (shouldShowToast && successMessage) {
          showToast(successMessage, 'success');
        }

        // Call success callback
        if (onSuccess) {
          await onSuccess(result);
        }

        return result;
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(parseErrorMessage(err));
        setError(errorObj);

        // Parse error message
        const message = customParseError
          ? customParseError(err)
          : errorMessage || parseErrorMessage(err);

        // Show error toast
        if (shouldShowToast) {
          showToast(message, 'error');
        }

        // Call error callback
        if (onError) {
          await onError(errorObj);
        }

        // Re-throw error if no error callback provided
        // This allows the caller to handle it if needed
        if (!onError) {
          throw errorObj;
        }

        return undefined;
      } finally {
        setIsLoading(false);

        // Call finally callback
        if (onFinally) {
          await onFinally();
        }
      }
    },
    [showToast]
  );

  return {
    execute,
    isLoading,
    error,
    clearError,
    reset,
  };
}

/**
 * Variant for multiple concurrent operations
 */
export function useAsyncOperations() {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, Error | null>>({});
  const { showToast } = useToast();

  const execute = useCallback(
    async <T = any>(
      operationId: string,
      operation: () => Promise<T>,
      options: AsyncOperationOptions<T> = {}
    ): Promise<T | undefined> => {
      const {
        successMessage,
        errorMessage,
        onSuccess,
        onError,
        onFinally,
        showToast: shouldShowToast = true,
        parseError: customParseError,
      } = options;

      try {
        setLoadingMap((prev) => ({ ...prev, [operationId]: true }));
        setErrorMap((prev) => ({ ...prev, [operationId]: null }));

        const result = await operation();

        if (shouldShowToast && successMessage) {
          showToast(successMessage, 'success');
        }

        if (onSuccess) {
          await onSuccess(result);
        }

        return result;
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(parseErrorMessage(err));
        setErrorMap((prev) => ({ ...prev, [operationId]: errorObj }));

        const message = customParseError
          ? customParseError(err)
          : errorMessage || parseErrorMessage(err);

        if (shouldShowToast) {
          showToast(message, 'error');
        }

        if (onError) {
          await onError(errorObj);
        }

        if (!onError) {
          throw errorObj;
        }

        return undefined;
      } finally {
        setLoadingMap((prev) => ({ ...prev, [operationId]: false }));

        if (onFinally) {
          await onFinally();
        }
      }
    },
    [showToast]
  );

  const isLoading = useCallback(
    (operationId: string) => loadingMap[operationId] || false,
    [loadingMap]
  );

  const getError = useCallback(
    (operationId: string) => errorMap[operationId] || null,
    [errorMap]
  );

  const clearError = useCallback((operationId: string) => {
    setErrorMap((prev) => ({ ...prev, [operationId]: null }));
  }, []);

  const reset = useCallback((operationId?: string) => {
    if (operationId) {
      setLoadingMap((prev) => ({ ...prev, [operationId]: false }));
      setErrorMap((prev) => ({ ...prev, [operationId]: null }));
    } else {
      setLoadingMap({});
      setErrorMap({});
    }
  }, []);

  return {
    execute,
    isLoading,
    getError,
    clearError,
    reset,
    loadingStates: loadingMap,
    errors: errorMap,
  };
}

export default useAsyncOperation;
