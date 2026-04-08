import { db } from '../firebase';
import { collection, getDocs, query, where, doc, writeBatch, setDoc, Timestamp, getDoc, limit as firestoreLimit } from 'firebase/firestore';
import SettingsService from './SettingsService';
import { isQuotaExceededError } from './BaseService';

class DatabaseService {
    static SOFT_DOC_LIMIT = 50000;
    static HEALTH_COLLECTIONS = ['posts', 'projects', 'experience', 'content', 'messages', 'auditLogs', 'users', 'rolePermissions', 'settings', 'visits', 'dailyUsage'];
    static ARCHIVE_COLLECTIONS = ['authLogs', 'systemLogs', 'activityFeed', 'draftContent', 'dailyUsage', 'messages', 'visits'];
    static MAX_BATCH_OPERATIONS = 450;
    static META_KEYS = new Set(['format', 'version', 'exportDate', 'archiveDate', 'cutoffDate', 'daysOld', 'date', 'timestamp']);

    static isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    static triggerJsonDownload(payload, filename) {
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.setAttribute('href', url);
        anchor.setAttribute('download', filename);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 150);
    }

    static isDateKeyBeforeCutoff(docId, cutoffDate) {
        if (typeof docId !== 'string') return false;
        const match = docId.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return false;
        const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T23:59:59.999Z`);
        return Number.isFinite(parsed.getTime()) && parsed < cutoffDate;
    }

    static isValueBeforeCutoff(value, cutoffDate) {
        if (!value || !cutoffDate) return false;
        const candidate = value?.toDate ? value.toDate() : (value instanceof Date ? value : new Date(value));
        return Number.isFinite(candidate?.getTime?.()) && candidate < cutoffDate;
    }

    static restoreFirestoreTypes(value) {
        if (value instanceof Timestamp) return value;
        if (value === null || typeof value !== 'object') return value;
        if (Array.isArray(value)) return value.map((item) => DatabaseService.restoreFirestoreTypes(item));

        const hasSeconds = Object.prototype.hasOwnProperty.call(value, 'seconds') && Object.prototype.hasOwnProperty.call(value, 'nanoseconds');
        const hasUnderscoreSeconds = Object.prototype.hasOwnProperty.call(value, '_seconds') && Object.prototype.hasOwnProperty.call(value, '_nanoseconds');
        if (hasSeconds || hasUnderscoreSeconds) {
            const seconds = Number(hasSeconds ? value.seconds : value._seconds);
            const nanoseconds = Number(hasSeconds ? value.nanoseconds : value._nanoseconds);
            if (Number.isFinite(seconds) && Number.isFinite(nanoseconds)) {
                return new Timestamp(seconds, nanoseconds);
            }
        }

        const restored = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            restored[key] = DatabaseService.restoreFirestoreTypes(nestedValue);
        }
        return restored;
    }

    static safeTrackRead(trackRead, count, label) {
        if (!trackRead) return;
        try {
            trackRead(count, label);
        } catch (trackingError) {
            // Tracking must never break core database operations.
            console.warn('[DatabaseService] Activity tracking failed during health check:', trackingError);
        }
    }

    static isQuotaExceededError(error) {
        return isQuotaExceededError(error);
    }

    static async countCollectionManual(collectionName) {
        const snapshot = await getDocs(collection(db, collectionName));
        return snapshot.size;
    }

    /**
     * Get health status of all collections.
     * @param {function(number, string): void} [trackRead] 
     * @returns {Promise<Record<string, number>>}
     */
    static async getHealth(trackRead) {
        const counts = {};
        const failures = {};
        const { getCountFromServer } = await import('firebase/firestore');

        for (const col of DatabaseService.HEALTH_COLLECTIONS) {
            try {
                const colRef = collection(db, col);
                let count = 0;
                let method = 'aggregate';

                try {
                    const aggregateSnapshot = await getCountFromServer(colRef);
                    count = aggregateSnapshot.data().count;
                } catch {
                    // Aggregate queries may fail on some rule/config combinations.
                    // Fall back to full scan count so Database tab remains useful.
                    method = 'manual';
                    count = await DatabaseService.countCollectionManual(col);
                    DatabaseService.safeTrackRead(trackRead, count, `Counted ${col} for health (manual fallback)`);
                    counts[col] = count;
                    continue;
                }

                // Defensive fallback: if aggregate says 0, validate with a 1-doc probe.
                // This prevents misleading all-zero dashboards when aggregate behavior is inconsistent.
                if (count === 0) {
                    const probeSnapshot = await getDocs(query(colRef, firestoreLimit(1)));
                    if (!probeSnapshot.empty) {
                        method = 'manual';
                        count = await DatabaseService.countCollectionManual(col);
                    }
                }

                DatabaseService.safeTrackRead(trackRead, 1, `Counted ${col} for health (${method})`);
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
            error.quotaExceeded = Object.values(failures).some((failure) => DatabaseService.isQuotaExceededError(failure));
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
        // Validation handled in UI and Firestore rules

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
        // Validation handled in UI and Firestore rules

        const collectionsToExport = ['posts', 'projects', 'experience', 'content', 'messages', 'auditLogs', 'users', 'rolePermissions', 'settings', 'visits', 'dailyUsage'];
        const exportData = {
            format: 'portfolio-backup/v2',
            exportDate: new Date().toISOString(),
            collections: {}
        };

        for (const collName of collectionsToExport) {
            const querySnapshot = await getDocs(collection(db, collName));
            if (trackRead) trackRead(querySnapshot.size, `Exported ${collName}`);
            
            if (!querySnapshot.empty) {
                exportData.collections[collName] = {};
                for (const d of querySnapshot.docs) {
                    exportData.collections[collName][d.id] = d.data();
                    
                    // Handle history subcollections
                    if (['posts', 'projects', 'experience', 'content', 'users'].includes(collName)) {
                        const historySnap = await getDocs(collection(db, collName, d.id, 'history'));
                        if (trackRead) trackRead(historySnap.size, `Exported ${collName}/${d.id}/history`);
                        if (!historySnap.empty) {
                            const historyPath = `${collName}/${d.id}/history`;
                            exportData.collections[historyPath] = {};
                            historySnap.forEach(h => { exportData.collections[historyPath][h.id] = h.data(); });
                        }
                    }

                    // Handle dailyUsage logs
                    if (collName === 'dailyUsage') {
                        const logsSnap = await getDocs(collection(db, collName, d.id, 'logs'));
                        if (trackRead) trackRead(logsSnap.size, `Exported ${collName}/${d.id}/logs`);
                        if (!logsSnap.empty) {
                            const logsPath = `${collName}/${d.id}/logs`;
                            exportData.collections[logsPath] = {};
                            logsSnap.forEach(l => { exportData.collections[logsPath][l.id] = l.data(); });
                        }
                    }
                }
            }
        }

        DatabaseService.triggerJsonDownload(
            exportData,
            `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`
        );

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
    static async archive(userRole, daysOld, archiveTargets = {}, trackRead, trackDelete) {
        // Validation handled in UI and Firestore rules

        const safeDaysOld = Number(daysOld);
        if (!Number.isFinite(safeDaysOld) || safeDaysOld <= 0) {
            throw new Error('Invalid archive range. Please choose a positive number of days.');
        }

        const normalizedTargets = DatabaseService.ARCHIVE_COLLECTIONS.reduce((acc, key) => {
            acc[key] = archiveTargets?.[key] !== false;
            return acc;
        }, {});
        const selectedTargets = DatabaseService.ARCHIVE_COLLECTIONS.filter((key) => normalizedTargets[key]);
        if (selectedTargets.length === 0) {
            throw new Error('Select at least one archive category before running the archive.');
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - safeDaysOld);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        const archivedData = {
            format: 'portfolio-archive/v2',
            archiveDate: new Date().toISOString(),
            cutoffDate: cutoffDate.toISOString(),
            daysOld: safeDaysOld,
            collections: {}
        };
        const refsToDelete = [];
        const refPathSet = new Set();
        let fetchedCount = 0;

        const addRefForDelete = (ref) => {
            const path = ref?.path || '';
            if (!path || refPathSet.has(path)) return false;
            refPathSet.add(path);
            refsToDelete.push(ref);
            return true;
        };

        const collectSnapshot = (collectionKey, snapshot) => {
            if (!snapshot || snapshot.empty) return;
            archivedData.collections[collectionKey] = archivedData.collections[collectionKey] || {};
            snapshot.forEach((docSnap) => {
                archivedData.collections[collectionKey][docSnap.id] = docSnap.data();
                addRefForDelete(docSnap.ref);
                fetchedCount += 1;
            });
        };

        const archiveJobs = [];

        if (normalizedTargets.messages) {
            archiveJobs.push(
                getDocs(query(collection(db, 'messages'), where('createdAt', '<', cutoffTimestamp)))
                    .then((snapshot) => collectSnapshot('messages', snapshot))
            );
        }
        if (normalizedTargets.visits) {
            archiveJobs.push(
                getDocs(query(collection(db, 'visits'), where('timestamp', '<', cutoffTimestamp)))
                    .then((snapshot) => collectSnapshot('visits', snapshot))
            );
        }
        if (normalizedTargets.authLogs || normalizedTargets.systemLogs) {
            archiveJobs.push((async () => {
                const auditSnap = await getDocs(query(collection(db, 'auditLogs'), where('timestamp', '<', cutoffTimestamp)));
                const authDocs = [];
                const systemDocs = [];

                auditSnap.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const category = String(data?.details?.category || '').toLowerCase();
                    const flow = String(data?.details?.flow || '').toLowerCase();
                    const isAuthLog = category === 'auth' || flow === 'login';

                    if (isAuthLog && normalizedTargets.authLogs) {
                        authDocs.push(docSnap);
                    } else if (!isAuthLog && normalizedTargets.systemLogs) {
                        systemDocs.push(docSnap);
                    }
                });

                if (authDocs.length > 0) {
                    archivedData.collections.authLogs = archivedData.collections.authLogs || {};
                    authDocs.forEach((docSnap) => {
                        archivedData.collections.authLogs[docSnap.id] = docSnap.data();
                        addRefForDelete(docSnap.ref);
                        fetchedCount += 1;
                    });
                }

                if (systemDocs.length > 0) {
                    archivedData.collections.systemLogs = archivedData.collections.systemLogs || {};
                    systemDocs.forEach((docSnap) => {
                        archivedData.collections.systemLogs[docSnap.id] = docSnap.data();
                        addRefForDelete(docSnap.ref);
                        fetchedCount += 1;
                    });
                }
            })());
        }
        if (normalizedTargets.activityFeed || normalizedTargets.dailyUsage) {
            archiveJobs.push((async () => {
                // Archive aggregated analytics counters + detail logs by dailyUsage date key.
                const dailyUsageSnap = await getDocs(collection(db, 'dailyUsage'));
                for (const dayDoc of dailyUsageSnap.docs) {
                    if (!DatabaseService.isDateKeyBeforeCutoff(dayDoc.id, cutoffDate)) continue;

                    const logsSnap = await getDocs(collection(db, 'dailyUsage', dayDoc.id, 'logs'));
                    if (normalizedTargets.dailyUsage) {
                        archivedData.collections.dailyUsage = archivedData.collections.dailyUsage || {};
                        archivedData.collections.dailyUsage[dayDoc.id] = dayDoc.data();
                        addRefForDelete(dayDoc.ref);
                        fetchedCount += 1;
                        collectSnapshot(`dailyUsage/${dayDoc.id}/logs`, logsSnap);
                    } else if (normalizedTargets.activityFeed) {
                        collectSnapshot(`activityFeed/${dayDoc.id}/logs`, logsSnap);
                    }
                }
            })());
        }

        if (normalizedTargets.draftContent) {
            archiveJobs.push((async () => {
                const draftSources = ['posts', 'projects'];
                for (const sourceName of draftSources) {
                    const draftSnap = await getDocs(query(collection(db, sourceName), where('visible', '==', false)));
                    const eligibleDrafts = draftSnap.docs.filter((docSnap) => {
                        const data = docSnap.data();
                        const createdAt = data?.createdAt || data?.updatedAt || data?.publishedAt;
                        return DatabaseService.isValueBeforeCutoff(createdAt, cutoffDate);
                    });

                    if (eligibleDrafts.length === 0) continue;

                    archivedData.collections.draftContent = archivedData.collections.draftContent || {};
                    archivedData.collections[`draftContent/${sourceName}`] = archivedData.collections[`draftContent/${sourceName}`] || {};

                    for (const docSnap of eligibleDrafts) {
                        archivedData.collections[`draftContent/${sourceName}`][docSnap.id] = docSnap.data();
                        addRefForDelete(docSnap.ref);
                        fetchedCount += 1;

                        const historySnap = await getDocs(collection(db, sourceName, docSnap.id, 'history'));
                        if (!historySnap.empty) {
                            collectSnapshot(`draftContent/${sourceName}/${docSnap.id}/history`, historySnap);
                        }
                    }
                }
            })());
        }

        await Promise.all(archiveJobs);

        if (trackRead) trackRead(fetchedCount, 'Fetched old records for archive');

        const deletionCount = refsToDelete.length;
        if (deletionCount === 0) return { deleted: 0 };

        for (let i = 0; i < refsToDelete.length; i += DatabaseService.MAX_BATCH_OPERATIONS) {
            const batch = writeBatch(db);
            refsToDelete.slice(i, i + DatabaseService.MAX_BATCH_OPERATIONS).forEach((ref) => {
                batch.delete(ref);
            });
            await batch.commit();
        }

        DatabaseService.triggerJsonDownload(
            archivedData,
            `portfolio_ARCHIVE_${new Date().toISOString().split('T')[0]}.json`
        );

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
        // Validation handled in UI and Firestore rules

        if (!jsonContent || typeof jsonContent !== 'string') {
            throw new Error('Restore file is empty or unreadable.');
        }

        let importData;
        try {
            importData = JSON.parse(jsonContent);
        } catch {
            throw new Error('Invalid JSON format. Please provide a valid backup file.');
        }

        if (!DatabaseService.isPlainObject(importData)) {
            throw new Error('Invalid backup format. Expected a JSON object.');
        }

        const isNewFormat = DatabaseService.isPlainObject(importData.collections);
        const collections = isNewFormat ? importData.collections : importData;

        const collectionsToProcess = Object.entries(collections).filter(([key, val]) => {
            return !DatabaseService.META_KEYS.has(key) && DatabaseService.isPlainObject(val);
        });

        const totalDocs = collectionsToProcess.reduce((acc, [, docs]) => acc + Object.keys(docs).length, 0);
        if (totalDocs === 0) throw new Error('No valid records found in file.');

        let processedCount = 0;
        let completedCount = 0;
        const failedCollections = new Set();

        for (const [colName, docs] of collectionsToProcess) {
            const docEntries = Object.entries(docs);
            for (let i = 0; i < docEntries.length; i += 25) {
                const chunk = docEntries.slice(i, i + 25);
                await Promise.all(chunk.map(async ([docId, docData]) => {
                    try {
                        const processedData = DatabaseService.restoreFirestoreTypes(docData);
                        const docRef = doc(db, colName, docId);
                        await setDoc(docRef, processedData);
                        completedCount++;
                    } catch (error) {
                        failedCollections.add(colName);
                        console.error(`Failed to restore ${colName}/${docId}:`, error);
                    } finally {
                        processedCount++;
                        if (onProgress) onProgress(processedCount, totalDocs);
                    }
                }));
            }
        }

        if (completedCount === 0) {
            throw new Error('Restore failed. No records were imported.');
        }

        if (trackWrite) trackWrite(completedCount, `Restored database (${completedCount}/${totalDocs})`);
        return { completedCount, totalDocs, failedCollections: Array.from(failedCollections) };
    }
}

export default DatabaseService;
