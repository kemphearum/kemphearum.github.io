import BaseService from './BaseService';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, writeBatch, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import SettingsService from './SettingsService';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';

class DatabaseService {
    static SOFT_DOC_LIMIT = 50000;

    /**
     * Get health status of all collections.
     * @param {function(number, string): void} [trackRead] 
     * @returns {Promise<Record<string, number>>}
     */
    static async getHealth(trackRead) {
        const collections = ['posts', 'projects', 'experience', 'content', 'messages', 'auditLogs', 'users', 'rolePermissions', 'settings', 'analytics', 'visits', 'dailyUsage'];
        const counts = {};
        const failures = {};
        const { getCountFromServer } = await import('firebase/firestore');

        for (const col of collections) {
            try {
                const q = collection(db, col);
                const snapshot = await getCountFromServer(q);
                const count = snapshot.data().count;
                if (trackRead) trackRead(1, `Counted ${col} for health (optimized)`);
                counts[col] = count;
            } catch (err) {
                console.error(`Error counting ${col}:`, err);
                failures[col] = {
                    code: err?.code || 'unknown',
                    message: err?.message || 'Failed to count collection'
                };
            }
        }

        if (Object.keys(failures).length > 0) {
            const error = new Error('Database health check failed for one or more collections.');
            error.code = 'DATABASE_HEALTH_PARTIAL_FAILURE';
            error.partialCounts = counts;
            error.failures = failures;
            throw error;
        }

        return counts;
    }

    /**
     * Get audit settings from global settings.
     * @returns {Promise<Object>}
     */
    static async getAuditSettings() {
        const docRef = doc(db, 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().audit) {
            return snap.data().audit;
        }
        return { logAll: true, logReads: true, logWrites: true, logDeletes: true, logAnonymous: false };
    }

    /**
     * Update audit settings.
     * @param {string} userRole 
     * @param {string} userEmail 
     * @param {string} key 
     * @param {boolean} value 
     * @param {Object} currentSettings 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<Object>} The updated settings block
     */
    static async updateAuditSettings(userRole, userEmail, key, value, currentSettings, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.DATABASE, userRole)) {
            throw new Error('Unauthorized');
        }

        let newSettings = { [key]: value };
        if (key === 'logAll') {
            newSettings = {
                logAll: value,
                logReads: value,
                logWrites: value,
                logDeletes: value,
                logAnonymous: value
            };
        } else {
            const merged = { ...currentSettings, ...newSettings };
            const allOthersEnabled = ['logReads', 'logWrites', 'logDeletes', 'logAnonymous'].every(k => merged[k]);
            newSettings.logAll = allOthersEnabled;
        }

        const finalAudit = { ...currentSettings, ...newSettings };
        await SettingsService.saveSettings('audit', finalAudit, trackWrite);

        // Security Event Logging
        try {
            const AuditLogService = (await import('./AuditLogService')).default;
            await AuditLogService.addAuditLog({
                email: userEmail || 'unknown@admin.portfolio',
                action: 'UPDATE_DATABASE_AUDIT_SETTINGS',
                details: {
                    setting: key,
                    value: value,
                    scope: key === 'logAll' ? 'global' : 'single'
                },
                ipAddress: 'Admin Session',
                country: 'Internal',
                city: 'Internal',
                userAgent: 'Administrative Action',
                deviceType: 'desktop',
                sessionId: 'service-action'
            }, 'success', null, trackWrite);
        } catch (e) {
            console.error("Failed to log security event:", e);
        }

        return newSettings;
    }

    /**
     * Perform full database backup.
     * @param {string} userRole 
     * @param {function(number, string): void} [trackRead] 
     * @returns {Promise<boolean>} True on success
     */
    static async backup(userRole, trackRead) {
        if (!isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE, userRole)) {
            throw new Error('Unauthorized');
        }

        const collectionsToExport = ['posts', 'projects', 'experience', 'content', 'messages', 'auditLogs', 'users', 'rolePermissions', 'settings', 'visits', 'dailyUsage'];
        let exportData = { exportDate: new Date().toISOString(), collections: {} };

        for (const collName of collectionsToExport) {
            const q = query(collection(db, collName));
            const querySnapshot = await getDocs(q);
            if (trackRead) trackRead(querySnapshot.size, `Exported ${collName}`);
            
            if (!querySnapshot.empty) {
                exportData.collections[collName] = {};
                for (const d of querySnapshot.docs) {
                    exportData.collections[collName][d.id] = d.data();
                    
                    // Handle history subcollections
                    if (['posts', 'projects', 'experience', 'content', 'users'].includes(collName)) {
                        const historySnap = await getDocs(collection(db, collName, d.id, 'history'));
                        if (!historySnap.empty) {
                            const historyPath = `${collName}/${d.id}/history`;
                            exportData.collections[historyPath] = {};
                            historySnap.forEach(h => { exportData.collections[historyPath][h.id] = h.data(); });
                        }
                    }

                    // Handle dailyUsage logs
                    if (collName === 'dailyUsage') {
                        const logsSnap = await getDocs(collection(db, collName, d.id, 'logs'));
                        if (!logsSnap.empty) {
                            const logsPath = `${collName}/${d.id}/logs`;
                            exportData.collections[logsPath] = {};
                            logsSnap.forEach(l => { exportData.collections[logsPath][l.id] = l.data(); });
                        }
                    }
                }
            }
        }

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute("href", url);
        a.setAttribute("download", `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 150);

        return true;
    }

    /**
     * Archive old records.
     * @param {string} userRole 
     * @param {number} daysOld 
     * @param {function(number, string): void} [trackRead] 
     * @param {function(number, string, Object): void} [trackDelete] 
     * @returns {Promise<{deleted: number}>}
     */
    static async archive(userRole, daysOld, trackRead, trackDelete) {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.DATABASE, userRole)) {
            throw new Error('Unauthorized');
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        const archivedData = { archiveDate: new Date().toISOString(), cutoffDate: cutoffDate.toISOString(), collections: { messages: {}, auditLogs: {} } };

        const [oldMessagesSnap, oldLogsSnap, oldVisitsSnap] = await Promise.all([
            getDocs(query(collection(db, 'messages'), where('createdAt', '<', cutoffTimestamp))),
            getDocs(query(collection(db, 'auditLogs'), where('timestamp', '<', cutoffTimestamp))),
            getDocs(query(collection(db, 'visits'), where('timestamp', '<', cutoffTimestamp)))
        ]);

        if (trackRead) {
            trackRead(oldMessagesSnap.size + oldLogsSnap.size + oldVisitsSnap.size, 'Fetched old records for archive');
        }

        const batch = writeBatch(db);
        let deletionCount = 0;

        oldMessagesSnap.forEach(docSnap => { archivedData.collections.messages[docSnap.id] = docSnap.data(); batch.delete(docSnap.ref); deletionCount++; });
        oldLogsSnap.forEach(docSnap => { archivedData.collections.auditLogs[docSnap.id] = docSnap.data(); batch.delete(docSnap.ref); deletionCount++; });
        oldVisitsSnap.forEach(docSnap => {
            if (!archivedData.collections.visits) archivedData.collections.visits = {};
            archivedData.collections.visits[docSnap.id] = docSnap.data();
            batch.delete(docSnap.ref);
            deletionCount++;
        });

        if (deletionCount === 0) return { deleted: 0 };

        const json = JSON.stringify(archivedData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute("href", url);
        a.setAttribute("download", `portfolio_ARCHIVE_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        await batch.commit();
        if (trackDelete) trackDelete(deletionCount, 'Archived old records');

        return { deleted: deletionCount };
    }

    /**
     * Restore database from backup.
     * @param {string} userRole 
     * @param {string} jsonContent 
     * @param {function(number, string): void} [trackWrite] 
     * @param {function(number, number): void} [onProgress] 
     * @returns {Promise<{completedCount: number, totalDocs: number, failedCollections: Array<string>}>}
     */
    static async restore(userRole, jsonContent, trackWrite, onProgress) {
        if (!isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE, userRole)) {
            throw new Error('Unauthorized');
        }

        const restoreTimestamps = (obj) => {
            if (obj === null || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(item => restoreTimestamps(item));
            if (Object.keys(obj).length === 2 && 'seconds' in obj && 'nanoseconds' in obj) return new Timestamp(obj.seconds, obj.nanoseconds);
            const newObj = {};
            for (const key in obj) newObj[key] = restoreTimestamps(obj[key]);
            return newObj;
        };

        const importData = JSON.parse(jsonContent);
        const isNewFormat = importData.collections && typeof importData.collections === 'object';
        const collections = isNewFormat ? importData.collections : importData;

        const collectionsToProcess = Object.entries(collections).filter(([key, val]) => {
            const metaFields = ['exportDate', 'archiveDate', 'cutoffDate', 'date', 'timestamp'];
            return !metaFields.includes(key) && val && typeof val === 'object';
        });

        const totalDocs = collectionsToProcess.reduce((acc, [, docs]) => acc + Object.keys(docs).length, 0);
        if (totalDocs === 0) throw new Error('No valid records found in file.');

        let completedCount = 0;
        let failedCollections = new Set();

        for (const [colName, docs] of collectionsToProcess) {
            const docEntries = Object.entries(docs);
            for (let i = 0; i < docEntries.length; i += 25) {
                const chunk = docEntries.slice(i, i + 25);
                await Promise.all(chunk.map(async ([docId, docData]) => {
                    try {
                        const processedData = restoreTimestamps(docData);
                        const docRef = doc(db, colName, docId);
                        await setDoc(docRef, processedData);
                        completedCount++;
                        if (onProgress) onProgress(completedCount, totalDocs);
                    } catch {
                        failedCollections.add(colName);
                    }
                }));
            }
        }

        if (trackWrite) trackWrite(completedCount, 'Restored database');
        return { completedCount, totalDocs, failedCollections: Array.from(failedCollections) };
    }
}

export default DatabaseService;
