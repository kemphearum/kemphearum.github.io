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

    async fetchAnalyticsDetails(userRole, dateRangeConfig, type, limitOverride = 200, trackRead) {
        if (userRole !== 'superadmin' && userRole !== 'admin') return { logs: [], total: 0 };

        try {
            const startDate = new Date(dateRangeConfig.start + 'T00:00:00');
            const endDate = new Date(dateRangeConfig.end + 'T23:59:59');

            let q = query(
                collection(db, this.collectionName),
                where("timestamp", ">=", startDate),
                where("timestamp", "<=", endDate)
            );

            const totalSnap = await getCountFromServer(q);
            const totalCount = totalSnap.data().count;

            const querySnapshot = await getDocs(query(q, orderBy("timestamp", "desc"), firestoreLimit(limitOverride)));

            if (trackRead) {
                trackRead(querySnapshot.size, `Fetched details for ${type}`);
            }

            return {
                logs: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                total: totalCount
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
