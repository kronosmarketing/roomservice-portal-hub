
import { useEffect } from "react";
import { logSecurityEvent, verifyAuthentication } from "./securityUtils";

interface SecurityAuditLoggerProps {
  hotelId: string;
  component: string;
  action?: string;
  details?: any;
  children: React.ReactNode;
}

const SecurityAuditLogger = ({ 
  hotelId, 
  component, 
  action = 'component_accessed',
  details,
  children 
}: SecurityAuditLoggerProps) => {

  useEffect(() => {
    const logAccess = async () => {
      const isAuthenticated = await verifyAuthentication();
      
      if (isAuthenticated) {
        await logSecurityEvent(action, component, hotelId, {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ...details
        });
      } else {
        await logSecurityEvent('unauthenticated_access_attempt', component, hotelId, {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ...details
        });
      }
    };

    logAccess();
  }, [hotelId, component, action]);

  return <>{children}</>;
};

export default SecurityAuditLogger;
