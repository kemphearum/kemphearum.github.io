import BaseService from './BaseService';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

class UserService extends BaseService {
    constructor() {
        super('users');
    }

    async fetchUsers(userRole, trackRead, trackDelete) {
        if (userRole !== 'superadmin') return [];

        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        if (trackRead) trackRead(querySnapshot.size, 'Fetched users list for management');

        const uniqueUsers = new Map();
        const docsToDelete = [];
        querySnapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const email = data.email?.toLowerCase();
            if (!email) return;
            if (uniqueUsers.has(email)) {
                const existing = uniqueUsers.get(email);
                const roles = { 'superadmin': 4, 'admin': 3, 'editor': 2, 'pending': 1 };
                const existingScore = roles[existing.data.role] || 0;
                const newScore = roles[data.role] || 0;
                if (newScore > existingScore) {
                    docsToDelete.push(existing.id);
                    uniqueUsers.set(email, { id: docSnap.id, data });
                } else {
                    docsToDelete.push(docSnap.id);
                }
            } else {
                uniqueUsers.set(email, { id: docSnap.id, data });
            }
        });

        if (docsToDelete.length > 0) {
            Promise.all(docsToDelete.map(id => {
                if (trackDelete) trackDelete(1, 'Cleaned duplicate user');
                return deleteDoc(doc(db, "users", id));
            })).catch(console.error);
        }

        let finalList = Array.from(uniqueUsers.values()).map(u => ({ id: u.id, ...u.data }));
        finalList = finalList.filter(u => u.isActive !== false);
        finalList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        return finalList;
    }

    async updateRole(userRole, userId, newRole, trackWrite) {
        if (userRole !== 'superadmin') throw new Error("Only Superadmins can modify users.");
        return this.update(userId, { role: newRole }, trackWrite);
    }

    async removeUser(userRole, userId, trackDelete) {
        if (userRole !== 'superadmin') throw new Error("Only Superadmins can remove users.");
        // We use updateDoc to logically disable them
        const docRef = doc(db, this.collectionName, userId);
        await updateDoc(docRef, { isActive: false });
        if (trackDelete) trackDelete(1, 'Disabled user');
    }

    async sendPasswordReset(userRole, email) {
        if (userRole !== 'superadmin') throw new Error("Only Superadmins can reset passwords.");
        return sendPasswordResetEmail(auth, email);
    }

    async createUser(userRole, email, password, role, trackRead) {
        if (userRole !== 'superadmin') throw new Error("Only Superadmins can create users.");

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

        await addDoc(collection(db, "users"), {
            email: emailLower,
            role: role,
            isActive: true,
            createdAt: serverTimestamp()
        });
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
     * Create a new user document (auto-generated ID).
     */
    async createUserDoc(data) {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }

    /**
     * Update a specific field on a user document by doc ID.
     */
    async updateUserField(docId, fieldData) {
        const docRef = doc(db, this.collectionName, docId);
        await updateDoc(docRef, fieldData);
    }
}

export default new UserService();
