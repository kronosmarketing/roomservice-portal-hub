
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

  const sanitized = input.trim().substring(0, maxLength);
  
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
