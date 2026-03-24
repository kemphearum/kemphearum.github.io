import React from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * FormField — Unified layout wrapper for Admin form fields.
 * Supports both react-hook-form (via name prop) and manual state.
 */
const FormField = ({
  label,
  name,
  hint,
  validation = {},
  error: manualError,
  required = false,
  children,
  className = '',
  columns = 1
}) => {
  // Safely attempt to get form context
  const context = useFormContext();
  
  const error = context?.formState?.errors?.[name] || manualError;
  const isRequired = required || validation?.required;

  return (
    <div className={`ui-form-field ${className}`} style={{ gridColumn: `span ${columns}` }}>
      {label && (
        <label htmlFor={name} className="ui-label">
          {label}
          {isRequired && <span className="ui-label-required">*</span>}
        </label>
      )}
      
      <div className="ui-form-field-content">
        {context && name && React.isValidElement(children) ? (
          React.cloneElement(children, {
            id: name,
            ...context.register(name, validation)
          })
        ) : (
          children
        )}
      </div>

      {hint && <p className="ui-form-hint">{hint}</p>}
      {(error || error?.message) && (
        <p className="ui-form-error">{error?.message || error}</p>
      )}
    </div>
  );
};

export default FormField;
