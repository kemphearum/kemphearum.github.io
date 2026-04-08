import BaseService from './BaseService';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, doc, query, updateDoc, where, serverTimestamp, writeBatch } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { isActionAllowed, ACTIONS, MODULES, isSuperAdminRole, normalizeRole, normalizeRolePermissionEntry } from '../utils/permissions';
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
     * @param {boolean} [params.includeTotal]
     * @returns {Promise<import('./BaseService').PaginatedResult>}
     */
    async fetchUsers({ userRole, trackRead, lastDoc = null, limit = 20, search = '', includeTotal = false }) {
        if (!isSuperAdminRole(userRole)) return { data: [], lastDoc: null, hasMore: false, totalCount: null };

        return this.fetchPaginated({
            lastDoc,
            limit,
            search,
            searchFields: ['email', 'displayName', 'role'],
            sortBy: 'createdAt',
            sortDirection: 'desc',
            includeTotal,
            trackRead
        });
    }

    async fetchStats(userRole) {
        if (!isSuperAdminRole(userRole)) {
            return { total: 0, active: 0, elevated: 0, disabled: 0 };
        }

        const users = await this.getAll();
        const active = users.filter((entry) => entry.isActive !== false && entry.disabled !== true).length;
        const disabled = users.length - active;
        const elevated = users.filter((entry) => {
            const role = normalizeRole(entry.role);
            return role === 'admin' || role === 'superadmin';
        }).length;

        return {
            total: users.length,
            active,
            elevated,
            disabled
        };
    }

    /**
     * Update user role.
     * @param {string} userRole 
     * @param {string} userId 
     * @param {string} newRole 
     * @param {function(number, string): void} [trackWrite] 
     * @param {Object} [rolePermissions]
     * @returns {Promise<void>}
     */
    async updateRole(userRole, userId, newRole, trackWrite, rolePermissions = {}) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS, userRole, rolePermissions)) throw new Error("Unauthorized action");
        const normalizedRole = normalizeRole(newRole) || 'pending';
        return this.update(userId, { role: normalizedRole }, trackWrite);
    }

    /**
     * Toggle user disabled state.
     * @param {string} userRole
     * @param {string} userId
     * @param {boolean} shouldDisable
     * @param {function(number, string): void} [trackWrite]
     * @param {Object} [rolePermissions]
     * @returns {Promise<void>}
     */
    async setUserDisabled(userRole, userId, shouldDisable, trackWrite, rolePermissions = {}) {
        if (!isActionAllowed(ACTIONS.DISABLE, MODULES.USERS, userRole, rolePermissions)) throw new Error("Unauthorized action");
        await this.update(userId, {
            isActive: !shouldDisable,
            disabled: shouldDisable
        }, trackWrite);
    }

    /**
     * Logically remove a user by setting isActive to false.
     * @param {string} userRole 
     * @param {string} userId 
     * @param {function(number, string, Object): void} [trackDelete] 
     * @param {Object} [rolePermissions]
     * @returns {Promise<void>}
     */
    async removeUser(userRole, userId, trackDelete, rolePermissions = {}) {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.USERS, userRole, rolePermissions)) throw new Error("Unauthorized action");
        // We use updateDoc to logically disable them
        await this.update(userId, { isActive: false }, trackDelete);
    }

    /**
     * Send password reset email.
     * @param {string} userRole 
     * @param {string} email 
     * @param {Object} [rolePermissions]
     * @returns {Promise<void>}
     */
    async sendPasswordReset(userRole, email, rolePermissions = {}) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS, userRole, rolePermissions)) throw new Error("Unauthorized action");
        return sendPasswordResetEmail(auth, email);
    }

    /**
     * Create a new user with Firebase Auth and Firestore record.
     * @param {string} userRole 
     * @param {string} email 
     * @param {string} password 
     * @param {string} role 
     * @param {function(number, string): void} [trackRead] 
     * @param {Object} [rolePermissions]
     * @returns {Promise<void>}
     */
    async createUser(userRole, email, password, role, trackRead, rolePermissions = {}) {
        if (!isActionAllowed(ACTIONS.CREATE, MODULES.USERS, userRole, rolePermissions)) throw new Error("Unauthorized action");
        const normalizedRole = normalizeRole(role) || 'pending';

        const dataToValidate = { email, role: normalizedRole };
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
            role: normalizedRole,
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
     * @returns {Promise<Record<string, Object>>} Map of roles to normalized permission objects
     */
    async fetchRolePermissions(trackRead) {
        const q = query(collection(db, "rolePermissions"));
        const snap = await getDocs(q);
        if (trackRead) trackRead(snap.size, 'Fetched role permissions');

        const perms = {};
        snap.docs.forEach((d) => {
            const rawRole = d.data().role;
            const normalizedRole = normalizeRole(rawRole);
            if (!normalizedRole) return;
            const normalizedEntry = normalizeRolePermissionEntry(
                {
                    allowedTabs: d.data().allowedTabs || [],
                    baseRole: d.data().baseRole,
                    allowedActions: d.data().allowedActions || {}
                },
                normalizedRole
            );
            perms[normalizedRole] = normalizedEntry;
        });
        return perms;
    }

    /**
     * Save role permissions.
     * @param {string} role 
     * @param {Array<string>} allowedTabs 
     * @param {function(number, string): void} [trackWrite] 
     * @param {string} [baseRole]
     * @param {Object} [allowedActions]
     * @returns {Promise<void>}
     */
    async saveRolePermissions(role, allowedTabs, trackWrite, baseRole, allowedActions = {}) {
        const normalizedRole = normalizeRole(role);
        if (!normalizedRole) throw new Error('Invalid role provided.');
        const normalizedBaseRole = normalizeRole(baseRole);
        const safeBaseRole = ['admin', 'editor', 'pending'].includes(normalizedBaseRole)
            ? normalizedBaseRole
            : (['admin', 'editor', 'pending'].includes(normalizedRole) ? normalizedRole : 'pending');
        const normalizedEntry = normalizeRolePermissionEntry(
            { allowedTabs, baseRole: safeBaseRole, allowedActions },
            normalizedRole
        );
        const payload = {
            role: normalizedRole,
            allowedTabs: normalizedEntry.allowedTabs,
            baseRole: safeBaseRole,
            allowedActions: normalizedEntry.allowedActions
        };

        const q = query(collection(db, "rolePermissions"), where("role", "==", normalizedRole));
        const snap = await getDocs(q);

        if (snap.empty) {
            await addDoc(collection(db, "rolePermissions"), payload);
            if (trackWrite) trackWrite(1, `Created ${normalizedRole} permissions`);
        } else {
            await updateDoc(snap.docs[0].ref, {
                allowedTabs: normalizedEntry.allowedTabs,
                baseRole: safeBaseRole,
                allowedActions: normalizedEntry.allowedActions
            });
            if (trackWrite) trackWrite(1, `Updated ${normalizedRole} permissions`);
        }
    }

    /**
     * Remove a custom role permission profile and reassign users to a fallback role.
     * @param {string} role
     * @param {string} [replacementRole='pending']
     * @param {function(number, string): void} [trackWrite]
     * @returns {Promise<{reassignedUsers:number, removedPermissionDocs:number}>}
     */
    async deleteRoleAndReassignUsers(role, replacementRole = 'pending', trackWrite) {
        const normalizedRole = normalizeRole(role);
        const normalizedReplacement = normalizeRole(replacementRole) || 'pending';
        const protectedRoles = new Set(['superadmin', 'admin', 'editor', 'pending']);

        if (!normalizedRole) throw new Error('Invalid role provided.');
        if (protectedRoles.has(normalizedRole)) {
            throw new Error('System roles cannot be removed.');
        }
        if (normalizedReplacement === normalizedRole) {
            throw new Error('Replacement role must be different from the role being removed.');
        }

        const permissionSnap = await getDocs(query(collection(db, "rolePermissions"), where("role", "==", normalizedRole)));
        const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", normalizedRole)));

        const operations = [];
        permissionSnap.docs.forEach((entry) => {
            operations.push({ type: 'delete', ref: entry.ref });
        });
        usersSnap.docs.forEach((entry) => {
            operations.push({ type: 'update', ref: entry.ref, data: { role: normalizedReplacement } });
        });

        // Keep each commit below Firestore batch operation limits.
        const chunkSize = 400;
        for (let index = 0; index < operations.length; index += chunkSize) {
            const batch = writeBatch(db);
            const chunk = operations.slice(index, index + chunkSize);
            chunk.forEach((operation) => {
                if (operation.type === 'delete') {
                    batch.delete(operation.ref);
                } else {
                    batch.update(operation.ref, operation.data);
                }
            });
            await batch.commit();
        }

        if (trackWrite) {
            trackWrite(
                operations.length,
                `Removed role '${normalizedRole}' and reassigned ${usersSnap.size} users to '${normalizedReplacement}'`
            );
        }

        return {
            reassignedUsers: usersSnap.size,
            removedPermissionDocs: permissionSnap.size
        };
    }

    /**
     * Fetch a user document by email address.
     * @param {string} email
     * @returns {Promise<Object|null>} Returns { id, ref, ...data } or null.
     */
    async fetchUserByEmail(email) {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const q = query(collection(db, this.collectionName), where("email", "==", normalizedEmail));
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
