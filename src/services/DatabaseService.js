import { db } from '../firebase';
import { collection, getDocs, query, where, doc, updateDoc, writeBatch, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import SettingsService from './SettingsService';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';

class DatabaseService {
    static SOFT_DOC_LIMIT = 50000;

    static async getHealth(trackRead) {
        const collections = ['posts', 'projects', 'experience', 'content', 'messages', 'auditLogs', 'users', 'rolePermissions', 'settings', 'visits', 'dailyUsage'];
        const counts = {};
        for (const col of collections) {
            try {
                const snap = await getDocs(collection(db, col));
                if (trackRead) trackRead(snap.size, `Counted ${col} for health`);
                counts[col] = snap.size;
            } catch {
                counts[col] = 0;
            }
        }
        return counts;
    }

    static async getAuditSettings() {
        try {
            const docRef = doc(db, 'settings', 'global');
            const snap = await getDoc(docRef);
            if (snap.exists() && snap.data().audit) {
                return snap.data().audit;
            }
            // Fallback to legacy or default
            return { logAll: true, logReads: true, logWrites: true, logDeletes: true, logAnonymous: false };
        } catch (error) {
            console.error("Error fetching audit settings:", error);
            return { logAll: true, logReads: true, logWrites: true, logDeletes: true, logAnonymous: false };
        }
    }

    static async updateAuditSettings(userRole, key, value, currentSettings, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.DATABASE, userRole)) {
            throw new Error("Unauthorized action");
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

        const ref = doc(db, 'settings', 'global');
        const finalAudit = { ...currentSettings, ...newSettings };
        await SettingsService.saveSettings('audit', finalAudit, trackWrite);
        return newSettings;
    }

    static async backup(userRole, trackRead) {
        if (!isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE, userRole)) {
            throw new Error("Unauthorized action");
        }

        const collectionsToExport = ['posts', 'projects', 'experience', 'content', 'messages', 'auditLogs', 'users', 'rolePermissions', 'settings', 'visits', 'dailyUsage'];
        let exportData = { exportDate: new Date().toISOString(), collections: {} };

        for (const collName of collectionsToExport) {
            try {
                const q = query(collection(db, collName));
                const querySnapshot = await getDocs(q);
                if (trackRead) trackRead(querySnapshot.size, `Exported ${collName}`);
                if (!querySnapshot.empty) {
                    exportData.collections[collName] = {};
                    
                    for (const d of querySnapshot.docs) {
                        exportData.collections[collName][d.id] = d.data();
                        
                        // Check for history subcollections
                        if (['posts', 'projects', 'experience', 'content', 'users'].includes(collName)) {
                            try {
                                const historyQ = query(collection(db, collName, d.id, 'history'));
                                const historySnap = await getDocs(historyQ);
                                if (!historySnap.empty) {
                                    if (trackRead) trackRead(historySnap.size, `Exported ${collName}/${d.id}/history`);
                                    const historyPath = `${collName}/${d.id}/history`;
                                    exportData.collections[historyPath] = {};
                                    historySnap.forEach(h => {
                                        exportData.collections[historyPath][h.id] = h.data();
                                    });
                                }
                            } catch (e) {
                                console.warn(`Could not export history for ${collName}/${d.id}:`, e);
                            }
                        }

                        // Check for logs subcollections under dailyUsage
                        if (collName === 'dailyUsage') {
                            try {
                                const logsQ = query(collection(db, collName, d.id, 'logs'));
                                const logsSnap = await getDocs(logsQ);
                                if (!logsSnap.empty) {
                                    if (trackRead) trackRead(logsSnap.size, `Exported ${collName}/${d.id}/logs`);
                                    const logsPath = `${collName}/${d.id}/logs`;
                                    exportData.collections[logsPath] = {};
                                    logsSnap.forEach(l => {
                                        exportData.collections[logsPath][l.id] = l.data();
                                    });
                                }
                            } catch (e) {
                                console.warn(`Could not export logs for ${collName}/${d.id}:`, e);
                            }
                        }
                    }
                }
            } catch (colError) {
                console.warn(`Skipping collection ${collName}:`, colError);
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

    static async archive(userRole, daysOld, trackRead, trackDelete) {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.DATABASE, userRole)) {
            throw new Error("Unauthorized action");
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        const archivedData = { archiveDate: new Date().toISOString(), cutoffDate: cutoffDate.toISOString(), collections: { messages: {}, auditLogs: {} } };

        const oldMessagesQ = query(collection(db, 'messages'), where('createdAt', '<', cutoffTimestamp));
        const oldMessagesSnap = await getDocs(oldMessagesQ);
        if (trackRead) trackRead(oldMessagesSnap.size, 'Fetched old messages for archive');

        const oldLogsQ = query(collection(db, 'auditLogs'), where('timestamp', '<', cutoffTimestamp));
        const oldLogsSnap = await getDocs(oldLogsQ);
        if (trackRead) trackRead(oldLogsSnap.size, 'Fetched old audit logs for archive');

        const oldVisitsQ = query(collection(db, 'visits'), where('timestamp', '<', cutoffTimestamp));
        const oldVisitsSnap = await getDocs(oldVisitsQ);
        if (trackRead) trackRead(oldVisitsSnap.size, 'Fetched old analytics for archive');

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

        if (deletionCount === 0) {
            return { deleted: 0 };
        }

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

    static async restore(userRole, jsonContent, trackWrite, onProgress) {
        if (!isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE, userRole)) {
            throw new Error("Unauthorized action");
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
        if (totalDocs === 0) {
            throw new Error('No valid records found in file.');
        }

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
                    } catch (err) {
                        console.error(`Restore failed for ${colName}/${docId}:`, err);
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
