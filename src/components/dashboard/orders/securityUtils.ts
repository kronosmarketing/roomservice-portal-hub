
// Legacy security utilities - now using new standardized functions
export { 
  validateUserHotelAccess, 
  verifyAuthentication, 
  auditSession 
} from './security/authValidation';

export { logSecurityEvent } from './security/securityLogging';

export { validateFileUpload } from './security/inputValidation';

export { checkRateLimit } from './security/rateLimiting';

// Export additional utility functions that are used across components
export { sanitizeInput } from './security/inputSanitization';

// Export validation functions
export const validateOrderId = (orderId: string): boolean => {
  if (!orderId || typeof orderId !== 'string') {
    return false;
  }
  
  // Order ID should be at least 8 characters and contain only alphanumeric characters and hyphens
  const orderIdRegex = /^[a-zA-Z0-9-]{8,}$/;
  return orderIdRegex.test(orderId.trim());
};

export const validateRoomNumber = (roomNumber: string): boolean => {
  if (!roomNumber || typeof roomNumber !== 'string') {
    return false;
  }
  
  // Room number specific validation
  const sanitized = roomNumber.trim();
  if (!/^[A-Za-z0-9\-\.]+$/.test(sanitized)) {
    return false;
  }
  
  return true;
};
