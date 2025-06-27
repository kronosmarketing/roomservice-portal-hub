
// Consolidated security utilities with standardized approach
export { validateUserHotelAccess, verifyAuthentication, auditSession } from './authValidation';
export { logSecurityEvent } from './securityLogging';
export { 
  validateFileUpload, 
  validateAndSanitizeText, 
  validateAmount, 
  validateRoomNumber 
} from './inputValidation';
export { checkRateLimit } from './rateLimiting';
