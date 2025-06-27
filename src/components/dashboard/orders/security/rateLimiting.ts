
import { supabase } from "@/integrations/supabase/client";
import { logSecurityEvent } from "./securityLogging";

/**
 * Check rate limiting using the new secure database function
 */
export const checkRateLimit = async (
  action: string,
  maxRequests: number = 50,
  windowMinutes: number = 15
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_secure_rate_limit', {
      action_name: action,
      max_requests: maxRequests,
      window_minutes: windowMinutes
    });
    
    if (error) {
      console.error('Rate limit check error:', error);
      await logSecurityEvent('rate_limit_check_error', 'security', null, { 
        error: error.message,
        action 
      });
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Rate limit check exception:', error);
    await logSecurityEvent('rate_limit_check_exception', 'security', null, { 
      error: String(error),
      action 
    });
    return false;
  }
};
