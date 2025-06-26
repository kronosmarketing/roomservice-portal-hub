
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
