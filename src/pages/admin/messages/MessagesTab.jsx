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
import { useTranslation } from '../../../hooks/useTranslation';

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
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const queryClient = useQueryClient();
    const [searchMessages, setSearchMessages] = useState('');
    const debouncedSearch = useDebounce(searchMessages, 500);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [viewingMessage, setViewingMessage] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: tr('Confirm', 'បញ្ជាក់'), type: 'danger' });
    const { trackWrite, trackDelete } = useActivity();

    const pagination = useCursorPagination(5, [debouncedSearch]);

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

    const messages = messagesResult.data;

    const refetchMessages = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        onMessagesChange?.();
    }, [queryClient, onMessagesChange]);

    const unreadMessagesCount = useMemo(() => messages.filter((message) => !message.isRead).length, [messages]);
    const readMessagesCount = messages.length - unreadMessagesCount;
    const selectedCount = selectedMessages.length;
    const pageSummary = debouncedSearch
        ? tr(`${messages.length} search result${messages.length === 1 ? '' : 's'} on this page`, `លទ្ធផលស្វែងរក ${messages.length} នៅលើទំព័រនេះ`)
        : tr(`${messages.length} message${messages.length === 1 ? '' : 's'} loaded on this page`, `សារ ${messages.length} ដែលបានផ្ទុកលើទំព័រនេះ`);

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
        showToast(tr(`Marked ${selectedMessages.length} messages as ${isRead ? 'read' : 'unread'}.`, `បានសម្គាល់សារ ${selectedMessages.length} ជា ${isRead ? 'បានអាន' : 'មិនទាន់អាន'}។`));
    };

    const handleBatchDeleteMessages = () => {
        if (selectedMessages.length === 0) return;
        if (!isActionAllowed('delete', 'messages')) {
            return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ។'), 'error');
        }

        setConfirmDialog({
            isOpen: true,
            title: tr('Delete Messages', 'លុបសារ'),
            message: tr(`Are you sure you want to delete ${selectedMessages.length} selected messages? This action cannot be undone.`, `តើអ្នកប្រាកដថាចង់លុបសារ ${selectedMessages.length} ដែលបានជ្រើសរើសឬ? សកម្មភាពនេះមិនអាចមិនធ្វើវិញបានទេ។`),
            confirmText: tr('Delete All', 'លុបទាំងអស់'),
            type: 'danger',
            onConfirm: async () => {
                const { error } = await BaseService.safe(() => MessageService.batchDeleteMessages(userRole, selectedMessages, trackDelete));
                if (error) {
                    showToast(error, 'error');
                } else {
                    refetchMessages();
                    setSelectedMessages([]);
                    showToast(tr(`Deleted ${selectedMessages.length} messages.`, `បានលុបសារ ${selectedMessages.length}។`));
                }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: tr('Confirm', 'បញ្ជាក់'), type: 'danger' });
            }
        });
    };

    const handleDeleteMessage = (id) => {
        if (!isActionAllowed('delete', 'messages')) {
            return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ។'), 'error');
        }

        setConfirmDialog({
            isOpen: true,
            title: tr('Delete Message', 'លុបសារ'),
            message: tr('Are you sure you want to delete this message? This action cannot be undone.', 'តើអ្នកប្រាកដថាចង់លុបសារនេះឬ? សកម្មភាពនេះមិនអាចមិនធ្វើវិញបានទេ។'),
            confirmText: tr('Delete', 'លុប'),
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
                    showToast(tr('Message deleted.', 'បានលុបសារ។'));
                }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: tr('Confirm', 'បញ្ជាក់'), type: 'danger' });
            }
        });
    };

    const replyHref = viewingMessage
        ? `mailto:${viewingMessage.email}?subject=${encodeURIComponent(tr(`Re: Portfolio inquiry from ${viewingMessage.name || 'your contact form'}`, `ឆ្លើយតប៖ សំណួរពី Portfolio ពី ${viewingMessage.name || 'ទម្រង់ទំនាក់ទំនងរបស់អ្នក'}`))}`
        : '#';

    return (
        <div className="ui-message-tab">
            <SectionHeader
                title={tr('Inquiry Messages', 'សារសំណួរ')}
                description={tr('Review contact form submissions, prioritize unread inquiries, and move from triage to reply without losing context.', 'ពិនិត្យសារពីទម្រង់ទំនាក់ទំនង កំណត់អាទិភាពសារមិនទាន់អាន ហើយឆ្លើយតបដោយមិនបាត់បរិបទ។')}
                icon={Mail}
                rightElement={(
                    <div className="ui-message-headerActions">
                        <Badge variant={unreadMessagesCount > 0 ? 'primary' : 'default'}>
                            {unreadMessagesCount > 0 ? tr(`${unreadMessagesCount} unread`, `${unreadMessagesCount} មិនទាន់អាន`) : tr('Inbox clear', 'ប្រអប់សារទទេ')}
                        </Badge>
                        <button
                            onClick={() => {
                                pagination.reset();
                                refetchMessages();
                                showToast(tr('Messages refreshed', 'បានធ្វើបច្ចុប្បន្នភាពសារ'));
                            }}
                            className="ui-button ui-button--ghost ui-btn-icon-only"
                            title={tr('Refresh messages', 'ធ្វើបច្ចុប្បន្នភាពសារ')}
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
                            <span className="ui-message-workspace__eyebrow">{tr('Inbox workspace', 'កន្លែងធ្វើការប្រអប់សារ')}</span>
                            <h3>{tr('Scan, sort, and answer inquiries faster', 'ស្កេន តម្រៀប និងឆ្លើយសំណួរបានលឿន')}</h3>
                            <p>
                                {tr('Keep the list focused on what needs attention first, then open each message in a cleaner reading surface with reply-ready actions.', 'ផ្តោតលើសារដែលត្រូវការយកចិត្តទុកដាក់ជាមុន រួចបើកអាននិងឆ្លើយតបបានភ្លាម។')}
                            </p>
                        </div>
                        <div className="ui-message-workspace__status">
                            <Badge variant={debouncedSearch ? 'primary' : 'default'}>
                                {debouncedSearch ? tr(`Filtered by "${debouncedSearch}"`, `បានតម្រងតាម "${debouncedSearch}"`) : tr('Latest page', 'ទំព័រចុងក្រោយ')}
                            </Badge>
                            <span>{pageSummary}</span>
                        </div>
                    </div>

                    <div className="ui-message-workspace__stats">
                        <div className="ui-message-workspace__stat">
                            <span className="ui-message-workspace__statLabel">{tr('Unread now', 'មិនទាន់អាន')}</span>
                            <strong>{unreadMessagesCount}</strong>
                            <span className="ui-message-workspace__statHint">{tr('Messages needing a fresh review', 'សារដែលត្រូវពិនិត្យ')}</span>
                        </div>
                        <div className="ui-message-workspace__stat">
                            <span className="ui-message-workspace__statLabel">{tr('Read on page', 'បានអានលើទំព័រ')}</span>
                            <strong>{readMessagesCount}</strong>
                            <span className="ui-message-workspace__statHint">{tr('Already opened and reviewed', 'បានបើក និងពិនិត្យរួច')}</span>
                        </div>
                        <div className="ui-message-workspace__stat">
                            <span className="ui-message-workspace__statLabel">{tr('Loaded now', 'ដែលបានផ្ទុក')}</span>
                            <strong>{messages.length}</strong>
                            <span className="ui-message-workspace__statHint">{tr('Visible records on this page', 'កំណត់ត្រាដែលមើលឃើញលើទំព័រនេះ')}</span>
                        </div>
                        <div className="ui-message-workspace__stat">
                            <span className="ui-message-workspace__statLabel">{tr('Selected', 'បានជ្រើស')}</span>
                            <strong>{selectedCount}</strong>
                            <span className="ui-message-workspace__statHint">{tr('Ready for batch actions', 'រួចសម្រាប់សកម្មភាពជាក្រុម')}</span>
                        </div>
                    </div>
                </div>

                <div className="ui-message-toolbar">
                    <div className="ui-message-searchPanel">
                        <label className="ui-message-searchPanel__label" htmlFor="message-search">
                            {tr('Search inbox', 'ស្វែងរកក្នុងប្រអប់សារ')}
                        </label>
                        <div className="admin-search-container ui-message-searchPanel__field">
                            <Search size={16} className="admin-search-icon" />
                            <Input
                                id="message-search"
                                type="text"
                                placeholder={tr('Search by sender, email, or message preview...', 'ស្វែងរកតាមអ្នកផ្ញើ អ៊ីមែល ឬការមើលសារជាមុន...')}
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
                                ? tr(`${messages.length} matching message${messages.length === 1 ? '' : 's'} visible on this page.`, `មានសារត្រូវគ្នា ${messages.length} នៅលើទំព័រនេះ។`)
                                : tr('Unread rows stay visually elevated so the next reply is easy to spot.', 'ជួរមិនទាន់អានត្រូវបានរំលេចឱ្យងាយរកឃើញសម្រាប់ឆ្លើយបន្ទាប់។')}
                        </p>
                    </div>

                    <div className="ui-message-toolbar__aside">
                        <div className="ui-message-toolbar__note">
                            <span className="ui-message-toolbar__noteIcon">
                                <Inbox size={16} />
                            </span>
                            <div>
                                <strong>{tr('Focused review', 'ពិនិត្យផ្តោត')}</strong>
                                <p>{tr('Open any row to read the full message, copy the sender context, and jump straight into email.', 'បើកជួរណាមួយដើម្បីអានសារពេញ យកបរិបទអ្នកផ្ញើ ហើយឆ្លើយតាមអ៊ីមែលភ្លាម។')}</p>
                            </div>
                        </div>
                        <div className="ui-message-toolbar__note">
                            <span className="ui-message-toolbar__noteIcon">
                                <Layers3 size={16} />
                            </span>
                            <div>
                                <strong>{tr('Batch-friendly', 'ងាយសម្រាប់សកម្មភាពជាក្រុម')}</strong>
                                <p>{tr('Select multiple rows when you want to clear older inquiries or reset unread state in one pass.', 'ជ្រើសជួរច្រើនពេលចង់សម្អាតសារចាស់ ឬកំណត់ស្ថានភាពមិនទាន់អានឡើងវិញ។')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedMessages.length > 0 && (
                    <div className="ui-message-bulkBar">
                        <div className="ui-message-bulkBar__summary">
                            <span className="ui-message-bulkBar__count">{selectedMessages.length}</span>
                            <div>
                                <strong>{tr(`${selectedMessages.length} selected`, `បានជ្រើស ${selectedMessages.length}`)}</strong>
                                <p>{tr('Apply a status update or clear the chosen messages.', 'ធ្វើបច្ចុប្បន្នភាពស្ថានភាព ឬសម្អាតសារដែលបានជ្រើស។')}</p>
                            </div>
                        </div>
                        <div className="ui-message-bulkBar__actions">
                            <Button variant="secondary" size="sm" onClick={() => handleBatchMarkMessages(true)} title={tr('Mark selected as read', 'សម្គាល់ដែលជ្រើសថាបានអាន')}>
                                <MailOpen size={14} /> {tr('Mark Read', 'សម្គាល់ថាបានអាន')}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleBatchMarkMessages(false)} title={tr('Mark selected as unread', 'សម្គាល់ដែលជ្រើសថាមិនទាន់អាន')}>
                                <Mail size={14} /> {tr('Mark Unread', 'សម្គាល់ថាមិនទាន់អាន')}
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleBatchDeleteMessages} title={tr('Delete selected messages', 'លុបសារដែលបានជ្រើស')}>
                                <Trash2 size={14} /> {tr('Delete', 'លុប')}
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
                                <Dialog.Title>{tr('Message Details', 'ព័ត៌មានលម្អិតសារ')}</Dialog.Title>
                                <Dialog.Description>
                                    {tr('Read the inquiry, verify sender context, and reply without leaving the admin workspace.', 'អានសំណួរ ផ្ទៀងផ្ទាត់បរិបទអ្នកផ្ញើ និងឆ្លើយតបដោយមិនចាកចេញពី Admin។')}
                                </Dialog.Description>
                            </div>
                        </div>
                        <div className="ui-message-detail__headerMeta">
                            {viewingMessage && (
                                <Badge variant={viewingMessage.isRead ? 'default' : 'primary'}>
                                    {viewingMessage.isRead ? tr('Read', 'បានអាន') : tr('Unread', 'មិនទាន់អាន')}
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
                                            <span>{tr('Message body', 'ខ្លឹមសារសារ')}</span>
                                            <small>{buildRelativeTime(viewingMessage.createdAt)}</small>
                                        </div>
                                        <div className="ui-message-detail__messageText">
                                            {viewingMessage.message || tr('No message body was provided.', 'មិនមានខ្លឹមសារសារទេ។')}
                                        </div>
                                    </section>
                                </div>

                                <aside className="ui-message-detail__aside">
                                    <section className="ui-message-detail__panel">
                                        <div className="ui-message-detail__sectionHead">
                                            <span>{tr('Sender', 'អ្នកផ្ញើ')}</span>
                                        </div>
                                        <div className="ui-message-detail__senderCard">
                                            <div className="ui-message-detail__senderAvatar">
                                                {getInitials(viewingMessage.name)}
                                            </div>
                                            <div className="ui-message-detail__senderMeta">
                                                <strong>{viewingMessage.name || tr('Unknown sender', 'អ្នកផ្ញើមិនស្គាល់')}</strong>
                                                <a href={`mailto:${viewingMessage.email}`}>
                                                    {viewingMessage.email || tr('No email provided', 'មិនមានអ៊ីមែល')}
                                                </a>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="ui-message-detail__panel">
                                        <div className="ui-message-detail__sectionHead">
                                            <span>{tr('Message status', 'ស្ថានភាពសារ')}</span>
                                        </div>
                                        <div className="ui-message-detail__metaList">
                                            <div className="ui-message-detail__metaItem">
                                                <span>{tr('Received', 'បានទទួល')}</span>
                                                <strong>{formatDateTime(viewingMessage.createdAt)}</strong>
                                            </div>
                                            <div className="ui-message-detail__metaItem">
                                                <span>{tr('Status', 'ស្ថានភាព')}</span>
                                                <strong>{viewingMessage.isRead ? tr('Already reviewed', 'បានពិនិត្យរួច') : tr('Needs attention', 'ត្រូវការយកចិត្តទុកដាក់')}</strong>
                                            </div>
                                            <div className="ui-message-detail__metaItem">
                                                <span>{tr('Reply path', 'ផ្លូវឆ្លើយតប')}</span>
                                                <strong>{tr('Email client', 'កម្មវិធីអ៊ីមែល')}</strong>
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
                                        <Trash2 size={16} /> {tr('Delete', 'លុប')}
                                    </Button>
                                </div>
                                <div className="ui-footer-actions-right">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleToggleMessageRead(viewingMessage.id, viewingMessage.isRead)}
                                    >
                                        {viewingMessage.isRead ? <><MailOpen size={18} /> {tr('Mark Unread', 'សម្គាល់ថាមិនទាន់អាន')}</> : <><Mail size={18} /> {tr('Mark Read', 'សម្គាល់ថាបានអាន')}</>}
                                    </Button>
                                    <a
                                        href={replyHref}
                                        className="ui-message-detail__replyLink"
                                    >
                                        <Reply size={18} /> {tr('Reply Now', 'ឆ្លើយឥឡូវនេះ')}
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
                                    {tr('Review this action before continuing.', 'ពិនិត្យសកម្មភាពនេះមុនបន្ត។')}
                                </Dialog.Description>
                            </div>
                        </div>
                        <Dialog.Close />
                    </Dialog.Header>
                    <Dialog.Body className="ui-confirm-dialog__body">
                        <p className="ui-confirm-dialog__message">{confirmDialog.message}</p>
                        <p className="ui-confirm-dialog__note">{tr('Deleted messages cannot be restored from this inbox view.', 'សារដែលលុបហើយ មិនអាចស្តារឡើងវិញពីទិដ្ឋភាពប្រអប់សារនេះបានទេ។')}</p>
                    </Dialog.Body>
                    <Dialog.Footer className="ui-confirm-dialog__footer">
                        <Button variant="ghost" onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}>
                            {tr('Cancel', 'បោះបង់')}
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
