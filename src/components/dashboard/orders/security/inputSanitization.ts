
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
