
import { supabase } from "@/integrations/supabase/client";

/**
 * Valida que el usuario actual tiene acceso al hotel especificado
 */
export const validateUserHotelAccess = async (hotelId: string): Promise<boolean> => {
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Usuario no autenticado');
      return false;
    }

    // Obtener el hotel del usuario por email
    const { data: userSettings, error } = await supabase
      .from('hotel_user_settings')
      .select('id')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('❌ Error obteniendo configuración del usuario:', error);
      return false;
    }

    const hasAccess = userSettings?.id === hotelId;
    
    console.log('🔐 Validación de acceso al hotel:', {
      userHotelId: userSettings?.id,
      requestedHotelId: hotelId,
      hasAccess
    });

    return hasAccess;
  } catch (error) {
    console.error('❌ Error en validación de seguridad:', error);
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
    .substring(0, 1000); // Limitar longitud
};

/**
 * Valida que un ID de pedido tiene el formato correcto
 */
export const validateOrderId = (orderId: string): boolean => {
  if (!orderId || typeof orderId !== 'string') {
    return false;
  }

  const trimmedId = orderId.trim();
  
  // Debe tener al menos 8 caracteres y ser alfanumérico con guiones
  const uuidPattern = /^[a-f0-9-]{8,}$/i;
  return uuidPattern.test(trimmedId) && trimmedId.length >= 8;
};

/**
 * Valida que un número de habitación es válido
 */
export const validateRoomNumber = (roomNumber: string): boolean => {
  if (!roomNumber || typeof roomNumber !== 'string') {
    return false;
  }

  const trimmed = roomNumber.trim();
  
  // Debe ser alfanumérico, entre 1 y 20 caracteres
  const roomPattern = /^[a-zA-Z0-9]{1,20}$/;
  return roomPattern.test(trimmed);
};

/**
 * Valida que un monto es válido
 */
export const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && 
         amount >= 0 && 
         amount <= 10000 && // Límite máximo razonable
         Number.isFinite(amount);
};
