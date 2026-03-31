const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const DEFAULT_SUPERADMIN_EMAILS = ['kem.phearum@gmail.com'];
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const SUPERADMIN_EMAILS = new Set(
    DEFAULT_SUPERADMIN_EMAILS.map(normalizeEmail)
);

// Existing toggleUserStatus function...
exports.toggleUserStatus = functions.https.onCall(async (data, context) => {
    // ... existing implementation ...
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in to perform this action.'
        );
    }

    const requesterEmail = normalizeEmail(context.auth.token.email);
    if (!SUPERADMIN_EMAILS.has(requesterEmail)) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only the Super Admin can enable or disable user accounts.'
        );
    }

    const { targetEmail, disableFlag } = data;

    if (!targetEmail) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The target email must be provided.'
        );
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(targetEmail);
        await admin.auth().updateUser(userRecord.uid, {
            disabled: disableFlag
        });

        return {
            success: true,
            message: `User ${targetEmail} has been successfully ${disableFlag ? 'disabled' : 'enabled'}.`
        };
    } catch (error) {
        console.error("Error toggling user status:", error);
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError(
                'not-found',
                `No user found with email ${targetEmail}.`
            );
        }
        throw new functions.https.HttpsError(
            'internal',
            'An internal error occurred while updating the user.'
        );
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

function setCorsHeaders(req, res) {
    const allowedOrigins = new Set([
        'https://kemphearum.github.io',
        'https://www.kemphearum.github.io',
        'https://phearum-info.web.app',
        'https://phearum-info.firebaseapp.com',
        'https://kem-phearum.web.app',
        'https://kem-phearum.firebaseapp.com',
        'https://phearum-info.vercel.app',
        'http://localhost:5173'
    ]);

    const origin = String(req.headers.origin || '');
    if (allowedOrigins.has(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

async function enforceContactRateLimit(identifier) {
    const now = Date.now();
    const minuteMs = 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    const rateRef = admin.firestore().collection('contactRateLimits').doc(identifier);

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

        // Hard limits for free-tier quota protection
        if (nextMinuteCount > 1) {
            throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Please wait a minute.');
        }
        if (nextDayCount > 5) {
            throw new functions.https.HttpsError('resource-exhausted', 'Daily request limit reached. Please try tomorrow.');
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

exports.submitContact = functions.https.onRequest(async (req, res) => {
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
            // Silently accept bot submissions without writing.
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

        const forwarded = String(req.headers['x-forwarded-for'] || '');
        const ip = normalizeText(forwarded.split(',')[0] || req.ip || 'unknown', 100);
        const identifier = `${ip}:${email}`.toLowerCase();
        await enforceContactRateLimit(identifier);

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
        const code = error?.code || '';
        if (code === 'resource-exhausted') {
            return res.status(429).json({ success: false, error: error.message || 'Too many requests.' });
        }
        console.error('submitContact error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

exports.dynamicSEO = functions.https.onRequest(async (req, res) => {
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
            console.error("Failed to fetch index.html", e);
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
        console.error("Error in dynamicSEO:", error);
        res.status(500).send("Internal Server Error");
    }
});
