import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../hooks/useActivity', () => ({
    useActivity: () => ({ trackRead: vi.fn(), trackWrite: vi.fn(), trackDelete: vi.fn() })
}));

import { useAdminCrud } from './useAdminCrud';
import { ACTIONS } from '../../../utils/permissions';

const createWrapper = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => React.createElement(QueryClientProvider, { client }, children);
};

const renderCrud = (overrides = {}) => {
    const showToast = vi.fn();
    const isActionAllowed = overrides.isActionAllowed || vi.fn(() => true);

    const config = {
        resourceKey: 'posts',
        module: 'blog',
        isActionAllowed,
        showToast,
        t: (key) => key,
        fetchPaginated: vi.fn(async () => ({
            data: [{ id: 'a', visible: true }, { id: 'b', visible: true }],
            lastDoc: null,
            hasMore: false,
            totalCount: 2
        })),
        fetchStats: vi.fn(async () => ({ total: 2 })),
        statsDefault: { total: 0 },
        messages: { created: 'created.msg', updated: 'updated.msg', deleted: 'deleted.msg' },
        ...overrides
    };

    const utils = renderHook(() => useAdminCrud(config), { wrapper: createWrapper() });
    return { ...utils, showToast, isActionAllowed, config };
};

describe('useAdminCrud', () => {
    beforeEach(() => vi.clearAllMocks());

    it('loads paginated items and stats', async () => {
        const { result } = renderCrud();
        await waitFor(() => expect(result.current.items).toHaveLength(2));
        await waitFor(() => expect(result.current.stats.total).toBe(2));
        expect(result.current.listResult.totalCount).toBe(2);
    });

    it('toggles individual row selection', async () => {
        const { result } = renderCrud();
        await waitFor(() => expect(result.current.items).toHaveLength(2));

        act(() => result.current.selection.onSelect('a'));
        expect(result.current.selectedIds).toEqual(['a']);

        act(() => result.current.selection.onSelect('a'));
        expect(result.current.selectedIds).toEqual([]);
    });

    it('select-all selects every visible row then clears', async () => {
        const { result } = renderCrud();
        await waitFor(() => expect(result.current.items).toHaveLength(2));

        act(() => result.current.selection.onSelectAll());
        expect(result.current.selectedIds).toEqual(['a', 'b']);

        act(() => result.current.selection.onSelectAll());
        expect(result.current.selectedIds).toEqual([]);
    });

    it('clears selection when searching', async () => {
        const { result } = renderCrud();
        await waitFor(() => expect(result.current.items).toHaveLength(2));

        act(() => result.current.selection.onSelect('a'));
        expect(result.current.selectedIds).toEqual(['a']);

        act(() => result.current.handleSearch('query'));
        expect(result.current.selectedIds).toEqual([]);
        expect(result.current.searchQuery).toBe('query');
    });

    it('ensurePermission toasts and returns false when not allowed', async () => {
        const isActionAllowed = vi.fn(() => false);
        const { result, showToast } = renderCrud({ isActionAllowed });
        await waitFor(() => expect(result.current.items).toHaveLength(2));

        let allowed;
        act(() => { allowed = result.current.ensurePermission(ACTIONS.CREATE); });
        expect(allowed).toBe(false);
        expect(showToast).toHaveBeenCalledWith('admin.common.noPermissionAction', 'error');
    });

    it('saveItem uses the create message when not editing', async () => {
        const { result, showToast } = renderCrud();
        await waitFor(() => expect(result.current.items).toHaveLength(2));

        await act(async () => {
            await result.current.saveItem(async () => {});
        });

        expect(showToast).toHaveBeenCalledWith('created.msg', 'success');
    });
});
