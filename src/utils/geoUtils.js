/**
 * Centralized utility for fetching IP geolocation data with multiple fallbacks.
 * Prevents console spam by silencing errors and implementing a cooldown.
 */

const DEFAULT_GEO = { country_name: 'Unknown', city: 'Unknown', ip: 'Unknown', country_code: 'UN' };
const COOLDOWN_KEY = 'analytics_geo_failed_cooldown';
const COOLDOWN_TIME = 1000 * 60 * 15; // 15 minutes cooldown if all providers fail

export const fetchGeoData = async () => {
    // 1. Check if we have a success in session storage
    const stored = sessionStorage.getItem('analytics_geo');
    if (stored) return JSON.parse(stored);

    // 2. Check for recent failure cooldown
    const lastFailed = sessionStorage.getItem(COOLDOWN_KEY);
    if (lastFailed && (Date.now() - parseInt(lastFailed, 10) < COOLDOWN_TIME)) {
        return DEFAULT_GEO;
    }

    // 3. Fallback Chain
    const providers = [
        // Provider 1: ipwho.org (New Premium Provider)
        async () => {
            const apiKey = import.meta.env.VITE_IPWHO_API_KEY;
            if (!apiKey) throw new Error('API Key missing');
            const res = await fetch(`https://ipwho.org/api/all?key=${apiKey}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            if (!d.success) throw new Error(d.message || 'API Error');
            return {
                country_name: d.data.geoLocation.country || 'Unknown',
                city: d.data.geoLocation.city || 'Unknown',
                ip: d.data.ip || 'Unknown',
                country_code: d.data.geoLocation.countryCode || 'UN'
            };
        },
        // Provider 2: ipapi.co (Reliable fallback, 30k requests/mo free)
        async () => {
            const res = await fetch('https://ipapi.co/json/');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            return {
                country_name: d.country_name || 'Unknown',
                city: d.city || 'Unknown',
                ip: d.ip || 'Unknown',
                country_code: d.country_code || 'UN'
            };
        },
        // Provider 3: ipify (Final fallback for IP address only)
        async () => {
            const res = await fetch('https://api.ipify.org?format=json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            return { ...DEFAULT_GEO, ip: d.ip || 'Unknown' };
        }
    ];

    for (const provider of providers) {
        try {
            const data = await provider();
            sessionStorage.setItem('analytics_geo', JSON.stringify(data));
            sessionStorage.removeItem(COOLDOWN_KEY); // Reset cooldown on success
            return data;
        } catch (e) {
            // Silently try next provider
            continue;
        }
    }

    // All failed: Trigger cooldown
    sessionStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    return DEFAULT_GEO;
};
