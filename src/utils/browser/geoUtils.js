/**
 * Centralized utility for fetching IP geolocation data with multiple fallbacks.
 * Prevents console spam by blocking failing providers and handling concurrent calls.
 */

const DEFAULT_GEO = { country_name: 'Unknown', city: 'Unknown', ip: 'Unknown', country_code: 'UN' };
const COOLDOWN_KEY = 'analytics_geo_failed_cooldown';
const BLOCKLIST_PREFIX = 'analytics_geo_blocked_';
const COOLDOWN_TIME = 1000 * 60 * 60 * 24; // 24 hour global cooldown if all fail
const BLOCK_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days block for specific failing providers

let pendingPromise = null;

export const fetchGeoData = async () => {
    if (pendingPromise) return pendingPromise;

    pendingPromise = (async () => {
        try {
            // 1. Check if we have a success in session storage
            const stored = sessionStorage.getItem('analytics_geo');
            if (stored) return JSON.parse(stored);

            // 2. Check for recent global failure cooldown
            const lastFailed = localStorage.getItem(COOLDOWN_KEY);
            if (lastFailed && (Date.now() - parseInt(lastFailed, 10) < COOLDOWN_TIME)) {
                return DEFAULT_GEO;
            }

            // 3. Fallback Chain
            const providers = [
                {
                    name: 'ipify_premium',
                    fn: async () => {
                        const apiKey = import.meta.env.VITE_IPIFY_API_KEY;
                        // If key is missing, treat as permanent error to avoid network noise
                        if (!apiKey) throw new Error('CONFIG_MISSING');
                        
                        const res = await fetch(`https://geo.ipify.org/api/v2/country,city?apiKey=${apiKey}`);
                        if (!res.ok) throw new Error(`${res.status}`);
                        const d = await res.json();
                        return {
                            country_name: d.location?.country || 'Unknown',
                            city: d.location?.city || 'Unknown',
                            ip: d.ip || 'Unknown',
                            country_code: d.location?.country || 'UN'
                        };
                    }
                },
                {
                    name: 'ipwhois',
                    fn: async () => {
                        const res = await fetch('https://ipwho.is/');
                        if (!res.ok) throw new Error(`${res.status}`);
                        const d = await res.json();
                        return {
                            country_name: d.country || 'Unknown',
                            city: d.city || 'Unknown',
                            ip: d.ip || 'Unknown',
                            country_code: d.country_code || 'UN'
                        };
                    }
                },
                {
                    name: 'ipify_basic',
                    fn: async () => {
                        const res = await fetch('https://api.ipify.org?format=json');
                        if (!res.ok) throw new Error(`${res.status}`);
                        const d = await res.json();
                        return { ...DEFAULT_GEO, ip: d.ip || 'Unknown' };
                    }
                }
            ];

            for (const provider of providers) {
                // Check if this specific provider is blocked (prevents the call entirely)
                const blockedUntil = localStorage.getItem(`${BLOCKLIST_PREFIX}${provider.name}`);
                if (blockedUntil && (blockedUntil === 'permanent' || Date.now() < parseInt(blockedUntil, 10))) {
                    continue;
                }

                try {
                    const data = await provider.fn();
                    sessionStorage.setItem('analytics_geo', JSON.stringify(data));
                    localStorage.removeItem(COOLDOWN_KEY);
                    return data;
                } catch (e) {
                    const status = e.message;
                    
                    // If config is missing, block permanently
                    if (status === 'CONFIG_MISSING') {
                        localStorage.setItem(`${BLOCKLIST_PREFIX}${provider.name}`, 'permanent');
                    } else {
                        // For all other errors (403, network failure), block for 7 days
                        localStorage.setItem(`${BLOCKLIST_PREFIX}${provider.name}`, (Date.now() + BLOCK_DURATION).toString());
                        
                        // Only log real functional errors, not expected blocks/missing keys
                        if (provider.name === 'ipify_premium' && status !== '403' && status !== '401') {
                            console.warn("Premium Geolocation failed:", status);
                        }
                    }
                    continue;
                }
            }

            // All failed: Trigger global cooldown
            localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
            return DEFAULT_GEO;
        } finally {
            pendingPromise = null;
        }
    })();

    return pendingPromise;
};
