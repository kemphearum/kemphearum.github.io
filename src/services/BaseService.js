import { db, auth } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default class BaseService {
    constructor(collectionName, useHistory = true) {
        if (!collectionName) {
            throw new Error("BaseService requires a collectionName");
        }
        this.collectionName = collectionName;
        this.collectionRef = collection(db, collectionName);
        this.useHistory = useHistory;
    }

    async getAll(sortBy = null, sortDirection = 'desc') {
        let q = this.collectionRef;
        if (sortBy) {
            q = query(this.collectionRef, orderBy(sortBy, sortDirection));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getById(id) {
        const docRef = doc(db, this.collectionName, id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    }

    async getHistory(id) {
        const historyRef = collection(db, this.collectionName, id, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async _saveHistory(docId, action, data) {
        try {
            const historyRef = collection(db, this.collectionName, docId, 'history');
            await addDoc(historyRef, {
                action,
                dataPayload: data || null,
                timestamp: serverTimestamp(),
                user: auth?.currentUser?.email || 'Anonymous'
            });
        } catch (err) {
            console.error(`Failed to save history for ${this.collectionName}/${docId}:`, err);
        }
    }

    async create(data, trackWrite = null) {
        const docRef = await addDoc(this.collectionRef, data);
        const itemName = data.title || data.role || data.company || data.name || data.label || 'unnamed';
        const label = `Created ${this.collectionName}: ${itemName}`;
        if (trackWrite) trackWrite(1, label, data);
        if (this.useHistory) await this._saveHistory(docRef.id, 'created', data);
        return docRef.id;
    }

    async update(id, data, trackWrite = null) {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, data);
        const itemName = data.title || data.role || data.company || data.name || data.label || id;
        const label = `Updated ${this.collectionName}: ${itemName}`;
        if (trackWrite) trackWrite(1, label, data);
        if (this.useHistory) await this._saveHistory(id, 'updated', data);
        return true;
    }

    async delete(id, trackDelete = null) {
        if (this.useHistory) await this._saveHistory(id, 'deleted', null);
        const docRef = doc(db, this.collectionName, id);
        await deleteDoc(docRef);
        if (trackDelete) trackDelete(1, `Deleted ${this.collectionName}: ${id}`, { id });
        return true;
    }
}
