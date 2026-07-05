import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth as adminGetAuth } from 'firebase-admin/auth';
import { ALLOWED_CONTACT_ORIGINS } from './contactSubmission';

/**
 * Shared Firebase Admin bootstrap for Vercel serverless / React Router resource
 * routes. Everything here runs on the free tier (Vercel functions + Firebase
 * Spark) — no Cloud Functions / Blaze required. Credentials come from the
 * FIREBASE_SERVICE_ACCOUNT_JSON env var already configured for the contact API.
 */
const parseServiceAccount = () => {
    const raw = globalThis.process?.env?.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
        if (globalThis.process?.env?.NODE_ENV === 'development' || !globalThis.process?.env?.NODE_ENV) {
            console.warn('⚠️ Missing FIREBASE_SERVICE_ACCOUNT_JSON in development. Admin SDK disabled.');
            return null;
        }
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON in server environment.');
    }
    try {
        const parsed = JSON.parse(raw);
        if (parsed.private_key) {
            parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
        }
        return parsed;
    } catch {
        if (globalThis.process?.env?.NODE_ENV === 'development') {
            console.warn('⚠️ Invalid FIREBASE_SERVICE_ACCOUNT_JSON format in development. Admin SDK disabled.');
            return null;
        }
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format.');
    }
};

const ensureApp = () => {
    if (!getApps().length) {
        const sa = parseServiceAccount();
        if (!sa) {
            throw new Error('Admin SDK is disabled. FIREBASE_SERVICE_ACCOUNT_JSON is missing.');
        }
        initializeApp({ credential: cert(sa) });
    }
};

export const getDb = () => {
    ensureApp();
    return getFirestore();
};

export const getAdminAuth = () => {
    ensureApp();
    return adminGetAuth();
};

// Reuse the same allowlist the contact endpoint trusts, so all API routes
// share one CORS policy.
export const ALLOWED_API_ORIGINS = ALLOWED_CONTACT_ORIGINS;

export const buildApiCorsHeaders = (origin, requestUrl, { methods = 'POST, OPTIONS', allowHeaders = 'Content-Type' } = {}) => {
    const headers = {
        Vary: 'Origin',
        'Access-Control-Allow-Methods': methods,
        'Access-Control-Allow-Headers': allowHeaders
    };
    
    let isAllowed = false;
    if (origin) {
        if (ALLOWED_API_ORIGINS.has(origin) || origin.endsWith('.vercel.app')) {
            isAllowed = true;
        } else if (requestUrl) {
            try {
                const requestOrigin = new URL(requestUrl).origin;
                if (origin === requestOrigin) {
                    isAllowed = true;
                }
            } catch {
                // ignore
            }
        }
    }
    
    if (isAllowed) {
        headers['Access-Control-Allow-Origin'] = origin;
    }
    return headers;
};

export const normalizeText = (value, maxLength = 5000) => (
    String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, maxLength)
);

export const apiSuccess = (data = null, status = 200) => ({
    status,
    body: { success: true, ...(data && { data }) }
});

export const apiError = (message, code = 'INTERNAL_ERROR', status = 500) => ({
    status,
    body: { success: false, error: { code, message } }
});


export const getBearerToken = (request) => {
    const header = String(request.headers.get('authorization') || '');
    return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

export const parseRequestPayload = async (request) => {
    const contentType = String(request.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
        return await request.json();
    }
    const raw = await request.text();
    if (!raw) return {};
    if (contentType.includes('application/x-www-form-urlencoded')) {
        return Object.fromEntries(new URLSearchParams(raw).entries());
    }
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

export const getClientIp = (headers) => {
    const read = (key) => (
        typeof headers?.get === 'function' ? headers.get(key) : headers?.[key]
    );
    const forwarded = normalizeText(read('x-forwarded-for') || '', 200);
    const realIp = normalizeText(read('x-real-ip') || '', 200);
    return normalizeText(forwarded.split(',')[0] || realIp || 'unknown', 100);
};

/**
 * Fixed-window per-identifier rate limiter backed by Firestore.
 * Throws an Error with code 'RATE_LIMITED' when a window is exceeded.
 */
export const enforceRateLimit = async (db, collectionName, identifier, { perMinute, perDay }) => {
    const now = Date.now();
    const minuteMs = 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    const ref = db.collection(collectionName).doc(identifier || 'unknown');

    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : {};
        const minuteWindowStart = Number(data.minuteWindowStart || 0);
        const dayWindowStart = Number(data.dayWindowStart || 0);
        const minuteCount = Number(data.minuteCount || 0);
        const dayCount = Number(data.dayCount || 0);

        const inMinuteWindow = now - minuteWindowStart < minuteMs;
        const inDayWindow = now - dayWindowStart < dayMs;
        const nextMinuteCount = inMinuteWindow ? minuteCount + 1 : 1;
        const nextDayCount = inDayWindow ? dayCount + 1 : 1;

        if (perMinute && nextMinuteCount > perMinute) {
            const error = new Error('Too many requests. Please wait a minute.');
            error.code = 'RATE_LIMITED';
            throw error;
        }
        if (perDay && nextDayCount > perDay) {
            const error = new Error('Daily request limit reached. Please try later.');
            error.code = 'RATE_LIMITED';
            throw error;
        }

        tx.set(ref, {
            minuteWindowStart: inMinuteWindow ? minuteWindowStart : now,
            dayWindowStart: inDayWindow ? dayWindowStart : now,
            minuteCount: nextMinuteCount,
            dayCount: nextDayCount,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
    });
};
