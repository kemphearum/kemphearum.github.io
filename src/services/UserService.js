import BaseService from './BaseService';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, doc, orderBy, query, updateDoc, where, serverTimestamp, limit as firestoreLimit, startAfter } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';

class UserService extends BaseService {
    constructor() {
        super('users');
    }

    async fetchUsers({ userRole, trackRead, lastDoc = null, limit = 20, search = '' }) {
        if (userRole !== 'superadmin') return { data: [], lastDoc: null, hasMore: false };

        return this.fetchPaginated({
            lastDoc,
            limit,
            search,
            searchField: 'email',
            sortBy: 'createdAt',
            sortDirection: 'desc',
            trackRead
        });
    }

    async updateRole(userRole, userId, newRole, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS, userRole)) throw new Error("Unauthorized action");
        return this.update(userId, { role: newRole }, trackWrite);
    }

    async removeUser(userRole, userId, trackDelete) {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.USERS, userRole)) throw new Error("Unauthorized action");
        // We use updateDoc to logically disable them
        await this.update(userId, { isActive: false }, trackDelete);
    }

    async sendPasswordReset(userRole, email) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS, userRole)) throw new Error("Unauthorized action");
        return sendPasswordResetEmail(auth, email);
    }

    async createUser(userRole, email, password, role, trackRead) {
        if (!isActionAllowed(ACTIONS.CREATE, MODULES.USERS, userRole)) throw new Error("Unauthorized action");

        const emailLower = email.toLowerCase().trim();
        const existingQ = query(collection(db, "users"), where("email", "==", emailLower));
        const existingSnap = await getDocs(existingQ);
        if (trackRead) trackRead(existingSnap.size, 'Checked existing user');

        if (!existingSnap.empty) {
            throw new Error("This email is already registered in the database.");
        }

        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
        const signupResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailLower, password, returnSecureToken: false })
        });

        const signupData = await signupResponse.json();
        if (!signupResponse.ok) {
            if (signupData.error?.message?.includes('EMAIL_EXISTS')) throw new Error("This email is already registered.");
            if (signupData.error?.message?.includes('WEAK_PASSWORD')) throw new Error("Password should be at least 6 characters.");
            throw new Error(signupData.error?.message || 'Failed to create user in Authentication');
        }

        const uid = signupData.localId; // Use the UID from Auth

        await this.createUserDoc({
            email: emailLower,
            role: role,
            isActive: true
        }, uid);
    }

    async updateProfile(userId, displayName, trackWrite) {
        if (!userId) throw new Error("No User ID provided.");
        await this.update(userId, { displayName }, trackWrite);
    }

    async fetchRolePermissions(trackRead) {
        const q = query(collection(db, "rolePermissions"));
        const snap = await getDocs(q);
        if (trackRead) trackRead(snap.size, 'Fetched role permissions');

        const perms = {};
        snap.docs.forEach(d => { perms[d.data().role] = d.data().allowedTabs || []; });
        return perms;
    }

    async saveRolePermissions(role, allowedTabs, trackWrite) {
        const q = query(collection(db, "rolePermissions"), where("role", "==", role));
        const snap = await getDocs(q);

        if (snap.empty) {
            await addDoc(collection(db, "rolePermissions"), { role, allowedTabs });
            if (trackWrite) trackWrite(1, `Created ${role} permissions`);
        } else {
            await updateDoc(snap.docs[0].ref, { allowedTabs });
            if (trackWrite) trackWrite(1, `Updated ${role} permissions`);
        }
    }

    /**
     * Fetch a user document by email address.
     * Returns { id, ...data } or null.
     */
    async fetchUserByEmail(email) {
        const q = query(collection(db, this.collectionName), where("email", "==", email));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ref: docSnap.ref, ...docSnap.data() };
    }

    /**
     * Fetch a user document by its ID (usually Auth UID).
     */
    async fetchUserById(docId) {
        const docRef = doc(db, this.collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ref: docSnap.ref, ...docSnap.data() };
    }

    /**
     * Create a new user document.
     * If docId is provided, it uses that as the document ID (suitable for Auth UID).
     */
    async createUserDoc(data, docId = null) {
        const payload = {
            ...data,
            createdAt: serverTimestamp()
        };

        if (docId) {
            const docRef = doc(db, this.collectionName, docId);
            await setDoc(docRef, payload);
            return docId;
        } else {
            const docRef = await addDoc(collection(db, this.collectionName), payload);
            return docRef.id;
        }
    }

    /**
     * Delete a user document.
     */
    async deleteUserDoc(docId) {
        await deleteDoc(doc(db, this.collectionName, docId));
    }

    /**
     * Update a specific field on a user document by doc ID.
     */
    async updateUserField(docId, fieldData) {
        await this.update(docId, fieldData);
    }
}

export default new UserService();
