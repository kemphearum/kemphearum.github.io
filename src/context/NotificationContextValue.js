import { createContext, useContext } from 'react';

export const NotificationContext = createContext(null);

const NOOP = {
    notifications: [],
    unreadCount: 0,
    record: () => {},
    markAllRead: () => {},
    clearAll: () => {},
    remove: () => {}
};

export const useNotifications = () => useContext(NotificationContext) || NOOP;
