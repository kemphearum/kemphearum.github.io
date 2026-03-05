import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AuditLogService from '../../../services/AuditLogService';
import { Activity, Filter, RefreshCw, Eye, Edit2, Trash2, ChevronRight, Search, X, Shield, Mail, Globe, Monitor, Smartphone, Tablet, MapPin, Key, Clock, BarChart2 } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { sortData } from '../../../utils/sortData';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import styles from '../../Admin.module.scss';

const SOFT_DOC_LIMIT = 50000;

const AuditLogsTab = ({ userRole, showToast }) => {
    const { trackRead, dailyUsage, pendingRef, refreshActivity, currentDateKey } = useActivity();

    // Activity State
    const [activityDateRange, setActivityDateRange] = useState('today');
    const [aggregatedUsage, setAggregatedUsage] = useState({ reads: 0, writes: 0, deletes: 0 });
    const [isAggregating, setIsAggregating] = useState(false);
    const [isRefreshingActivity, setIsRefreshingActivity] = useState(false);
    const [activityDetailType, setActivityDetailType] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityLogsLoading, setActivityLogsLoading] = useState(false);

    // Audit State
    const [auditLogsList, setAuditLogsList] = useState([]);
    const [selectedAuditLog, setSelectedAuditLog] = useState(null);
    const [searchUsers, setSearchUsers] = useState('');
    const [auditDateRange, setAuditDateRange] = useState('all');
    const [auditPage, setAuditPage] = useState(1);
    const [auditPerPage, setAuditPerPage] = useState(10);
    const [auditSort, setAuditSort] = useState({ field: 'timestamp', dir: 'desc' });
    const [loading, setLoading] = useState(false);

    const handleAuditSort = useCallback((field) => {
        setAuditSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
        setAuditPage(1);
    }, []);

    // Aggregate activity data based on date range
    useEffect(() => {
        if (activityDateRange === 'today') {
            setAggregatedUsage(dailyUsage);
            return;
        }
        const fetchHistory = async () => {
            setIsAggregating(true);
            try {
                const limitVal = activityDateRange === '7d' ? 7 : (activityDateRange === '30d' ? 30 : 365);
                const history = await AuditLogService.fetchAggregatedHistory(limitVal);
                setAggregatedUsage(history);
            } catch (err) { console.error('Failed to fetch historical activity:', err); setAggregatedUsage(dailyUsage); }
            finally { setIsAggregating(false); }
        };
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activityDateRange, dailyUsage.reads, dailyUsage.writes, dailyUsage.deletes]);

    const handleActivityDetail = useCallback(async (type) => {
        setActivityDetailType(type);
        setActivityLogs([]);
        setActivityLogsLoading(true);
        try {
            const operationType = type === 'reads' ? 'read' : (type === 'writes' ? 'write' : 'delete');
            const logs = await AuditLogService.fetchActivityDetails(activityDateRange, operationType, currentDateKey);
            setActivityLogs(logs);
        } catch (error) { console.error(`Error fetching ${type} details:`, error); showToast(`Failed to load activity logs: ${error.message}`, 'error'); }
        finally { setActivityLogsLoading(false); }
    }, [activityDateRange, currentDateKey, showToast]);

    // Fetch audit logs
    const fetchAuditLogs = useCallback(async () => {
        if (userRole !== 'superadmin') return;
        try {
            setLoading(true);
            const data = await AuditLogService.fetchSecurityAuditTrail(userRole, trackRead);
            setAuditLogsList(data);
        } catch (error) { console.error("Error fetching audit logs:", error); showToast("Failed to load audit logs.", "error"); }
        finally { setLoading(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, showToast]);

    useEffect(() => { fetchAuditLogs(); }, [fetchAuditLogs]);

    const filteredAuditLogs = useMemo(() => {
        let result = auditLogsList;
        if (searchUsers) {
            const lower = searchUsers.toLowerCase();
            result = result.filter(l => (l.email && l.email.toLowerCase().includes(lower)) || (l.ipAddress && l.ipAddress.includes(lower)));
        }
        if (auditDateRange !== 'all') {
            const now = new Date();
            let cutoff = new Date();
            if (auditDateRange === 'today') cutoff.setHours(0, 0, 0, 0);
            else if (auditDateRange === '7d') cutoff.setDate(now.getDate() - 7);
            else if (auditDateRange === '30d') cutoff.setDate(now.getDate() - 30);
            result = result.filter(l => l.timestamp?.seconds && new Date(l.timestamp.seconds * 1000) >= cutoff);
        }
        return sortData(result, auditSort);
    }, [auditLogsList, searchUsers, auditDateRange, auditSort]);

    const auditTotalPages = Math.ceil(filteredAuditLogs.length / auditPerPage) || 1;
    const paginatedAuditLogs = useMemo(() => {
        const start = (auditPage - 1) * auditPerPage;
        return filteredAuditLogs.slice(start, start + auditPerPage);
    }, [filteredAuditLogs, auditPage, auditPerPage]);

    return (
        <div style={{ paddingBottom: '3rem' }}>
            {/* ========== ESTIMATED ACTIVITY CARDS ========== */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
                            <Activity size={22} className={styles.pulse} style={{ color: 'var(--primary-color)' }} /> Activity Logs
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>Manage your portfolio audit</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.35rem 0.75rem' }}>
                            <Filter size={14} style={{ opacity: 0.6 }} />
                            <select value={activityDateRange} onChange={(e) => setActivityDateRange(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
                                <option value="today">Today</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                        <button onClick={async () => { setIsRefreshingActivity(true); try { await refreshActivity(); showToast('Activity data refreshed!', 'success'); } catch { showToast('Failed to refresh activity', 'error'); } finally { setIsRefreshingActivity(false); } }} className={styles.iconBtn} title="Refresh Stats" disabled={isRefreshingActivity} style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)', width: '36px', height: '36px', color: 'var(--text-primary)', padding: 0 }}>
                            <RefreshCw size={16} className={isRefreshingActivity ? styles.spin : ''} style={{ color: 'var(--primary-color)' }} />
                        </button>
                    </div>
                </div>

                <div className={styles.analyticsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {/* READS Card */}
                    <div className={`${styles.statCard} ${styles.activityDetailCard} ${aggregatedUsage.reads > 40000 ? styles.highUsage : ''}`} onClick={() => handleActivityDetail('reads')} style={{ borderTop: 'none', borderLeft: '3px solid #38bdf8', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(56, 189, 248, 0.01) 100%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className={styles.statLabel} style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Eye size={16} /> READS</span>
                            <div style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>{((aggregatedUsage.reads / SOFT_DOC_LIMIT) * 100).toFixed(1)}%</div>
                        </div>
                        <div className={styles.statValue} style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>
                            {isAggregating ? '...' : ((aggregatedUsage.reads || 0) + (activityDateRange === 'today' ? pendingRef.current.reads : 0)).toLocaleString()}
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}> / {SOFT_DOC_LIMIT.toLocaleString()}</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
                            <div style={{ width: `${Math.min(100, (aggregatedUsage.reads / SOFT_DOC_LIMIT) * 100)}%`, height: '100%', background: '#38bdf8', boxShadow: '0 0 8px rgba(56, 189, 248, 0.4)' }} />
                        </div>
                        <span className={styles.viewDetailsLink} style={{ color: '#38bdf8' }}>View Details <ChevronRight size={14} /></span>
                    </div>

                    {/* WRITES Card */}
                    <div className={`${styles.statCard} ${styles.activityDetailCard} ${aggregatedUsage.writes > 15000 ? styles.highUsage : ''}`} onClick={() => handleActivityDetail('writes')} style={{ borderTop: 'none', borderLeft: '3px solid #a78bfa', background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.05) 0%, rgba(167, 139, 250, 0.01) 100%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className={styles.statLabel} style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Edit2 size={16} /> WRITES</span>
                            <div style={{ fontSize: '0.65rem', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>{((aggregatedUsage.writes / 20000) * 100).toFixed(1)}%</div>
                        </div>
                        <div className={styles.statValue} style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>
                            {isAggregating ? '...' : ((aggregatedUsage.writes || 0) + (activityDateRange === 'today' ? pendingRef.current.writes : 0)).toLocaleString()}
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}> / 20,000</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
                            <div style={{ width: `${Math.min(100, (aggregatedUsage.writes / 20000) * 100)}%`, height: '100%', background: '#a78bfa', boxShadow: '0 0 8px rgba(167, 139, 250, 0.4)' }} />
                        </div>
                        <span className={styles.viewDetailsLink} style={{ color: '#a78bfa' }}>View Details <ChevronRight size={14} /></span>
                    </div>

                    {/* DELETES Card */}
                    <div className={`${styles.statCard} ${styles.activityDetailCard} ${aggregatedUsage.deletes > 15000 ? styles.highUsage : ''}`} onClick={() => handleActivityDetail('deletes')} style={{ borderTop: 'none', borderLeft: '3px solid #fb923c', background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(251, 146, 60, 0.01) 100%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className={styles.statLabel} style={{ color: '#fb923c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Trash2 size={16} /> DELETES</span>
                            <div style={{ fontSize: '0.65rem', background: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>{((aggregatedUsage.deletes / 20000) * 100).toFixed(1)}%</div>
                        </div>
                        <div className={styles.statValue} style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>
                            {isAggregating ? '...' : ((aggregatedUsage.deletes || 0) + (activityDateRange === 'today' ? pendingRef.current.deletes : 0)).toLocaleString()}
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}> / 20,000</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
                            <div style={{ width: `${Math.min(100, (aggregatedUsage.deletes / 20000) * 100)}%`, height: '100%', background: '#fb923c', boxShadow: '0 0 8px rgba(251, 146, 60, 0.4)' }} />
                        </div>
                        <span className={styles.viewDetailsLink} style={{ color: '#fb923c' }}>View Details <ChevronRight size={14} /></span>
                    </div>
                </div>
            </div>

            {/* ========== LOGIN AUDIT TRAIL ========== */}
            <div className={styles.listSectionHeader} style={{ marginTop: '3rem', borderTop: '1px solid var(--divider)', paddingTop: '2rem' }}>
                <h3 className={styles.listTitle}>Login Audit Trail</h3>
            </div>

            {userRole !== 'superadmin' ? (
                <div className={styles.emptyState}>Only Super Admins can view audit logs.</div>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div className={styles.searchBox} style={{ margin: 0, flex: 1, marginRight: '1rem' }}>
                            <Search size={16} className={styles.searchIcon} />
                            <input type="text" placeholder="Search by email or IP..." value={searchUsers} onChange={(e) => { setSearchUsers(e.target.value); setAuditPage(1); }} />
                            {searchUsers && <span className={styles.searchResultCount}>{filteredAuditLogs.length} of {auditLogsList.length}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Filter size={14} /> Filter:</span>
                            <select value={auditDateRange} onChange={(e) => { setAuditDateRange(e.target.value); setAuditPage(1); }} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}>
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                            </select>
                        </div>
                    </div>

                    {filteredAuditLogs.length === 0 ? (
                        <div className={styles.emptyState}>{searchUsers ? 'No matching logs found.' : 'No audit logs recorded yet.'}</div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 1.8fr 1.2fr', gap: '0.75rem', padding: '1rem 1.5rem', background: 'var(--card-bg)', border: '1px solid var(--divider)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                <SortableHeader label="User Email" field="email" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                <SortableHeader label="IP Address" field="ipAddress" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                <SortableHeader label="Device" field="deviceType" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                <SortableHeader label="User Agent" field="userAgent" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                <SortableHeader label="Timestamp" field="timestamp" sortDirection={auditSort.dir} onSort={handleAuditSort} />
                            </div>
                            {paginatedAuditLogs.map((log, index) => (
                                <div key={log.id || `audit-${index}`} onClick={() => setSelectedAuditLog(log)} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 1.8fr 1.2fr', gap: '0.75rem', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.85rem', alignItems: 'center', transition: 'background 0.2s ease', cursor: 'pointer' }} className={styles.userGridRowHover}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--primary-color)' }}>{log.email}</div>
                                    <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{log.ipAddress}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                                        {log.deviceType === 'mobile' ? <Smartphone size={14} style={{ color: '#fb923c' }} /> : log.deviceType === 'tablet' ? <Tablet size={14} style={{ color: '#a78bfa' }} /> : <Monitor size={14} style={{ color: '#38bdf8' }} />}
                                        <span style={{ textTransform: 'capitalize' }}>{log.deviceType || 'Desktop'}</span>
                                    </div>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }} title={log.userAgent}>{log.userAgent}</div>
                                    <div style={{ color: 'var(--text-primary)' }}>{log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Unknown'}</div>
                                </div>
                            ))}
                            <Pagination currentPage={auditPage} totalPages={auditTotalPages} onPageChange={setAuditPage} perPage={auditPerPage} onPerPageChange={(v) => { setAuditPerPage(v); setAuditPage(1); }} totalItems={filteredAuditLogs.length} />
                        </>
                    )}
                </>
            )}

            {/* Audit Details Modal */}
            {selectedAuditLog && (
                <div className={styles.modalOverlay} onClick={() => setSelectedAuditLog(null)} style={{ zIndex: 1100 }}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: 0, animation: 'modalFadeIn 0.25s ease forwards' }}>
                        <div className={styles.modalHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', background: 'rgba(100, 255, 218, 0.03)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color, #64ffda)', margin: 0 }}><Shield size={20} /> Audit Log Details</h3>
                            <button onClick={() => setSelectedAuditLog(null)} className={styles.closeBtn} style={{ position: 'absolute', top: '50%', right: '1.5rem', transform: 'translateY(-50%)' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                                {[
                                    { label: 'User Email', value: selectedAuditLog.email, icon: <Mail size={14} />, color: '#38bdf8', span: false },
                                    { label: 'IP Address', value: selectedAuditLog.ipAddress, icon: <Globe size={14} />, color: '#a78bfa', span: false },
                                    { label: 'Device', value: selectedAuditLog.deviceType || 'Unknown', icon: <Monitor size={14} />, color: '#fb923c', span: false },
                                    { label: 'Country', value: selectedAuditLog.country || 'Unknown', icon: <Globe size={14} />, color: '#34d399', span: false },
                                    { label: 'City', value: selectedAuditLog.city || 'Unknown', icon: <MapPin size={14} />, color: '#f472b6', span: false },
                                    { label: 'Session ID', value: selectedAuditLog.sessionId || 'Unknown', icon: <Key size={14} />, color: '#fbbf24', span: false },
                                    { label: 'Timestamp', value: selectedAuditLog.timestamp?.seconds ? new Date(selectedAuditLog.timestamp.seconds * 1000).toLocaleString() : 'Unknown', icon: <Clock size={14} />, color: '#64ffda', span: true },
                                    { label: 'User Agent', value: selectedAuditLog.userAgent || 'Unknown', icon: <Monitor size={14} />, color: '#94a3b8', span: true },
                                ].map((item, idx) => (
                                    <div key={`detail-${item.label}-${idx}`} style={{ gridColumn: item.span ? 'span 2' : 'auto', background: 'var(--card-bg, rgba(255,255,255,0.02))', border: '1px solid var(--border-color, rgba(255,255,255,0.06))', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', transition: 'all 0.2s ease' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.color}40`; e.currentTarget.style.background = `${item.color}08`; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color, rgba(255,255,255,0.06))'; e.currentTarget.style.background = 'var(--card-bg, rgba(255,255,255,0.02))'; }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: item.color, fontWeight: 600 }}>{item.icon} {item.label}</span>
                                        <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word', lineHeight: 1.5 }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.modalFooter} style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedAuditLog(null)} className={styles.closeBtnFooter}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Detail Modal */}
            {activityDetailType && (
                <div className={styles.modalOverlay} onClick={() => setActivityDetailType(null)} style={{ zIndex: 1100 }}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '85vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
                        <div className={styles.modalHeader} style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', background: 'var(--card-bg)', display: 'block' }}>
                            <div>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 0.4rem 0', fontSize: '1.25rem', color: activityDetailType === 'reads' ? '#38bdf8' : activityDetailType === 'writes' ? '#a78bfa' : '#fb923c' }}>
                                    {activityDetailType === 'reads' ? <Eye size={22} /> : activityDetailType === 'writes' ? <Edit2 size={22} /> : <Trash2 size={22} />}
                                    {activityDetailType.charAt(0).toUpperCase() + activityDetailType.slice(1)} Activity Logs
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Detailed breakdown of all {activityDetailType} for {new Date().toISOString().split('T')[0]}
                                </p>
                            </div>
                            <button
                                onClick={() => setActivityDetailType(null)}
                                className={styles.closeBtn}
                                style={{ position: 'absolute', top: '50%', right: '1.5rem', transform: 'translateY(-50%)', zIndex: 10 }}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                            {activityLogsLoading ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                    <RefreshCw size={24} className={styles.spin} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                                    <p>Loading activity logs...</p>
                                </div>
                            ) : activityLogs.length === 0 ? (
                                <div className={styles.emptyState} style={{ padding: '4rem', textAlign: 'center' }}>No {activityDetailType} activity logs found for this period.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Operation & Target</th>
                                            <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Count</th>
                                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>User Attribution</th>
                                            <th style={{ textAlign: 'right', padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activityLogs.map((log, i) => {
                                            const isAnon = !log.user || log.user === 'Anonymous';
                                            return (
                                                <tr key={`log-${log.id || i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                                                {activityDetailType === 'reads' ? <Eye size={14} /> : activityDetailType === 'writes' ? <Edit2 size={14} /> : <Trash2 size={14} />}
                                                            </div>
                                                            <span style={{ fontWeight: 500 }}>{log.label || log.type || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                                                        <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                                            {log.count || 1}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isAnon ? '#94a3b8' : '#10b981' }}></span>
                                                            <span style={{ fontWeight: isAnon ? 400 : 500, color: isAnon ? 'var(--text-secondary)' : '#e2e8f0' }}>{log.user || 'Anonymous'}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                        {log.time?.seconds ? new Date(log.time.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className={styles.modalFooter} style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <BarChart2 size={16} />
                                Total cumulative {activityDetailType} tracked today:
                                <strong style={{ color: 'var(--text-primary)', marginLeft: '0.2rem' }}>
                                    {activityLogs.reduce((acc, log) => acc + (log.count || 1), 0).toLocaleString()}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={() => setActivityDetailType(null)} className={styles.closeBtnFooter}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogsTab;
