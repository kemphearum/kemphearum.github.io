import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../firebase';
import { logEvent } from 'firebase/analytics';
import { AnalyticsService } from '../services/AnalyticsService';
// Local reference to avoid some scope/minification issues
const analyticsSvc = AnalyticsService;
import { fetchGeoData } from '../utils/geoUtils';
import { parseUserAgent, isReturningVisitor } from '../utils/uaUtils';

export const getSessionId = () => {
    if (typeof window === 'undefined') return 'ssr-session';
    try {
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    } catch (e) {
        return 'no-session-support';
    }
};

export const getDeviceType = () => {
    if (typeof window === 'undefined' || !navigator?.userAgent) return "desktop";
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "mobile";
    return "desktop";
};

/**
 * Custom hook to track page views and provide a custom event tracking function.
 * It automatically sends a 'page_view' event to Firebase Analytics on every route change.
 * It ALSO logs the visit to a custom Firestore "visits" collection for the Admin dashboard.
 */
export const useAnalytics = () => {
    const location = useLocation();
    const hasLogFired = useRef({});
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        const path = location.pathname;
        startTimeRef.current = Date.now();

        // --- 1. FIREBASE GA4 TRACKING ---
        if (analytics) {
            logEvent(analytics, 'page_view', {
                page_path: path + location.search,
                page_title: document.title,
            });
        }

        // --- 2. CUSTOM FIRESTORE TRACKING (For Admin Dashboard) ---
        const logVisitToFirestore = async () => {
            // Prevent strict-mode double-firing on the exact same path
            if (hasLogFired.current[path]) return;
            hasLogFired.current[path] = true;

            try {
                const sessionId = getSessionId();
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

                // Client-side dedup using sessionStorage (avoids needing Firestore read permissions)
                const dedupKey = `visit_${path}`;
                const lastLogged = sessionStorage.getItem(dedupKey);
                if (lastLogged) {
                    const diffMinutes = (Date.now() - parseInt(lastLogged, 10)) / (1000 * 60);
                    if (diffMinutes < 30) return; // Don't re-log within 30 minutes
                }

                // Fetch geo-data and UA details
                const geoData = await fetchGeoData();
                const { browser, os } = parseUserAgent(navigator.userAgent);
                const isReturning = isReturningVisitor();

                // Save to Firestore via Service
                const visitRecord = {
                    sessionId,
                    path,
                    date: today,
                    userAgent: navigator.userAgent,
                    device: getDeviceType(),
                    browser,
                    os,
                    isReturning,
                    country: geoData.country_name,
                    countryCode: geoData.country_code,
                    city: geoData.city,
                    ip: geoData.ip,
                    referrer: document.referrer || 'Direct',
                    timestamp: new Date()
                };

                const visitId = await analyticsSvc.logVisit(visitRecord);
                
                // Store visit ID to update duration on cleanup
                if (visitId) {
                    sessionStorage.setItem(`last_visit_id_${path}`, visitId);
                }

                // Mark as logged in sessionStorage
                sessionStorage.setItem(dedupKey, Date.now().toString());

            } catch (error) {
                console.error("Error logging visit to Firestore:", error);
            }
        };

        // Delay slightly so it doesn't block UI rendering or cause a stutter
        const timeoutId = setTimeout(() => {
            logVisitToFirestore();
        }, 1000);

        // --- 3. DURATION TRACKING (Cleanup) ---
        return () => {
            clearTimeout(timeoutId);
            const endTime = Date.now();
            const durationSeconds = Math.round((endTime - startTimeRef.current) / 1000);
            const visitId = sessionStorage.getItem(`last_visit_id_${path}`);
            
            // Only update if they stayed for more than 2 seconds (ignore bounces/skips)
            if (visitId && durationSeconds > 2) {
                analyticsSvc.updateVisitDuration(visitId, durationSeconds).catch(() => {});
                sessionStorage.removeItem(`last_visit_id_${path}`);
            }
        };
    }, [location.pathname, location.search]);

    const trackEvent = (eventName, eventParams = {}) => {
        if (analytics) {
            logEvent(analytics, eventName, { ...eventParams });
        }
    };

    return { trackEvent };
};
