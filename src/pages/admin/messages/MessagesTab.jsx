import React, { useState, useCallback } from 'react';
import { Mail, MailOpen, Trash2, Search, RefreshCw, Reply, Inbox, Layers3 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Dialog, Badge } from '@/shared/components/ui';
import SectionHeader from '../components/SectionHeader';
import MessageService from '../../../services/MessageService';
import BaseService from '../../../services/BaseService';
import { useActivity } from '../../../hooks/useActivity';
import { useDebounce } from '../../../hooks/useDebounce';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import MessagesTable from './components/MessagesTable';
import { useTranslation } from '../../../hooks/useTranslation';
import { ACTIONS, MODULES } from '../../../utils/permissions';

const getDateFromTimestamp = (timestamp) => {
    if (!timestamp?.seconds) return null;
    return new Date(timestamp.seconds * 1000);
};

const formatDateTime = (timestamp, locale, fallbackText) => {
    const date = getDateFromTimestamp(timestamp);
    return date
        ? new Intl.DateTimeFormat(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date)
        : fallbackText;
};

const buildRelativeTime = (timestamp, locale, fallbackText) => {
    const date = getDateFromTimestamp(timestamp);
    if (!date) return fallbackText;

    const diffMs = date.getTime() - Date.now();
    const absMinutes = Math.abs(diffMs) / 60000;
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (absMinutes < 60) {
        return formatter.format(Math.round(diffMs / 60000), 'minute');
    }

    const absHours = absMinutes / 60;
    if (absHours < 24) {
        return formatter.format(Math.round(diffMs / 3600000), 'hour');
    }

    const absDays = absHours / 24;
    if (absDays < 7) {
        return formatter.format(Math.round(diffMs / 86400000), 'day');
    }

    return formatter.format(Math.round(diffMs / 604800000), 'week');
};

const MessagesTab = ({ userRole, showToast, isActionAllowed, onMessagesChange }) => {
    const { language, t } = useTranslation();
    const locale = language === 'km' ? 'km-KH' : undefined;
    const tm = useCallback((key, params = {}) => t(`admin.messages.${key}`, params), [t]);
    const queryClient = useQueryClient();
    const [searchMessages, setSearchMessages] = useState('');
    const debouncedSearch = useDebounce(searchMessages, 500);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [viewingMessage, setViewingMessage] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: tm('dialog.confirm'),
        type: 'danger'
    });
    const { trackWrite, trackDelete } = useActivity();

    const pagination = useCursorPagination(5, [debouncedSearch]);

    const resetConfirmDialog = useCallback(() => {
        setConfirmDialog({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: null,
            confirmText: tm('dialog.confirm'),
            type: 'danger'
        });
    }, [tm]);

    const { data: messagesResult = { data: [], lastDoc: null, hasMore: false, totalCount: null }, isLoading, isFetching } = useQuery({
        queryKey: ['messages', debouncedSearch, pagination.cursor, pagination.limit],
        queryFn: async () => {
            const requestCursor = pagination.cursor;
            const result = await BaseService.safe(() => MessageService.fetchMessagesPaginated({
                lastDoc: requestCursor,
                limit: pagination.limit,
                search: debouncedSearch,
                includeTotal: true
            }));

            if (result.error) {
                showToast(result.error, 'error');
                return { data: [], lastDoc: null, hasMore: false, totalCount: null };
            }

            pagination.updateAfterFetch(requestCursor, result.data.lastDoc, result.data.hasMore);
            return result.data;
        },
        staleTime: 60000,
        gcTime: 300000
    });

    const { data: unreadCountResult = 0 } = useQuery({
        queryKey: ['messages', 'unreadCount'],
        queryFn: async () => {
            const result = await BaseService.safe(() => MessageService.getUnreadCount());
            if (result.error) {
                showToast(result.error, 'error');
                return 0;
            }
            return result.data;
        },
        staleTime: 30000,
        gcTime: 300000
    });

    const messages = messagesResult.data;

    const refetchMessages = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['messages', 'unreadCount'] });
        onMessagesChange?.();
    }, [queryClient, onMessagesChange]);

    const pageUnreadCount = messages.filter((message) => !message.isRead).length;
    const pageReadCount = Math.max(0, messages.length - pageUnreadCount);
    const normalizedUnreadCount = Math.max(0, Number(unreadCountResult) || 0);
    const hasTotalCount = Number.isFinite(messagesResult.totalCount);
    const totalMessagesCount = hasTotalCount
        ? Math.max(0, Number(messagesResult.totalCount) || 0, normalizedUnreadCount)
        : messages.length;
    const unreadMessagesCount = hasTotalCount
        ? Math.min(normalizedUnreadCount, totalMessagesCount)
        : pageUnreadCount;
    const readMessagesCount = hasTotalCount
        ? Math.max(0, totalMessagesCount - unreadMessagesCount)
        : pageReadCount;
    const selectedCount = selectedMessages.length;
    const pageSummary = debouncedSearch
        ? tm('summary.searchResultsOnPage', { count: messages.length })
        : tm('summary.loadedOnPage', { count: messages.length });

    const handleToggleMessageRead = async (id, currentStatus) => {
        const { error } = await BaseService.safe(() => MessageService.toggleReadStatus(userRole, id, currentStatus, trackWrite));
        if (error) return showToast(error, 'error');

        refetchMessages();
        if (viewingMessage?.id === id) {
            setViewingMessage((prev) => ({ ...prev, isRead: !currentStatus }));
        }
    };

    const handleViewMessage = (msg) => {
        if (!msg.isRead) {
            setViewingMessage({ ...msg, isRead: true });
            handleToggleMessageRead(msg.id, false);
            return;
        }

        setViewingMessage(msg);
    };

    const handleToggleSelectMessage = (id) => {
        setSelectedMessages((prev) => (
            prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
        ));
    };

    const handleSelectAllMessages = () => {
        const paginatedIds = messages.map((message) => message.id);
        const allSelected = paginatedIds.every((id) => selectedMessages.includes(id)) && paginatedIds.length > 0;

        if (allSelected) {
            setSelectedMessages((prev) => prev.filter((id) => !paginatedIds.includes(id)));
            return;
        }

        setSelectedMessages((prev) => {
            const newSelections = paginatedIds.filter((id) => !prev.includes(id));
            return [...prev, ...newSelections];
        });
    };

    const handleBatchMarkMessages = async (isRead) => {
        if (selectedMessages.length === 0) return;

        const { error } = await BaseService.safe(() => MessageService.batchMarkMessages(userRole, selectedMessages, isRead, trackWrite));
        if (error) return showToast(error, 'error');

        refetchMessages();
        setSelectedMessages([]);
        showToast(tm(isRead ? 'toasts.markedRead' : 'toasts.markedUnread', { count: selectedMessages.length }));
    };

    const handleBatchDeleteMessages = () => {
        if (selectedMessages.length === 0) return;
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.MESSAGES)) {
            return showToast(t('admin.common.noPermissionAction'), 'error');
        }

        setConfirmDialog({
            isOpen: true,
            title: tm('dialog.deleteManyTitle'),
            message: tm('dialog.deleteManyMessage', { count: selectedMessages.length }),
            confirmText: tm('actions.deleteAll'),
            type: 'danger',
            onConfirm: async () => {
                const { error } = await BaseService.safe(() => MessageService.batchDeleteMessages(userRole, selectedMessages, trackDelete));
                if (error) {
                    showToast(error, 'error');
                } else {
                    refetchMessages();
                    setSelectedMessages([]);
                    showToast(tm('toasts.deletedMany', { count: selectedMessages.length }));
                }
                resetConfirmDialog();
            }
        });
    };

    const handleDeleteMessage = (id) => {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.MESSAGES)) {
            return showToast(t('admin.common.noPermissionAction'), 'error');
        }

        setConfirmDialog({
            isOpen: true,
            title: tm('dialog.deleteSingleTitle'),
            message: tm('dialog.deleteSingleMessage'),
            confirmText: tm('actions.delete'),
            type: 'danger',
            onConfirm: async () => {
                const { error } = await BaseService.safe(() => MessageService.deleteMessage(userRole, id, trackDelete));
                if (error) {
                    showToast(error, 'error');
                } else {
                    refetchMessages();
                    setSelectedMessages((prev) => prev.filter((mid) => mid !== id));
                    if (viewingMessage?.id === id) {
                        setViewingMessage(null);
                    }
                    showToast(tm('toasts.deletedOne'));
                }
                resetConfirmDialog();
            }
        });
    };

    const replyHref = viewingMessage
        ? `mailto:${viewingMessage.email}?subject=${encodeURIComponent(tm('actions.replySubject', { name: viewingMessage.name || tm('general.contactForm') }))}`
        : '#';

    return (
        <div className="ui-message-tab">
            <SectionHeader
                title={tm('header.title')}
                description={tm('header.description')}
                icon={Mail}
                rightElement={(
                    <div className="ui-message-headerActions">
                        <Badge variant={unreadMessagesCount > 0 ? 'primary' : 'default'}>
                            {unreadMessagesCount > 0 ? tm('header.unreadCount', { count: unreadMessagesCount }) : tm('header.inboxClear')}
                        </Badge>
                        <button
                            onClick={() => {
                                pagination.reset();
                                refetchMessages();
                                showToast(tm('toasts.refreshed'));
                            }}
                            className="ui-button ui-button--ghost ui-btn-icon-only"
                            title={tm('actions.refresh')}
                            type="button"
                        >
                            <RefreshCw size={18} className={(isLoading || isFetching) ? 'ui-spin' : ''} />
                        </button>
                    </div>
                )}
            />

            <section className="ui-message-workspace">
                <div className="ui-message-workspace__overview">
                    <div className="ui-message-workspace__intro">
                        <div className="ui-message-workspace__copy">
                            <span className="ui-message-workspace__eyebrow">{tm('workspace.eyebrow')}</span>
                            <h3>{tm('workspace.title')}</h3>
                            <p>{tm('workspace.description')}</p>
                        </div>
                        <div className="ui-message-workspace__status">
                            <Badge variant={debouncedSearch ? 'primary' : 'default'}>
                                {debouncedSearch ? tm('workspace.filteredBy', { query: debouncedSearch }) : tm('workspace.latestPage')}
                            </Badge>
                            <span>{pageSummary}</span>
                        </div>
                    </div>
                    <div className="ui-message-workspace__stats">
                        <div className="ui-message-workspace__stat ui-message-workspace__stat--unread">
                            <span className="ui-message-workspace__statLabel">{tm('stats.unread.label')}</span>
                            <strong>{unreadMessagesCount}</strong>
                            <span className="ui-message-workspace__statHint">{tm('stats.unread.hint')}</span>
                        </div>
                        <div className="ui-message-workspace__stat ui-message-workspace__stat--read">
                            <span className="ui-message-workspace__statLabel">{tm('stats.read.label')}</span>
                            <strong>{readMessagesCount}</strong>
                            <span className="ui-message-workspace__statHint">{tm('stats.read.hint')}</span>
                        </div>
                        <div className="ui-message-workspace__stat ui-message-workspace__stat--total">
                            <span className="ui-message-workspace__statLabel">{tm('stats.total.label')}</span>
                            <strong>{totalMessagesCount}</strong>
                            <span className="ui-message-workspace__statHint">{tm('stats.total.hint')}</span>
                        </div>
                        <div className="ui-message-workspace__stat ui-message-workspace__stat--selected">
                            <span className="ui-message-workspace__statLabel">{tm('stats.selected.label')}</span>
                            <strong>{selectedCount}</strong>
                            <span className="ui-message-workspace__statHint">{tm('stats.selected.hint')}</span>
                        </div>
                    </div>

                    <div className="ui-message-toolbar">
                        <div className="ui-message-searchPanel">
                            <div className="ui-message-searchPanel__input">
                                <Search size={16} className="ui-message-searchPanel__icon" />
                                <Input
                                    placeholder={tm('toolbar.searchPlaceholder')}
                                    value={searchMessages}
                                    onChange={(event) => setSearchMessages(event.target.value)}
                                    className="admin-search-input"
                                />
                                {(isLoading || isFetching) && (
                                    <RefreshCw
                                        size={14}
                                        className="ui-spin ui-message-searchPanel__spinner"
                                    />
                                )}
                            </div>
                            <p className="ui-message-searchPanel__meta">
                                {debouncedSearch
                                    ? tm('toolbar.searchResultsVisible', { count: messages.length })
                                    : tm('toolbar.defaultHint')}
                            </p>
                        </div>

                        <div className="ui-message-toolbar__aside">
                            <div className="ui-message-toolbar__note">
                                <span className="ui-message-toolbar__noteIcon">
                                    <Inbox size={16} />
                                </span>
                                <div>
                                    <strong>{tm('notes.focusedReview.title')}</strong>
                                    <p>{tm('notes.focusedReview.description')}</p>
                                </div>
                            </div>
                            <div className="ui-message-toolbar__note">
                                <span className="ui-message-toolbar__noteIcon">
                                    <Layers3 size={16} />
                                </span>
                                <div>
                                    <strong>{tm('notes.batchFriendly.title')}</strong>
                                    <p>{tm('notes.batchFriendly.description')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedMessages.length > 0 && (
                    <div className="ui-message-bulkBar">
                        <div className="ui-message-bulkBar__summary">
                            <span className="ui-message-bulkBar__count">{selectedMessages.length}</span>
                            <div>
                                <strong>{tm('bulk.selectedCount', { count: selectedMessages.length })}</strong>
                                <p>{tm('bulk.description')}</p>
                            </div>
                        </div>
                        <div className="ui-message-bulkBar__actions">
                            <Button variant="secondary" size="sm" onClick={() => handleBatchMarkMessages(true)} title={tm('bulk.markReadTitle')}>
                                <MailOpen size={14} /> {tm('actions.markRead')}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleBatchMarkMessages(false)} title={tm('bulk.markUnreadTitle')}>
                                <Mail size={14} /> {tm('actions.markUnread')}
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleBatchDeleteMessages} title={tm('bulk.deleteTitle')}>
                                <Trash2 size={14} /> {tm('actions.delete')}
                            </Button>
                        </div>
                    </div>
                )}
            </section>

            <MessagesTable
                messages={messages}
                onView={handleViewMessage}
                onToggleRead={handleToggleMessageRead}
                onDelete={handleDeleteMessage}
                pageSize={pagination.limit}
                page={pagination.page}
                totalItems={messagesResult.totalCount}
                loading={isLoading || isFetching}
                hasMore={messagesResult.hasMore}
                isFirstPage={pagination.isFirstPage}
                onNext={() => pagination.fetchNext(messagesResult.lastDoc)}
                onPrevious={pagination.fetchPrevious}
                onPageChange={(page, size) => {
                    if (size !== pagination.limit) {
                        pagination.handlePageSizeChange(size);
                    }
                }}
                paginationVariant="cursor"
                selection={{
                    selectedIds: selectedMessages,
                    onSelect: handleToggleSelectMessage,
                    onSelectAll: handleSelectAllMessages
                }}
            />

            <Dialog open={!!viewingMessage} onOpenChange={() => setViewingMessage(null)}>
                <Dialog.Content maxWidth="860px" className="ui-message-detail-dialog">
                    <Dialog.Header className="ui-message-detail__header">
                        <div className="ui-message-detail__hero">
                            <div className="ui-message-detail__icon">
                                <Mail size={22} />
                            </div>
                            <div className="ui-message-detail__heroCopy">
                                <Dialog.Title>{tm('detail.title')}</Dialog.Title>
                                <Dialog.Description>{tm('detail.description')}</Dialog.Description>
                            </div>
                        </div>
                        <div className="ui-message-detail__headerMeta">
                            {viewingMessage && (
                                <Badge variant={viewingMessage.isRead ? 'default' : 'primary'}>
                                    {viewingMessage.isRead ? tm('status.read') : tm('status.unread')}
                                </Badge>
                            )}
                            <Dialog.Close />
                        </div>
                    </Dialog.Header>

                    <Dialog.Body className="ui-message-detail__body">
                        {viewingMessage && (
                            <div className="ui-message-detail__layout">
                                <div className="ui-message-detail__main">
                                    <section className="ui-message-detail__panel ui-message-detail__panel--message">
                                        <div className="ui-message-detail__sectionHead">
                                            <span>{tm('detail.messageBody')}</span>
                                            <small>{buildRelativeTime(viewingMessage.createdAt, locale, tm('general.justArrived'))}</small>
                                        </div>
                                        <div className="ui-message-detail__messageText">
                                            {viewingMessage.message || tm('detail.noBody')}
                                        </div>
                                    </section>
                                </div>

                                <aside className="ui-message-detail__aside">
                                    <section className="ui-message-detail__panel">
                                        <div className="ui-message-detail__sectionHead">
                                            <span>{tm('detail.sender')}</span>
                                        </div>
                                        <div className="ui-message-detail__senderCard">
                                            <div className="ui-message-detail__senderAvatar">
                                                {(viewingMessage.name || '').trim().slice(0, 2).toUpperCase() || '?'}
                                            </div>
                                            <div className="ui-message-detail__senderMeta">
                                                <strong>{viewingMessage.name || tm('general.unknownSender')}</strong>
                                                <a href={`mailto:${viewingMessage.email}`}>
                                                    {viewingMessage.email || tm('general.noEmail')}
                                                </a>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="ui-message-detail__panel">
                                        <div className="ui-message-detail__sectionHead">
                                            <span>{tm('detail.statusTitle')}</span>
                                        </div>
                                        <div className="ui-message-detail__metaList">
                                            <div className="ui-message-detail__metaItem">
                                                <span>{tm('detail.received')}</span>
                                                <strong>{formatDateTime(viewingMessage.createdAt, locale, tm('general.recently'))}</strong>
                                            </div>
                                            <div className="ui-message-detail__metaItem">
                                                <span>{tm('detail.status')}</span>
                                                <strong>{viewingMessage.isRead ? tm('status.alreadyReviewed') : tm('status.needsAttention')}</strong>
                                            </div>
                                            <div className="ui-message-detail__metaItem">
                                                <span>{tm('detail.replyPath')}</span>
                                                <strong>{tm('detail.emailClient')}</strong>
                                            </div>
                                        </div>
                                    </section>
                                </aside>
                            </div>
                        )}
                    </Dialog.Body>

                    <Dialog.Footer className="ui-message-detail__footer">
                        {viewingMessage && (
                            <div className="ui-footer-actions-container">
                                <div className="ui-footer-actions-left">
                                    <Button variant="danger" onClick={() => handleDeleteMessage(viewingMessage.id)}>
                                        <Trash2 size={16} /> {tm('actions.delete')}
                                    </Button>
                                </div>
                                <div className="ui-footer-actions-right">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleToggleMessageRead(viewingMessage.id, viewingMessage.isRead)}
                                    >
                                        {viewingMessage.isRead ? <><MailOpen size={18} /> {tm('actions.markUnread')}</> : <><Mail size={18} /> {tm('actions.markRead')}</>}
                                    </Button>
                                    <a
                                        href={replyHref}
                                        className="ui-message-detail__replyLink"
                                    >
                                        <Reply size={18} /> {tm('actions.replyNow')}
                                    </a>
                                </div>
                            </div>
                        )}
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog>

            <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && resetConfirmDialog()}>
                <Dialog.Content maxWidth="440px" className={`ui-confirm-dialog ${confirmDialog.type !== 'danger' ? 'ui-confirm-dialog--primary' : ''}`}>
                    <Dialog.Header className="ui-confirm-dialog__header">
                        <div className="ui-confirm-dialog__titleWrap">
                            <span className="ui-confirm-dialog__icon">
                                {confirmDialog.type === 'danger' ? <Trash2 size={20} /> : <Mail size={20} />}
                            </span>
                            <div>
                                <Dialog.Title className="ui-confirm-dialog__title">
                                    {confirmDialog.title}
                                </Dialog.Title>
                                <Dialog.Description className="ui-confirm-dialog__description">
                                    {tm('dialog.reviewAction')}
                                </Dialog.Description>
                            </div>
                        </div>
                        <Dialog.Close />
                    </Dialog.Header>
                    <Dialog.Body className="ui-confirm-dialog__body">
                        <p className="ui-confirm-dialog__message">{confirmDialog.message}</p>
                        <p className="ui-confirm-dialog__note">{tm('dialog.deleteNote')}</p>
                    </Dialog.Body>
                    <Dialog.Footer className="ui-confirm-dialog__footer">
                        <Button variant="ghost" onClick={resetConfirmDialog}>
                            {tm('dialog.cancel')}
                        </Button>
                        <Button
                            variant={confirmDialog.type === 'danger' ? 'danger' : 'primary'}
                            onClick={() => {
                                confirmDialog.onConfirm?.();
                                resetConfirmDialog();
                            }}
                        >
                            {confirmDialog.confirmText}
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog>
        </div>
    );
};

export default MessagesTab;
