import React, { useState, useMemo, useCallback } from 'react';
import { Mail, MailOpen, Trash2, Search, RefreshCw, Reply } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Dialog } from '@/shared/components/ui';
import SectionHeader from '../components/SectionHeader';
import MessageService from '../../../services/MessageService';
import BaseService from '../../../services/BaseService';
import { useActivity } from '../../../hooks/useActivity';
import { useDebounce } from '../../../hooks/useDebounce';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import MessagesTable from './components/MessagesTable';

const MessagesTab = ({ userRole, showToast, isActionAllowed, onMessagesChange }) => {
    const queryClient = useQueryClient();
    const [searchMessages, setSearchMessages] = useState('');
    const debouncedSearch = useDebounce(searchMessages, 500);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [viewingMessage, setViewingMessage] = useState(null);
    const [msgSort, setMsgSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const { trackWrite, trackDelete } = useActivity();

    // cursor pagination hook
    const pagination = useCursorPagination(10, [debouncedSearch]);

    // 1. Fetch Paginated Messages
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
        if (onMessagesChange) onMessagesChange(); // Trigger unread count refresh in Admin.jsx
    }, [queryClient, onMessagesChange]);

    const toggleSort = useCallback((field) => {
        setMsgSort(prev => ({
            field,
            dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc'
        }));
        pagination.reset();
    }, [pagination]);



    // Remove client-side filtering/pagination
    const filteredMessages = messages;
    const paginatedMessages = messages;

    // Use a separate count from the result if needed or just the total
    const unreadMessagesCount = useMemo(() => {
        return messages.filter(m => !m.isRead).length;
    }, [messages]);

    const handleToggleMessageRead = async (id, currentStatus) => {
        const { error } = await BaseService.safe(() => MessageService.toggleReadStatus(userRole, id, currentStatus, trackWrite));
        if (error) return showToast(error, 'error');
        refetchMessages();
        if (viewingMessage && viewingMessage.id === id) {
            setViewingMessage(prev => ({ ...prev, isRead: !currentStatus }));
        }
    };

    const handleViewMessage = (msg) => {
        if (!msg.isRead) {
            setViewingMessage({ ...msg, isRead: true });
            handleToggleMessageRead(msg.id, false);
        } else {
            setViewingMessage(msg);
        }
    };

    const handleToggleSelectMessage = (id) => {
        setSelectedMessages(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleSelectAllMessages = () => {
        const paginatedIds = paginatedMessages.map(m => m.id);
        const allSelected = paginatedIds.every(id => selectedMessages.includes(id)) && paginatedIds.length > 0;
        if (allSelected) {
            setSelectedMessages(prev => prev.filter(id => !paginatedIds.includes(id)));
        } else {
            setSelectedMessages(prev => {
                const newSelections = paginatedIds.filter(id => !prev.includes(id));
                return [...prev, ...newSelections];
            });
        }
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
            return showToast("You do not have permission to perform this action.", "error");
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Delete Messages',
            message: `Are you sure you want to delete ${selectedMessages.length} selected messages? This action cannot be undone.`,
            confirmText: 'Delete All',
            type: 'danger',
            onConfirm: async () => {
                const { error } = await BaseService.safe(() => MessageService.batchDeleteMessages(userRole, selectedMessages, trackDelete));
                if (error) { showToast(error, 'error'); }
                else { refetchMessages(); setSelectedMessages([]); showToast(`Deleted ${selectedMessages.length} messages.`); }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
            }
        });
    };

    const handleDeleteMessage = (id) => {
        if (!isActionAllowed('delete', 'messages')) {
            return showToast("You do not have permission to perform this action.", "error");
        }
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Message',
            message: 'Are you sure you want to delete this message? This action cannot be undone.',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                const { error } = await BaseService.safe(() => MessageService.deleteMessage(userRole, id, trackDelete));
                if (error) { showToast(error, 'error'); }
                else { refetchMessages(); setSelectedMessages(prev => prev.filter(mid => mid !== id)); if (viewingMessage && viewingMessage.id === id) setViewingMessage(null); showToast('Message deleted.'); }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
            }
        });
    };

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <SectionHeader
                title="Inquiry Messages"
                description={`Manage and respond to contact form submissions. Currently tracking ${messages.length} inquiries.`}
                icon={Mail}
                rightElement={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {unreadMessagesCount > 0 && (
                            <div style={{ background: 'rgba(108, 99, 255, 0.15)', color: '#6C63FF', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                {unreadMessagesCount} Unread
                            </div>
                        )}
                        <button 
                            onClick={() => { pagination.reset(); refetchMessages(); showToast('Messages refreshed'); }} 
                            className="ui-button ui-ghost ui-square"
                            title="Refresh Data"
                        >
                            <RefreshCw size={18} className={(isLoading || isFetching) ? 'ui-spin' : ''} />
                        </button>
                    </div>
                }
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="admin-search-container" style={{ margin: 0, flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search size={16} className="admin-search-icon" />
                    <Input 
                        type="text" 
                        placeholder="Search by name, email, or message..." 
                        value={searchMessages} 
                        onChange={(e) => setSearchMessages(e.target.value)} 
                        className="admin-search-input"
                    />
                    {(isLoading || isFetching) && <RefreshCw size={14} className="ui-spin" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />}
                    {debouncedSearch && messages.length > 0 && <span className="admin-search-result-count" style={{ right: (isLoading || isFetching) ? '2.5rem' : '1rem' }}>{messages.length} results on this page</span>}
                </div>

                {selectedMessages.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                            {selectedMessages.length} selected
                        </span>
                        <Button variant="secondary" size="sm" onClick={() => handleBatchMarkMessages(true)} title="Mark as Read">
                            <MailOpen size={14} /> Read
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleBatchMarkMessages(false)} title="Mark as Unread">
                            <Mail size={14} /> Unread
                        </Button>
                        <Button variant="danger" size="sm" onClick={handleBatchDeleteMessages} title="Delete Selected">
                            <Trash2 size={14} /> Delete
                        </Button>
                    </div>
                )}
            </div>

            <MessagesTable
                messages={paginatedMessages}
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

            {/* Message Detail Modal */}
            <Dialog open={!!viewingMessage} onOpenChange={() => setViewingMessage(null)}>
                <Dialog.Content maxWidth="680px">
                    <Dialog.Header style={{ background: 'rgba(99, 102, 241, 0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                                <Mail size={24} />
                            </div>
                            <div>
                                <Dialog.Title style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Message Details</Dialog.Title>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>From inquiries on your portfolio</p>
                            </div>
                        </div>
                        <Dialog.Close />
                    </Dialog.Header>
                    <Dialog.Body style={{ padding: '2rem' }}>
                        {viewingMessage && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Sender</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{viewingMessage.name?.charAt(0)}</div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{viewingMessage.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{viewingMessage.email}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Timestamp</span>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                            {viewingMessage.createdAt?.seconds ? new Date(viewingMessage.createdAt.seconds * 1000).toLocaleString() : 'Recently'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', minHeight: '150px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '1rem' }}>Message Body</span>
                                    <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--text-primary)', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                                        {viewingMessage.message}
                                    </p>
                                </div>
                            </>
                        )}
                    </Dialog.Body>
                    <Dialog.Footer style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', justifyContent: 'space-between' }}>
                        {viewingMessage && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', justifyContent: 'space-between', width: '100%' }}>
                                <Button variant="danger" onClick={() => { handleDeleteMessage(viewingMessage.id); setViewingMessage(null); }} style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <Trash2 size={16} /> Delete
                                </Button>
                                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                    <Button variant="secondary" onClick={() => handleToggleMessageRead(viewingMessage.id, viewingMessage.isRead)}>
                                        {viewingMessage.isRead ? <><MailOpen size={18} /> Mark Unread</> : <><Mail size={18} /> Mark Read</>}
                                    </Button>
                                    <Button asChild>
                                        <a href={`mailto:${viewingMessage.email}?subject=Re: Inquiry from ${encodeURIComponent(viewingMessage.name || '')}`} style={{ textDecoration: 'none' }}>
                                            <Reply size={18} /> Reply Now
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog>


            {/* Confirm Dialog */}
            <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
                <Dialog.Content maxWidth="440px">
                    <Dialog.Header>
                        <Dialog.Title style={{ color: confirmDialog.type === 'danger' ? '#ef4444' : '#f97316', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {confirmDialog.type === 'danger' ? <Trash2 size={20} /> : <Mail size={20} />} {confirmDialog.title}
                        </Dialog.Title>
                        <Dialog.Close />
                    </Dialog.Header>
                    <Dialog.Body style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                        {confirmDialog.message}
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="ghost" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                        <Button 
                            variant={confirmDialog.type === 'danger' ? 'danger' : 'primary'}
                            onClick={() => { confirmDialog.onConfirm?.(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }}
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
