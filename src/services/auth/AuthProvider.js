/* eslint-disable no-unused-vars */
/**
 * Abstract class defining the contract for Authentication Providers.
 * Any new authentication provider (Firebase, Keycloak, Auth0, etc.) must implement this interface.
 */
export default class AuthProvider {
    /**
     * @returns {string} The name of the provider (e.g., 'Firebase', 'Auth0')
     */
    get name() {
        throw new Error('Not implemented');
    }

    /**
     * Subscribes to auth state changes.
     * @param {function(Object|null): void} callback 
     * @returns {function(): void} Unsubscribe function
     */
    onAuthStateChanged(callback) {
        throw new Error('Not implemented');
    }

    /**
     * @returns {Object|null} The current authenticated user, or null
     */
    getCurrentUser() {
        throw new Error('Not implemented');
    }

    /**
     * Sign out the current user.
     * @returns {Promise<void>}
     */
    async signOut() {
        throw new Error('Not implemented');
    }

    /**
     * Send a password reset email to the given email address.
     * @param {string} email 
     * @returns {Promise<void>}
     */
    async sendPasswordResetEmail(email) {
        throw new Error('Not implemented');
    }

    /**
     * Update the user's password.
     * @param {string} newPassword 
     * @returns {Promise<void>}
     */
    async updatePassword(newPassword) {
        throw new Error('Not implemented');
    }

    /**
     * Reauthenticate the current user (e.g., before sensitive operations).
     * @param {any} credential 
     * @returns {Promise<void>}
     */
    async reauthenticate(credential) {
        throw new Error('Not implemented');
    }
}
