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

    /**
     * Fetch analytics visits within a date range
     * @param {string} userRole 
     * @param {Object} dateRangeConfig - { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
     * @param {function(number, string): void} [trackRead] - Optional activity tracker callback
     * @returns {Promise<Array<Object>>} List of visit records
     */
    async fetchAnalytics(userRole, dateRangeConfig, trackRead) {
        if (userRole !== 'superadmin' && userRole !== 'admin') return [];

        const startDate = new Date(dateRangeConfig.start + 'T00:00:00');
        const endDate = new Date(dateRangeConfig.end + 'T23:59:59');

        const q = query(
            collection(db, this.collectionName),
            where("timestamp", ">=", startDate),
            where("timestamp", "<=", endDate),
            orderBy("timestamp", "desc"),
            firestoreLimit(2000)
        );

        const querySnapshot = await getDocs(q);
        if (trackRead) {
            trackRead(querySnapshot.size, 'Fetched analytics visits history');
        }

        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Fetch analytics visits details with pagination
     * @param {string} userRole 
     * @param {Object} dateRangeConfig - { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
     * @param {string} type - Display type for tracking
     * @param {Object} [pagination] - Pagination config
     * @param {number} [pagination.page]
     * @param {number} [pagination.limit]
     * @param {function(number, string): void} [trackRead] - Optional activity tracker callback
     * @returns {Promise<{data: Array, meta: {total: number, page: number, totalPages: number}}>}
     */
    async fetchAnalyticsDetails(userRole, dateRangeConfig, type, pagination = { page: 1, limit: 50 }, trackRead) {
        if (userRole !== 'superadmin' && userRole !== 'admin') return { data: [], meta: { total: 0 } };

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

        const q = query(baseQuery, orderBy("timestamp", "desc"), firestoreLimit(page * limit));
        const querySnapshot = await getDocs(q);

        const logs = querySnapshot.docs.slice((page - 1) * limit).map(doc => ({ id: doc.id, ...doc.data() }));

        if (trackRead) {
            trackRead(querySnapshot.size, `Fetched details for ${type} (page ${page})`);
        }

        return {
            data: logs,
            meta: {
                total: totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }

    /**
     * Logs a public page visit tracking event.
     * @param {Object} visitData
     * @returns {Promise<string>} Document ID
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
     * @returns {Promise<void>}
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
