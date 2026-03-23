import BaseService from './BaseService';
import { db } from '../firebase';
import { doc, writeBatch, query, where, getCountFromServer, orderBy, limit as firestoreLimit, getDocs, collection, startAfter } from 'firebase/firestore';

class MessageService extends BaseService {
    constructor() {
        super('messages', false);
    }

    async create(data, trackWrite) {
        const processedData = {
            ...data,
            senderEmail: data.email?.toLowerCase() || data.senderEmail?.toLowerCase() || ''
        };
        return super.create(processedData, trackWrite);
    }

    async toggleReadStatus(userRole, id, currentStatus, trackWrite) {
        if (userRole === 'pending') {
            throw new Error("Not authorized to update message status.");
        }
        return this.update(id, { isRead: !currentStatus }, trackWrite);
    }

    async deleteMessage(userRole, id, trackDelete) {
        if (userRole === 'pending') {
            throw new Error("Not authorized to delete messages.");
        }
        return this.delete(id, trackDelete);
    }

    async batchMarkMessages(userRole, selectedMessageIds, isRead, trackWrite) {
        if (userRole === 'pending') {
            throw new Error("Not authorized to update messages.");
        }
        if (!selectedMessageIds || selectedMessageIds.length === 0) return;

        const batch = writeBatch(db);
        selectedMessageIds.forEach(id => {
            const docRef = doc(db, this.collectionName, id);
            batch.update(docRef, { isRead });
        });

        await batch.commit();
        if (trackWrite) {
            trackWrite(selectedMessageIds.length, `Batch marked messages as ${isRead ? 'read' : 'unread'}`);
        }
    }

    async batchDeleteMessages(userRole, selectedMessageIds, trackDelete) {
        if (userRole === 'pending') {
            throw new Error("Not authorized to delete messages.");
        }
        if (!selectedMessageIds || selectedMessageIds.length === 0) return;

        const batch = writeBatch(db);
        selectedMessageIds.forEach(id => {
            const docRef = doc(db, this.collectionName, id);
            batch.delete(docRef);
        });

        await batch.commit();
        if (trackDelete) {
            trackDelete(selectedMessageIds.length, 'Batch deleted messages');
        }
    }

    async getUnreadCount() {
        try {
            const q = query(collection(db, this.collectionName), where('isRead', '==', false));
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            console.error("Error getting unread count:", error);
            return 0;
        }
    }

    /**
     * Fetch messages with server-side cursor-based pagination and search
     * @param {Object} params - { lastDoc, limit, search }
     * @returns {Promise<{data: Array, lastDoc: any, hasMore: boolean}>}
     */
    async fetchMessagesPaginated({ lastDoc = null, limit = 20, search = '' }) {
        return this.fetchPaginated({
            lastDoc,
            limit,
            search,
            searchField: 'senderEmail',
            sortBy: 'createdAt',
            sortDirection: 'desc'
        });
    }
}

export default new MessageService();
