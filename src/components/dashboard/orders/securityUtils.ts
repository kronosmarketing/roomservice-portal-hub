// Main security utilities - re-export from modular files for backward compatibility
export * from './security';

// Keep the original exports for backward compatibility
export {
  validateUserHotelAccess,
  verifyAuthentication,
  auditSession
} from './security/authValidation';

export {
  sanitizeInput,
  sanitizeHtml,
  generateSecureHash
} from './security/inputSanitization';

export {
  validateOrderId,
  validateRoomNumber,
  validateAmount,
  validateEmail,
  validatePhone,
  validateAndSanitizeInput
} from './security/inputValidation';

export {
  validateFileUpload
} from './security/fileValidation';

export {
  checkRateLimit
} from './security/rateLimiting';

export {
  logSecurityEvent
} from './security/securityLogging';
