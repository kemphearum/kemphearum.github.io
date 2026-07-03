import { FieldValue } from 'firebase-admin/firestore';
import { getDb, getAdminAuth, getClientIp, normalizeText, enforceRateLimit } from './firebaseAdmin';

const RATE_LIMIT_COLLECTION = 'authLogRateLimits';
const AUDIT_COLLECTION = 'auditLogs';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

/**
 * Record an auth event (security review F-03/F-07). Failed logins are not
 * authenticated, so the client cannot write auditLogs directly (rules require
 * a session). This runs server-side with the Admin SDK (rules-bypassing) and
 * is rate-limited per IP to curb forged-failure spam.
 *
 * If an Authorization: Bearer <idToken> header is present it is verified, and
 * the logged email must match the token — so authenticated callers cannot
 * spoof another user's events.
 *
 * Unverified callers cannot record 'success': without this, anyone could
 * forge successful-login entries for any email and pollute the audit trail.
 * The only legitimate unauthenticated success is a magic-link request, which
 * is anonymously triggerable from the login form anyway, so it stays allowed
 * (its flow label makes it distinguishable from a login).
 */
export const processAuthEvent = async ({ payload, headers, authToken }) => {
    const data = payload && typeof payload === 'object' ? payload : {};
    const claimedStatus = data.status === 'failure' ? 'failure' : 'success';
    const email = normalizeEmail(data.email);

    if (!email || !isValidEmail(email)) {
        return { status: 400, body: { success: false, error: { code: 'BAD_REQUEST', message: 'A valid email is required.' } } };
    }

    // Bypass in local development if service account is missing
    if ((globalThis.process?.env?.NODE_ENV === 'development' || !globalThis.process?.env?.NODE_ENV) && !globalThis.process?.env?.FIREBASE_SERVICE_ACCOUNT_JSON) {
        console.log('Skipping auth audit log in development due to missing FIREBASE_SERVICE_ACCOUNT_JSON.');
        return { status: 200, body: { success: true } };
    }

    try {
        const db = getDb();

        // If a token is supplied, it must belong to the email being logged.
        let verified = false;
        if (authToken) {
            try {
                const decoded = await getAdminAuth().verifyIdToken(authToken);
                if (normalizeEmail(decoded.email) !== email) {
                    return { status: 403, body: { success: false, error: { code: 'FORBIDDEN', message: 'Email does not match the authenticated user.' } } };
                }
                verified = true;
            } catch {
                return { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid authentication token.' } } };
            }
        }

        const flow = typeof data.details?.flow === 'string' ? data.details.flow : '';
        const status = (verified || claimedStatus === 'failure' || flow === 'magic_link_request')
            ? claimedStatus
            : 'failure';

        const ip = getClientIp(headers);
        await enforceRateLimit(db, RATE_LIMIT_COLLECTION, ip, { perMinute: 10, perDay: 100 });

        await db.collection(AUDIT_COLLECTION).add({
            email,
            status,
            reason: typeof data.reason === 'string' ? data.reason.slice(0, 500) : null,
            ipAddress: ip,
            country: normalizeText(data.country, 100),
            city: normalizeText(data.city, 120),
            userAgent: normalizeText(data.userAgent, 1024),
            deviceType: normalizeText(data.deviceType, 40),
            sessionId: normalizeText(data.sessionId, 128),
            details: data.details && typeof data.details === 'object' ? data.details : {},
            timestamp: FieldValue.serverTimestamp(),
            source: 'auth-api'
        });

        return { status: 200, body: { success: true } };
    } catch (error) {
        if (error?.code === 'RATE_LIMITED') {
            return { status: 429, body: { success: false, error: { code: 'RATE_LIMITED', message: error.message } } };
        }
        console.error('Auth audit API error:', error);
        return { status: 500, body: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } } };
    }
};
