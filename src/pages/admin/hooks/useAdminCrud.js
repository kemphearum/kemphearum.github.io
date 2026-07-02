import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useDebounce } from '../../../hooks/useDebounce';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import BaseService from '../../../services/BaseService';
import { ACTIONS } from '../../../utils/permissions';

const EMPTY_RESULT = { data: [], lastDoc: null, hasMore: false, totalCount: null };

/**
 * Shared CRUD orchestration for content tabs (blog, projects, experience).
 *
 * The caller declares *what* to fetch and how to persist a resource; this hook
 * owns the mechanical machinery: search + debounce + cursor pagination, the
 * paginated and stats queries, row selection, optimistic visibility/featured
 * toggles, bulk mutations, dialog state, and the save/delete executors.
 *
 * Resource-specific config:
 *  - resourceKey: react-query base key, e.g. 'posts' | 'projects' | 'experience'
 *  - module: permissions module (MODULES.*) used for action gating
 *  - fetchPaginated({ lastDoc, limit, search, trackRead }) => raw service result
 *  - fetchStats(statsParam) => stats object
 *  - toggleVisibility / toggleFeatured: { mutationFn(id, current, trackWrite), on, off }
 *  - bulk: { delete, setVisibility, setFeatured, messages }
 *  - messages: { created, updated } for the form executor
 */
export const useAdminCrud = ({
    resourceKey,
    module,
    isActionAllowed,
    showToast,
    t,
    initialLimit = 5,
    fetchPaginated,
    fetchStats,
    statsDefault = {},
    statsParam,
    statsKeyExtra = [],
    toggleVisibility,
    toggleFeatured,
    bulk,
    messages = {}
}) => {
    const { trackRead, trackWrite, trackDelete } = useActivity();
    const queryClient = useQueryClient();

    // ----- Search + pagination -----
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const pagination = useCursorPagination(initialLimit, [debouncedSearch]);
    const isSearching = searchQuery !== debouncedSearch;

    // ----- Selection -----
    const [selectedIds, setSelectedIds] = useState([]);

    const listKey = useMemo(
        () => [resourceKey, debouncedSearch, pagination.cursor, pagination.limit],
        [resourceKey, debouncedSearch, pagination.cursor, pagination.limit]
    );

    // ----- Dialog state -----
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [historyItem, setHistoryItem] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    useEffect(() => {
        const checkHash = () => {
            if (window.location.hash === '#new') {
                setIsFormOpen(true);
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        };
        
        checkHash();
        window.addEventListener('hashchange', checkHash);
        return () => window.removeEventListener('hashchange', checkHash);
    }, []);

    // ----- Permission guard -----
    const ensurePermission = useCallback((action) => {
        if (isActionAllowed(action, module)) return true;
        showToast(t('admin.common.noPermissionAction'), 'error');
        return false;
    }, [isActionAllowed, module, showToast, t]);

    // ----- Queries -----
    const { data: listResult = EMPTY_RESULT, isLoading, isFetching } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: listKey,
        queryFn: async () => {
            const requestCursor = pagination.cursor;
            const result = await BaseService.safe(() => fetchPaginated({
                lastDoc: requestCursor,
                limit: pagination.limit,
                search: debouncedSearch,
                trackRead
            }));

            if (result.error) {
                showToast(result.error, 'error');
                return EMPTY_RESULT;
            }

            pagination.updateAfterFetch(requestCursor, result.data.lastDoc, result.data.hasMore);
            return result.data;
        }
    });

    const { data: stats = statsDefault } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: [resourceKey, 'stats', ...statsKeyExtra],
        queryFn: async () => {
            const result = await BaseService.safe(() => fetchStats(statsParam));
            if (result.error) {
                showToast(result.error, 'error');
                return statsDefault;
            }
            return result.data;
        }
    });

    const items = listResult.data;

    // ----- Search handler -----
    const handleSearch = useCallback((value) => {
        setSearchQuery(value);
        setSelectedIds([]);
        pagination.reset();
    }, [pagination]);

    // ----- Selection handlers -----
    const toggleSelect = useCallback((id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }, []);

    const selectAll = useCallback(() => {
        const pageIds = items.map((item) => item.id);
        setSelectedIds((prev) => {
            const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.includes(id));
            if (allSelected) return prev.filter((id) => !pageIds.includes(id));
            const additions = pageIds.filter((id) => !prev.includes(id));
            return [...prev, ...additions];
        });
    }, [items]);

    const clearSelection = useCallback(() => setSelectedIds([]), []);

    // ----- Optimistic toggle (shared logic for visibility/featured) -----
    const makeOptimisticToggle = (field, config) => ({
        mutationFn: ({ id, current }) => config.mutationFn(id, current, trackWrite),
        onMutate: async ({ id, current }) => {
            await queryClient.cancelQueries({ queryKey: [resourceKey] });
            const previous = queryClient.getQueryData(listKey);
            if (previous) {
                queryClient.setQueryData(listKey, {
                    ...previous,
                    data: previous.data.map((row) => (row.id === id ? { ...row, [field]: !current } : row))
                });
            }
            return { previous };
        },
        onError: (err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(listKey, context.previous);
            showToast(err?.message || t('admin.common.messages.updateFailed'), 'error');
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: [resourceKey] }),
        onSuccess: (_data, { current }) => {
            const msg = current ? config.off : config.on;
            if (msg) showToast(msg);
        }
    });

    const visibilityMutation = useMutation(makeOptimisticToggle('visible', toggleVisibility || { mutationFn: () => Promise.resolve() }));
    const featuredMutation = useMutation(makeOptimisticToggle('featured', toggleFeatured || { mutationFn: () => Promise.resolve() }));

    const handleToggleVisibility = useCallback((id, current) => {
        if (!toggleVisibility) return;
        if (!ensurePermission(ACTIONS.TOGGLE_VISIBILITY)) return;
        visibilityMutation.mutate({ id, current });
    }, [toggleVisibility, ensurePermission, visibilityMutation]);

    const handleToggleFeatured = useCallback((id, current) => {
        if (!toggleFeatured) return;
        if (!ensurePermission(ACTIONS.FEATURE)) return;
        featuredMutation.mutate({ id, current });
    }, [toggleFeatured, ensurePermission, featuredMutation]);

    // ----- Bulk mutations -----
    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => bulk.delete(ids, trackDelete),
        onSuccess: (_data, ids) => {
            showToast(bulk.messages.deleted(ids.length));
            clearSelection();
            queryClient.invalidateQueries({ queryKey: [resourceKey] });
        },
        onError: (err) => showToast(err?.message || t('admin.common.messages.deleteFailed'), 'error')
    });

    const bulkVisibilityMutation = useMutation({
        mutationFn: ({ ids, visible }) => bulk.setVisibility(ids, visible, trackWrite),
        onSuccess: (_data, { ids, visible }) => {
            showToast(bulk.messages.visibility(ids.length, visible));
            clearSelection();
            queryClient.invalidateQueries({ queryKey: [resourceKey] });
        },
        onError: (err) => showToast(err?.message || t('admin.common.messages.updateFailed'), 'error')
    });

    const bulkFeaturedMutation = useMutation({
        mutationFn: ({ ids, featured }) => bulk.setFeatured(ids, featured, trackWrite),
        onSuccess: (_data, { ids, featured }) => {
            showToast(bulk.messages.featured(ids.length, featured));
            clearSelection();
            queryClient.invalidateQueries({ queryKey: [resourceKey] });
        },
        onError: (err) => showToast(err?.message || t('admin.common.messages.updateFailed'), 'error')
    });

    const bulkPending = bulkDeleteMutation.isPending
        || bulkVisibilityMutation.isPending
        || bulkFeaturedMutation.isPending;

    // ----- Form / delete executors -----
    const { loading: formLoading, execute: executeForm } = useAsyncAction({
        showToast,
        invalidateKeys: [[resourceKey]],
        onSuccess: () => setIsFormOpen(false)
    });

    const { loading: deleteLoading, execute: executeDelete } = useAsyncAction({
        showToast,
        successMessage: messages.deleted,
        invalidateKeys: [[resourceKey]],
        onSuccess: () => setDeletingItem(null)
    });

    const saveItem = useCallback((actionFn) => executeForm(actionFn, {
        successMessage: editingItem ? messages.updated : messages.created
    }), [executeForm, editingItem, messages.updated, messages.created]);

    return {
        // trackers
        trackRead,
        trackWrite,
        trackDelete,
        queryClient,
        listKey,

        // search
        searchQuery,
        handleSearch,
        isSearching,

        // data
        items,
        listResult,
        stats,
        isLoading,
        isFetching,

        // pagination
        pagination,

        // selection
        selectedIds,
        selection: { selectedIds, onSelect: toggleSelect, onSelectAll: selectAll },
        clearSelection,

        // dialogs
        editingItem,
        setEditingItem,
        deletingItem,
        setDeletingItem,
        historyItem,
        setHistoryItem,
        isFormOpen,
        setIsFormOpen,
        isHistoryOpen,
        setIsHistoryOpen,

        // permissions
        ensurePermission,

        // toggles
        handleToggleVisibility,
        handleToggleFeatured,

        // bulk
        bulkDeleteMutation,
        bulkVisibilityMutation,
        bulkFeaturedMutation,
        bulkPending,

        // executors
        formLoading,
        deleteLoading,
        saveItem,
        executeDelete
    };
};

export default useAdminCrud;
