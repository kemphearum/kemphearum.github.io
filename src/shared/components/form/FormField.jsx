import React from 'react';
import { useFormContext } from 'react-hook-form';
import FormError from './FormError';

/**
 * FormField Component
 * Wraps an input component and connects it to react-hook-form.
 * 
 * @param {string} label - The label for the field
 * @param {string} name - The registration name for the field
 * @param {Object} validation - Validation rules for react-hook-form
 * @param {React.ReactElement} children - The input component to wrap
 */
const FormField = ({ 
  label, 
  name, 
  validation = {}, 
  children 
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className="ui-form-field">
      {label && (
        <label htmlFor={name} className="ui-label">
          {label}
          {validation.required && <span className="ui-label-required">*</span>}
        </label>
      )}
      
      {React.isValidElement(children) ? (
        React.cloneElement(children, {
          id: name,
          ...register(name, validation)
        })
      ) : (
        children
      )}
      
      <FormError message={error?.message} />
    </div>
  );
};

export default FormField;
