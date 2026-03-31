import { db, auth } from '../firebase';
import { 
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
    query, orderBy, serverTimestamp, where, limit as firestoreLimit, startAfter,
    writeBatch, getCountFromServer
} from 'firebase/firestore';
import { getLocalizedField } from '../utils/localization';

/**
 * @typedef {Object} ServiceResult
 * @property {*} data - The returned payload, or null on error
 * @property {string|null} error - Error message string, or null on success
 * @property {Object} [meta] - Optional metadata (e.g. pagination info)
 */

/**
 * @typedef {Object} PaginatedResult
 * @property {Array<Object>} data - Array of documents
 * @property {import('firebase/firestore').DocumentSnapshot|null} lastDoc - Last visible document for cursor pagination
 * @property {boolean} hasMore - Whether more pages exist
 * @property {number|null} [totalCount] - Total matching documents when requested
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string[]} techStack
 * @property {string} githubUrl
 * @property {string} liveUrl
 * @property {string} slug
 * @property {string} content
 * @property {boolean} visible
 * @property {boolean} featured
 * @property {string} [imageUrl]
 * @property {import('firebase/firestore').Timestamp} [createdAt]
 */

/**
 * @typedef {Object} BlogPost
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * @property {string} excerpt
 * @property {string} content
 * @property {string[]} tags
 * @property {boolean} visible
 * @property {boolean} featured
 * @property {string} [coverImage]
 * @property {import('firebase/firestore').Timestamp} [createdAt]
 */

/**
 * @typedef {Object} Experience
 * @property {string} id
 * @property {string} role
 * @property {string} company
 * @property {string} description
 * @property {string} startDate
 * @property {string} [endDate]
 * @property {boolean} visible
 * @property {import('firebase/firestore').Timestamp} [createdAt]
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} role
 * @property {string} [displayName]
 * @property {import('firebase/firestore').Timestamp} [createdAt]
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} message
 * @property {boolean} read
 * @property {import('firebase/firestore').Timestamp} [createdAt]
 */

export default class BaseService {
    constructor(collectionName, useHistory = true) {
        if (!collectionName) {
            throw new Error("BaseService requires a collectionName");
        }
        this.collectionName = collectionName;
        this.collectionRef = collection(db, collectionName);
        this.useHistory = useHistory;
    }

    /**
     * Wraps any async service call to return a standardized { data, error } object
     * instead of throwing. Use this for new code that prefers result objects over try/catch.
     * 
     * @template T
     * @param {() => Promise<T>} fn - Async function to execute
     * @returns {Promise<ServiceResult>}
     * 
     * @example
     * const { data, error } = await ProjectService.safe(() => ProjectService.getAll());
     * if (error) showToast(error, 'error');
     */
    static async safe(fn) {
        try {
            const data = await fn();
            return { data, error: null };
        } catch (err) {
            console.error('[ServiceError]', err);
            const msg = err.message || 'An unexpected error occurred';
            
            // Map to standardized Quota Exceeded code
            if (err.code === 'resource-exhausted' || msg.includes('429') || msg.toLowerCase().includes('quota exceeded')) {
                return { data: null, error: 'QUOTA_EXCEEDED' };
            }

            return { data: null, error: msg };
        }
    }

    /**
     * Fetch all documents from this collection.
     * @param {string|null} sortBy - Field to sort by
     * @param {'asc'|'desc'} sortDirection
     * @param {Function|null} trackRead
     * @returns {Promise<Array<Object>>}
     */
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
     * @param {import('firebase/firestore').DocumentSnapshot|null} [options.lastDoc]
     * @param {number} [options.limit=10]
     * @param {string} [options.search]
     * @param {string|null} [options.searchField]
     * @param {string} [options.sortBy='createdAt']
     * @param {'asc'|'desc'} [options.sortDirection='desc']
     * @param {boolean} [options.includeTotal=false]
     * @param {Function|null} [options.trackRead]
     * @returns {Promise<PaginatedResult>}
     */
    async fetchPaginated({ 
        lastDoc = null, 
        limit = 10, 
        search = '', 
        searchField = null, 
        sortBy = 'createdAt', 
        sortDirection = 'desc', 
        includeTotal = false,
        trackRead = null 
    }) {
        try {
            let baseQuery = query(this.collectionRef);

            if (search && searchField) {
                // Server-side prefix search (Firestore friendly)
                const trimmedSearch = (search || '').trim();
                
                if (trimmedSearch) {
                    const searchLower = trimmedSearch.toLowerCase();
                    baseQuery = query(
                        baseQuery,
                        where(searchField, '>=', searchLower),
                        where(searchField, '<=', searchLower + '\uf8ff')
                    );
                }
            }

            let totalCount = null;
            if (includeTotal) {
                try {
                    const countSnapshot = await getCountFromServer(baseQuery);
                    totalCount = countSnapshot.data().count;
                } catch (countError) {
                    console.warn(`count() failed in fetchPaginated for ${this.collectionName}:`, countError);
                }
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
                hasMore,
                totalCount
            };
        } catch (error) {
            console.error(`Error in fetchPaginated for ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Fetch a single document by its ID.
     * @param {string} id
     * @param {Function|null} trackRead
     * @returns {Promise<Object|null>}
     */
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

    /**
     * Fetch edit history for a document.
     * @param {string} id
     * @returns {Promise<Array<Object>>}
     */
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

    /**
     * Create a new document.
     * @param {Object} data
     * @param {Function|null} trackWrite
     * @returns {Promise<string>} The new document ID
     */
    async create(data, trackWrite = null) {
        const docRef = await addDoc(this.collectionRef, data);
        const itemName = getLocalizedField(data.title, 'en')
            || getLocalizedField(data.role, 'en')
            || getLocalizedField(data.company, 'en')
            || data.name
            || data.label
            || 'unnamed';
        const label = `Created ${this.collectionName}: ${itemName}`;
        if (trackWrite) trackWrite(1, label, data);
        if (this.useHistory) await this._saveHistory(docRef.id, 'created', data);
        return docRef.id;
    }

    /**
     * Update an existing document.
     * @param {string} id
     * @param {Object} data
     * @param {Function|null} trackWrite
     * @returns {Promise<boolean>}
     */
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
        const itemName = getLocalizedField(data.title, 'en')
            || getLocalizedField(data.role, 'en')
            || getLocalizedField(data.company, 'en')
            || data.name
            || data.label
            || id;
        const label = `Updated ${this.collectionName}: ${itemName}`;
        if (trackWrite) trackWrite(1, label, data);
        if (this.useHistory) await this._saveHistory(id, 'updated', data, previousData);
        return true;
    }

    /**
     * Delete a document by ID.
     * @param {string} id
     * @param {Function|null} trackDelete
     * @returns {Promise<boolean>}
     */
    async delete(id, trackDelete = null) {
        if (this.useHistory) await this._saveHistory(id, 'deleted', null);
        const docRef = doc(db, this.collectionName, id);
        await deleteDoc(docRef);
        if (trackDelete) trackDelete(1, `Deleted ${this.collectionName}: ${id}`, { id });
        return true;
    }

    /**
     * Batch delete multiple documents by IDs.
     * @param {Array<string>} ids
     * @param {Function|null} trackDelete
     * @returns {Promise<boolean>}
     */
    async batchDelete(ids, trackDelete = null) {
        if (!ids || ids.length === 0) return true;
        
        const batch = writeBatch(db);
        
        for (const id of ids) {
            if (this.useHistory) await this._saveHistory(id, 'deleted', null);
            const docRef = doc(db, this.collectionName, id);
            batch.delete(docRef);
        }
        
        await batch.commit();
        if (trackDelete) trackDelete(ids.length, `Batch deleted ${ids.length} items from ${this.collectionName}`);
        return true;
    }

    /**
     * Batch update multiple documents by IDs.
     * @param {Array<string>} ids
     * @param {Object} data
     * @param {Function|null} trackWrite
     * @returns {Promise<boolean>}
     */
    async batchUpdate(ids, data, trackWrite = null) {
        if (!ids || ids.length === 0) return true;
        
        const batch = writeBatch(db);
        
        for (const id of ids) {
            if (this.useHistory) {
                const currentDoc = await this.getById(id);
                if (currentDoc) {
                    const previousData = {};
                    Object.keys(data).forEach(key => {
                        previousData[key] = currentDoc[key];
                    });
                    await this._saveHistory(id, 'updated', data, previousData);
                }
            }
            const docRef = doc(db, this.collectionName, id);
            batch.update(docRef, data);
        }
        
        await batch.commit();
        if (trackWrite) trackWrite(ids.length, `Batch updated ${ids.length} items in ${this.collectionName}`, data);
        return true;
    }
}
