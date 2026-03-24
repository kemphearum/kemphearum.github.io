import BaseService from './BaseService';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, doc, orderBy, query, updateDoc, where, serverTimestamp, limit as firestoreLimit, startAfter } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';
import { normalizeUser, validateUser } from '../domain/user/userDomain';

class UserService extends BaseService {
    constructor() {
        super('users');
    }

    /**
     * Fetch users with pagination and search.
     * @param {Object} params
     * @param {string} params.userRole
     * @param {function(number, string): void} [params.trackRead]
     * @param {import('firebase/firestore').DocumentSnapshot|null} [params.lastDoc]
     * @param {number} [params.limit]
     * @param {string} [params.search]
     * @returns {Promise<import('./BaseService').PaginatedResult>}
     */
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

    /**
     * Update user role.
     * @param {string} userRole 
     * @param {string} userId 
     * @param {string} newRole 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<void>}
     */
    async updateRole(userRole, userId, newRole, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS, userRole)) throw new Error("Unauthorized action");
        return this.update(userId, { role: newRole }, trackWrite);
    }

    /**
     * Logically remove a user by setting isActive to false.
     * @param {string} userRole 
     * @param {string} userId 
     * @param {function(number, string, Object): void} [trackDelete] 
     * @returns {Promise<void>}
     */
    async removeUser(userRole, userId, trackDelete) {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.USERS, userRole)) throw new Error("Unauthorized action");
        // We use updateDoc to logically disable them
        await this.update(userId, { isActive: false }, trackDelete);
    }

    /**
     * Send password reset email.
     * @param {string} userRole 
     * @param {string} email 
     * @returns {Promise<void>}
     */
    async sendPasswordReset(userRole, email) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS, userRole)) throw new Error("Unauthorized action");
        return sendPasswordResetEmail(auth, email);
    }

    /**
     * Create a new user with Firebase Auth and Firestore record.
     * @param {string} userRole 
     * @param {string} email 
     * @param {string} password 
     * @param {string} role 
     * @param {function(number, string): void} [trackRead] 
     * @returns {Promise<void>}
     */
    async createUser(userRole, email, password, role, trackRead) {
        if (!isActionAllowed(ACTIONS.CREATE, MODULES.USERS, userRole)) throw new Error("Unauthorized action");

        const dataToValidate = { email, role };
        const errors = validateUser(dataToValidate);
        if (errors) throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`);

        const { email: emailLower } = normalizeUser(dataToValidate);
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

    /**
     * Update user profile display name.
     * @param {string} userId 
     * @param {string} displayName 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<void>}
     */
    async updateProfile(userId, displayName, trackWrite) {
        if (!userId) throw new Error("No User ID provided.");
        await this.update(userId, { displayName }, trackWrite);
    }

    /**
     * Fetch role-based tab permissions.
     * @param {function(number, string): void} [trackRead] 
     * @returns {Promise<Record<string, Array<string>>>} Map of roles to allowed tabs
     */
    async fetchRolePermissions(trackRead) {
        const q = query(collection(db, "rolePermissions"));
        const snap = await getDocs(q);
        if (trackRead) trackRead(snap.size, 'Fetched role permissions');

        const perms = {};
        snap.docs.forEach(d => { perms[d.data().role] = d.data().allowedTabs || []; });
        return perms;
    }

    /**
     * Save role permissions.
     * @param {string} role 
     * @param {Array<string>} allowedTabs 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<void>}
     */
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
     * @param {string} email
     * @returns {Promise<Object|null>} Returns { id, ref, ...data } or null.
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
     * @param {string} docId
     * @returns {Promise<Object|null>}
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
     * @param {Object} data 
     * @param {string|null} [docId=null] 
     * @returns {Promise<string>} The new document ID
     */
    async createUserDoc(data, docId = null) {
        const normalized = normalizeUser(data);
        const payload = {
            ...normalized,
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
     * @param {string} docId 
     * @returns {Promise<void>}
     */
    async deleteUserDoc(docId) {
        await deleteDoc(doc(db, this.collectionName, docId));
    }

    /**
     * Update a specific field on a user document by doc ID.
     * @param {string} docId 
     * @param {Object} fieldData 
     * @returns {Promise<void>}
     */
    async updateUserField(docId, fieldData) {
        await this.update(docId, fieldData);
    }
}

export default new UserService();
