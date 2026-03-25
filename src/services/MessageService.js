import BaseService from './BaseService';
import { db } from '../firebase';
import { doc, writeBatch, query, where, getCountFromServer, collection } from 'firebase/firestore';

const UNREAD_COUNT_CACHE_MS = 30000;
const UNREAD_COUNT_BACKOFF_START_MS = 5000;
const UNREAD_COUNT_BACKOFF_MAX_MS = 300000;

class MessageService extends BaseService {
    constructor() {
        super('messages', false);
        this.unreadCountCache = { value: 0, fetchedAt: 0 };
        this.unreadCountInFlight = null;
        this.unreadCountBackoffMs = 0;
        this.unreadCountBackoffUntil = 0;
    }

    _getCachedUnreadCount() {
        const value = Number(this.unreadCountCache?.value);
        return Number.isFinite(value) ? Math.max(0, value) : 0;
    }

    _setCachedUnreadCount(nextValue) {
        const value = Number(nextValue);
        this.unreadCountCache = {
            value: Number.isFinite(value) ? Math.max(0, value) : 0,
            fetchedAt: Date.now()
        };
    }

    _adjustCachedUnreadCount(delta) {
        const amount = Number(delta);
        if (!Number.isFinite(amount) || amount === 0) return;
        this._setCachedUnreadCount(this._getCachedUnreadCount() + amount);
    }

    _isQuotaExceededError(error) {
        const code = String(error?.code || '').toLowerCase();
        const message = String(error?.message || '').toLowerCase();
        return (
            code.includes('resource-exhausted')
            || code.includes('quota')
            || message.includes('quota exceeded')
            || message.includes('too many requests')
            || message.includes('429')
        );
    }

    _increaseUnreadBackoff() {
        this.unreadCountBackoffMs = this.unreadCountBackoffMs
            ? Math.min(this.unreadCountBackoffMs * 2, UNREAD_COUNT_BACKOFF_MAX_MS)
            : UNREAD_COUNT_BACKOFF_START_MS;
        this.unreadCountBackoffUntil = Date.now() + this.unreadCountBackoffMs;
    }

    _resetUnreadBackoff() {
        this.unreadCountBackoffMs = 0;
        this.unreadCountBackoffUntil = 0;
    }

    invalidateUnreadCountCache() {
        this.unreadCountCache.fetchedAt = 0;
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
        const id = await super.create(processedData, trackWrite);

        if (processedData.isRead === false || processedData.isRead === undefined) {
            this._adjustCachedUnreadCount(1);
        } else {
            this.invalidateUnreadCountCache();
        }

        return id;
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
        await this.update(id, { isRead: !currentStatus }, trackWrite);
        // currentStatus=false -> now read, decrement unread. currentStatus=true -> now unread, increment unread.
        this._adjustCachedUnreadCount(currentStatus ? 1 : -1);
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
        await this.delete(id, trackDelete);
        this.invalidateUnreadCountCache();
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
        this.invalidateUnreadCountCache();
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
        this.invalidateUnreadCountCache();
        return { count: selectedMessageIds.length };
    }

    /**
     * Get count of unread messages.
     * @returns {Promise<number>}
     */
    async getUnreadCount() {
        const now = Date.now();
        const cacheAge = now - Number(this.unreadCountCache?.fetchedAt || 0);
        const shouldUseFreshCache = cacheAge >= 0 && cacheAge < UNREAD_COUNT_CACHE_MS;
        if (shouldUseFreshCache) {
            return this._getCachedUnreadCount();
        }

        if (this.unreadCountInFlight) {
            return this.unreadCountInFlight;
        }

        if (this.unreadCountBackoffUntil > now) {
            return this._getCachedUnreadCount();
        }

        const q = query(collection(db, this.collectionName), where('isRead', '==', false));
        this.unreadCountInFlight = (async () => {
            try {
                const snapshot = await getCountFromServer(q);
                const count = Number(snapshot.data()?.count || 0);
                this._setCachedUnreadCount(count);
                this._resetUnreadBackoff();
                return this._getCachedUnreadCount();
            } catch (error) {
                if (this._isQuotaExceededError(error)) {
                    this._increaseUnreadBackoff();
                    console.warn(
                        `Unread count query throttled; backing off for ${Math.round(this.unreadCountBackoffMs / 1000)}s.`
                    );
                    return this._getCachedUnreadCount();
                }
                throw error;
            } finally {
                this.unreadCountInFlight = null;
            }
        })();

        return this.unreadCountInFlight;
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
