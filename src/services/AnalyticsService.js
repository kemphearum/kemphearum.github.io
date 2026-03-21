import BaseService from './BaseService';
import { db } from '../firebase';
import { 
    collection, getDocs, query, where, orderBy, getCountFromServer, 
    limit as firestoreLimit, addDoc, serverTimestamp, doc, updateDoc 
} from 'firebase/firestore';

class AnalyticsService extends BaseService {
    constructor() {
        super('visits');
    }

    async fetchAnalytics(userRole, dateRangeConfig, trackRead) {
        if (userRole !== 'superadmin' && userRole !== 'admin') return [];

        try {
            const startDate = new Date(dateRangeConfig.start + 'T00:00:00');
            const endDate = new Date(dateRangeConfig.end + 'T23:59:59');

            const q = query(
                collection(db, this.collectionName),
                where("timestamp", ">=", startDate),
                where("timestamp", "<=", endDate),
                orderBy("timestamp", "desc"),
                firestoreLimit(2000) // Safety limit to prevent quota exhaustion
            );

            const querySnapshot = await getDocs(q);
            if (trackRead) {
                trackRead(querySnapshot.size, 'Fetched analytics visits history');
            }

            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore Error in fetchAnalytics:", error);
            if (error.code === 'resource-exhausted') {
                throw new Error('QUOTA_EXCEEDED');
            }
            throw error;
        }
    }

    /**
     * Fetch analytics visits details with pagination
     * @param {string} userRole 
     * @param {Object} dateRangeConfig - { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
     * @param {Object} pagination - { page, limit }
     * @returns {Promise<{logs: Array, total: number, page: number, totalPages: number}>}
     */
    async fetchAnalyticsDetails(userRole, dateRangeConfig, type, pagination = { page: 1, limit: 50 }, trackRead) {
        if (userRole !== 'superadmin' && userRole !== 'admin') return { logs: [], total: 0 };

        try {
            const { page = 1, limit = 50 } = pagination;
            const startDate = new Date(dateRangeConfig.start + 'T00:00:00');
            const endDate = new Date(dateRangeConfig.end + 'T23:59:59');

            const baseQuery = query(
                collection(db, this.collectionName),
                where("timestamp", ">=", startDate),
                where("timestamp", "<=", endDate)
            );

            const totalSnap = await getCountFromServer(baseQuery);
            const totalCount = totalSnap.data().count;

            // Fetch up to the current page's end
            const q = query(baseQuery, orderBy("timestamp", "desc"), firestoreLimit(page * limit));
            const querySnapshot = await getDocs(q);

            // Slice the last page-worth of documents for client-side pagination bridge
            const logs = querySnapshot.docs.slice((page - 1) * limit).map(doc => ({ id: doc.id, ...doc.data() }));

            if (trackRead) {
                trackRead(querySnapshot.size, `Fetched details for ${type} (page ${page})`);
            }

            return {
                logs,
                total: totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit)
            };
        } catch (error) {
            console.error("Firestore Error in fetchAnalyticsDetails:", error);
            if (error.code === 'resource-exhausted') {
                return { logs: [], total: 0, quotaExceeded: true };
            }
            throw error;
        }
    }

    /**
     * Logs a public page visit tracking event.
     * @param {Object} visitData
     * @returns {Promise<string>} The ID of the created visit document
     */
    async logVisit(visitData) {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...visitData,
            timestamp: serverTimestamp()
        });
        return docRef.id;
    }

    /**
     * Updates the duration of a visit.
     * @param {string} visitId 
     * @param {number} durationSeconds 
     */
    async updateVisitDuration(visitId, durationSeconds) {
        const docRef = doc(db, this.collectionName, visitId);
        await updateDoc(docRef, {
            duration: durationSeconds
        });
    }
}

const analyticsServiceInstance = new AnalyticsService();
export { analyticsServiceInstance as AnalyticsService };
export default analyticsServiceInstance;
