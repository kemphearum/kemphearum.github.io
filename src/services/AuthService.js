import { auth } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    EmailAuthProvider,
    linkWithCredential,
    updatePassword,
    reauthenticateWithPopup,
    reauthenticateWithCredential
} from 'firebase/auth';

const MAGIC_LINK_EMAIL_KEY = 'adminMagicLinkEmail';

const getActionCodeSettings = () => ({
    url: `${typeof window !== 'undefined' ? window.location.origin : ''}/admin`,
    handleCodeInApp: true
});

class AuthService {
    /**
     * Authenticate a user with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    async login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    /**
     * Create a new user with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    async register(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    /**
     * Authenticate with a Google account via popup.
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        return signInWithPopup(auth, provider);
    }

    /**
     * Authenticate with an Apple account via popup.
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    async loginWithApple() {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        return signInWithPopup(auth, provider);
    }

    /**
     * Send a passwordless sign-in link to the given email and remember the
     * address locally so the return visit can complete the sign-in.
     * @param {string} email
     * @returns {Promise<void>}
     */
    async sendMagicLink(email) {
        const normalized = String(email || '').trim().toLowerCase();
        await sendSignInLinkToEmail(auth, normalized, getActionCodeSettings());
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, normalized);
        }
    }

    /**
     * Whether the given URL is a passwordless email sign-in link.
     * @param {string} href
     * @returns {boolean}
     */
    isMagicLink(href) {
        return isSignInWithEmailLink(auth, href);
    }

    /**
     * Read the email stored when the magic link was requested (same device).
     * @returns {string}
     */
    getStoredMagicLinkEmail() {
        if (typeof window === 'undefined') return '';
        return window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY) || '';
    }

    /**
     * Complete a passwordless sign-in from an email link.
     * @param {string} email
     * @param {string} href
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    async completeMagicLink(email, href) {
        const normalized = String(email || '').trim().toLowerCase();
        const credential = await signInWithEmailLink(auth, normalized, href);
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
        }
        return credential;
    }

    /**
     * Whether the current user already has an email/password credential.
     * @returns {boolean}
     */
    hasPasswordProvider() {
        const current = auth.currentUser;
        return !!current && current.providerData.some((p) => p.providerId === 'password');
    }

    /**
     * Set (link) or change the email/password credential for the current user.
     *
     * Security: re-authentication is ALWAYS required before the change, so an
     * unattended/hijacked open session cannot silently set a new password.
     * - If currentPassword is supplied, it is verified via re-auth (the caller
     *   is changing a password they already know).
     * - Otherwise the user re-authenticates through a Google popup (first-time
     *   set on an SSO account, where no password exists to verify against).
     *
     * For an SSO-only account this links email/password sign-in so the same
     * account can also log in with a password; if a password credential already
     * exists it is updated instead.
     * @param {string} newPassword
     * @param {string} [currentPassword='']
     * @returns {Promise<void>}
     */
    async setPassword(newPassword, currentPassword = '') {
        const current = auth.currentUser;
        if (!current) throw new Error('No authenticated user.');

        if (currentPassword) {
            await reauthenticateWithCredential(
                current,
                EmailAuthProvider.credential(current.email, currentPassword)
            );
        } else {
            await reauthenticateWithPopup(current, new GoogleAuthProvider());
        }

        if (this.hasPasswordProvider()) {
            await updatePassword(current, newPassword);
            return;
        }
        await linkWithCredential(current, EmailAuthProvider.credential(current.email, newPassword));
    }

    /**
     * Sign out the current user
     * @returns {Promise<void>}
     */
    async logout() {
        return signOut(auth);
    }

    /**
     * Subscribe to authentication state changes
     * @param {function(import('firebase/auth').User|null): void} callback
     * @returns {import('firebase/auth').Unsubscribe}
     */
    onAuthChange(callback) {
        return onAuthStateChanged(auth, callback);
    }

    /**
     * Get the currently logged in user
     * @returns {import('firebase/auth').User | null}
     */
    getCurrentUser() {
        return auth.currentUser;
    }
}

export default new AuthService();
