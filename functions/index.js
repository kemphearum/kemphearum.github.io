const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Existing toggleUserStatus function...
exports.toggleUserStatus = functions.https.onCall(async (data, context) => {
    // ... existing implementation ...
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in to perform this action.'
        );
    }

    if (context.auth.token.email !== 'kem.phearum@gmail.com') {
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
    'www.kemphearum.github.io'
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
            
            let title = 'Kem Phearum - Portfolio & Blog';
            let description = 'A modern, responsive personal portfolio and Markdown blog built by Kem Phearum.';
            let imageUrl = 'https://kemphearum.github.io/og-image.jpg';
            
            const snapshot = await admin.firestore().collection(collectionName).where('slug', '==', slug).limit(1).get();
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                title = data.title || title;
                description = data.excerpt || data.description || description;
                imageUrl = data.coverImage || data.imageUrl || imageUrl;
            } else {
                const doc = await admin.firestore().collection(collectionName).doc(slug).get();
                if (doc.exists) {
                    const data = doc.data();
                    title = data.title || title;
                    description = data.excerpt || data.description || description;
                    imageUrl = data.coverImage || data.imageUrl || imageUrl;
                }
            }

            const safeTitle = escapeHtml(title);
            const safeDescription = escapeHtml(description);
            const safeImageUrl = escapeHtml(sanitizePublicUrl(imageUrl, 'https://kemphearum.github.io/og-image.jpg'));
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
