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
