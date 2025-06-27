
import { useState, useCallback } from "react";
import { 
  sanitizeInput, 
  sanitizeHtml, 
  validateEmail, 
  validatePhone, 
  validateRoomNumber,
  validateAmount,
  logSecurityEvent 
} from "./securityUtils";

interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  error?: string;
}

interface SecureInputValidationProps {
  children: (validationUtils: {
    validateAndSanitizeText: (value: string, maxLength?: number) => ValidationResult;
    validateAndSanitizeHtml: (value: string, maxLength?: number) => ValidationResult;
    validateEmail: (value: string) => ValidationResult;
    validatePhone: (value: string) => ValidationResult;
    validateRoomNumber: (value: string) => ValidationResult;
    validateAmount: (value: number) => ValidationResult;
    logSuspiciousInput: (inputType: string, originalValue: string, sanitizedValue: string) => void;
  }) => React.ReactNode;
}

const SecureInputValidation = ({ children }: SecureInputValidationProps) => {
  const [suspiciousInputs, setSuspiciousInputs] = useState(new Set<string>());

  const logSuspiciousInput = useCallback(async (
    inputType: string, 
    originalValue: string, 
    sanitizedValue: string
  ) => {
    const key = `${inputType}-${Date.now()}`;
    if (suspiciousInputs.has(key)) return;

    setSuspiciousInputs(prev => new Set(prev).add(key));
    
    if (originalValue !== sanitizedValue) {
      await logSecurityEvent('suspicious_input_detected', inputType, undefined, {
        originalLength: originalValue.length,
        sanitizedLength: sanitizedValue.length,
        containsScript: originalValue.toLowerCase().includes('script'),
        containsHtml: /<[^>]*>/.test(originalValue)
      });
    }
  }, [suspiciousInputs]);

  const validateAndSanitizeText = useCallback((value: string, maxLength = 1000): ValidationResult => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, sanitizedValue: '', error: 'Valor inválido' };
    }

    const sanitized = sanitizeInput(value);
    
    if (sanitized.length > maxLength) {
      return { 
        isValid: false, 
        sanitizedValue: sanitized.substring(0, maxLength), 
        error: `Texto demasiado largo (máximo ${maxLength} caracteres)` 
      };
    }

    if (value !== sanitized) {
      logSuspiciousInput('text', value, sanitized);
    }

    return { isValid: true, sanitizedValue: sanitized };
  }, [logSuspiciousInput]);

  const validateAndSanitizeHtml = useCallback((value: string, maxLength = 2000): ValidationResult => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, sanitizedValue: '', error: 'Valor inválido' };
    }

    const sanitized = sanitizeHtml(value);
    
    if (sanitized.length > maxLength) {
      return { 
        isValid: false, 
        sanitizedValue: sanitized.substring(0, maxLength), 
        error: `Contenido demasiado largo (máximo ${maxLength} caracteres)` 
      };
    }

    if (value !== sanitized) {
      logSuspiciousInput('html', value, sanitized);
    }

    return { isValid: true, sanitizedValue: sanitized };
  }, [logSuspiciousInput]);

  const validateEmailInput = useCallback((value: string): ValidationResult => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, sanitizedValue: '', error: 'Email requerido' };
    }

    const sanitized = sanitizeInput(value);
    const isValid = validateEmail(sanitized);

    if (!isValid) {
      return { isValid: false, sanitizedValue: sanitized, error: 'Formato de email inválido' };
    }

    return { isValid: true, sanitizedValue: sanitized };
  }, []);

  const validatePhoneInput = useCallback((value: string): ValidationResult => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, sanitizedValue: '', error: 'Teléfono requerido' };
    }

    const sanitized = sanitizeInput(value);
    const isValid = validatePhone(sanitized);

    if (!isValid) {
      return { isValid: false, sanitizedValue: sanitized, error: 'Formato de teléfono inválido' };
    }

    return { isValid: true, sanitizedValue: sanitized };
  }, []);

  const validateRoomNumberInput = useCallback((value: string): ValidationResult => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, sanitizedValue: '', error: 'Número de habitación requerido' };
    }

    const sanitized = sanitizeInput(value);
    const isValid = validateRoomNumber(sanitized);

    if (!isValid) {
      return { isValid: false, sanitizedValue: sanitized, error: 'Número de habitación inválido' };
    }

    return { isValid: true, sanitizedValue: sanitized };
  }, []);

  const validateAmountInput = useCallback((value: number): ValidationResult => {
    const isValid = validateAmount(value);

    if (!isValid) {
      return { 
        isValid: false, 
        sanitizedValue: '0', 
        error: 'Monto inválido (debe ser entre 0 y 10,000)' 
      };
    }

    return { isValid: true, sanitizedValue: value.toString() };
  }, []);

  return (
    <>
      {children({
        validateAndSanitizeText,
        validateAndSanitizeHtml,
        validateEmail: validateEmailInput,
        validatePhone: validatePhoneInput,
        validateRoomNumber: validateRoomNumberInput,
        validateAmount: validateAmountInput,
        logSuspiciousInput
      })}
    </>
  );
};

export default SecureInputValidation;
