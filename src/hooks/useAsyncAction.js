import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useAsyncAction = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Refs for tracking latest values to maintain stable `execute` identity
  // This prevents unnecessary recreations when inline functions/objects are passed
  const optionsRef = useRef(options);
  const loadingRef = useRef(loading);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const execute = useCallback(async (actionFn, overrideOptions = {}) => {
    if (loadingRef.current) return { success: false, error: new Error('Action already in progress') };

    const {
      successMessage,
      errorMessage = 'An error occurred.',
      invalidateKeys,
      onSuccess,
      showToast
    } = { ...optionsRef.current, ...overrideOptions };

    loadingRef.current = true;
    setLoading(true);
    
    try {
      const result = await actionFn();
      
      if (showToast && successMessage) {
        showToast(successMessage, 'success');
      }

      if (invalidateKeys) {
        const keys = Array.isArray(invalidateKeys[0]) ? invalidateKeys : [invalidateKeys];
        keys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('AsyncAction Error:', error);
      if (showToast) {
        // Gracefully handle strings or standard Error objects
        const text = typeof error === 'string' ? error : (error?.message || errorMessage);
        showToast(text, 'error');
      }
      return { success: false, error };
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [queryClient]); // Stable identity

  return { loading, execute };
};
