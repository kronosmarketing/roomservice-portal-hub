
import { checkRateLimit } from "./rateLimiting";
import { logSecurityEvent } from "./securityLogging";

interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: string;
  error?: string;
}

/**
 * Validates and sanitizes text input with security logging
 */
export const validateAndSanitizeText = async (
  input: string, 
  maxLength: number = 255,
  fieldName: string = 'text_field'
): Promise<ValidationResult> => {
  try {
    // Check rate limiting for validation requests
    const rateLimitOk = await checkRateLimit('input_validation', 100, 5);
    if (!rateLimitOk) {
      await logSecurityEvent('rate_limit_exceeded', 'input_validation', fieldName);
      return { isValid: false, error: 'Too many validation requests' };
    }

    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Input is required and must be text' };
    }

    if (input.length > maxLength) {
      return { isValid: false, error: `Input exceeds maximum length of ${maxLength} characters` };
    }

    // Basic XSS protection
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();

    // SQL injection patterns
    const sqlPatterns = [
      /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b)/i,
      /(union|or|and)\s+\d+\s*=\s*\d+/i,
      /['"]\s*(or|and)\s+['"]\w+['"]\s*=\s*['"]\w+['"]|['"]\s*;\s*drop\s/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(sanitized)) {
        await logSecurityEvent('sql_injection_attempt', 'input_validation', fieldName, { 
          input: input.substring(0, 100) 
        });
        return { isValid: false, error: 'Invalid input detected' };
      }
    }

    return { isValid: true, sanitizedValue: sanitized };
  } catch (error) {
    await logSecurityEvent('input_validation_error', 'input_validation', fieldName, { 
      error: String(error) 
    });
    return { isValid: false, error: 'Validation error occurred' };
  }
};

/**
 * Validates numeric amounts with security checks
 */
export const validateAmount = async (amount: number): Promise<ValidationResult> => {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return { isValid: false, error: 'Amount must be a valid number' };
    }

    if (amount < 0) {
      return { isValid: false, error: 'Amount cannot be negative' };
    }

    if (amount > 999999.99) {
      await logSecurityEvent('suspicious_amount', 'input_validation', 'amount', { amount });
      return { isValid: false, error: 'Amount is too large' };
    }

    const rounded = Math.round(amount * 100) / 100;
    return { isValid: true, sanitizedValue: rounded.toString() };
  } catch (error) {
    return { isValid: false, error: 'Amount validation failed' };
  }
};

/**
 * Validates room numbers with security checks
 */
export const validateRoomNumber = async (roomNumber: string): Promise<ValidationResult> => {
  try {
    const textValidation = await validateAndSanitizeText(roomNumber, 20, 'room_number');
    if (!textValidation.isValid) {
      return textValidation;
    }

    const sanitized = textValidation.sanitizedValue!;
    
    // Room number specific validation
    if (!/^[A-Za-z0-9\-\.]+$/.test(sanitized)) {
      return { isValid: false, error: 'Room number contains invalid characters' };
    }

    return { isValid: true, sanitizedValue: sanitized };
  } catch (error) {
    return { isValid: false, error: 'Room number validation failed' };
  }
};

/**
 * Validates file uploads with comprehensive security checks
 */
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/json',
    'text/plain'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|vbs|js|jar)$/i,
    /[<>:"|?*]/,
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return { valid: false, error: 'File name contains invalid characters' };
    }
  }

  return { valid: true };
};
