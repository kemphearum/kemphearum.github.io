import BaseService from './BaseService';
import { db } from '../firebase';
import { 
    collection, getDocs, query, where, orderBy, getCountFromServer, 
    limit as firestoreLimit, addDoc, serverTimestamp, doc, updateDoc 
} from 'firebase/firestore';
import { isAdminRole } from '../utils/permissions';

const MAX_ANALYTICS_ROWS = 3000;
const MAX_DETAIL_WINDOW = 5000;
const MAX_DURATION_SECONDS = 86400;

const toDateString = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeDateRange = (range) => {
    const now = new Date();
    const endSource = range?.end || toDateString(now);
    const startSource = range?.start || endSource;

    const startDate = new Date(`${startSource}T00:00:00`);
    const endDate = new Date(`${endSource}T23:59:59.999`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new Error('Invalid analytics date range');
    }

    if (startDate.getTime() > endDate.getTime()) {
        throw new Error('Analytics start date must be before end date');
    }

    return {
        startDate,
        endDate,
        startKey: toDateString(startDate),
        endKey: toDateString(endDate)
    };
};

const sanitizeVisitString = (value, fallback = 'Unknown', max = 256) => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim();
    if (!normalized) return fallback;
    return normalized.slice(0, max);
};

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
        if (!isAdminRole(userRole)) return [];

        const { startDate, endDate, startKey, endKey } = normalizeDateRange(dateRangeConfig);

        const byTimestampQuery = query(
            collection(db, this.collectionName),
            where('timestamp', '>=', startDate),
            where('timestamp', '<=', endDate),
            orderBy('timestamp', 'desc'),
            firestoreLimit(MAX_ANALYTICS_ROWS)
        );

        let querySnapshot = await getDocs(byTimestampQuery);
        let rows = querySnapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));

        // Compatibility fallback: older rows might only have a `date` field.
        if (rows.length === 0) {
            try {
                const byDateQuery = query(
                    collection(db, this.collectionName),
                    where('date', '>=', startKey),
                    where('date', '<=', endKey),
                    orderBy('date', 'desc'),
                    firestoreLimit(MAX_ANALYTICS_ROWS)
                );
                querySnapshot = await getDocs(byDateQuery);
                rows = querySnapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
            } catch (dateFallbackError) {
                console.warn('[Analytics] Date-key fallback query failed:', dateFallbackError);
            }
        }

        if (trackRead) {
            trackRead(querySnapshot.size, 'Fetched analytics visits history');
        }

        return rows;
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
        if (!isAdminRole(userRole)) {
            return { data: [], meta: { total: 0, page: 1, totalPages: 0, hasMore: false } };
        }

        const unsafePage = Number.isFinite(Number(pagination?.page)) ? Number(pagination.page) : 1;
        const unsafeLimit = Number.isFinite(Number(pagination?.limit)) ? Number(pagination.limit) : 50;
        const page = Math.max(1, Math.floor(unsafePage));
        const limit = Math.max(1, Math.min(200, Math.floor(unsafeLimit)));
        const { startDate, endDate, startKey, endKey } = normalizeDateRange(dateRangeConfig);

        const baseQuery = query(
            collection(db, this.collectionName),
            where('timestamp', '>=', startDate),
            where('timestamp', '<=', endDate)
        );

        let totalCount = 0;
        try {
            const totalSnap = await getCountFromServer(baseQuery);
            totalCount = totalSnap.data().count;
        } catch (countError) {
            // Some environments/rules may reject count() while normal reads still work.
            // Continue with paged reads and derive a best-effort total below.
            console.warn('[Analytics] count() failed in fetchAnalyticsDetails, falling back to page-size total.', countError);
        }

        const queryWindow = Math.min(MAX_DETAIL_WINDOW, Math.max(limit, page * limit));
        let querySnapshot = await getDocs(query(baseQuery, orderBy('timestamp', 'desc'), firestoreLimit(queryWindow)));
        let docs = querySnapshot.docs;

        // Compatibility fallback: older rows might only have a `date` field.
        if (docs.length === 0) {
            try {
                const byDateQuery = query(
                    collection(db, this.collectionName),
                    where('date', '>=', startKey),
                    where('date', '<=', endKey),
                    orderBy('date', 'desc'),
                    firestoreLimit(queryWindow)
                );
                querySnapshot = await getDocs(byDateQuery);
                docs = querySnapshot.docs;
            } catch (dateFallbackError) {
                console.warn('[Analytics] Date-key fallback details query failed:', dateFallbackError);
            }
        }

        const startIndex = (page - 1) * limit;
        const logs = docs.slice(startIndex, startIndex + limit).map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
        if (totalCount === 0 && docs.length > 0) {
            // Best-effort total when count() is unavailable.
            totalCount = Math.max(startIndex + logs.length, docs.length);
        }

        if (trackRead) {
            trackRead(logs.length, `Fetched analytics details for ${type} (page ${page})`);
        }

        const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;
        const hasMore = totalCount > 0 ? page < totalPages : docs.length > startIndex + logs.length;

        return {
            data: logs,
            meta: {
                total: totalCount,
                page,
                totalPages,
                hasMore
            }
        };
    }

    /**
     * Logs a public page visit tracking event.
     * @param {Object} visitData
     * @returns {Promise<string>} Document ID
     */
    async logVisit(visitData) {
        const now = new Date();
        const dateKey = toDateString(now);

        const sanitizedPayload = {
            sessionId: sanitizeVisitString(visitData?.sessionId, 'unknown-session', 128),
            path: sanitizeVisitString(visitData?.path, '/', 512),
            date: sanitizeVisitString(visitData?.date || dateKey, dateKey, 10),
            userAgent: sanitizeVisitString(visitData?.userAgent, 'Unknown', 1024),
            device: sanitizeVisitString(visitData?.device, 'desktop', 24).toLowerCase(),
            browser: sanitizeVisitString(visitData?.browser, 'Unknown', 80),
            os: sanitizeVisitString(visitData?.os, 'Unknown', 80),
            isReturning: Boolean(visitData?.isReturning),
            country: sanitizeVisitString(visitData?.country, 'Unknown', 100),
            countryCode: sanitizeVisitString(visitData?.countryCode, 'UN', 3).toUpperCase(),
            city: sanitizeVisitString(visitData?.city, 'Unknown', 120),
            ip: sanitizeVisitString(visitData?.ip, 'Unknown', 64),
            referrer: sanitizeVisitString(visitData?.referrer, 'Direct', 1024),
            duration: 0
        };

        const docRef = await addDoc(collection(db, this.collectionName), {
            ...sanitizedPayload,
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
        if (!visitId || typeof visitId !== 'string') return;

        const normalizedDuration = Number.isFinite(Number(durationSeconds))
            ? Math.floor(Number(durationSeconds))
            : 0;
        const safeDuration = Math.max(0, Math.min(MAX_DURATION_SECONDS, normalizedDuration));

        const docRef = doc(db, this.collectionName, visitId);
        await updateDoc(docRef, {
            duration: safeDuration
        });
    }
}

const analyticsServiceInstance = new AnalyticsService();
export { analyticsServiceInstance as AnalyticsService };
export default analyticsServiceInstance;
