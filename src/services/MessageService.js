import BaseService from './BaseService';
import { db } from '../firebase';
import { doc, writeBatch, query, where, getCountFromServer, orderBy, limit as firestoreLimit, getDocs, collection, startAfter } from 'firebase/firestore';

class MessageService extends BaseService {
    constructor() {
        super('messages', false);
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
        try {
            let baseRef = collection(db, this.collectionName);
            let constraints = [orderBy('createdAt', 'desc'), firestoreLimit(limit + 1)];

            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(baseRef, ...constraints);
            const snap = await getDocs(q);
            
            const docs = snap.docs;
            const hasMore = docs.length > limit;
            const resultDocs = hasMore ? docs.slice(0, limit) : docs;
            
            let data = resultDocs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastVisible = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

            if (search) {
                const lower = search.toLowerCase();
                data = data.filter(m => 
                    (m.senderName && m.senderName.toLowerCase().includes(lower)) || 
                    (m.senderEmail && m.senderEmail.toLowerCase().includes(lower)) ||
                    (m.subject && m.subject.toLowerCase().includes(lower))
                );
            }

            return {
                data,
                lastDoc: lastVisible,
                hasMore
            };
        } catch (error) {
            console.error("Error in fetchMessagesPaginated:", error);
            throw error;
        }
    }
}

export default new MessageService();
