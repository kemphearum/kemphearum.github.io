import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NotificationProvider } from './NotificationContext';
import { useNotifications } from './NotificationContextValue';

const wrapper = ({ children }) => React.createElement(NotificationProvider, null, children);

describe('NotificationContext', () => {
    beforeEach(() => window.localStorage.clear());

    it('records notifications with unread tracking', () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        act(() => result.current.record('Saved', 'success'));
        act(() => result.current.record('Failed', 'error'));

        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.notifications[0].message).toBe('Failed');
        expect(result.current.unreadCount).toBe(2);
    });

    it('marks all read and clears', () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        act(() => result.current.record('One', 'info'));
        act(() => result.current.markAllRead());
        expect(result.current.unreadCount).toBe(0);

        act(() => result.current.clearAll());
        expect(result.current.notifications).toHaveLength(0);
    });

    it('persists to localStorage', () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });
        act(() => result.current.record('Persisted', 'info'));
        expect(window.localStorage.getItem('admin.notifications')).toContain('Persisted');
    });

    it('returns a safe no-op outside a provider', () => {
        const { result } = renderHook(() => useNotifications());
        expect(result.current.unreadCount).toBe(0);
        expect(() => result.current.record('x')).not.toThrow();
    });
});
