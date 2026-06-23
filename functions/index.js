const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
admin.initializeApp();

// Secrets (set with: firebase functions:secrets:set <NAME>)
const GITHUB_DISPATCH_TOKEN = defineSecret("GITHUB_DISPATCH_TOKEN");
const IPIFY_API_KEY = defineSecret("IPIFY_API_KEY");

const DEFAULT_SUPERADMIN_EMAILS = ['kem.phearum@gmail.com'];
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const SUPERADMIN_EMAILS = new Set(
    DEFAULT_SUPERADMIN_EMAILS.map(normalizeEmail)
);

const DEFAULT_GEO = { country_name: 'Unknown', city: 'Unknown', ip: 'Unknown', country_code: 'UN' };

// ---------------------------------------------------------------------------
// Admin: enable/disable a Firebase Auth account (superadmin only).
// Migrated to the v2 callable API: the handler receives a single `request`
// (request.auth, request.data) — the old v1 (data, context) signature crashed
// on firebase-functions v7 because `context` is undefined.
// ---------------------------------------------------------------------------
exports.toggleUserStatus = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }

    const requesterEmail = normalizeEmail(request.auth.token.email);
    if (!SUPERADMIN_EMAILS.has(requesterEmail)) {
        throw new HttpsError('permission-denied', 'Only the Super Admin can enable or disable user accounts.');
    }

    const { targetEmail, disableFlag } = request.data || {};
    if (!targetEmail) {
        throw new HttpsError('invalid-argument', 'The target email must be provided.');
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(targetEmail);
        await admin.auth().updateUser(userRecord.uid, { disabled: Boolean(disableFlag) });
        return {
            success: true,
            message: `User ${targetEmail} has been successfully ${disableFlag ? 'disabled' : 'enabled'}.`
        };
    } catch (error) {
        logger.error("Error toggling user status:", error);
        if (error.code === 'auth/user-not-found') {
            throw new HttpsError('not-found', `No user found with email ${targetEmail}.`);
        }
        throw new HttpsError('internal', 'An internal error occurred while updating the user.');
    }
});

// ---------------------------------------------------------------------------
// Admin: dispatch the GitHub Actions database-sync workflow (superadmin only).
// ---------------------------------------------------------------------------
exports.triggerDatabaseSync = onCall({ secrets: [GITHUB_DISPATCH_TOKEN] }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to run database sync.');
    }

    const requesterEmail = normalizeEmail(request.auth.token.email);
    if (!SUPERADMIN_EMAILS.has(requesterEmail)) {
        throw new HttpsError('permission-denied', 'Only the Super Admin can run database sync.');
    }

    const token = GITHUB_DISPATCH_TOKEN.value() || process.env.GITHUB_DISPATCH_TOKEN;
    if (!token) {
        throw new HttpsError('failed-precondition', 'GitHub dispatch token is not configured on the backend.');
    }

    const requestedBy = normalizeEmail(request.data && request.data.requestedBy) || requesterEmail;

    try {
        const response = await fetch(
            'https://api.github.com/repos/kemphearum/kemphearum.github.io/dispatches',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'Content-Type': 'application/json',
                    'User-Agent': 'portfolio-admin-function'
                },
                body: JSON.stringify({
                    event_type: 'manual_database_sync',
                    client_payload: { source: 'database-tab', requestedBy }
                })
            }
        );

        if (!response.ok) {
            const message = await response.text();
            logger.error('GitHub dispatch failed:', response.status, message);
            throw new HttpsError(
                response.status === 401 || response.status === 403 ? 'permission-denied' : 'internal',
                'GitHub rejected the database sync request.'
            );
        }

        return { success: true };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error('triggerDatabaseSync error:', error);
        throw new HttpsError('internal', 'Failed to dispatch database sync.');
    }
});

const BOT_USER_AGENTS = [
    'telegrambot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
    'slackbot', 'whatsapp', 'pinterest', 'googlebot', 'discordbot',
    'skypeuripreview', 'embedly', 'outbrain'
];

const DEFAULT_PUBLIC_HOST = 'phearum-info.web.app';
const ALLOWED_PUBLIC_HOSTS = new Set([
    DEFAULT_PUBLIC_HOST,
    'phearum-info.firebaseapp.com',
    'kemphearum.github.io',
    'www.kemphearum.github.io',
    'phearum-info.vercel.app'
]);

function normalizeHost(rawHost = '') {
    return String(rawHost)
        .split(',')[0]
        .trim()
        .toLowerCase()
        .replace(/:\d+$/, '');
}

function getSafeHost(req) {
    const requestedHost = normalizeHost(req.headers['x-forwarded-host'] || req.hostname || DEFAULT_PUBLIC_HOST);
    return ALLOWED_PUBLIC_HOSTS.has(requestedHost) ? requestedHost : DEFAULT_PUBLIC_HOST;
}

function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function sanitizePublicUrl(value, fallback) {
    try {
        const url = new URL(value, `https://${DEFAULT_PUBLIC_HOST}`);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return url.href;
        }
    } catch {
        // Fall through to fallback.
    }
    return fallback;
}

function getLocalizedText(value, fallback = '') {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        const english = typeof value.en === 'string' ? value.en.trim() : '';
        const khmer = typeof value.km === 'string' ? value.km.trim() : '';
        return english || khmer || fallback;
    }
    return fallback;
}

const CORS_ALLOWED_ORIGINS = new Set([
    'https://kemphearum.github.io',
    'https://www.kemphearum.github.io',
    'https://phearum-info.web.app',
    'https://phearum-info.firebaseapp.com',
    'https://kem-phearum.web.app',
    'https://kem-phearum.firebaseapp.com',
    'https://phearum-info.vercel.app',
    'http://localhost:5173'
]);

function setCorsHeaders(req, res) {
    const origin = String(req.headers.origin || '');
    if (CORS_ALLOWED_ORIGINS.has(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizeText(value, maxLength = 5000) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, maxLength);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clientIp(req) {
    const forwarded = String(req.headers['x-forwarded-for'] || '');
    return normalizeText(forwarded.split(',')[0] || req.ip || 'unknown', 100);
}

// Generic fixed-window rate limiter backed by Firestore.
async function enforceRateLimit(collectionName, identifier, { perMinute, perDay }) {
    const now = Date.now();
    const minuteMs = 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    const rateRef = admin.firestore().collection(collectionName).doc(identifier);

    await admin.firestore().runTransaction(async (tx) => {
        const snap = await tx.get(rateRef);
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
            throw new HttpsError('resource-exhausted', 'Too many requests. Please wait a minute.');
        }
        if (perDay && nextDayCount > perDay) {
            throw new HttpsError('resource-exhausted', 'Daily request limit reached. Please try tomorrow.');
        }

        tx.set(rateRef, {
            minuteWindowStart: inMinuteWindow ? minuteWindowStart : now,
            dayWindowStart: inDayWindow ? dayWindowStart : now,
            minuteCount: nextMinuteCount,
            dayCount: nextDayCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    });
}

exports.submitContact = onRequest(async (req, res) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const payload = req.body && typeof req.body === 'object' ? req.body : {};
        const honeypot = normalizeText(payload.website || '', 200);
        if (honeypot) {
            return res.status(200).json({ success: true });
        }

        const name = normalizeText(payload.name, 100);
        const email = normalizeText(payload.email, 200).toLowerCase();
        const message = String(payload.message || '').trim().slice(0, 5000);

        if (!name || name.length < 2) {
            return res.status(400).json({ success: false, error: 'Name is required.' });
        }
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ success: false, error: 'A valid email is required.' });
        }
        if (!message || message.length < 10) {
            return res.status(400).json({ success: false, error: 'Message is too short.' });
        }

        const ip = clientIp(req);
        const identifier = `${ip}:${email}`.toLowerCase();
        await enforceRateLimit('contactRateLimits', identifier, { perMinute: 1, perDay: 5 });

        await admin.firestore().collection('messages').add({
            name,
            email,
            senderEmail: email,
            message,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'contact-function'
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        if (error && error.code === 'resource-exhausted') {
            return res.status(429).json({ success: false, error: error.message || 'Too many requests.' });
        }
        logger.error('submitContact error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ---------------------------------------------------------------------------
// Auth audit logging (security review F-03/F-07).
// Failed logins are not authenticated, so the client cannot write auditLogs
// (rules require isSignedIn()). This callable records them server-side via the
// Admin SDK (which bypasses rules), rate-limited per IP to curb forged spam.
// Authenticated callers must log their own email.
// ---------------------------------------------------------------------------
exports.logAuthEvent = onCall(async (request) => {
    const data = request.data || {};
    const status = data.status === 'failure' ? 'failure' : 'success';
    const email = normalizeEmail(data.email);

    if (!email || !isValidEmail(email)) {
        throw new HttpsError('invalid-argument', 'A valid email is required.');
    }
    // An authenticated caller may only log events for their own identity.
    if (request.auth && normalizeEmail(request.auth.token.email) !== email) {
        throw new HttpsError('permission-denied', 'Email does not match the authenticated user.');
    }

    const ip = normalizeText(
        (request.rawRequest && request.rawRequest.headers['x-forwarded-for'] || '').split(',')[0]
        || (request.rawRequest && request.rawRequest.ip) || 'unknown',
        100
    );
    // 10/min, 100/day per IP — generous for real logins, hostile to spam.
    await enforceRateLimit('authLogRateLimits', ip || 'unknown', { perMinute: 10, perDay: 100 });

    await admin.firestore().collection('auditLogs').add({
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
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: 'auth-function'
    });

    return { success: true };
});

// ---------------------------------------------------------------------------
// Geo lookup proxy (security review F-04).
// Keeps the paid ipify key server-side instead of inlining it in the client
// bundle. Resolves the visitor's IP from the forwarded header.
// ---------------------------------------------------------------------------
exports.geoLookup = onRequest({ secrets: [IPIFY_API_KEY] }, async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    const ip = clientIp(req);
    const fallback = { ...DEFAULT_GEO, ip: ip && ip !== 'unknown' ? ip : 'Unknown' };

    try {
        const key = IPIFY_API_KEY.value() || process.env.IPIFY_API_KEY;
        if (!key) {
            return res.status(200).json(fallback);
        }
        const url = `https://geo.ipify.org/api/v2/country,city?apiKey=${key}`
            + (ip && ip !== 'unknown' ? `&ipAddress=${encodeURIComponent(ip)}` : '');
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(200).json(fallback);
        }
        const d = await response.json();
        res.set('Cache-Control', 'private, max-age=300');
        return res.status(200).json({
            country_name: (d.location && d.location.country) || 'Unknown',
            city: (d.location && d.location.city) || 'Unknown',
            ip: d.ip || fallback.ip,
            country_code: (d.location && d.location.country) || 'UN'
        });
    } catch (error) {
        logger.error('geoLookup error:', error);
        return res.status(200).json(fallback);
    }
});

exports.dynamicSEO = onRequest(async (req, res) => {
    try {
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        const isBot = BOT_USER_AGENTS.some(bot => userAgent.includes(bot));

        const host = getSafeHost(req);
        const protocol = host === 'localhost' ? 'http' : 'https';
        const fullUrl = sanitizePublicUrl(`${protocol}://${host}${req.originalUrl || req.path || '/'}`, `https://${DEFAULT_PUBLIC_HOST}/`);

        let html = '';
        try {
            const fetchRes = await fetch(`${protocol}://${host}/index.html`);
            if (fetchRes.ok) {
                html = await fetchRes.text();
            }
        } catch (e) {
            logger.error("Failed to fetch index.html", e);
        }

        if (!html) {
            html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body><script>window.location.href="/";</script></body></html>`;
        }

        if (!isBot) {
            res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
            return res.status(200).send(html);
        }

        const pathSegments = req.path.split('/').filter(Boolean);
        if (pathSegments.length >= 2) {
            const type = pathSegments[0]; // 'blog' or 'projects'
            const slug = pathSegments[1];

            if (type !== 'blog' && type !== 'projects') {
                res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
                return res.status(200).send(html);
            }

            const collectionName = type === 'blog' ? 'posts' : 'projects';
            const defaultImage = sanitizePublicUrl(`${protocol}://${host}/og-image.jpg`, `https://${DEFAULT_PUBLIC_HOST}/og-image.jpg`);

            let title = 'Kem Phearum - Portfolio & Blog';
            let description = 'A modern, responsive personal portfolio and Markdown blog built by Kem Phearum.';
            let imageUrl = defaultImage;

            const snapshot = await admin.firestore().collection(collectionName).where('slug', '==', slug).limit(1).get();
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                title = getLocalizedText(data.title, title);
                description = getLocalizedText(data.excerpt, getLocalizedText(data.description, description));
                imageUrl = sanitizePublicUrl(data.coverImage || data.imageUrl || imageUrl, imageUrl);
            } else {
                const doc = await admin.firestore().collection(collectionName).doc(slug).get();
                if (doc.exists) {
                    const data = doc.data();
                    title = getLocalizedText(data.title, title);
                    description = getLocalizedText(data.excerpt, getLocalizedText(data.description, description));
                    imageUrl = sanitizePublicUrl(data.coverImage || data.imageUrl || imageUrl, imageUrl);
                }
            }

            const safeTitle = escapeHtml(title);
            const safeDescription = escapeHtml(description);
            const safeImageUrl = escapeHtml(sanitizePublicUrl(imageUrl, defaultImage));
            const safeFullUrl = escapeHtml(fullUrl);

            const metaTags = `
                <title>${safeTitle} | Kem Phearum</title>
                <meta name="description" content="${safeDescription}" />
                <meta property="og:title" content="${safeTitle} | Kem Phearum" />
                <meta property="og:description" content="${safeDescription}" />
                <meta property="og:image" content="${safeImageUrl}" />
                <meta property="og:type" content="article" />
                <meta property="og:url" content="${safeFullUrl}" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="${safeTitle} | Kem Phearum" />
                <meta name="twitter:description" content="${safeDescription}" />
                <meta name="twitter:image" content="${safeImageUrl}" />
            `;

            html = html.replace(/<title>.*?<\/title>/i, '');
            html = html.replace(/<meta property="og:[^>]*>/gi, '');
            html = html.replace(/<meta name="twitter:[^>]*>/gi, '');
            html = html.replace(/<meta name="description"[^>]*>/gi, '');

            html = html.replace(/<head[^>]*>/i, `$&${metaTags}`);
        }

        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.status(200).send(html);

    } catch (error) {
        logger.error("Error in dynamicSEO:", error);
        res.status(500).send("Internal Server Error");
    }
});
