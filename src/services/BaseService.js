import { db, auth } from '../firebase';
import { 
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
    query, orderBy, serverTimestamp, where, limit as firestoreLimit, startAfter 
} from 'firebase/firestore';

export default class BaseService {
    constructor(collectionName, useHistory = true) {
        if (!collectionName) {
            throw new Error("BaseService requires a collectionName");
        }
        this.collectionName = collectionName;
        this.collectionRef = collection(db, collectionName);
        this.useHistory = useHistory;
    }

    async getAll(sortBy = null, sortDirection = 'desc', trackRead = null) {
        let q = this.collectionRef;
        if (sortBy) {
            q = query(this.collectionRef, orderBy(sortBy, sortDirection));
        }
        const snapshot = await getDocs(q);
        if (trackRead) trackRead(snapshot.size, `Fetched ${this.collectionName} list`, { sortBy, sortDirection, count: snapshot.size });
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Generic cursor-based pagination with optional prefix search.
     * @param {Object} options 
     */
    async fetchPaginated({ 
        lastDoc = null, 
        limit = 10, 
        search = '', 
        searchField = null, 
        sortBy = 'createdAt', 
        sortDirection = 'desc', 
        trackRead = null 
    }) {
        try {
            let baseQuery = query(this.collectionRef);

            if (search && searchField) {
                // Server-side prefix search (Firestore friendly)
                const searchLower = search.toLowerCase();
                baseQuery = query(
                    baseQuery,
                    where(searchField, '>=', searchLower),
                    where(searchField, '<=', searchLower + '\uf8ff')
                );
            }

            let constraints = [orderBy(sortBy, sortDirection), firestoreLimit(limit + 1)];

            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(baseQuery, ...constraints);
            const querySnapshot = await getDocs(q);
            
            const docs = querySnapshot.docs;
            const hasMore = docs.length > limit;
            const resultDocs = hasMore ? docs.slice(0, limit) : docs;

            if (trackRead) {
                trackRead(querySnapshot.size, `Fetched paginated ${this.collectionName}`, { count: querySnapshot.size });
            }

            const data = resultDocs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastVisible = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

            return {
                data,
                lastDoc: lastVisible,
                hasMore
            };
        } catch (error) {
            console.error(`Error in fetchPaginated for ${this.collectionName}:`, error);
            throw error;
        }
    }

    async getById(id, trackRead = null) {
        const docRef = doc(db, this.collectionName, id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            const data = { id: snapshot.id, ...snapshot.data() };
            if (trackRead) trackRead(1, `Fetched ${this.collectionName} by ID: ${id}`, { id });
            return data;
        }
        return null;
    }

    async getHistory(id) {
        const historyRef = collection(db, this.collectionName, id, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async _saveHistory(docId, action, newData, previousData = null) {
        try {
            const historyRef = collection(db, this.collectionName, docId, 'history');
            await addDoc(historyRef, {
                action,
                newData: newData || null,
                previousData: previousData || null,
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
        let previousData = null;
        if (this.useHistory) {
            const currentDoc = await this.getById(id);
            if (currentDoc) {
                previousData = {};
                Object.keys(data).forEach(key => {
                    previousData[key] = currentDoc[key];
                });
            }
        }

        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, data);
        const itemName = data.title || data.role || data.company || data.name || data.label || id;
        const label = `Updated ${this.collectionName}: ${itemName}`;
        if (trackWrite) trackWrite(1, label, data);
        if (this.useHistory) await this._saveHistory(id, 'updated', data, previousData);
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
