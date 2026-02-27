import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../firebase';
import { logEvent } from 'firebase/analytics';

/**
 * Custom hook to track page views and provide a custom event tracking function.
 * It automatically sends a 'page_view' event to Firebase Analytics on every route change.
 */
export const useAnalytics = () => {
    const location = useLocation();

    useEffect(() => {
        if (analytics) {
            logEvent(analytics, 'page_view', {
                page_path: location.pathname + location.search,
                page_title: document.title,
            });
        }
    }, [location]);

    /**
     * Manually track a custom event
     * @param {string} eventName - The name of the custom event (e.g. 'download_resume', 'contact_submit')
     * @param {object} eventParams - Optional parameters to attach to the event
     */
    const trackEvent = (eventName, eventParams = {}) => {
        if (analytics) {
            logEvent(analytics, eventName, {
                ...eventParams,
            });
        }
    };

    return { trackEvent };
};
