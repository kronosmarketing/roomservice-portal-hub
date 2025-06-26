
import { useState, useEffect } from "react";
import { validateUserHotelAccess, logSecurityEvent, checkRateLimit } from "./securityUtils";
import { useToast } from "@/hooks/use-toast";

interface EnhancedSecurityValidationProps {
  hotelId: string;
  operation: string;
  children: (isAuthorized: boolean, validateOperation: (action: string) => Promise<boolean>) => React.ReactNode;
}

const EnhancedSecurityValidation = ({ hotelId, operation, children }: EnhancedSecurityValidationProps) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    validateAccess();
  }, [hotelId]);

  const validateAccess = async () => {
    try {
      const hasAccess = await validateUserHotelAccess(hotelId);
      
      if (!hasAccess) {
        await logSecurityEvent('unauthorized_access_attempt', operation, hotelId);
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para esta operación",
          variant: "destructive"
        });
        setIsAuthorized(false);
      } else {
        await logSecurityEvent('access_validated', operation, hotelId);
        setIsAuthorized(true);
      }
    } catch (error) {
      console.error('Error validando acceso:', error);
      await logSecurityEvent('access_validation_error', operation, hotelId, { error: String(error) });
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const validateOperation = async (action: string): Promise<boolean> => {
    // Rate limiting check
    const rateLimitPassed = checkRateLimit(`${operation}_${action}`, 50, 15);
    if (!rateLimitPassed) {
      await logSecurityEvent('rate_limit_exceeded', operation, hotelId, { action });
      toast({
        title: "Límite de operaciones excedido",
        description: "Por favor, espera antes de realizar más operaciones",
        variant: "destructive"
      });
      return false;
    }

    // Re-validate access for sensitive operations
    const hasAccess = await validateUserHotelAccess(hotelId);
    if (!hasAccess) {
      await logSecurityEvent('operation_access_denied', operation, hotelId, { action });
      return false;
    }

    await logSecurityEvent('operation_authorized', operation, hotelId, { action });
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Validando permisos...</p>
        </div>
      </div>
    );
  }

  return <>{children(isAuthorized, validateOperation)}</>;
};

export default EnhancedSecurityValidation;
