import React, { useState, useCallback, useMemo } from 'react';
import { Search, Mail, MailOpen, Trash2, X, Reply } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { sortData } from '../../../utils/sortData';
import styles from '../../Admin.module.scss';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import MessageService from '../../../services/MessageService';
import ConfirmDialog from '../components/ConfirmDialog';
import BaseModal from '../components/BaseModal';
import SectionHeader from '../components/SectionHeader';

const MessagesTab = ({ userRole, showToast, messages, setMessages }) => {
    const [searchMessages, setSearchMessages] = useState('');
    const [messagesPage, setMessagesPage] = useState(1);
    const [messagesPerPage, setMessagesPerPage] = useState(10);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [viewingMessage, setViewingMessage] = useState(null);
    const [msgSort, setMsgSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const { trackWrite, trackDelete } = useActivity();

    const toggleSort = useCallback((field) => {
        setMsgSort(prev => ({
            field,
            dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc'
        }));
        setMessagesPage(1);
    }, []);



    const filteredMessages = useMemo(() => {
        let result = messages;
        if (searchMessages) {
            const lowerSearch = searchMessages.toLowerCase();
            result = result.filter(msg =>
                (msg.name && msg.name.toLowerCase().includes(lowerSearch)) ||
                (msg.email && msg.email.toLowerCase().includes(lowerSearch)) ||
                (msg.message && msg.message.toLowerCase().includes(lowerSearch))
            );
        }
        return sortData(result, msgSort);
    }, [messages, searchMessages, msgSort]);

    const messagesTotalPages = Math.ceil(filteredMessages.length / messagesPerPage) || 1;
    const paginatedMessages = useMemo(() => {
        const start = (messagesPage - 1) * messagesPerPage;
        return filteredMessages.slice(start, start + messagesPerPage);
    }, [filteredMessages, messagesPage, messagesPerPage]);

    const unreadMessagesCount = useMemo(() => {
        return messages.filter(m => !m.isRead).length;
    }, [messages]);

    const handleToggleMessageRead = async (id, currentStatus) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: !currentStatus } : m));
        setViewingMessage(prev => (prev && prev.id === id) ? { ...prev, isRead: !currentStatus } : prev);
        try {
            await MessageService.toggleReadStatus(userRole, id, currentStatus, trackWrite);
        } catch (error) {
            setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: currentStatus } : m));
            setViewingMessage(prev => (prev && prev.id === id) ? { ...prev, isRead: currentStatus } : prev);
            showToast(error.message || 'Failed to update message status.', 'error');
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
        try {
            await MessageService.batchMarkMessages(userRole, selectedMessages, isRead, trackWrite);
            setMessages(prev => prev.map(m => selectedMessages.includes(m.id) ? { ...m, isRead } : m));
            setSelectedMessages([]);
            showToast(`Marked ${selectedMessages.length} messages as ${isRead ? 'read' : 'unread'}.`);
        } catch (error) {
            showToast(error.message || 'Failed to update messages.', 'error');
        }
    };

    const handleBatchDeleteMessages = () => {
        if (selectedMessages.length === 0) return;

        setConfirmDialog({
            isOpen: true,
            title: 'Delete Messages',
            message: `Are you sure you want to delete ${selectedMessages.length} selected messages? This action cannot be undone.`,
            confirmText: 'Delete All',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await MessageService.batchDeleteMessages(userRole, selectedMessages, trackDelete);
                    setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id)));
                    setSelectedMessages([]);
                    showToast(`Deleted ${selectedMessages.length} messages.`);
                } catch (error) {
                    showToast(error.message || 'Failed to delete messages.', 'error');
                } finally {
                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
                }
            }
        });
    };

    const handleDeleteMessage = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Message',
            message: 'Are you sure you want to delete this message? This action cannot be undone.',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await MessageService.deleteMessage(userRole, id, trackDelete);
                    setMessages(messages.filter(m => m.id !== id));
                    setSelectedMessages(prev => prev.filter(mid => mid !== id));
                    if (viewingMessage && viewingMessage.id === id) setViewingMessage(null);
                    showToast('Message deleted.');
                } catch (error) {
                    showToast(error.message || 'Failed to delete message.', 'error');
                } finally {
                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
                }
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
                    </div>
                }
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div className={styles.searchBox} style={{ margin: 0, flex: 1, minWidth: '250px' }}>
                    <Search size={16} className={styles.searchIcon} />
                    <input type="text" placeholder="Search by name, email, or message..." value={searchMessages} onChange={(e) => { setSearchMessages(e.target.value); setMessagesPage(1); }} />
                    {searchMessages && <span className={styles.searchResultCount}>{filteredMessages.length} of {messages.length}</span>}
                </div>

                {selectedMessages.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                            {selectedMessages.length} selected
                        </span>
                        <button onClick={() => handleBatchMarkMessages(true)} className={styles.iconBtn} title="Mark as Read" style={{ width: 'auto', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <MailOpen size={14} /> Read
                        </button>
                        <button onClick={() => handleBatchMarkMessages(false)} className={styles.iconBtn} title="Mark as Unread" style={{ width: 'auto', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Mail size={14} /> Unread
                        </button>
                        <button onClick={handleBatchDeleteMessages} className={styles.deleteBtn} title="Delete Selected" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                )}
            </div>

            {filteredMessages.length === 0 ? (
                <div className={styles.emptyState}>
                    <Mail size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>{searchMessages ? 'No matching messages found.' : 'Your inbox is empty.'}</p>
                </div>
            ) : (
                <>
                    <div className={styles.messageHeader}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                checked={paginatedMessages.length > 0 && paginatedMessages.every(msg => selectedMessages.includes(msg.id))}
                                onChange={handleSelectAllMessages}
                                style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                            />
                        </div>
                        <SortableHeader label="Sender" field="name" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={toggleSort} />
                        <SortableHeader label="Email" field="email" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={toggleSort} />
                        <SortableHeader label="Message Preview" field="message" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={toggleSort} />
                        <SortableHeader label="Received" field="createdAt" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={toggleSort} />
                        <div style={{ textAlign: 'right' }}>Actions</div>
                    </div>

                    {paginatedMessages.map((msg, index) => {
                        const isUnread = !msg.isRead;
                        const isSelected = selectedMessages.includes(msg.id);
                        return (
                            <div
                                key={msg.id || `msg-${index}`}
                                onClick={(e) => { if (e.target.type !== 'checkbox' && !e.target.closest('button')) handleViewMessage(msg); }}
                                className={`${styles.messageGrid} ${isUnread ? styles.unread : ''} ${isSelected ? styles.selected : ''}`}
                            >
                                <div onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelectMessage(msg.id)}
                                        style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                                    />
                                </div>
                                <div style={{ color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isUnread ? '700' : '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {msg.name}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{msg.email}</div>
                                <div style={{ color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: isUnread ? 1 : 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {msg.message}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button onClick={(e) => { e.stopPropagation(); handleToggleMessageRead(msg.id, msg.isRead); }} className={styles.iconBtn} title={msg.isRead ? "Mark Unread" : "Mark Read"} style={{ background: isUnread ? 'rgba(108, 99, 255, 0.1)' : 'transparent' }}>
                                        {msg.isRead ? <MailOpen size={15} /> : <Mail size={15} style={{ color: 'var(--primary-color)' }} />}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }} className={styles.iconBtn} title="Delete" style={{ color: '#ef4444' }}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    <Pagination currentPage={messagesPage} totalPages={messagesTotalPages} onPageChange={setMessagesPage} perPage={messagesPerPage} onPerPageChange={(v) => { setMessagesPerPage(v); setMessagesPage(1); }} totalItems={filteredMessages.length} />
                </>
            )}

            {/* Message Detail Modal */}
            <BaseModal
                isOpen={!!viewingMessage}
                onClose={() => setViewingMessage(null)}
                zIndex={1200}
                maxWidth="680px"
                contentStyle={{ borderRadius: '24px', padding: 0 }}
                headerStyle={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                headerContent={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Message Details</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>From inquiries on your portfolio</p>
                        </div>
                    </div>
                }
                bodyStyle={{ padding: '2rem' }}
                footerStyle={{ padding: '1.25rem 2rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', justifyContent: 'space-between' }}
                footerContent={
                    <>
                        <button onClick={() => { handleDeleteMessage(viewingMessage?.id); setViewingMessage(null); }} className={styles.deleteBtn} style={{ padding: '0.6rem 1.25rem', margin: 0, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <Trash2 size={16} /> Delete
                        </button>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button onClick={() => handleToggleMessageRead(viewingMessage?.id, viewingMessage?.isRead)} className={styles.iconBtn} style={{ width: 'auto', padding: '0.6rem 1rem' }}>
                                {viewingMessage?.isRead ? <><MailOpen size={18} /> Mark Unread</> : <><Mail size={18} /> Mark Read</>}
                            </button>
                            <a href={`mailto:${viewingMessage?.email}?subject=Re: Inquiry from ${encodeURIComponent(viewingMessage?.name || '')}`} className={styles.primaryBtn} style={{ margin: 0, textDecoration: 'none', padding: '0.6rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <Reply size={18} /> Reply Now
                            </a>
                        </div>
                    </>
                }
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Sender</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{viewingMessage?.name?.charAt(0)}</div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{viewingMessage?.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{viewingMessage?.email}</div>
                            </div>
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Timestamp</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                            {viewingMessage?.createdAt?.seconds ? new Date(viewingMessage.createdAt.seconds * 1000).toLocaleString() : 'Recently'}
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', minHeight: '150px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '1rem' }}>Message Body</span>
                    <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--text-primary)', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                        {viewingMessage?.message}
                    </p>
                </div>
            </BaseModal>


            {/* Confirm Dialog */}
            {confirmDialog.isOpen && (
                <ConfirmDialog
                    confirmDialog={confirmDialog}
                    setConfirmDialog={setConfirmDialog}
                />
            )}
        </div>
    );
};

export default MessagesTab;
