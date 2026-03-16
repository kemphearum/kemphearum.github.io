const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.setUserRole = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    const { targetEmail, role } = data;
    if (!targetEmail || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Email and role are required.');
    }

    // Role hierarchy check
    const isOwner = context.auth.token.email === 'kem.phearum@gmail.com';
    const isTargetSelf = context.auth.token.email === targetEmail;
    const isCallerSuperAdmin = context.auth.token.role === 'superadmin';

    // Allow owner to bootstrap themselves or others, or existing superadmin to manage roles
    if (!isCallerSuperAdmin && !isOwner) {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions.');
    }

    try {
        const user = await admin.auth().getUserByEmail(targetEmail);
        await admin.auth().setCustomUserClaims(user.uid, { role });
        
        // Synch with Firestore for visibility
        await admin.firestore().collection('users').doc(user.uid).set({
            role: role,
            email: targetEmail.toLowerCase()
        }, { merge: true });

        return { success: true, message: `Claim '${role}' assigned to ${targetEmail}` };
    } catch (error) {
        console.error("Set role error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});


// Existing toggleUserStatus function...
exports.toggleUserStatus = functions.https.onCall(async (data, context) => {
    // ... existing implementation ...
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in to perform this action.'
        );
    }

    if (context.auth.token.role !== 'superadmin' && context.auth.token.email !== 'kem.phearum@gmail.com') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only the Super Admin can perform this action.'
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

exports.triggerBuild = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    // Role check: Admin or Superadmin
    const role = context.auth.token.role;
    const isAllowed = role === 'admin' || role === 'superadmin' || context.auth.token.email === 'kem.phearum@gmail.com';
    
    if (!isAllowed) {
         throw new functions.https.HttpsError('permission-denied', 'Only authorized staff can trigger rebuilds.');
    }

    const githubToken = process.env.GITHUB_DISPATCH_TOKEN;
    if (!githubToken) {
        throw new functions.https.HttpsError('failed-precondition', 'GitHub token not configured on server.');
    }

    const { event_type = 'manual_rebuild' } = data;
    const GITHUB_OWNER = 'kemphearum';
    const GITHUB_REPO = 'kemphearum.github.io';
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ event_type }),
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json',
                'User-Agent': 'Firebase-Functions'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("GitHub API error:", errorText);
            throw new functions.https.HttpsError('internal', `GitHub API error: ${res.statusText}`);
        }

        return { success: true, message: 'Rebuild triggered successfully.' };
    } catch (error) {
        console.error("Trigger build failed:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to trigger build.');
    }
});

exports.getBuildStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    const githubToken = process.env.GITHUB_DISPATCH_TOKEN;
    if (!githubToken) {
        throw new functions.https.HttpsError('failed-precondition', 'GitHub token not configured on server.');
    }

    // Role check: Admin or Superadmin
    const role = context.auth.token.role;
    if (role !== 'admin' && role !== 'superadmin' && context.auth.token.email !== 'kem.phearum@gmail.com') {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized access to build status.');
    }

    const { runId, startTime } = data;
    const GITHUB_OWNER = 'kemphearum';
    const GITHUB_REPO = 'kemphearum.github.io';

    try {
        let url;
        if (runId) {
            url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}`;
        } else {
            url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?event=repository_dispatch&per_page=5`;
        }

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'Firebase-Functions'
            }
        });

        if (!res.ok) {
            throw new functions.https.HttpsError('internal', `GitHub API error: ${res.statusText}`);
        }

        const runData = await res.json();
        return { success: true, data: runData };
    } catch (error) {
        console.error("Get build status failed:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to fetch build status.');
    }
});

const BOT_USER_AGENTS = [
    'telegrambot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
    'slackbot', 'whatsapp', 'pinterest', 'googlebot', 'discordbot',
    'skypeuripreview', 'embedly', 'outbrain'
];

const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return m;
        }
    });
};

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
                <title>${escapeHTML(title)} | Kem Phearum</title>
                <meta name="description" content="${escapeHTML(description)}" />
                <meta property="og:title" content="${escapeHTML(title)} | Kem Phearum" />
                <meta property="og:description" content="${escapeHTML(description)}" />
                <meta property="og:image" content="${imageUrl}" />
                <meta property="og:type" content="article" />
                <meta property="og:url" content="${fullUrl}" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="${escapeHTML(title)} | Kem Phearum" />
                <meta name="twitter:description" content="${escapeHTML(description)}" />
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
