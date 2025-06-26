
import { supabase } from "@/integrations/supabase/client";
import { logSecurityEvent } from "./securityLogging";

/**
 * Valida que el usuario actual tiene acceso al hotel especificado
 */
export const validateUserHotelAccess = async (hotelId: string): Promise<boolean> => {
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      await logSecurityEvent('failed_authentication', 'hotel_access_validation', hotelId);
      return false;
    }

    // Usar la función de base de datos para validar acceso
    const { data, error } = await supabase.rpc('user_has_hotel_access', {
      target_hotel_id: hotelId
    });
    
    if (error) {
      console.error('❌ Error validando acceso al hotel:', error);
      await logSecurityEvent('access_validation_error', 'hotel', hotelId, { error: error.message });
      return false;
    }

    const hasAccess = data === true;
    
    if (!hasAccess) {
      await logSecurityEvent('unauthorized_hotel_access_attempt', 'hotel', hotelId);
    }

    return hasAccess;
  } catch (error) {
    console.error('❌ Error en validación de seguridad:', error);
    await logSecurityEvent('security_validation_exception', 'hotel', hotelId, { error: String(error) });
    return false;
  }
};

/**
 * Verifica si el usuario está autenticado
 */
export const verifyAuthentication = async (): Promise<boolean> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return !error && !!user;
  } catch (error) {
    return false;
  }
};

/**
 * Función de auditoría de sesión que verifica integridad periódicamente
 */
export const auditSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('validate_session_integrity');
    
    if (error) {
      await logSecurityEvent('session_audit_error', 'security', null, { error: error.message });
      return false;
    }
    
    const isValid = data === true;
    
    if (!isValid) {
      await logSecurityEvent('invalid_session_detected', 'security', null);
    }
    
    return isValid;
  } catch (error) {
    await logSecurityEvent('session_audit_exception', 'security', null, { error: String(error) });
    return false;
  }
};
