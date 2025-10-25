/**
 * Validation Utilities
 *
 * Centralized validation functions to replace duplicate validation logic
 * across auth forms and other components.
 */

/**
 * Email validation regex
 * Matches standard email formats
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone number regex (international format)
 */
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong',
}

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: (min: number) => `Password must be at least ${min} characters`,
  PASSWORD_TOO_LONG: (max: number) => `Password must be less than ${max} characters`,
  PASSWORD_MISMATCH: 'Passwords do not match',
  PASSWORD_WEAK: 'Password is too weak. Use a mix of letters, numbers, and symbols',
  PHONE_INVALID: 'Please enter a valid phone number',
  PHONE_REQUIRED: 'Phone number is required',
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_SHORT: (min: number) => `Name must be at least ${min} characters`,
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must be less than ${max} characters`,
  MIN_VALUE: (field: string, min: number) => `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} must be less than ${max}`,
  INVALID_FORMAT: (field: string) => `Invalid ${field} format`,
};

/**
 * Check if a value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName?: string): string | null {
  if (isEmpty(value)) {
    return fieldName ? `${fieldName} is required` : VALIDATION_MESSAGES.REQUIRED;
  }
  return null;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): string | null {
  if (isEmpty(email)) {
    return VALIDATION_MESSAGES.EMAIL_REQUIRED;
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return VALIDATION_MESSAGES.EMAIL_INVALID;
  }

  return null;
}

/**
 * Validate password
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number;
    maxLength?: number;
    requireStrength?: PasswordStrength;
  } = {}
): string | null {
  const { minLength = 8, maxLength = 100, requireStrength } = options;

  if (isEmpty(password)) {
    return VALIDATION_MESSAGES.PASSWORD_REQUIRED;
  }

  if (password.length < minLength) {
    return VALIDATION_MESSAGES.PASSWORD_TOO_SHORT(minLength);
  }

  if (password.length > maxLength) {
    return VALIDATION_MESSAGES.PASSWORD_TOO_LONG(maxLength);
  }

  if (requireStrength) {
    const strength = getPasswordStrength(password);
    const strengthLevels = [
      PasswordStrength.WEAK,
      PasswordStrength.MEDIUM,
      PasswordStrength.STRONG,
      PasswordStrength.VERY_STRONG,
    ];
    const currentIndex = strengthLevels.indexOf(strength);
    const requiredIndex = strengthLevels.indexOf(requireStrength);

    if (currentIndex < requiredIndex) {
      return VALIDATION_MESSAGES.PASSWORD_WEAK;
    }
  }

  return null;
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(
  password: string,
  confirmation: string
): string | null {
  if (isEmpty(confirmation)) {
    return 'Please confirm your password';
  }

  if (password !== confirmation) {
    return VALIDATION_MESSAGES.PASSWORD_MISMATCH;
  }

  return null;
}

/**
 * Get password strength
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (isEmpty(password)) return PasswordStrength.WEAK;

  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety checks
  if (/[a-z]/.test(password)) strength++; // Lowercase
  if (/[A-Z]/.test(password)) strength++; // Uppercase
  if (/\d/.test(password)) strength++; // Numbers
  if (/[^a-zA-Z\d]/.test(password)) strength++; // Special characters

  if (strength <= 2) return PasswordStrength.WEAK;
  if (strength <= 4) return PasswordStrength.MEDIUM;
  if (strength <= 5) return PasswordStrength.STRONG;
  return PasswordStrength.VERY_STRONG;
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string, required: boolean = true): string | null {
  if (isEmpty(phone)) {
    return required ? VALIDATION_MESSAGES.PHONE_REQUIRED : null;
  }

  const cleaned = phone.replace(/\s/g, '');

  if (!PHONE_REGEX.test(phone)) {
    return VALIDATION_MESSAGES.PHONE_INVALID;
  }

  // Check length (international numbers can be 7-15 digits)
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return VALIDATION_MESSAGES.PHONE_INVALID;
  }

  return null;
}

/**
 * Validate name
 */
export function validateName(name: string, minLength: number = 2): string | null {
  if (isEmpty(name)) {
    return VALIDATION_MESSAGES.NAME_REQUIRED;
  }

  if (name.trim().length < minLength) {
    return VALIDATION_MESSAGES.NAME_TOO_SHORT(minLength);
  }

  return null;
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  options: {
    min?: number;
    max?: number;
    fieldName?: string;
  }
): string | null {
  const { min, max, fieldName = 'Field' } = options;

  if (min !== undefined && value.length < min) {
    return VALIDATION_MESSAGES.MIN_LENGTH(fieldName, min);
  }

  if (max !== undefined && value.length > max) {
    return VALIDATION_MESSAGES.MAX_LENGTH(fieldName, max);
  }

  return null;
}

/**
 * Validate numeric value
 */
export function validateNumber(
  value: number,
  options: {
    min?: number;
    max?: number;
    fieldName?: string;
  }
): string | null {
  const { min, max, fieldName = 'Value' } = options;

  if (min !== undefined && value < min) {
    return VALIDATION_MESSAGES.MIN_VALUE(fieldName, min);
  }

  if (max !== undefined && value > max) {
    return VALIDATION_MESSAGES.MAX_VALUE(fieldName, max);
  }

  return null;
}

/**
 * Validate URL
 */
export function validateUrl(url: string, required: boolean = false): string | null {
  if (isEmpty(url)) {
    return required ? VALIDATION_MESSAGES.REQUIRED : null;
  }

  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
}

/**
 * Validate against custom regex
 */
export function validateRegex(
  value: string,
  regex: RegExp,
  errorMessage?: string
): string | null {
  if (!regex.test(value)) {
    return errorMessage || 'Invalid format';
  }
  return null;
}

/**
 * Combine multiple validators
 * Returns the first error message found, or null if all pass
 */
export function combineValidators(
  ...validators: Array<() => string | null>
): string | null {
  for (const validator of validators) {
    const error = validator();
    if (error) return error;
  }
  return null;
}

/**
 * Create a validator function
 */
export function createValidator<T extends Record<string, any>>(
  validationRules: {
    [K in keyof T]?: (value: T[K], formData: T) => string | null;
  }
) {
  return (formData: T): Partial<Record<keyof T, string>> => {
    const errors: Partial<Record<keyof T, string>> = {};

    for (const field in validationRules) {
      const validator = validationRules[field];
      if (validator) {
        const error = validator(formData[field], formData);
        if (error) {
          errors[field] = error;
        }
      }
    }

    return errors;
  };
}

/**
 * Common validation sets for forms
 */
export const commonValidators = {
  /**
   * Login form validation
   */
  login: createValidator<{ email: string; password: string }>({
    email: (value) => validateEmail(value),
    password: (value) => validateRequired(value, 'Password'),
  }),

  /**
   * Register form validation
   */
  register: createValidator<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
  }>({
    name: (value) => validateName(value),
    email: (value) => validateEmail(value),
    password: (value) => validatePassword(value, { minLength: 8 }),
    confirmPassword: (value, formData) =>
      validatePasswordConfirmation(formData.password, value),
    phone: (value) => (value ? validatePhone(value, false) : null),
  }),

  /**
   * Forgot password form validation
   */
  forgotPassword: createValidator<{ email: string }>({
    email: (value) => validateEmail(value),
  }),

  /**
   * Reset password form validation
   */
  resetPassword: createValidator<{
    password: string;
    confirmPassword: string;
  }>({
    password: (value) => validatePassword(value, { minLength: 8 }),
    confirmPassword: (value, formData) =>
      validatePasswordConfirmation(formData.password, value),
  }),
};

export default {
  isEmpty,
  validateRequired,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  getPasswordStrength,
  validatePhone,
  validateName,
  validateLength,
  validateNumber,
  validateUrl,
  validateRegex,
  combineValidators,
  createValidator,
  commonValidators,
};
