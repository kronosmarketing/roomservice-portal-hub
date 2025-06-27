
import React, { useEffect, ReactNode } from 'react';
import { logSecurityEvent } from './security/securityLogging';

interface SecurityAuditLoggerProps {
  hotelId: string;
  component: string;
  action: string;
  details?: any;
  children: ReactNode;
}

const SecurityAuditLogger = ({ 
  hotelId, 
  component, 
  action, 
  details, 
  children 
}: SecurityAuditLoggerProps) => {
  useEffect(() => {
    const logComponentAccess = async () => {
      try {
        await logSecurityEvent(action, component, hotelId, {
          timestamp: new Date().toISOString(),
          component,
          ...details
        });
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    };

    logComponentAccess();
  }, [hotelId, component, action, details]);

  return <>{children}</>;
};

export default SecurityAuditLogger;
