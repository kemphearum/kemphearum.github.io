import AuthProvider from './AuthProvider';
import { auth } from '../../firebase';
import { onAuthStateChanged, signOut, sendPasswordResetEmail, updatePassword, reauthenticateWithCredential } from 'firebase/auth';

/**
 * Firebase implementation of the AuthProvider interface.
 */
export class FirebaseAuthProvider extends AuthProvider {
    get name() {
        return 'Firebase Authentication';
    }

    onAuthStateChanged(callback) {
        return onAuthStateChanged(auth, callback);
    }

    getCurrentUser() {
        return auth.currentUser;
    }

    async signOut() {
        return signOut(auth);
    }

    async sendPasswordResetEmail(email) {
        return sendPasswordResetEmail(auth, email);
    }

    async updatePassword(newPassword) {
        if (!auth.currentUser) throw new Error("No user is currently signed in.");
        return updatePassword(auth.currentUser, newPassword);
    }

    async reauthenticate(credential) {
        if (!auth.currentUser) throw new Error("No user is currently signed in.");
        return reauthenticateWithCredential(auth.currentUser, credential);
    }
}

// Export a singleton instance
export const firebaseAuthProvider = new FirebaseAuthProvider();
