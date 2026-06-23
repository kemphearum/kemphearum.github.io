/**
 * Resolves the base origin for the app's /api/* serverless routes.
 *
 * The API routes only exist on the Vercel SSR deployment. The site is also
 * mirrored on GitHub Pages and Firebase Hosting, where same-origin /api calls
 * would 404 — so off-Vercel we target the primary Vercel origin (cross-origin,
 * covered by the CORS allowlist in src/server/firebaseAdmin.js).
 */
const DEFAULT_PRIMARY_ORIGIN = 'https://phearum-info.vercel.app';

const getPrimaryOrigin = () => {
    const explicit = String(import.meta.env.VITE_PRIMARY_CONTACT_ORIGIN || '').trim();
    return (explicit || DEFAULT_PRIMARY_ORIGIN).replace(/\/$/, '');
};

/**
 * Build a full URL for an /api route. Uses a same-origin path on Vercel and
 * localhost (so local dev and previews work), otherwise the primary origin.
 * @param {string} path - e.g. 'geo', 'auth-log', 'db-sync'
 * @returns {string}
 */
export const apiUrl = (path) => {
    const clean = String(path || '').replace(/^\/+/, '');
    const hostname = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
    const sameOrigin = hostname.endsWith('.vercel.app') || hostname === 'localhost' || hostname === '127.0.0.1';
    if (sameOrigin) {
        return `/api/${clean}`;
    }
    return `${getPrimaryOrigin()}/api/${clean}`;
};
