import { buildApiCorsHeaders, parseRequestPayload, getClientIp, getDb, enforceRateLimit, normalizeText } from '../../src/server/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const toJsonResponse = (body, status, headers = {}) => (
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    })
);

const sanitizeVisitString = (value, fallback = 'Unknown', max = 256) => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim();
    if (!normalized) return fallback;
    return normalized.slice(0, max);
};

export async function action({ request }) {
    const origin = String(request.headers.get('origin') || '');
    const corsHeaders = buildApiCorsHeaders(origin, { methods: 'POST, PUT, OPTIONS' });

    if (request.method === 'OPTIONS') {
        return new Response('', { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST' && request.method !== 'PUT') {
        return toJsonResponse({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, 405, corsHeaders);
    }

    try {
        const payload = await parseRequestPayload(request);
        const clientIp = getClientIp(request.headers);
        const db = getDb();
        const ipIdentifier = `ip:${clientIp.toLowerCase()}`;

        // Rate limit: Max 10 analytics payloads per IP per day, max 3 per minute
        await enforceRateLimit(db, 'analyticsRateLimits', ipIdentifier, { perMinute: 3, perDay: 10 });

        if (request.method === 'POST') {
            const dateKey = new Date().toISOString().split('T')[0];
            const sanitizedPayload = {
                sessionId: sanitizeVisitString(payload?.sessionId, 'unknown-session', 128),
                path: sanitizeVisitString(payload?.path, '/', 512),
                date: sanitizeVisitString(payload?.date || dateKey, dateKey, 10),
                userAgent: sanitizeVisitString(payload?.userAgent, 'Unknown', 1024),
                device: sanitizeVisitString(payload?.device, 'desktop', 24).toLowerCase(),
                browser: sanitizeVisitString(payload?.browser, 'Unknown', 80),
                os: sanitizeVisitString(payload?.os, 'Unknown', 80),
                isReturning: Boolean(payload?.isReturning),
                country: sanitizeVisitString(payload?.country, 'Unknown', 100),
                countryCode: sanitizeVisitString(payload?.countryCode, 'UN', 3).toUpperCase(),
                city: sanitizeVisitString(payload?.city, 'Unknown', 120),
                ip: sanitizeVisitString(clientIp, 'Unknown', 64),
                referrer: sanitizeVisitString(payload?.referrer, 'Direct', 1024),
                duration: 0
            };

            const docRef = await db.collection('visits').add({
                ...sanitizedPayload,
                timestamp: FieldValue.serverTimestamp()
            });

            return toJsonResponse({ success: true, data: { id: docRef.id } }, 200, corsHeaders);
        }

        if (request.method === 'PUT') {
            const visitId = normalizeText(payload?.id, 100);
            const durationSeconds = payload?.duration;

            if (!visitId) {
                return toJsonResponse({ success: false, error: { code: 'BAD_REQUEST', message: 'Visit ID is required' } }, 400, corsHeaders);
            }

            const normalizedDuration = Number.isFinite(Number(durationSeconds)) ? Math.floor(Number(durationSeconds)) : 0;
            const safeDuration = Math.max(0, Math.min(86400, normalizedDuration));

            await db.collection('visits').doc(visitId).update({
                duration: safeDuration
            });

            return toJsonResponse({ success: true }, 200, corsHeaders);
        }
    } catch (error) {
        if (error?.code === 'RATE_LIMITED') {
            return toJsonResponse({ success: false, error: { code: 'RATE_LIMITED', message: error.message } }, 429, corsHeaders);
        }
        console.error('Analytics API error:', error);
        return toJsonResponse({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500, corsHeaders);
    }
}

export async function loader({ request }) {
    const origin = String(request.headers.get('origin') || '');
    const corsHeaders = buildApiCorsHeaders(origin);
    return toJsonResponse({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, 405, corsHeaders);
}
