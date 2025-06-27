
import React, { createContext, useContext, ReactNode } from 'react';
import { validateAndSanitizeText, validateAmount, validateRoomNumber } from './security/inputValidation';

interface ValidationUtils {
  validateAndSanitizeText: typeof validateAndSanitizeText;
  validateAmount: typeof validateAmount;
  validateRoomNumber: typeof validateRoomNumber;
}

const ValidationContext = createContext<ValidationUtils | null>(null);

interface SecureInputValidationProps {
  children: (utils: ValidationUtils) => ReactNode;
}

const SecureInputValidation = ({ children }: SecureInputValidationProps) => {
  const utils: ValidationUtils = {
    validateAndSanitizeText,
    validateAmount,
    validateRoomNumber,
  };

  return (
    <ValidationContext.Provider value={utils}>
      {children(utils)}
    </ValidationContext.Provider>
  );
};

export default SecureInputValidation;
