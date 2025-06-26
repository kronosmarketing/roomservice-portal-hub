
import { supabase } from "@/integrations/supabase/client";

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
 * Sanitiza una cadena de texto para prevenir inyecciones
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Eliminar scripts
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+\s*=/gi, '') // Eliminar event handlers
    .replace(/data:/gi, '') // Eliminar data URLs
    .replace(/vbscript:/gi, '') // Eliminar vbscript
    .replace(/expression\s*\(/gi, '') // Eliminar CSS expressions
    .substring(0, 1000); // Limitar longitud
};

/**
 * Sanitiza HTML básico permitiendo solo tags seguros
 */
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Lista de tags permitidos
  const allowedTags = ['b', 'i', 'em', 'strong', 'br', 'p'];
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
  
  return input.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match;
    }
    return '';
  });
};

/**
 * Valida que un ID de pedido tiene el formato correcto
 */
export const validateOrderId = (orderId: string): boolean => {
  if (!orderId || typeof orderId !== 'string') {
    return false;
  }

  const trimmedId = orderId.trim();
  
  // Debe ser un UUID válido
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(trimmedId);
};

/**
 * Valida que un número de habitación es válido
 */
export const validateRoomNumber = (roomNumber: string): boolean => {
  if (!roomNumber || typeof roomNumber !== 'string') {
    return false;
  }

  const trimmed = roomNumber.trim();
  
  // Debe ser alfanumérico, entre 1 y 20 caracteres, sin caracteres especiales peligrosos
  const roomPattern = /^[a-zA-Z0-9\-]{1,20}$/;
  return roomPattern.test(trimmed);
};

/**
 * Valida que un monto es válido
 */
export const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && 
         amount >= 0 && 
         amount <= 10000 && // Límite máximo razonable
         Number.isFinite(amount) &&
         !Number.isNaN(amount);
};

/**
 * Valida que un email tiene formato válido
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email) && email.length <= 254;
};

/**
 * Valida que un teléfono tiene formato válido
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
  return phonePattern.test(phone.replace(/[\s\-\(\)]/g, ''));
};

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
 * Genera un hash seguro para validación de integridad
 */
export const generateSecureHash = async (data: string): Promise<string> => {
  try {
    // Usar Web Crypto API para generar hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Fallback simple si no está disponible crypto API
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '');
  }
};

/**
 * Valida archivo subido
 */
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  // Validar tamaño (10MB máximo)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'El archivo excede el tamaño máximo de 10MB' };
  }

  // Validar tipos de archivo permitidos
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/json',
    'text/plain'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido' };
  }

  // Validar nombre de archivo
  const fileName = file.name;
  if (!/^[a-zA-Z0-9\-_\.\s]+$/.test(fileName) || fileName.length > 255) {
    return { valid: false, error: 'Nombre de archivo inválido' };
  }

  return { valid: true };
};

/**
 * Rate limiting simple en memoria (para producción usar Redis)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
};

/**
 * Valida y sanitiza datos de entrada con validación específica por tipo
 */
export const validateAndSanitizeInput = (
  input: string, 
  type: 'text' | 'email' | 'phone' | 'roomNumber' | 'orderId' | 'amount',
  maxLength: number = 255
): { isValid: boolean; sanitizedValue: string; error?: string } => {
  
  if (!input || typeof input !== 'string') {
    return { isValid: false, sanitizedValue: '', error: 'Entrada requerida' };
  }

  const sanitized = sanitizeInput(input).substring(0, maxLength);
  
  switch (type) {
    case 'email':
      if (!validateEmail(sanitized)) {
        return { isValid: false, sanitizedValue: sanitized, error: 'Formato de email inválido' };
      }
      break;
    case 'phone':
      if (!validatePhone(sanitized)) {
        return { isValid: false, sanitizedValue: sanitized, error: 'Formato de teléfono inválido' };
      }
      break;
    case 'roomNumber':
      if (!validateRoomNumber(sanitized)) {
        return { isValid: false, sanitizedValue: sanitized, error: 'Número de habitación inválido' };
      }
      break;
    case 'orderId':
      if (!validateOrderId(sanitized)) {
        return { isValid: false, sanitizedValue: sanitized, error: 'Formato de ID de pedido inválido' };
      }
      break;
    case 'amount':
      const numValue = parseFloat(sanitized);
      if (!validateAmount(numValue)) {
        return { isValid: false, sanitizedValue: sanitized, error: 'Monto inválido' };
      }
      break;
    case 'text':
    default:
      if (sanitized.length === 0) {
        return { isValid: false, sanitizedValue: sanitized, error: 'Texto requerido' };
      }
      break;
  }

  return { isValid: true, sanitizedValue: sanitized };
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
