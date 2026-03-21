import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';

/**
 * Form Component
 * A wrapper for react-hook-form with FormProvider.
 * 
 * @param {Object} defaultValues - Initial values for the form
 * @param {Function} onSubmit - Callback for form submission
 * @param {React.ReactNode} children - Form fields and buttons
 * @param {string} className - Optional className for the form element
 */
const Form = ({ 
  defaultValues, 
  onSubmit, 
  children, 
  className = '' 
}) => {
  const methods = useForm({
    defaultValues
  });

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={methods.handleSubmit(onSubmit)} 
        className={className}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
};

export default Form;
