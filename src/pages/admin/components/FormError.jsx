import React from 'react';

/**
 * FormError Component
 * Displays a validation error message.
 * 
 * @param {string} message - The error message to display
 */
const FormError = ({ message }) => {
  if (!message) return null;
  
  return (
    <span className="ui-form-error" style={{ 
      display: 'block', 
      color: 'var(--danger-color, #ef4444)', 
      fontSize: '0.75rem', 
      marginTop: '0.25rem' 
    }}>
      {message}
    </span>
  );
};

export default FormError;
