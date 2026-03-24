import BaseService from './BaseService';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

class AuthService {
    /**
     * Authenticate a user with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    async login(email, password) {
        return BaseService.safe(async () => {
            return await signInWithEmailAndPassword(auth, email, password);
        });
    }

    /**
     * Create a new user with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    async register(email, password) {
        return BaseService.safe(async () => {
            return await createUserWithEmailAndPassword(auth, email, password);
        });
    }

    /**
     * Sign out the current user
     * @returns {Promise<void>}
     */
    async logout() {
        return BaseService.safe(async () => {
            return await signOut(auth);
        });
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
