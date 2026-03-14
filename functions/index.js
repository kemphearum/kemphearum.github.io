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

exports.dynamicSEO = functions.https.onRequest(async (req, res) => {
    try {
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        const isBot = BOT_USER_AGENTS.some(bot => userAgent.includes(bot));

        const host = req.headers['x-forwarded-host'] || req.hostname || 'phearum-info.web.app';
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const fullUrl = `${protocol}://${host}${req.path}`;
        
        let html = '';
        try {
            const fetchRes = await fetch(`https://${host}/index.html`);
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

            const metaTags = `
                <title>${title} | Kem Phearum</title>
                <meta name="description" content="${description}" />
                <meta property="og:title" content="${title} | Kem Phearum" />
                <meta property="og:description" content="${description}" />
                <meta property="og:image" content="${imageUrl}" />
                <meta property="og:type" content="article" />
                <meta property="og:url" content="${fullUrl}" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="${title} | Kem Phearum" />
                <meta name="twitter:description" content="${description}" />
                <meta name="twitter:image" content="${imageUrl}" />
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
