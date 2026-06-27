import React, { useCallback, useMemo, useState } from 'react';
import { NotificationContext } from './NotificationContextValue';

const STORE_KEY = 'admin.notifications';
const MAX = 20;

const load = () => {
    if (typeof window === 'undefined') return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

/**
 * Centralized notification service. Every feature records notifications through
 * `record()` (the admin toast flow routes through it too), so there is a single
 * history with unread tracking, persisted to localStorage. Zero-cost: no backend.
 */
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(load);

    const persist = useCallback((list) => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, MAX)));
        } catch {
            /* ignore quota / serialization errors */
        }
    }, []);

    const record = useCallback((message, type = 'info') => {
        if (!message) return;
        setNotifications((prev) => {
            const next = [{
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                message: String(message),
                type,
                timestamp: Date.now(),
                read: false
            }, ...prev].slice(0, MAX);
            persist(next);
            return next;
        });
    }, [persist]);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => {
            const next = prev.map((item) => (item.read ? item : { ...item, read: true }));
            persist(next);
            return next;
        });
    }, [persist]);

    const clearAll = useCallback(() => {
        setNotifications([]);
        persist([]);
    }, [persist]);

    const remove = useCallback((id) => {
        setNotifications((prev) => {
            const next = prev.filter((item) => item.id !== id);
            persist(next);
            return next;
        });
    }, [persist]);

    const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

    const value = useMemo(
        () => ({ notifications, unreadCount, record, markAllRead, clearAll, remove }),
        [notifications, unreadCount, record, markAllRead, clearAll, remove]
    );

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export default NotificationProvider;
