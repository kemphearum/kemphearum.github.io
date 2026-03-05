import React, { useState, useCallback, useMemo } from 'react';
import { Search, Mail, MailOpen, Trash2, X, Reply } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { sortData } from '../../../utils/sortData';
import styles from '../../Admin.module.scss';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import MessageService from '../../../services/MessageService';
import ConfirmDialog from '../components/ConfirmDialog';

const MessagesTab = ({ userRole, showToast, messages, setMessages }) => {
    const [searchMessages, setSearchMessages] = useState('');
    const [messagesPage, setMessagesPage] = useState(1);
    const [messagesPerPage, setMessagesPerPage] = useState(10);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [viewingMessage, setViewingMessage] = useState(null);
    const [msgSort, setMsgSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const { trackRead, trackWrite, trackDelete } = useActivity();

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
        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
            <div className={styles.listSection} style={{ marginTop: '0' }}>
                <div className={styles.listSectionHeader}>
                    <h3 className={styles.listTitle}>
                        Inbox
                        {unreadMessagesCount > 0 && (
                            <span className={styles.count} style={{ background: 'linear-gradient(135deg, #6C63FF, #8B83FF)', color: '#fff', fontWeight: 'bold', marginLeft: '0.5rem', boxShadow: '0 2px 8px rgba(108, 99, 255, 0.4)' }}>
                                {unreadMessagesCount} Unread
                            </span>
                        )}
                    </h3>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className={styles.searchBox} style={{ margin: 0, flex: 1, minWidth: '250px' }}>
                        <Search size={16} className={styles.searchIcon} />
                        <input type="text" placeholder="Search by name, email, or message..." value={searchMessages} onChange={(e) => { setSearchMessages(e.target.value); setMessagesPage(1); }} />
                        {searchMessages && <span className={styles.searchResultCount}>{filteredMessages.length} of {messages.length}</span>}
                    </div>

                    {selectedMessages.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                                {selectedMessages.length} selected
                            </span>
                            <button onClick={() => handleBatchMarkMessages(true)} className={styles.editBtn} title="Mark as Read" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
                                <MailOpen size={14} /> Read
                            </button>
                            <button onClick={() => handleBatchMarkMessages(false)} className={styles.editBtn} title="Mark as Unread" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
                                <Mail size={14} /> Unread
                            </button>
                            <button onClick={handleBatchDeleteMessages} className={styles.deleteBtn} title="Delete Selected" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>

                {filteredMessages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <p>{searchMessages ? 'No matching messages found.' : 'No messages yet.'}</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.messageHeader}>
                            <input
                                type="checkbox"
                                checked={paginatedMessages.length > 0 && paginatedMessages.every(msg => selectedMessages.includes(msg.id))}
                                onChange={handleSelectAllMessages}
                                style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                                title="Select All on this page"
                            />
                            <SortableHeader label="Sender" field="name" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={toggleSort} />
                            <SortableHeader label="Email" field="email" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={toggleSort} />
                            <SortableHeader label="Message" field="message" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={toggleSort} />
                            <SortableHeader label="Date" field="createdAt" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={toggleSort} />
                            <div style={{ textAlign: 'right', paddingRight: '0.5rem' }}>Actions</div>
                        </div>

                        {paginatedMessages.map((msg, index) => {
                            const isUnread = !msg.isRead;
                            const isSelected = selectedMessages.includes(msg.id);
                            return (
                                <div
                                    key={msg.id || `msg-${index}`}
                                    className={`${styles.messageGrid} ${isUnread ? styles.unread : ''} ${isSelected ? styles.selected : ''}`}
                                    onClick={(e) => {
                                        if (e.target.type !== 'checkbox' && !e.target.closest('button')) {
                                            handleViewMessage(msg);
                                        }
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelectMessage(msg.id)}
                                        style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                                    />
                                    <div className={`${styles.messageCell} ${styles.primary} ${isUnread ? styles.unread : ''}`}>
                                        {msg.name}
                                    </div>
                                    <div className={styles.messageCell}>{msg.email}</div>
                                    <div className={`${styles.messageCell} ${isUnread ? styles.unread : ''}`} title={msg.message}>
                                        {msg.message}
                                    </div>
                                    <div className={styles.messageCell} style={{ fontSize: '0.8rem', color: isUnread ? 'var(--primary-color)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </div>
                                    <div className={styles.messageActions}>
                                        <button onClick={(e) => { e.stopPropagation(); handleToggleMessageRead(msg.id, msg.isRead); }} className={styles.editBtn} title={msg.isRead ? "Mark as Unread" : "Mark as Read"} style={{ padding: '0.3rem' }}>
                                            {msg.isRead ? <MailOpen size={15} /> : <Mail size={15} />}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }} className={styles.deleteBtn} title="Delete" style={{ padding: '0.3rem' }}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <Pagination currentPage={messagesPage} totalPages={messagesTotalPages} onPageChange={setMessagesPage} perPage={messagesPerPage} onPerPageChange={(v) => { setMessagesPerPage(v); setMessagesPage(1); }} totalItems={filteredMessages.length} />
                    </>
                )}
            </div>

            {/* Message View Modal */}
            {viewingMessage && (
                <div className={styles.modalOverlay} onClick={() => setViewingMessage(null)} style={{ zIndex: 1200 }}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', borderRadius: '20px' }}>
                        <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem 2rem' }}>
                            <h3 style={{ fontSize: '1.3rem' }}><Mail size={22} style={{ color: 'var(--primary-color)' }} /> Message Details</h3>
                            <button onClick={() => setViewingMessage(null)} className={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: '75vh' }}>
                            <div className={styles.detailGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                    <span className={styles.detailLabel}>Sender Information</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.6rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                            {viewingMessage.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' }}>{viewingMessage.name}</span>
                                            <a href={`mailto:${viewingMessage.email}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>{viewingMessage.email}</a>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Received Date</span>
                                    <span className={styles.detailValue} style={{ fontSize: '0.95rem' }}>{viewingMessage.createdAt?.seconds ? new Date(viewingMessage.createdAt.seconds * 1000).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : 'Recently'}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Status</span>
                                    <span className={`${styles.roleBadge} ${viewingMessage.isRead ? styles.roleAdmin : styles.rolePending}`} style={{ marginTop: '0.4rem' }}>{viewingMessage.isRead ? '✓ Read' : '✉ Unread'}</span>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.015)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' }}>
                                <span className={styles.detailLabel} style={{ marginBottom: '1rem', display: 'block' }}>Message Content</span>
                                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                    {viewingMessage.message}
                                </p>
                            </div>
                        </div>
                        <div className={styles.modalFooter} style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', justifyContent: 'space-between' }}>
                            <button className={styles.deleteBtn} onClick={() => { handleDeleteMessage(viewingMessage.id); setViewingMessage(null); }} style={{ padding: '0.6rem 1.25rem' }}>
                                <Trash2 size={16} /> Delete Message
                            </button>
                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <button className={styles.editBtn} onClick={() => { handleToggleMessageRead(viewingMessage.id, viewingMessage.isRead); }} style={{ padding: '0.6rem 1rem' }}>
                                    {viewingMessage.isRead ? <><MailOpen size={18} /> Mark Unread</> : <><Mail size={18} /> Mark Read</>}
                                </button>
                                <a href={`mailto:${viewingMessage.email}?subject=Re: Inquiry from ${encodeURIComponent(viewingMessage.name)}`} className={styles.primaryBtn} style={{ margin: 0, textDecoration: 'none', padding: '0.6rem 1.5rem' }}>
                                    <Reply size={18} style={{ marginRight: '6px' }} /> Reply
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}


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
