import React, { useState, useMemo } from 'react';
import { X, Clock, History, AlertCircle, ChevronDown, ChevronRight, PlusCircle, MinusCircle, Edit3 } from 'lucide-react';
import styles from '../../Admin.module.scss';
import { useQuery } from '@tanstack/react-query';
import { diffWordsWithSpace } from 'diff';
import BaseModal from './BaseModal';

const HistoryModal = ({ isOpen, onClose, recordId, service, title }) => {
    const [expandedLogId, setExpandedLogId] = useState(null);

    const { data: history = [], isLoading, error } = useQuery({
        queryKey: ['history', service.collectionName, recordId],
        queryFn: () => service.getHistory(recordId),
        enabled: isOpen && !!recordId && !!service
    });

    // Calculate diffs between a current state and a previous state
    const calculateDiff = (current, previous) => {
        if (!current && !previous) return [];
        if (!previous) return Object.keys(current || {}).map(key => ({ key, type: 'added', newValue: current[key] }));
        if (!current) return Object.keys(previous || {}).map(key => ({ key, type: 'removed', oldValue: previous[key] }));

        const allKeys = new Set([...Object.keys(current), ...Object.keys(previous)]);
        const diffs = [];

        allKeys.forEach(key => {
            const val1 = previous[key];
            const val2 = current[key];

            // Basic deep equality check for arrays/objects
            const isEq = JSON.stringify(val1) === JSON.stringify(val2);

            if (!isEq) {
                if (val1 === undefined) diffs.push({ key, type: 'added', newValue: val2 });
                else if (val2 === undefined) diffs.push({ key, type: 'removed', oldValue: val1 });
                else diffs.push({ key, type: 'changed', oldValue: val1, newValue: val2 });
            }
        });

        return diffs;
    };

    const enhancedHistory = useMemo(() => {
        if (!history || history.length === 0) return [];
        // History is sorted desc (newest first).
        // To diff properly, we compare entry[n] with entry[n+1] (the older one).
        return history.map((entry, index) => {
            const olderEntry = history[index + 1];
            const diffs = calculateDiff(entry.dataPayload, olderEntry?.dataPayload);
            return { ...entry, diffs };
        });
    }, [history]);

    if (!isOpen) return null;

    const renderDiffs = (action, diffs, payload) => {
        if (action === 'deleted') {
            return <div style={{ color: 'var(--error-color, #ef4444)', fontSize: '0.85rem' }}>Record deleted.</div>;
        }

        if (action === 'created') {
            return (
                <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontFamily: 'monospace', padding: '0.85rem 1rem', background: 'var(--input-bg)', borderRadius: '6px', border: '1px solid rgba(108, 99, 255, 0.25)', color: 'var(--text-primary)' }}>
                    <pre style={{ margin: 0, color: 'inherit', fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'inherit', wordBreak: 'inherit', overflowX: 'auto' }}>
                        {JSON.stringify(payload, null, 2)}
                    </pre>
                </div>
            );
        }

        if (!diffs || diffs.length === 0) {
            return <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No specific field changes detected.</div>;
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {diffs.map((diff, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', fontFamily: 'monospace', background: 'transparent' }}>
                        <div style={{ fontWeight: 800, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>{diff.key}</div>
                        {diff.type === 'added' && (
                            <div style={{ color: 'var(--success-color, #10b981)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <PlusCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ wordBreak: 'break-word', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>{JSON.stringify(diff.newValue)}</span>
                            </div>
                        )}
                        {diff.type === 'removed' && (
                            <div style={{ color: 'var(--error-color, #ef4444)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', textDecoration: 'line-through', opacity: 0.8 }}>
                                <MinusCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ wordBreak: 'break-word', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>{JSON.stringify(diff.oldValue)}</span>
                            </div>
                        )}
                        {diff.type === 'changed' && (
                            typeof diff.oldValue === 'string' && typeof diff.newValue === 'string' ? (
                                <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontFamily: 'monospace', padding: '0.85rem 1rem', background: 'var(--input-bg)', borderRadius: '6px', border: '1px solid rgba(108, 99, 255, 0.25)', color: 'var(--text-primary)' }}>
                                    {diffWordsWithSpace(diff.oldValue, diff.newValue).map((part, index) => {
                                        const color = part.added ? 'var(--success-color, #10b981)' : part.removed ? 'var(--error-color, #ef4444)' : 'inherit';
                                        const bg = part.added ? 'rgba(16, 185, 129, 0.15)' : part.removed ? 'rgba(239, 68, 68, 0.15)' : 'transparent';
                                        const textDecoration = part.removed ? 'line-through' : 'none';
                                        return (
                                            <span key={index} style={{ color, backgroundColor: bg, textDecoration, padding: part.added || part.removed ? '0.1rem 0.25rem' : '0', borderRadius: '4px' }}>
                                                {part.value}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--input-bg)', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid rgba(108, 99, 255, 0.25)' }}>
                                    <div style={{ color: 'var(--error-color, #ef4444)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', textDecoration: 'line-through', opacity: 0.8 }}>
                                        <MinusCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <span style={{ wordBreak: 'break-word' }}>{JSON.stringify(diff.oldValue)}</span>
                                    </div>
                                    <div style={{ color: 'var(--success-color, #10b981)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <PlusCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <span style={{ wordBreak: 'break-word' }}>{JSON.stringify(diff.newValue)}</span>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            zIndex={9999}
            maxWidth="800px"
            bodyStyle={{ padding: 0 }}
            headerContent={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                        <History size={18} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Edit History</h2>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {title || 'Record Timeline'}
                        </p>
                    </div>
                </div>
            }
            footerContent={
                <button
                    onClick={onClose}
                    style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        background: 'transparent',
                        border: '1px solid var(--divider)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--divider)';
                    }}
                >
                    Close
                </button>
            }
        >
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <div className={styles.spinner}></div>
                </div>
            ) : error ? (
                <div className={styles.emptyState} style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                    <AlertCircle size={40} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Error loading history</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error.message || 'An unknown error occurred.'}</p>
                </div>
            ) : history.length === 0 ? (
                <div className={styles.emptyState} style={{ padding: '5rem 2rem', textAlign: 'center', opacity: 0.6 }}>
                    <Clock size={48} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No History Recorded</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This record was likely created before history tracking was enabled.</p>
                </div>
            ) : (
                <div style={{ padding: '2rem' }}>
                    <div style={{ position: 'relative' }}>
                        {/* Timeline line */}
                        <div style={{ position: 'absolute', left: '23px', top: '15px', bottom: '0', width: '2px', background: 'var(--primary-color)', opacity: 0.25 }}></div>

                        {enhancedHistory.map((entry, index) => {
                            const actionColor = entry.action === 'created' ? 'var(--success-color, #10b981)' : entry.action === 'deleted' ? 'var(--error-color, #ef4444)' : 'var(--primary-color, #3b82f6)';
                            const isExpanded = expandedLogId === entry.id;

                            return (
                                <div key={entry.id || index} style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', position: 'relative' }}>
                                    {/* dot */}
                                    <div style={{ width: '48px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: actionColor, zIndex: 2, marginTop: '8.5px' }}></div>
                                    </div>

                                    <div style={{ flexGrow: 1, background: isExpanded ? 'var(--card-bg)' : 'transparent', border: isExpanded ? '1px solid rgba(108, 99, 255, 0.2)' : '1px solid transparent', borderRadius: '8px', overflow: 'hidden', transition: 'all 0.2s ease' }}>
                                        <div
                                            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'transparent' }}
                                            onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: actionColor }}>
                                                        {entry.action}
                                                    </span>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                        by <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{entry.user || 'Unknown'}</span>
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                    <Clock size={14} style={{ opacity: 0.8 }} />
                                                    {entry.timestamp?.seconds ? new Date(entry.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                                                </div>
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>
                                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(108, 99, 255, 0.15)', background: 'var(--bg-color)' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Edit3 size={14} /> {entry.action === 'created' ? 'Initial Payload' : 'Changes Made'}
                                                </div>
                                                <div>
                                                    {renderDiffs(entry.action, entry.diffs, entry.dataPayload)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </BaseModal>
    );
};

export default HistoryModal;
