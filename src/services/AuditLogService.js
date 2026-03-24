import BaseService from './BaseService';
import { db } from '../firebase';
import { 
    collection, getDocs, query, orderBy, limit as firestoreLimit, 
    collectionGroup, addDoc, serverTimestamp, where,
    startAfter 
} from 'firebase/firestore';

class AuditLogService extends BaseService {
    constructor() {
        super('auditLogs');
    }

    /**
     * Records a new audit log (usually for logins or registrations)
     * @param {Object} logData - includes email, ipAddress, etc.
     * @param {string} status - 'success' or 'failure'
     * @param {string} [reason] - Optional reason for failure
     * @param {function(number, string): void} [trackWrite] - Optional activity tracker callback
     * @returns {Promise<string>} Document ID
     */
    async addAuditLog(logData, status = 'success', reason = null, trackWrite) {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...logData,
            status,
            reason,
            timestamp: serverTimestamp()
        });
        if (trackWrite) trackWrite(1, `Recorded ${status} auth audit trail`);
        return docRef.id;
    }

    /**
     * Fetch aggregated historical usage stats (reads, writes, deletes) based on a date limit
     * @param {number} limitVal - The number of days to fetch (e.g., 7, 30, 365)
     * @returns {Promise<{reads: number, writes: number, deletes: number}>}
     */
    async fetchAggregatedHistory(limitVal) {
        const q = query(
            collection(db, 'dailyUsage'), 
            orderBy('__name__', 'desc'), 
            firestoreLimit(limitVal)
        );
        const snap = await getDocs(q);
        let reads = 0, writes = 0, deletes = 0;

        snap.docs.forEach(d => {
            const data = d.data();
            reads += data.reads || 0;
            writes += data.writes || 0;
            deletes += data.deletes || 0;
        });

        return { reads, writes, deletes };
    }

    /**
     * Fetch detailed activity logs based on operation type and date range using cursor pagination
     * @param {Object} params - Query parameters
     * @param {string} params.activityDateRange - 'today', '7d', '30d', 'all'
     * @param {string} [params.operationType] - 'all', 'read', 'write', 'delete'
     * @param {string} [params.currentDateKey] - 'YYYY-MM-DD' (required if activityDateRange is 'today')
     * @param {any} [params.lastDoc] - Firestore cursor
     * @param {number} [params.limit] - Page size
     * @param {string} [params.search] - Search string
     * @param {Object} [params.filters] - Module and action filters
     * @returns {Promise<{data: Array, lastDoc: any, hasMore: boolean}>}
     */
    async fetchActivityDetails({ activityDateRange, operationType, currentDateKey, lastDoc = null, limit = 50, search = '', filters = {} }) {
        const normalizedRange = activityDateRange || 'today';
        const safeLimit = Math.min(100, Math.max(5, Number(limit) || 50));
        const normalizedSearch = (search || '').trim();

        let baseQuery;
        if (normalizedRange === 'today') {
            const dateKey = currentDateKey || new Date().toISOString().split('T')[0];
            const logsRef = collection(db, 'dailyUsage', dateKey, 'logs');
            baseQuery = query(logsRef);
        } else {
            baseQuery = query(collectionGroup(db, 'logs'));
            if (normalizedRange !== 'all') {
                const days = normalizedRange === '7d' ? 7 : (normalizedRange === '30d' ? 30 : 365);
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                const { Timestamp } = await import('firebase/firestore');
                baseQuery = query(baseQuery, where('time', '>=', Timestamp.fromDate(cutoff)));
            }
        }

        if (operationType && operationType !== 'all') {
            baseQuery = query(baseQuery, where('type', '==', operationType));
        }

        if (filters.module && filters.module !== 'all') {
            baseQuery = query(baseQuery, where('details.module', '==', filters.module));
        }

        if (filters.action && filters.action !== 'all') {
            baseQuery = query(baseQuery, where('details.action', '==', filters.action));
        }

        if (normalizedSearch) {
            baseQuery = query(
                baseQuery, 
                where('label', '>=', normalizedSearch),
                where('label', '<=', normalizedSearch + '\uf8ff')
            );
        }

        const constraints = [orderBy('time', 'desc'), firestoreLimit(safeLimit + 1)];
        if (lastDoc) constraints.push(startAfter(lastDoc));

        const q = query(baseQuery, ...constraints);
        const snap = await getDocs(q);
        
        const docs = snap.docs;
        const hasMore = docs.length > safeLimit;
        const resultDocs = hasMore ? docs.slice(0, safeLimit) : docs;
        
        const data = resultDocs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

        return {
            data,
            lastDoc: lastVisible,
            hasMore
        };
    }

    /**
     * Fetch security audit logs using cursor pagination
     * @param {Object} params - Query parameters
     * @param {string} params.userRole - User role (must be superadmin)
     * @param {function(number, string, Object): void} [params.trackRead] - Activity tracker callback
     * @param {any} [params.lastDoc] - Firestore cursor
     * @param {number} [params.limit] - Page size
     * @param {string} [params.search] - Search string
     * @param {string} [params.dateRange] - 'all', 'today', '7d', '30d'
     * @returns {Promise<{data: Array, lastDoc: any, hasMore: boolean}>}
     */
    async fetchSecurityAuditTrail({ userRole, trackRead, lastDoc = null, limit = 10, search = '', dateRange = 'all' }) {
        if (userRole !== 'superadmin') throw new Error('Unauthorized');
        const safeLimit = Math.min(100, Math.max(5, Number(limit) || 10));
        const normalizedSearch = (search || '').trim();
        
        const baseRef = collection(db, this.collectionName);
        let baseQuery = query(baseRef);

        if (dateRange !== 'all') {
            const now = new Date();
            let cutoff = new Date();
            if (dateRange === 'today') cutoff.setHours(0, 0, 0, 0);
            else if (dateRange === '7d') cutoff.setDate(now.getDate() - 7);
            else if (dateRange === '30d') cutoff.setDate(now.getDate() - 30);
            baseQuery = query(baseQuery, where('timestamp', '>=', cutoff));
        }

        if (normalizedSearch) {
            baseQuery = query(
                baseQuery,
                where('email', '>=', normalizedSearch),
                where('email', '<=', normalizedSearch + '\uf8ff')
            );
        }

        const queryConstraints = [orderBy('timestamp', 'desc'), firestoreLimit(safeLimit + 1)];
        if (lastDoc) queryConstraints.push(startAfter(lastDoc));

        const q = query(baseQuery, ...queryConstraints);
        const querySnapshot = await getDocs(q);
        
        const docs = querySnapshot.docs;
        const hasMore = docs.length > safeLimit;
        const resultDocs = hasMore ? docs.slice(0, safeLimit) : docs;
        
        const data = resultDocs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

        if (trackRead) trackRead(querySnapshot.size, 'Fetched audit logs list', { count: querySnapshot.size });
        
        return {
            data,
            lastDoc: lastVisible,
            hasMore
        };
    }
}

export default new AuditLogService();
