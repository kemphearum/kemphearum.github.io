import { useEffect } from 'react';

/**
 * Warns the user before leaving the page (refresh, tab close, navigation)
 * while there are unsaved changes. The listener is only attached while
 * `when` is true, so it has no effect for pristine forms.
 *
 * @param {boolean} when - whether there are unsaved changes to guard
 */
export const useUnsavedChangesWarning = (when) => {
    useEffect(() => {
        if (!when || typeof window === 'undefined') return undefined;

        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = '';
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [when]);
};

export default useUnsavedChangesWarning;
