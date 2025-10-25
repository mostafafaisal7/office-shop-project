/**
 * useFormSubmit Hook
 *
 * Consolidates duplicate form submission patterns with loading states and error handling.
 * Works seamlessly with useFormData and useAsyncOperation.
 *
 * Usage:
 * ```tsx
 * const form = useFormData({ email: '', password: '' });
 * const { handleSubmit, isSubmitting } = useFormSubmit({
 *   onSubmit: async (data) => {
 *     await authApi.login(data);
 *   },
 *   successMessage: 'Login successful!',
 *   onSuccess: () => router.push('/dashboard'),
 * });
 *
 * <form onSubmit={handleSubmit(form.formData, form.validate)}>
 *   ...
 * </form>
 * ```
 */

import { FormEvent, useCallback } from 'react';
import { useAsyncOperation, AsyncOperationOptions } from './useAsyncOperation';

export interface UseFormSubmitOptions<T> extends Omit<AsyncOperationOptions<any>, 'onSuccess'> {
  /**
   * Form submission handler
   */
  onSubmit: (data: T) => Promise<any>;

  /**
   * Success callback (receives both form data and API response)
   */
  onSuccess?: (data: T, response?: any) => void | Promise<void>;

  /**
   * Validation function (returns true if valid)
   */
  validate?: (data: T) => boolean;

  /**
   * Whether to prevent default form submission
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: boolean;

  /**
   * Reset form after successful submission
   * @default false
   */
  resetOnSuccess?: boolean;
}

export interface UseFormSubmitReturn<T> {
  /**
   * Form submit handler
   */
  handleSubmit: (
    formData: T,
    validate?: () => boolean
  ) => (e: FormEvent<HTMLFormElement>) => Promise<void>;

  /**
   * Submit form programmatically (without form event)
   */
  submit: (formData: T, validate?: () => boolean) => Promise<void>;

  /**
   * Whether form is currently submitting
   */
  isSubmitting: boolean;

  /**
   * Submission error (if any)
   */
  error: Error | null;

  /**
   * Clear submission error
   */
  clearError: () => void;

  /**
   * Reset submission state
   */
  reset: () => void;
}

/**
 * Hook for handling form submissions
 */
export function useFormSubmit<T extends Record<string, any>>(
  options: UseFormSubmitOptions<T>
): UseFormSubmitReturn<T> {
  const {
    onSubmit,
    onSuccess,
    validate: customValidate,
    preventDefault = true,
    stopPropagation = false,
    resetOnSuccess = false,
    ...asyncOptions
  } = options;

  const { execute, isLoading, error, clearError, reset } = useAsyncOperation();

  const submit = useCallback(
    async (formData: T, validate?: () => boolean) => {
      // Run validation if provided
      const validationFn = validate || customValidate;
      if (validationFn && !validationFn(formData)) {
        return;
      }

      // Execute submission
      const result = await execute(
        () => onSubmit(formData),
        {
          ...asyncOptions,
          onSuccess: onSuccess
            ? async (response) => {
                await onSuccess(formData, response);
              }
            : undefined,
        }
      );

      return result;
    },
    [onSubmit, onSuccess, customValidate, asyncOptions, execute]
  );

  const handleSubmit = useCallback(
    (formData: T, validate?: () => boolean) =>
      async (e: FormEvent<HTMLFormElement>) => {
        if (preventDefault) {
          e.preventDefault();
        }

        if (stopPropagation) {
          e.stopPropagation();
        }

        await submit(formData, validate);
      },
    [submit, preventDefault, stopPropagation]
  );

  return {
    handleSubmit,
    submit,
    isSubmitting: isLoading,
    error,
    clearError,
    reset,
  };
}

export default useFormSubmit;
