import React, { useState, useMemo, useCallback } from 'react';
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

const getDateFromTimestamp = (timestamp) => {
    if (!timestamp?.seconds) return null;
    return new Date(timestamp.seconds * 1000);
};

const formatDateTime = (timestamp) => {
    const date = getDateFromTimestamp(timestamp);
    return date
        ? new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date)
        : 'Recently';
};

const buildRelativeTime = (timestamp) => {
    const date = getDateFromTimestamp(timestamp);
    if (!date) return 'Just arrived';

    const diffMs = date.getTime() - Date.now();
    const absMinutes = Math.abs(diffMs) / 60000;
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

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

const getInitials = (name = '') => {
    const cleaned = name.trim();
    if (!cleaned) return '?';
    const parts = cleaned.split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const MessagesTab = ({ userRole, showToast, isActionAllowed, onMessagesChange }) => {
    const queryClient = useQueryClient();
    const [searchMessages, setSearchMessages] = useState('');
    const debouncedSearch = useDebounce(searchMessages, 500);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [viewingMessage, setViewingMessage] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const { trackWrite, trackDelete } = useActivity();

    const pagination = useCursorPagination(10, [debouncedSearch]);

    const { data: messagesResult = { data: [], lastDoc: null, hasMore: false }, isLoading, isFetching } = useQuery({
        queryKey: ['messages', debouncedSearch, pagination.cursor, pagination.limit],
        queryFn: async () => {
            const result = await BaseService.safe(() => MessageService.fetchMessagesPaginated({
                lastDoc: pagination.cursor,
                limit: pagination.limit,
                search: debouncedSearch
            }));

            if (result.error) {
                showToast(result.error, 'error');
                return { data: [], lastDoc: null, hasMore: false };
            }

            pagination.updateAfterFetch(result.data.lastDoc, result.data.hasMore);
            return result.data;
        },
        staleTime: 60000,
        gcTime: 300000
    });

    const messages = messagesResult.data;

    const refetchMessages = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        onMessagesChange?.();
    }, [queryClient, onMessagesChange]);

    const unreadMessagesCount = useMemo(() => messages.filter((message) => !message.isRead).length, [messages]);
    const readMessagesCount = messages.length - unreadMessagesCount;
    const selectedCount = selectedMessages.length;
    const pageSummary = debouncedSearch
        ? `${messages.length} search result${messages.length === 1 ? '' : 's'} on this page`
        : `${messages.length} message${messages.length === 1 ? '' : 's'} loaded on this page`;

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
        showToast(`Marked ${selectedMessages.length} messages as ${isRead ? 'read' : 'unread'}.`);
    };

    const handleBatchDeleteMessages = () => {
        if (selectedMessages.length === 0) return;
        if (!isActionAllowed('delete', 'messages')) {
            return showToast('You do not have permission to perform this action.', 'error');
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Delete Messages',
            message: `Are you sure you want to delete ${selectedMessages.length} selected messages? This action cannot be undone.`,
            confirmText: 'Delete All',
            type: 'danger',
            onConfirm: async () => {
                const { error } = await BaseService.safe(() => MessageService.batchDeleteMessages(userRole, selectedMessages, trackDelete));
                if (error) {
                    showToast(error, 'error');
                } else {
                    refetchMessages();
                    setSelectedMessages([]);
                    showToast(`Deleted ${selectedMessages.length} messages.`);
                }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
            }
        });
    };

    const handleDeleteMessage = (id) => {
        if (!isActionAllowed('delete', 'messages')) {
            return showToast('You do not have permission to perform this action.', 'error');
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Delete Message',
            message: 'Are you sure you want to delete this message? This action cannot be undone.',
            confirmText: 'Delete',
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
                    showToast('Message deleted.');
                }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
            }
        });
    };

    const replyHref = viewingMessage
        ? `mailto:${viewingMessage.email}?subject=${encodeURIComponent(`Re: Portfolio inquiry from ${viewingMessage.name || 'your contact form'}`)}`
        : '#';

    return (
        <div className="ui-message-tab">
            <SectionHeader
                title="Inquiry Messages"
                description="Review contact form submissions, prioritize unread inquiries, and move from triage to reply without losing context."
                icon={Mail}
                rightElement={(
                    <div className="ui-message-headerActions">
                        <Badge variant={unreadMessagesCount > 0 ? 'primary' : 'default'}>
                            {unreadMessagesCount > 0 ? `${unreadMessagesCount} unread` : 'Inbox clear'}
                        </Badge>
                        <button
                            onClick={() => {
                                pagination.reset();
                                refetchMessages();
                                showToast('Messages refreshed');
                            }}
                            className="ui-button ui-button--ghost ui-btn-icon-only"
                            title="Refresh messages"
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
                            <span className="ui-message-workspace__eyebrow">Inbox workspace</span>
                            <h3>Scan, sort, and answer inquiries faster</h3>
                            <p>
                                Keep the list focused on what needs attention first, then open each message in a cleaner reading surface with reply-ready actions.
                            </p>
                        </div>
                        <div className="ui-message-workspace__status">
                            <Badge variant={debouncedSearch ? 'primary' : 'default'}>
                                {debouncedSearch ? `Filtered by "${debouncedSearch}"` : 'Latest page'}
                            </Badge>
                            <span>{pageSummary}</span>
                        </div>
                    </div>

                    <div className="ui-message-workspace__stats">
                        <div className="ui-message-workspace__stat">
                            <span className="ui-message-workspace__statLabel">Unread now</span>
                            <strong>{unreadMessagesCount}</strong>
                            <span className="ui-message-workspace__statHint">Messages needing a fresh review</span>
                        </div>
                        <div className="ui-message-workspace__stat">
                            <span className="ui-message-workspace__statLabel">Read on page</span>
                            <strong>{readMessagesCount}</strong>
                            <span className="ui-message-workspace__statHint">Already opened and reviewed</span>
                        </div>
                        <div className="ui-message-workspace__stat">
                            <span className="ui-message-workspace__statLabel">Loaded now</span>
                            <strong>{messages.length}</strong>
                            <span className="ui-message-workspace__statHint">Visible records on this page</span>
                        </div>
                        <div className="ui-message-workspace__stat">
                            <span className="ui-message-workspace__statLabel">Selected</span>
                            <strong>{selectedCount}</strong>
                            <span className="ui-message-workspace__statHint">Ready for batch actions</span>
                        </div>
                    </div>
                </div>

                <div className="ui-message-toolbar">
                    <div className="ui-message-searchPanel">
                        <label className="ui-message-searchPanel__label" htmlFor="message-search">
                            Search inbox
                        </label>
                        <div className="admin-search-container ui-message-searchPanel__field">
                            <Search size={16} className="admin-search-icon" />
                            <Input
                                id="message-search"
                                type="text"
                                placeholder="Search by sender, email, or message preview..."
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
                                ? `${messages.length} matching message${messages.length === 1 ? '' : 's'} visible on this page.`
                                : 'Unread rows stay visually elevated so the next reply is easy to spot.'}
                        </p>
                    </div>

                    <div className="ui-message-toolbar__aside">
                        <div className="ui-message-toolbar__note">
                            <span className="ui-message-toolbar__noteIcon">
                                <Inbox size={16} />
                            </span>
                            <div>
                                <strong>Focused review</strong>
                                <p>Open any row to read the full message, copy the sender context, and jump straight into email.</p>
                            </div>
                        </div>
                        <div className="ui-message-toolbar__note">
                            <span className="ui-message-toolbar__noteIcon">
                                <Layers3 size={16} />
                            </span>
                            <div>
                                <strong>Batch-friendly</strong>
                                <p>Select multiple rows when you want to clear older inquiries or reset unread state in one pass.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedMessages.length > 0 && (
                    <div className="ui-message-bulkBar">
                        <div className="ui-message-bulkBar__summary">
                            <span className="ui-message-bulkBar__count">{selectedMessages.length}</span>
                            <div>
                                <strong>{selectedMessages.length} selected</strong>
                                <p>Apply a status update or clear the chosen messages.</p>
                            </div>
                        </div>
                        <div className="ui-message-bulkBar__actions">
                            <Button variant="secondary" size="sm" onClick={() => handleBatchMarkMessages(true)} title="Mark selected as read">
                                <MailOpen size={14} /> Mark Read
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleBatchMarkMessages(false)} title="Mark selected as unread">
                                <Mail size={14} /> Mark Unread
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleBatchDeleteMessages} title="Delete selected messages">
                                <Trash2 size={14} /> Delete
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
                loading={isLoading || isFetching}
                hasMore={pagination.hasMore}
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
                                <Dialog.Title>Message Details</Dialog.Title>
                                <Dialog.Description>
                                    Read the inquiry, verify sender context, and reply without leaving the admin workspace.
                                </Dialog.Description>
                            </div>
                        </div>
                        <div className="ui-message-detail__headerMeta">
                            {viewingMessage && (
                                <Badge variant={viewingMessage.isRead ? 'default' : 'primary'}>
                                    {viewingMessage.isRead ? 'Read' : 'Unread'}
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
                                            <span>Message body</span>
                                            <small>{buildRelativeTime(viewingMessage.createdAt)}</small>
                                        </div>
                                        <div className="ui-message-detail__messageText">
                                            {viewingMessage.message || 'No message body was provided.'}
                                        </div>
                                    </section>
                                </div>

                                <aside className="ui-message-detail__aside">
                                    <section className="ui-message-detail__panel">
                                        <div className="ui-message-detail__sectionHead">
                                            <span>Sender</span>
                                        </div>
                                        <div className="ui-message-detail__senderCard">
                                            <div className="ui-message-detail__senderAvatar">
                                                {getInitials(viewingMessage.name)}
                                            </div>
                                            <div className="ui-message-detail__senderMeta">
                                                <strong>{viewingMessage.name || 'Unknown sender'}</strong>
                                                <a href={`mailto:${viewingMessage.email}`}>
                                                    {viewingMessage.email || 'No email provided'}
                                                </a>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="ui-message-detail__panel">
                                        <div className="ui-message-detail__sectionHead">
                                            <span>Message status</span>
                                        </div>
                                        <div className="ui-message-detail__metaList">
                                            <div className="ui-message-detail__metaItem">
                                                <span>Received</span>
                                                <strong>{formatDateTime(viewingMessage.createdAt)}</strong>
                                            </div>
                                            <div className="ui-message-detail__metaItem">
                                                <span>Status</span>
                                                <strong>{viewingMessage.isRead ? 'Already reviewed' : 'Needs attention'}</strong>
                                            </div>
                                            <div className="ui-message-detail__metaItem">
                                                <span>Reply path</span>
                                                <strong>Email client</strong>
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
                                        <Trash2 size={16} /> Delete
                                    </Button>
                                </div>
                                <div className="ui-footer-actions-right">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleToggleMessageRead(viewingMessage.id, viewingMessage.isRead)}
                                    >
                                        {viewingMessage.isRead ? <><MailOpen size={18} /> Mark Unread</> : <><Mail size={18} /> Mark Read</>}
                                    </Button>
                                    <a
                                        href={replyHref}
                                        className="ui-message-detail__replyLink"
                                    >
                                        <Reply size={18} /> Reply Now
                                    </a>
                                </div>
                            </div>
                        )}
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog>

            <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}>
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
                                    Review this action before continuing.
                                </Dialog.Description>
                            </div>
                        </div>
                        <Dialog.Close />
                    </Dialog.Header>
                    <Dialog.Body className="ui-confirm-dialog__body">
                        <p className="ui-confirm-dialog__message">{confirmDialog.message}</p>
                        <p className="ui-confirm-dialog__note">Deleted messages cannot be restored from this inbox view.</p>
                    </Dialog.Body>
                    <Dialog.Footer className="ui-confirm-dialog__footer">
                        <Button variant="ghost" onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}>
                            Cancel
                        </Button>
                        <Button
                            variant={confirmDialog.type === 'danger' ? 'danger' : 'primary'}
                            onClick={() => {
                                confirmDialog.onConfirm?.();
                                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
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
