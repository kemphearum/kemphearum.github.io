import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, db } from '../firebase';
import { logEvent } from 'firebase/analytics';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const getSessionId = () => {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
};

const getDeviceType = () => {
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

    useEffect(() => {
        // --- 1. FIREBASE GA4 TRACKING ---
        if (analytics) {
            logEvent(analytics, 'page_view', {
                page_path: location.pathname + location.search,
                page_title: document.title,
            });
        }

        // --- 2. CUSTOM FIRESTORE TRACKING (For Admin Dashboard) ---
        const logVisitToFirestore = async () => {
            // Prevent strict-mode double-firing on the exact same path
            if (hasLogFired.current[location.pathname]) return;
            hasLogFired.current[location.pathname] = true;

            try {
                const sessionId = getSessionId();
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

                // Client-side dedup using sessionStorage (avoids needing Firestore read permissions)
                const dedupKey = `visit_${location.pathname}`;
                const lastLogged = sessionStorage.getItem(dedupKey);
                if (lastLogged) {
                    const diffMinutes = (Date.now() - parseInt(lastLogged, 10)) / (1000 * 60);
                    if (diffMinutes < 30) return; // Don't re-log within 30 minutes
                }

                const visitsRef = collection(db, 'visits');

                // Fetch basic geo-data (completely free, no API key needed for basic usage)
                let geoData = { country_name: 'Unknown', city: 'Unknown', ip: 'Unknown', country_code: 'UN' };

                try {
                    const storedGeo = sessionStorage.getItem('analytics_geo');
                    if (storedGeo) {
                        geoData = JSON.parse(storedGeo);
                    } else {
                        const res = await fetch('https://ipapi.co/json/');
                        if (res.ok) {
                            const data = await res.json();
                            geoData = {
                                country_name: data.country_name || 'Unknown',
                                city: data.city || 'Unknown',
                                ip: data.ip || 'Unknown',
                                country_code: data.country_code || 'UN'
                            };
                            sessionStorage.setItem('analytics_geo', JSON.stringify(geoData));
                        }
                    }
                } catch (e) {
                    console.warn("Could not fetch IP data (adblocker or network error). Logging anyway.", e);
                }

                // Save to Firestore
                await addDoc(visitsRef, {
                    sessionId,
                    path: location.pathname,
                    timestamp: serverTimestamp(),
                    date: today,
                    userAgent: navigator.userAgent,
                    device: getDeviceType(),
                    country: geoData.country_name,
                    countryCode: geoData.country_code,
                    city: geoData.city,
                    ip: geoData.ip,
                    referrer: document.referrer || 'Direct'
                });

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

        return () => clearTimeout(timeoutId);
    }, [location.pathname, location.search]);

    const trackEvent = (eventName, eventParams = {}) => {
        if (analytics) {
            logEvent(analytics, eventName, { ...eventParams });
        }
    };

    return { trackEvent };
};
