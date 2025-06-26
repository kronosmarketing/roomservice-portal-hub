
import { supabase } from "@/integrations/supabase/client";

/**
 * Registra eventos de seguridad
 */
export const logSecurityEvent = async (
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
): Promise<void> => {
  try {
    await supabase.rpc('log_security_event', {
      p_action: action,
      p_resource_type: resourceType || null,
      p_resource_id: resourceId || null,
      p_details: details ? JSON.stringify(details) : null
    });
  } catch (error) {
    // Silenciar errores de logging para no afectar funcionalidad principal
    console.error('Error logging security event:', error);
  }
};
