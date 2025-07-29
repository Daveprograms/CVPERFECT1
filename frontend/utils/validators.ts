/**
 * Validation Utilities
 * Functions for validating user input and data
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

// Name validation
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
}

// Phone validation
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length !== 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit phone number' };
  }

  return { isValid: true };
}

// URL validation
export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
}

// File validation
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    required?: boolean;
  } = {}
): ValidationResult {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], required = true } = options;

  if (!file && required) {
    return { isValid: false, error: 'File is required' };
  }

  if (!file && !required) {
    return { isValid: true };
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type must be one of: ${allowedTypes.join(', ')}` };
  }

  return { isValid: true };
}

// Resume file validation
export function validateResumeFile(file: File): ValidationResult {
  return validateFile(file, {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    required: true
  });
}

// Job description validation
export function validateJobDescription(description: string): ValidationResult {
  if (!description) {
    return { isValid: false, error: 'Job description is required' };
  }

  if (description.trim().length < 50) {
    return { isValid: false, error: 'Job description must be at least 50 characters long' };
  }

  if (description.length > 10000) {
    return { isValid: false, error: 'Job description must be less than 10,000 characters' };
  }

  return { isValid: true };
}

// Form validation helpers
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, (value: any) => ValidationResult>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field as keyof T]);
    if (!result.isValid) {
      errors[field as keyof T] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

// Registration form validation
export function validateRegistrationForm(data: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  acceptTerms: boolean;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Email validation
  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error!;
  }

  // Password validation
  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid) {
    errors.password = passwordResult.error!;
  }

  // Confirm password validation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Full name validation
  const nameResult = validateName(data.fullName);
  if (!nameResult.isValid) {
    errors.fullName = nameResult.error!;
  }

  // Terms acceptance validation
  if (!data.acceptTerms) {
    errors.acceptTerms = 'You must accept the terms and conditions';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// Login form validation
export function validateLoginForm(data: {
  email: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Email validation
  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error!;
  }

  // Password required validation
  if (!data.password) {
    errors.password = 'Password is required';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// Text length validation
export function validateTextLength(
  text: string,
  minLength: number = 0,
  maxLength: number = Infinity,
  fieldName: string = 'Field'
): ValidationResult {
  if (text.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long` };
  }

  if (text.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters long` };
  }

  return { isValid: true };
}

// Required field validation
export function validateRequired(value: any, fieldName: string = 'Field'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
} 