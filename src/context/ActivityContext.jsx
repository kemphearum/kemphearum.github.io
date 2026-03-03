import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, collection, writeBatch, increment as firestoreIncrement, onSnapshot, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { getTodayDateKey } from '../utils/dateUtils';
import { ActivityContext } from './ActivityContextValue';



export const ActivityProvider = ({ children }) => {
    const [dailyUsage, setDailyUsage] = useState({ reads: 0, writes: 0, deletes: 0 });
    const [currentDateKey, setCurrentDateKey] = useState(getTodayDateKey());
    const [user, setUser] = useState(null);
    const [trackerTick, setTrackerTick] = useState(0);

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

        const { reads, writes, deletes, logs } = pendingRef.current;
        if (reads === 0 && writes === 0 && deletes === 0 && logs.length === 0) return;

        isFlushing.current = true;
        const dateKey = getTodayDateKey(); // Use fresh key in case of midnight flush

        try {
            const batch = writeBatch(db);
            const counterRef = doc(db, 'dailyUsage', dateKey);

            // Update main counters
            await setDoc(counterRef, {
                reads: firestoreIncrement(reads),
                writes: firestoreIncrement(writes),
                deletes: firestoreIncrement(deletes),
                lastUpdated: serverTimestamp()
            }, { merge: true });

            // Add history logs
            logs.forEach(log => {
                const logRef = doc(collection(counterRef, 'logs'));
                batch.set(logRef, {
                    ...log,
                    time: serverTimestamp(),
                    user: user?.email || 'Anonymous'
                });
            });

            await batch.commit();
            // Clear what we just flushed
            pendingRef.current = { reads: 0, writes: 0, deletes: 0, logs: [] };
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

    const trackRead = useCallback((count = 1, label = '') => {
        pendingRef.current.reads += count;
        if (label) {
            pendingRef.current.logs.push({ type: 'read', label, count });
        }
        queueFlush();
    }, [queueFlush]);

    const trackWrite = useCallback((count = 1, label = '') => {
        pendingRef.current.writes += count;
        if (label) {
            pendingRef.current.logs.push({ type: 'write', label, count });
        }
        queueFlush();
    }, [queueFlush]);

    const trackDelete = useCallback((count = 1, label = '') => {
        pendingRef.current.deletes += count;
        if (label) {
            pendingRef.current.logs.push({ type: 'delete', label, count });
        }
        queueFlush();
    }, [queueFlush]);

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

            // 2. Delete all logs in subcollection FIRST
            const counterRef = doc(db, 'dailyUsage', dateKey);
            const logsSnap = await getDocs(collection(counterRef, 'logs'));
            if (!logsSnap.empty) {
                const batch = writeBatch(db);
                logsSnap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }

            // 3. Delete the parent counter doc second
            await deleteDoc(counterRef);
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
        pendingRef,
        setTrackerTick
    };

    return (
        <ActivityContext.Provider value={value}>
            {children}
        </ActivityContext.Provider>
    );
};
