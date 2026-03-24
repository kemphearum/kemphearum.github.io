import BaseService from './BaseService';
import { db } from '../firebase';
import { doc, writeBatch, query, where, getCountFromServer, collection } from 'firebase/firestore';

class MessageService extends BaseService {
    constructor() {
        super('messages', false);
    }

    /**
     * Create a new message with email normalization.
     * @param {Object} data - The message payload
     * @param {function(number, string, Object): void} [trackWrite] 
     * @returns {Promise<string>} The new document ID
     */
    async create(data, trackWrite) {
        const processedData = {
            ...data,
            senderEmail: data.email?.toLowerCase() || data.senderEmail?.toLowerCase() || ''
        };
        return super.create(processedData, trackWrite);
    }

    /**
     * Toggle read status for a message.
     * @param {string} userRole 
     * @param {string} id 
     * @param {boolean} currentStatus 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<void>}
     */
    async toggleReadStatus(userRole, id, currentStatus, trackWrite) {
        if (userRole === 'pending') {
            throw new Error('Unauthorized');
        }
        return this.update(id, { isRead: !currentStatus }, trackWrite);
    }

    /**
     * Delete a message.
     * @param {string} userRole 
     * @param {string} id 
     * @param {function(number, string, Object): void} [trackDelete] 
     * @returns {Promise<void>}
     */
    async deleteMessage(userRole, id, trackDelete) {
        if (userRole === 'pending') {
            throw new Error('Unauthorized');
        }
        return this.delete(id, trackDelete);
    }

    /**
     * Batch mark messages as read or unread.
     * @param {string} userRole 
     * @param {Array<string>} selectedMessageIds 
     * @param {boolean} isRead 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<{count: number}>}
     */
    async batchMarkMessages(userRole, selectedMessageIds, isRead, trackWrite) {
        if (userRole === 'pending') {
            throw new Error('Unauthorized');
        }
        if (!selectedMessageIds || selectedMessageIds.length === 0) return { count: 0 };

        const batch = writeBatch(db);
        selectedMessageIds.forEach(id => {
            const docRef = doc(db, this.collectionName, id);
            batch.update(docRef, { isRead });
        });

        await batch.commit();
        if (trackWrite) {
            trackWrite(selectedMessageIds.length, `Batch marked messages as ${isRead ? 'read' : 'unread'}`);
        }
        return { count: selectedMessageIds.length };
    }

    /**
     * Batch delete messages.
     * @param {string} userRole 
     * @param {Array<string>} selectedMessageIds 
     * @param {function(number, string, Object): void} [trackDelete] 
     * @returns {Promise<{count: number}>}
     */
    async batchDeleteMessages(userRole, selectedMessageIds, trackDelete) {
        if (userRole === 'pending') {
            throw new Error('Unauthorized');
        }
        if (!selectedMessageIds || selectedMessageIds.length === 0) return { count: 0 };

        const batch = writeBatch(db);
        selectedMessageIds.forEach(id => {
            const docRef = doc(db, this.collectionName, id);
            batch.delete(docRef);
        });

        await batch.commit();
        if (trackDelete) {
            trackDelete(selectedMessageIds.length, 'Batch deleted messages');
        }
        return { count: selectedMessageIds.length };
    }

    /**
     * Get count of unread messages.
     * @returns {Promise<number>}
     */
    async getUnreadCount() {
        const q = query(collection(db, this.collectionName), where('isRead', '==', false));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    }

    /**
     * Fetch messages with server-side cursor-based pagination and search
     * @param {Object} params
     * @param {import('firebase/firestore').DocumentSnapshot|null} [params.lastDoc=null]
     * @param {number} [params.limit=20]
     * @param {string} [params.search='']
     * @returns {Promise<import('./BaseService').PaginatedResult>}
     */
    async fetchMessagesPaginated({ lastDoc = null, limit = 20, search = '', includeTotal = false }) {
        return this.fetchPaginated({
            lastDoc,
            limit,
            search,
            searchField: 'senderEmail',
            sortBy: 'createdAt',
            sortDirection: 'desc',
            includeTotal
        });
    }
}

export default new MessageService();
