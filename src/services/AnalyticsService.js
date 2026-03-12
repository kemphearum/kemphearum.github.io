import BaseService from './BaseService';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, getCountFromServer, limit as firestoreLimit, addDoc, serverTimestamp } from 'firebase/firestore';

class AnalyticsService extends BaseService {
    constructor() {
        super('visits');
    }

    async fetchAnalytics(userRole, dateRangeConfig, trackRead) {
        if (userRole !== 'superadmin' && userRole !== 'admin') return [];

        const startDate = new Date(dateRangeConfig.start + 'T00:00:00');
        const endDate = new Date(dateRangeConfig.end + 'T23:59:59');

        const q = query(
            collection(db, this.collectionName),
            where("timestamp", ">=", startDate),
            where("timestamp", "<=", endDate),
            orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        if (trackRead) {
            trackRead(querySnapshot.size, 'Fetched analytics visits history');
        }

        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async fetchAnalyticsDetails(userRole, dateRangeConfig, type, limitOverride = 200, trackRead) {
        if (userRole !== 'superadmin' && userRole !== 'admin') return { logs: [], total: 0 };

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

export default new AnalyticsService();
