import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Mail, MailOpen, Trash2, X } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { sortData } from '../../../utils/sortData';
import styles from '../../Admin.module.scss';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import MessageService from '../../../services/MessageService';

const MessagesTab = ({ userRole, showToast, messages, setMessages }) => {
    const [searchMessages, setSearchMessages] = useState('');
    const [messagesPage, setMessagesPage] = useState(1);
    const [messagesPerPage, setMessagesPerPage] = useState(10);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [viewingMessage, setViewingMessage] = useState(null);
    const [msgSort, setMsgSort] = useState({ field: 'createdAt', dir: 'desc' });
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

    const handleBatchDeleteMessages = async () => {
        if (selectedMessages.length === 0) return;
        if (!window.confirm(`Delete ${selectedMessages.length} messages?`)) return;
        try {
            await MessageService.batchDeleteMessages(userRole, selectedMessages, trackDelete);
            setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id)));
            setSelectedMessages([]);
            showToast(`Deleted ${selectedMessages.length} messages.`);
        } catch (error) {
            showToast(error.message || 'Failed to delete messages.', 'error');
        }
    };

    const handleDeleteMessage = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await MessageService.deleteMessage(userRole, id, trackDelete);
            setMessages(messages.filter(m => m.id !== id));
            setSelectedMessages(prev => prev.filter(mid => mid !== id));
            if (viewingMessage && viewingMessage.id === id) setViewingMessage(null);
            showToast('Message deleted.');
        } catch (error) {
            showToast(error.message || 'Failed to delete message.', 'error');
        }
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
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: 0 }}>
                        <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <h3>
                                <Mail size={20} style={{ color: 'var(--primary-color)' }} />
                                Message Details
                            </h3>
                            <button onClick={() => setViewingMessage(null)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '60vh' }}>
                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                    <span className={styles.detailLabel}>From</span>
                                    <span className={styles.detailValue}>
                                        <span style={{ fontWeight: 'bold' }}>{viewingMessage.name}</span><br />
                                        <a href={`mailto:${viewingMessage.email}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'inline-block', marginTop: '0.2rem' }}>{viewingMessage.email}</a>
                                    </span>
                                </div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                    <span className={styles.detailLabel}>Date</span>
                                    <span className={styles.detailValue}>
                                        {viewingMessage.createdAt?.seconds ? new Date(viewingMessage.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                    </span>
                                </div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                    <span className={styles.detailLabel}>Message</span>
                                    <p className={styles.detailValue} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: 0, padding: '1rem', background: 'var(--input-bg)', borderRadius: '8px' }}>
                                        {viewingMessage.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter} style={{ justifyContent: 'space-between', marginTop: 'auto' }}>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => { handleDeleteMessage(viewingMessage.id); setViewingMessage(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <a
                                    href={`mailto:${viewingMessage.email}?subject=Re: Inquiry from ${encodeURIComponent(viewingMessage.name)}`}
                                    className={styles.submitBtn}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', background: 'transparent', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', color: 'var(--text-primary)', padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg> Reply
                                </a>
                                <button
                                    className={styles.editBtn}
                                    onClick={() => { handleToggleMessageRead(viewingMessage.id, viewingMessage.isRead); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                                >
                                    {viewingMessage.isRead ? <><MailOpen size={16} /> Mark Unread</> : <><Mail size={16} /> Mark Read</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesTab;
