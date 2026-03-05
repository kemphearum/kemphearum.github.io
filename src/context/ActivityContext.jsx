import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, collection, writeBatch, increment as firestoreIncrement, onSnapshot, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { getTodayDateKey } from '../utils/dateUtils';
import { ActivityContext } from './ActivityContextValue';



export const ActivityProvider = ({ children }) => {
    const [dailyUsage, setDailyUsage] = useState({ reads: 0, writes: 0, deletes: 0 });
    const [currentDateKey, setCurrentDateKey] = useState(getTodayDateKey());
    const [user, setUser] = useState(null);
    const [trackerTick, setTrackerTick] = useState(0);
    const [loggingConfig, setLoggingConfig] = useState({
        logAll: true,
        logReads: true,
        logWrites: true,
        logDeletes: true,
        logAnonymous: true
    });

    // Refs for debounced writes
    const activityFlushTimerRef = useRef(null);
    const pendingRef = useRef({ reads: 0, writes: 0, deletes: 0, logs: [] });
    const isFlushing = useRef(false);

    // Track auth state for attribution
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Listen to logging configuration rules
    useEffect(() => {
        const settingsRef = doc(db, 'settings', 'admin');
        const unsubscribe = onSnapshot(settingsRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setLoggingConfig({
                    logAll: data.logAll !== false,
                    logReads: data.logReads !== false,
                    logWrites: data.logWrites !== false,
                    logDeletes: data.logDeletes !== false,
                    logAnonymous: data.logAnonymous !== false,
                });
            }
        });
        return () => unsubscribe();
    }, []);

    // Reactive date key for midnight roll-over
    useEffect(() => {
        const checkDate = () => {
            const freshKey = getTodayDateKey();
            if (freshKey !== currentDateKey) {
                console.log('Date changed, rolling over activity tracker...');
                setCurrentDateKey(freshKey);
                // Clear state for new day
                setDailyUsage({ reads: 0, writes: 0, deletes: 0 });
                pendingRef.current = { reads: 0, writes: 0, deletes: 0, logs: [] };
            }
        };

        const interval = setInterval(checkDate, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [currentDateKey]);

    // Real-time listener for the daily counter doc
    useEffect(() => {
        if (!currentDateKey) return;
        const docRef = doc(db, 'dailyUsage', currentDateKey);
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                setDailyUsage(snapshot.data());
            } else {
                setDailyUsage({ reads: 0, writes: 0, deletes: 0 });
            }
        }, (err) => {
            if (err.code !== 'permission-denied') {
                console.error('Activity listener error:', err);
            }
        });

        return () => unsubscribe();
    }, [currentDateKey]);

    const flushToFirestore = useCallback(async () => {
        if (isFlushing.current) {
            // If already flushing, ensure we check back soon instead of dropping the flush entirely
            if (activityFlushTimerRef.current) clearTimeout(activityFlushTimerRef.current);
            activityFlushTimerRef.current = setTimeout(flushToFirestore, 1000);
            return;
        }

        const { reads, writes, deletes, logs } = { ...pendingRef.current };
        if (reads === 0 && writes === 0 && deletes === 0 && logs.length === 0) return;

        isFlushing.current = true;
        const dateKey = getTodayDateKey();

        try {
            const batch = writeBatch(db);
            const counterRef = doc(db, 'dailyUsage', dateKey);

            // 1. Update main counters (Now part of the batch for atomicity)
            batch.set(counterRef, {
                reads: firestoreIncrement(reads),
                writes: firestoreIncrement(writes),
                deletes: firestoreIncrement(deletes),
                lastUpdated: serverTimestamp()
            }, { merge: true });

            // 2. Add history logs
            logs.forEach(log => {
                const logRef = doc(collection(counterRef, 'logs'));
                batch.set(logRef, {
                    ...log,
                    time: serverTimestamp(),
                    user: user?.email || 'Anonymous'
                });
            });

            await batch.commit();

            // 3. Subtract what we just flushed (Fixes race condition)
            pendingRef.current.reads -= reads;
            pendingRef.current.writes -= writes;
            pendingRef.current.deletes -= deletes;
            pendingRef.current.logs = pendingRef.current.logs.slice(logs.length);

        } catch (err) {
            console.error('Failed to flush activity tracking:', err);
        } finally {
            isFlushing.current = false;
        }
    }, [user]);

    const queueFlush = useCallback(() => {
        if (activityFlushTimerRef.current) clearTimeout(activityFlushTimerRef.current);
        activityFlushTimerRef.current = setTimeout(flushToFirestore, 3000);
        setTrackerTick(t => t + 1); // Trigger optimistic UI update
    }, [flushToFirestore]);

    const shouldLogDetailedInfo = useCallback((type) => {
        if (!loggingConfig.logAll) return false;

        const isAnon = !user || user.email === undefined;
        if (isAnon && !loggingConfig.logAnonymous) return false;

        if (type === 'read' && !loggingConfig.logReads) return false;
        if (type === 'write' && !loggingConfig.logWrites) return false;
        if (type === 'delete' && !loggingConfig.logDeletes) return false;

        return true;
    }, [loggingConfig, user]);

    const trackRead = useCallback((count = 1, label = '') => {
        const validCount = Number.isFinite(count) ? count : 1;
        pendingRef.current.reads += validCount;
        if (label && shouldLogDetailedInfo('read')) {
            pendingRef.current.logs.push({ type: 'read', label, count: validCount });
        }
        queueFlush();
    }, [queueFlush, shouldLogDetailedInfo]);

    const trackWrite = useCallback((count = 1, label = '', details = null) => {
        const validCount = Number.isFinite(count) ? count : 1;
        pendingRef.current.writes += validCount;
        if (label && shouldLogDetailedInfo('write')) {
            const logEntry = { type: 'write', label, count: validCount };
            if (details) logEntry.details = details;
            pendingRef.current.logs.push(logEntry);
        }
        queueFlush();
    }, [queueFlush, shouldLogDetailedInfo]);

    const trackDelete = useCallback((count = 1, label = '', details = null) => {
        const validCount = Number.isFinite(count) ? count : 1;
        pendingRef.current.deletes += validCount;
        if (label && shouldLogDetailedInfo('delete')) {
            const logEntry = { type: 'delete', label, count: validCount };
            if (details) logEntry.details = details;
            pendingRef.current.logs.push(logEntry);
        }
        queueFlush();
    }, [queueFlush, shouldLogDetailedInfo]);

    const refreshActivity = useCallback(async () => {
        if (!currentDateKey) return;
        try {
            const docRef = doc(db, 'dailyUsage', currentDateKey);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                setDailyUsage(snapshot.data());
            }
            // Trigger a re-count of pending anyway
            setTrackerTick(t => t + 1);
            return true;
        } catch (err) {
            console.error('Failed to refresh activity:', err);
            throw err;
        }
    }, [currentDateKey]);

    const resetActivity = useCallback(async () => {
        const dateKey = getTodayDateKey();
        try {
            // 1. Clear local buffer and timer
            pendingRef.current = { reads: 0, writes: 0, deletes: 0, logs: [] };
            if (activityFlushTimerRef.current) {
                clearTimeout(activityFlushTimerRef.current);
                activityFlushTimerRef.current = null;
            }
            setTrackerTick(t => t + 1);

            const counterRef = doc(db, 'dailyUsage', dateKey);

            // 2. Delete logs in subcollection in chunks
            try {
                const logsSnap = await getDocs(collection(counterRef, 'logs'));
                if (!logsSnap.empty) {
                    const batches = [];
                    let currentBatch = writeBatch(db);
                    let opCount = 0;

                    logsSnap.docs.forEach((d) => {
                        currentBatch.delete(d.ref);
                        opCount++;
                        if (opCount === 450) { // Limit to 450
                            batches.push(currentBatch.commit());
                            currentBatch = writeBatch(db);
                            opCount = 0;
                        }
                    });

                    if (opCount > 0) {
                        batches.push(currentBatch.commit());
                    }
                    await Promise.all(batches);
                }
            } catch (logErr) {
                console.warn('Failed to delete activity logs subcollection:', logErr);
                // Continue to reset counters even if log deletion fails
            }

            // 3. Reset the parent counter doc instead of deleting
            await setDoc(counterRef, {
                reads: 0,
                writes: 0,
                deletes: 0,
                lastUpdated: serverTimestamp()
            }, { merge: true });

            return true;
        } catch (err) {
            console.error('Failed to reset activity tracking:', err);
            throw err;
        }
    }, []);

    const value = {
        dailyUsage,
        currentDateKey,
        trackerTick,
        trackRead,
        trackWrite,
        trackDelete,
        resetActivity,
        refreshActivity,
        pendingRef,
        setTrackerTick
    };

    return (
        <ActivityContext.Provider value={value}>
            {children}
        </ActivityContext.Provider>
    );
};
