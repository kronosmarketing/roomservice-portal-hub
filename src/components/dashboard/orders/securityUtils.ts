
// Legacy security utilities - now using new standardized functions
export { 
  validateUserHotelAccess, 
  verifyAuthentication, 
  auditSession 
} from './security/authValidation';

export { logSecurityEvent } from './security/securityLogging';

export { validateFileUpload } from './security/inputValidation';

export { checkRateLimit } from './security/rateLimiting';
