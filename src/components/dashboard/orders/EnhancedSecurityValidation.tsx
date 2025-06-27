
import React, { useState, useEffect, ReactNode } from 'react';
import { validateUserHotelAccess, auditSession } from './security/authValidation';
import { checkRateLimit } from './security/rateLimiting';
import { logSecurityEvent } from './security/securityLogging';

interface EnhancedSecurityValidationProps {
  hotelId: string;
  operation: string;
  children: (isAuthorized: boolean) => ReactNode;
}

const EnhancedSecurityValidation = ({ 
  hotelId, 
  operation, 
  children 
}: EnhancedSecurityValidationProps) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    validateAccess();
  }, [hotelId, operation]);

  const validateAccess = async () => {
    try {
      // Rate limiting check
      const rateLimitOk = await checkRateLimit(operation, 100, 15);
      if (!rateLimitOk) {
        await logSecurityEvent('rate_limit_exceeded', operation, hotelId);
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Session integrity check
      const sessionValid = await auditSession();
      if (!sessionValid) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Hotel access validation
      const hasAccess = await validateUserHotelAccess(hotelId);
      if (!hasAccess) {
        await logSecurityEvent('unauthorized_operation_attempt', operation, hotelId);
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      await logSecurityEvent('operation_authorized', operation, hotelId);
      setIsAuthorized(true);
    } catch (error) {
      console.error('Security validation error:', error);
      await logSecurityEvent('security_validation_error', operation, hotelId, { 
        error: String(error) 
      });
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-sm text-gray-600">Validating permissions...</span>
      </div>
    );
  }

  return <>{children(isAuthorized)}</>;
};

export default EnhancedSecurityValidation;
