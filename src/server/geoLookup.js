import { getClientIp } from './firebaseAdmin';

const DEFAULT_GEO = { country_name: 'Unknown', city: 'Unknown', ip: 'Unknown', country_code: 'UN' };

/**
 * Server-side geolocation lookup (security review F-04). Keeps the paid ipify
 * key out of the client bundle — the key lives only in the IPIFY_API_KEY env
 * var on Vercel. Resolves the visitor's IP from the forwarded header.
 */
export const processGeoLookup = async ({ headers }) => {
    const ip = getClientIp(headers);
    const fallback = { ...DEFAULT_GEO, ip: ip && ip !== 'unknown' ? ip : 'Unknown' };
    const key = globalThis.process?.env?.IPIFY_API_KEY;

    if (!key) {
        return { status: 200, body: fallback };
    }

    try {
        const url = `https://geo.ipify.org/api/v2/country,city?apiKey=${key}`
            + (ip && ip !== 'unknown' ? `&ipAddress=${encodeURIComponent(ip)}` : '');
        const response = await fetch(url);
        if (!response.ok) {
            return { status: 200, body: fallback };
        }
        const d = await response.json();
        return {
            status: 200,
            body: {
                country_name: (d.location && d.location.country) || 'Unknown',
                city: (d.location && d.location.city) || 'Unknown',
                ip: d.ip || fallback.ip,
                country_code: (d.location && d.location.country) || 'UN'
            }
        };
    } catch (error) {
        console.error('geoLookup error:', error);
        return { status: 200, body: fallback };
    }
};
