import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const RATE_LIMIT_COLLECTION = 'contactRateLimits';
const MESSAGE_COLLECTION = 'messages';

export const ALLOWED_CONTACT_ORIGINS = new Set([
    'https://kemphearum.github.io',
    'https://www.kemphearum.github.io',
    'https://phearum-info.web.app',
    'https://phearum-info.firebaseapp.com',
    'https://kem-phearum.web.app',
    'https://kem-phearum.firebaseapp.com',
    'https://phearum-info.vercel.app',
    'http://localhost:5173'
]);

const parseServiceAccount = () => {
    const raw = globalThis.process?.env?.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON in server environment.');
    }

    const parsed = JSON.parse(raw);
    if (parsed.private_key) {
        parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
    }
    return parsed;
};

const getDb = () => {
    if (!getApps().length) {
        const serviceAccount = parseServiceAccount();
        initializeApp({ credential: cert(serviceAccount) });
    }
    return getFirestore();
};

const normalizeText = (value, maxLength = 5000) => (
    String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, maxLength)
);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const enforceRateLimit = async (db, identifier) => {
    const now = Date.now();
    const minuteMs = 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(identifier);

    await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        const data = snap.exists ? snap.data() : {};

        const minuteWindowStart = Number(data.minuteWindowStart || 0);
        const dayWindowStart = Number(data.dayWindowStart || 0);
        const minuteCount = Number(data.minuteCount || 0);
        const dayCount = Number(data.dayCount || 0);

        const inMinuteWindow = now - minuteWindowStart < minuteMs;
        const inDayWindow = now - dayWindowStart < dayMs;

        const nextMinuteCount = inMinuteWindow ? minuteCount + 1 : 1;
        const nextDayCount = inDayWindow ? dayCount + 1 : 1;

        if (nextMinuteCount > 1) {
            const error = new Error('Too many requests. Please wait a minute.');
            error.code = 'RATE_LIMITED_MINUTE';
            throw error;
        }

        if (nextDayCount > 5) {
            const error = new Error('Daily request limit reached. Please try tomorrow.');
            error.code = 'RATE_LIMITED_DAY';
            throw error;
        }

        tx.set(docRef, {
            minuteWindowStart: inMinuteWindow ? minuteWindowStart : now,
            dayWindowStart: inDayWindow ? dayWindowStart : now,
            minuteCount: nextMinuteCount,
            dayCount: nextDayCount,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
    });
};

export const getClientIpFromHeaders = (headers) => {
    const forwarded = normalizeText(headers?.['x-forwarded-for'] || headers?.get?.('x-forwarded-for') || '', 200);
    const realIp = normalizeText(headers?.['x-real-ip'] || headers?.get?.('x-real-ip') || '', 200);
    const candidate = forwarded.split(',')[0] || realIp || 'unknown';
    return normalizeText(candidate, 100);
};

export const buildCorsHeaders = (origin) => {
    const headers = {
        Vary: 'Origin',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (origin && ALLOWED_CONTACT_ORIGINS.has(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    return headers;
};

export const processContactSubmission = async ({ payload, clientIp }) => {
    const data = payload && typeof payload === 'object' ? payload : {};
    const honeypot = normalizeText(data.website || '', 200);

    if (honeypot) {
        return { status: 200, body: { success: true } };
    }

    const name = normalizeText(data.name, 100);
    const email = normalizeText(data.email, 200).toLowerCase();
    const message = String(data.message || '').trim().slice(0, 5000);

    if (!name || name.length < 2) {
        return { status: 400, body: { success: false, error: 'Name is required.' } };
    }

    if (!email || !isValidEmail(email)) {
        return { status: 400, body: { success: false, error: 'A valid email is required.' } };
    }

    if (!message || message.length < 10) {
        return { status: 400, body: { success: false, error: 'Message is too short.' } };
    }

    try {
        const db = getDb();
        const identifier = `${normalizeText(clientIp, 100)}:${email}`.toLowerCase();

        await enforceRateLimit(db, identifier);
        await db.collection(MESSAGE_COLLECTION).add({
            name,
            email,
            senderEmail: email,
            message,
            isRead: false,
            createdAt: FieldValue.serverTimestamp(),
            source: 'contact-api'
        });

        return { status: 200, body: { success: true } };
    } catch (error) {
        if (error?.code === 'RATE_LIMITED_MINUTE' || error?.code === 'RATE_LIMITED_DAY') {
            return { status: 429, body: { success: false, error: error.message } };
        }

        console.error('Contact API error:', error);
        return { status: 500, body: { success: false, error: 'Internal server error' } };
    }
};
