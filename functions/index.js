const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.toggleUserStatus = functions.https.onCall(async (data, context) => {
    // 1. Verify caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in to perform this action.'
        );
    }

    // 2. Verify caller is the Super Admin
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
        // 3. Look up the user by email
        const userRecord = await admin.auth().getUserByEmail(targetEmail);

        // 4. Update the user's disabled status in Firebase Auth
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

exports.serveDynamicOG = functions.https.onRequest(async (req, res) => {
    try {
        // Parse the requested URL (e.g., /blog/my-cool-post)
        const pathSegments = req.path.split('/').filter(Boolean);
        const type = pathSegments[0]; // 'blog', 'project', or 'projects'
        const slug = pathSegments[1];

        // 1. Fetch the default index.html from the live site
        // This avoids needing to bundle the dist folder into the functions package.
        const response = await fetch('https://phearum-info.web.app/index.html');
        let htmlContent = await response.text();

        // 2. If valid route and slug, lookup details from Firestore
        if (slug && (type === 'blog' || type === 'project' || type === 'projects')) {
            const collectionName = type === 'blog' ? 'blogPosts' : 'projects';

            // Query Firestore for the document with the matching slug
            const snapshot = await admin.firestore().collection(collectionName).where('slug', '==', slug).limit(1).get();

            if (!snapshot.empty) {
                const docData = snapshot.docs[0].data();
                const title = docData.title ? `${docData.title} | Kem Phearum` : 'Kem Phearum Portfolio';
                const description = docData.description || docData.excerpt || 'Portfolio of Kem Phearum, an ICT Security professional and developer.';
                // Prefer coverImage for blog, imageUrl for projects
                const image = docData.coverImage || docData.imageUrl || null;

                // 3. Inject the dynamic metadata 
                // We use standard regex to replace the generic meta tags found in your index.html
                htmlContent = htmlContent.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
                htmlContent = htmlContent.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${description}" />`);

                // Open Graph (Facebook/LinkedIn)
                htmlContent = htmlContent.replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
                htmlContent = htmlContent.replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${description}" />`);

                // Twitter Cards
                htmlContent = htmlContent.replace(/<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`);
                htmlContent = htmlContent.replace(/<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`);

                // Inject image tags if an image exists
                if (image) {
                    htmlContent = htmlContent.replace(/<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image" content="${image}" />`);
                    htmlContent = htmlContent.replace(/<meta\s+name=["']twitter:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:image" content="${image}" />`);
                }
            }
        }

        // 4. Send the dynamically modified HTML back to the browser/crawler
        // Set caching headers so Firebase Hosting CDNs can cache this page for 10 mins 
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.status(200).send(htmlContent);

    } catch (error) {
        console.error("Error generating dynamic OG tags:", error);

        // Final fallback: just fetch and serve the raw generic index.html
        try {
            const fallbackResponse = await fetch('https://phearum-info.web.app/index.html');
            const fallbackHtml = await fallbackResponse.text();
            res.status(200).send(fallbackHtml);
        } catch (fallbackError) {
            res.status(500).send('An error occurred generating the page.');
        }
    }
});
