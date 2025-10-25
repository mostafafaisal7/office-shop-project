/**
 * useFormData Hook
 *
 * Consolidates duplicate form state management patterns.
 * Provides consistent form data handling and validation across components.
 *
 * Usage:
 * ```tsx
 * const { formData, errors, handleChange, setFieldValue, setFieldError, validate, reset } =
 *   useFormData<LoginFormData>({
 *     email: '',
 *     password: '',
 *   });
 * ```
 */

import { useState, useCallback, ChangeEvent } from 'react';

export interface UseFormDataOptions<T> {
  /**
   * Initial form data
   */
  initialData: T;

  /**
   * Validation function
   */
  validate?: (data: T) => Partial<Record<keyof T, string>>;

  /**
   * Clear errors on field change
   * @default true
   */
  clearErrorOnChange?: boolean;
}

export interface UseFormDataReturn<T> {
  /**
   * Current form data
   */
  formData: T;

  /**
   * Form errors
   */
  errors: Partial<Record<keyof T, string>>;

  /**
   * Whether form has errors
   */
  hasErrors: boolean;

  /**
   * Handle input change event
   */
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

  /**
   * Set a specific field value
   */
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;

  /**
   * Set multiple field values at once
   */
  setFormData: (data: Partial<T> | ((prev: T) => T)) => void;

  /**
   * Set a field error
   */
  setFieldError: <K extends keyof T>(field: K, error: string) => void;

  /**
   * Set multiple errors at once
   */
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;

  /**
   * Clear a field error
   */
  clearFieldError: <K extends keyof T>(field: K) => void;

  /**
   * Clear all errors
   */
  clearErrors: () => void;

  /**
   * Validate form (returns true if valid)
   */
  validate: () => boolean;

  /**
   * Reset form to initial state
   */
  reset: () => void;

  /**
   * Check if form data has changed from initial
   */
  isDirty: boolean;
}

/**
 * Hook for managing form data and validation
 */
export function useFormData<T extends Record<string, any>>(
  options: UseFormDataOptions<T>
): UseFormDataReturn<T> {
  const { initialData, validate: validateFn, clearErrorOnChange = true } = options;

  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldName = name as keyof T;

      // Handle checkbox inputs
      let fieldValue: any = value;
      if (type === 'checkbox') {
        fieldValue = (e.target as HTMLInputElement).checked;
      }

      setFormData((prev) => ({ ...prev, [fieldName]: fieldValue }));
      setIsDirty(true);

      // Clear error for this field if enabled
      if (clearErrorOnChange && errors[fieldName]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    },
    [clearErrorOnChange, errors]
  );

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear error for this field
    if (clearErrorOnChange) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [clearErrorOnChange]);

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback(<K extends keyof T>(field: K) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validate = useCallback(() => {
    if (!validateFn) {
      return true;
    }

    const validationErrors = validateFn(formData);
    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  }, [formData, validateFn]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsDirty(false);
  }, [initialData]);

  const updateFormData = useCallback((data: Partial<T> | ((prev: T) => T)) => {
    if (typeof data === 'function') {
      setFormData(data);
    } else {
      setFormData((prev) => ({ ...prev, ...data }));
    }
    setIsDirty(true);
  }, []);

  return {
    formData,
    errors,
    hasErrors,
    handleChange,
    setFieldValue,
    setFormData: updateFormData,
    setFieldError,
    setErrors,
    clearFieldError,
    clearErrors,
    validate,
    reset,
    isDirty,
  };
}

export default useFormData;
