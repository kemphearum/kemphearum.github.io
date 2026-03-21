import BaseService from './BaseService';
import { db } from '../firebase';
import { 
    collection, getDocs, query, orderBy, limit as firestoreLimit, 
    collectionGroup, addDoc, serverTimestamp, where, getCountFromServer,
    startAfter 
} from 'firebase/firestore';

class AuditLogService extends BaseService {
    constructor() {
        super('auditLogs');
    }

    /**
     * Records a new audit log (usually for logins or registrations)
     * @param {Object} logData 
     * @param {Function} trackWrite 
     * @returns {Promise<string>} document ID
     */
    async addAuditLog(logData, trackWrite) {
        try {
            const docRef = await addDoc(collection(db, this.collectionName), {
                ...logData,
                timestamp: serverTimestamp()
            });
            if (trackWrite) trackWrite(1, 'Recorded auth audit trail');
            return docRef.id;
        } catch (error) {
            console.error("Failed to write audit log:", error);
            throw error;
        }
    }

    /**
     * Fetch aggregated historical usage stats (reads, writes, deletes) based on a date limit
     * @param {number} limitVal - The number of days to fetch (e.g., 7, 30, 365)
     * @returns {Promise<{reads: number, writes: number, deletes: number}>}
     */
    async fetchAggregatedHistory(limitVal) {
        const q = query(collection(db, 'dailyUsage'), firestoreLimit(365));
        const snap = await getDocs(q);
        let reads = 0, writes = 0, deletes = 0;

        // Sort docs by ID (date string YYYY-MM-DD) descending and take the limit
        const sortedDocs = [...snap.docs]
            .sort((a, b) => b.id.localeCompare(a.id))
            .slice(0, limitVal);

        sortedDocs.forEach(d => {
            const data = d.data();
            reads += data.reads || 0;
            writes += data.writes || 0;
            deletes += data.deletes || 0;
        });

        return { reads, writes, deletes };
    }

    /**
     * Fetch detailed activity logs based on operation type and date range using cursor pagination
     * @param {Object} params - { activityDateRange, operationType, currentDateKey, lastDoc, limit, search }
     * @returns {Promise<{data: Array, lastDoc: any, hasMore: boolean}>}
     */
    async fetchActivityDetails({ activityDateRange, operationType, currentDateKey, lastDoc = null, limit = 50, search = '' }) {
        let logs = [];

        try {
            let baseQuery;
            if (activityDateRange === 'today') {
                const logsRef = collection(db, 'dailyUsage', currentDateKey, 'logs');
                baseQuery = query(logsRef, where('type', '==', operationType));
            } else {
                baseQuery = query(collectionGroup(db, 'logs'), where('type', '==', operationType));
                if (activityDateRange !== 'all') {
                    const days = activityDateRange === '7d' ? 7 : (activityDateRange === '30d' ? 30 : 365);
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - days);
                    baseQuery = query(baseQuery, where('time', '>=', cutoff));
                }
            }

            // Prepare paginated query
            let constraints = [orderBy('time', 'desc'), firestoreLimit(limit + 1)]; // Fetch limit + 1 to check hasMore
            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(baseQuery, ...constraints);
            const snap = await getDocs(q);
            
            const docs = snap.docs;
            const hasMore = docs.length > limit;
            const resultDocs = hasMore ? docs.slice(0, limit) : docs;
            
            logs = resultDocs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastVisible = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

            // Client-side search within the fetched chunk
            if (search) {
                const lower = search.toLowerCase();
                logs = logs.filter(l => 
                    (l.label && l.label.toLowerCase().includes(lower)) || 
                    (l.user && l.user.toLowerCase().includes(lower))
                );
            }

            return {
                data: logs,
                lastDoc: lastVisible,
                hasMore
            };
        } catch (error) {
            console.error("Error in fetchActivityDetails:", error);
            if (error.code === 'failed-precondition') {
                throw new Error("This query requires a Firestore Index. Check console for link.");
            }
            throw error;
        }
    }

    /**
     * Fetch security audit logs using cursor pagination
     * @param {Object} params - { userRole, trackRead, lastDoc, limit, search, dateRange }
     * @returns {Promise<{data: Array, lastDoc: any, hasMore: boolean}>}
     */
    async fetchSecurityAuditTrail({ userRole, trackRead, lastDoc = null, limit = 10, search = '', dateRange = 'all' }) {
        if (userRole !== 'superadmin') return { data: [], lastDoc: null, hasMore: false };
        
        try {
            const baseRef = collection(db, this.collectionName);
            let constraints = [];

            if (dateRange !== 'all') {
                const now = new Date();
                let cutoff = new Date();
                if (dateRange === 'today') cutoff.setHours(0, 0, 0, 0);
                else if (dateRange === '7d') cutoff.setDate(now.getDate() - 7);
                else if (dateRange === '30d') cutoff.setDate(now.getDate() - 30);
                constraints.push(where('timestamp', '>=', cutoff));
            }

            let queryConstraints = [...constraints, orderBy('timestamp', 'desc'), firestoreLimit(limit + 1)];
            if (lastDoc) {
                queryConstraints.push(startAfter(lastDoc));
            }

            const q = query(baseRef, ...queryConstraints);
            const querySnapshot = await getDocs(q);
            
            const docs = querySnapshot.docs;
            const hasMore = docs.length > limit;
            const resultDocs = hasMore ? docs.slice(0, limit) : docs;
            
            const data = resultDocs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastVisible = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

            if (trackRead) trackRead(querySnapshot.size, 'Fetched audit logs list', { count: querySnapshot.size });
            
            return {
                data,
                lastDoc: lastVisible,
                hasMore
            };
        } catch (error) {
            console.error("Error in fetchSecurityAuditTrail:", error);
            throw error;
        }
    }
}

export default new AuditLogService();
