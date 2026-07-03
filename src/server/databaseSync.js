import { getAdminAuth } from './firebaseAdmin';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const SUPERADMIN_EMAILS = new Set(['kem.phearum@gmail.com'].map(normalizeEmail));

const GITHUB_DISPATCH_URL = 'https://api.github.com/repos/kemphearum/kemphearum.github.io/dispatches';

/**
 * Dispatch the GitHub Actions database-sync workflow (security review F-11,
 * free-tier rebuild of the former Cloud Function). Verifies the caller's
 * Firebase ID token and superadmin email server-side, then dispatches using
 * the GITHUB_DISPATCH_TOKEN env var (never exposed to the client).
 */
export const processDatabaseSync = async ({ authToken, payload }) => {
    // Bypass in local development if service account is missing
    if ((globalThis.process?.env?.NODE_ENV === 'development' || !globalThis.process?.env?.NODE_ENV) && !globalThis.process?.env?.FIREBASE_SERVICE_ACCOUNT_JSON) {
        console.log('Skipping database sync in development due to missing FIREBASE_SERVICE_ACCOUNT_JSON.');
        return { status: 200, body: { success: true } };
    }

    if (!authToken) {
        return { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } } };
    }

    let requesterEmail;
    try {
        const decoded = await getAdminAuth().verifyIdToken(authToken);
        requesterEmail = normalizeEmail(decoded.email);
    } catch {
        return { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid authentication token.' } } };
    }

    if (!SUPERADMIN_EMAILS.has(requesterEmail)) {
        return { status: 403, body: { success: false, error: { code: 'FORBIDDEN', message: 'Only the Super Admin can run database sync.' } } };
    }

    const token = globalThis.process?.env?.GITHUB_DISPATCH_TOKEN;
    if (!token) {
        return { status: 503, body: { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'GitHub dispatch token is not configured.' } } };
    }

    const requestedBy = normalizeEmail(payload?.requestedBy) || requesterEmail;

    try {
        const response = await fetch(GITHUB_DISPATCH_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json',
                'User-Agent': 'portfolio-admin-api'
            },
            body: JSON.stringify({
                event_type: 'manual_database_sync',
                client_payload: { source: 'database-tab', requestedBy }
            })
        });

        if (!response.ok) {
            const message = await response.text();
            console.error('GitHub dispatch failed:', response.status, message);
            return {
                status: response.status === 401 || response.status === 403 ? 403 : 502,
                body: { success: false, error: { code: 'BAD_GATEWAY', message: 'GitHub rejected the database sync request.' } }
            };
        }

        return { status: 200, body: { success: true } };
    } catch (error) {
        console.error('databaseSync error:', error);
        return { status: 502, body: { success: false, error: { code: 'BAD_GATEWAY', message: 'Failed to dispatch database sync.' } } };
    }
};
