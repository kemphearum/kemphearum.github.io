import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

class AuthService {
    /**
     * Authenticate a user with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    /**
     * Create a new user with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<import('firebase/auth').UserCredential>}
     */
    register(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    /**
     * Sign out the current user
     * @returns {Promise<void>}
     */
    logout() {
        return signOut(auth);
    }

    /**
     * Subscribe to authentication state changes
     * @param {Function} callback 
     * @returns {import('firebase/auth').Unsubscribe}
     */
    onAuthChange(callback) {
        return onAuthStateChanged(auth, callback);
    }
}

export default new AuthService();
