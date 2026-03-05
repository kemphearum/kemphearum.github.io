import BaseService from './BaseService';
import { db } from '../firebase';
import { doc, writeBatch } from 'firebase/firestore';

class MessageService extends BaseService {
    constructor() {
        super('messages');
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
}

export default new MessageService();
