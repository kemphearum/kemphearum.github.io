import BaseService from './BaseService';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit as firestoreLimit, collectionGroup } from 'firebase/firestore';

class AuditLogService extends BaseService {
    constructor() {
        super('auditLogs');
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
     * Fetch detailed activity logs based on operation type and date range
     * @param {string} activityDateRange - 'today', '7d', '30d', or 'all'
     * @param {string} operationType - 'read', 'write', or 'delete'
     * @param {string} currentDateKey - The date string for 'today' (YYYY-MM-DD)
     * @returns {Promise<Array>}
     */
    async fetchActivityDetails(activityDateRange, operationType, currentDateKey) {
        let logs = [];

        if (activityDateRange === 'today') {
            const q = query(collection(db, 'dailyUsage', currentDateKey, 'logs'), orderBy('time', 'desc'), firestoreLimit(250));
            const snap = await getDocs(q);
            logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            // To avoid Collection Group index requirements, we fetch from individual days for 7/30d
            const daysToFetch = activityDateRange === '7d' ? 7 : (activityDateRange === '30d' ? 30 : 0);

            if (daysToFetch > 0) {
                // Get a larger batch of days and sort locally to get the most recent ones
                const qDays = query(collection(db, 'dailyUsage'), firestoreLimit(365));
                const daysSnap = await getDocs(qDays);

                // Sort descending by ID (date string like "2024-03-04") and take the most recent ones
                const sortedDays = [...daysSnap.docs]
                    .sort((a, b) => b.id.localeCompare(a.id))
                    .slice(0, daysToFetch);

                // Fetch logs for each day in parallel
                const logPromises = sortedDays.map(async (dayDoc) => {
                    const qLogs = query(collection(db, 'dailyUsage', dayDoc.id, 'logs'), firestoreLimit(100));
                    const lSnap = await getDocs(qLogs);
                    return lSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                });

                const logResults = await Promise.all(logPromises);
                logs = logResults.flat();
                // Sort combined logs by time
                logs.sort((a, b) => (b.time?.seconds || 0) - (a.time?.seconds || 0));
            } else {
                // For "All Time", we catch the index error specifically
                try {
                    const q = query(collectionGroup(db, 'logs'), orderBy('time', 'desc'), firestoreLimit(500));
                    const snap = await getDocs(q);
                    logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (cgErr) {
                    if (cgErr.code === 'failed-precondition') {
                        throw new Error("Historical cross-day logs require a Firestore Index. Please check the browser console for the setup link.");
                    }
                    throw cgErr;
                }
            }
        }

        // Finally filter by operation type
        const filteredLogs = logs.filter(log => log.type === operationType);
        return filteredLogs.slice(0, 500);
    }

    /**
     * Fetch security audit logs (logins, role changes, etc.)
     * @param {string} userRole 
     * @param {Function} trackRead 
     * @returns {Promise<Array>}
     */
    async fetchSecurityAuditTrail(userRole, trackRead) {
        if (userRole !== 'superadmin') return [];
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), firestoreLimit(100));
        const querySnapshot = await getDocs(q);
        if (trackRead) trackRead(querySnapshot.size, 'Fetched audit logs list');
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}

export default new AuditLogService();
