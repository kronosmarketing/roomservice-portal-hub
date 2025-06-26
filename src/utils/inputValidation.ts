
// Input validation utilities for security
export const validateOrderId = (orderId: string): boolean => {
  if (!orderId || typeof orderId !== 'string') {
    return false;
  }
  
  // Order ID should be at least 8 characters and contain only alphanumeric characters and hyphens
  const orderIdRegex = /^[a-zA-Z0-9-]{8,}$/;
  return orderIdRegex.test(orderId.trim());
};

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove HTML/script injection characters
    .substring(0, 255); // Limit length
};

export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (limit to 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'El archivo es demasiado grande. Máximo 10MB' };
  }
  
  // Check file type - allow common document types
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
    'text/plain'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Tipo de archivo no permitido. Solo se permiten PDF, Excel, CSV, JSON y TXT' 
    };
  }
  
  return { isValid: true };
};

export const createSecureWebhookPayload = (file: File, userId: string): FormData => {
  const formData = new FormData();
  
  // Validate inputs
  if (!validateOrderId(userId)) {
    throw new Error('Invalid user ID format');
  }
  
  const fileValidation = validateFileUpload(file);
  if (!fileValidation.isValid) {
    throw new Error(fileValidation.error || 'Invalid file');
  }
  
  formData.append('file', file);
  formData.append('userId', sanitizeInput(userId));
  formData.append('timestamp', new Date().toISOString());
  
  return formData;
};
