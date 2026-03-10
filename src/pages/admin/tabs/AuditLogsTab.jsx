import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AuditLogService from '../../../services/AuditLogService';
import { Activity, Search, Filter, Download, Trash2, Eye, Shield, UserX, Clock, MapPin, Monitor, Globe, Edit2, AlertCircle, RefreshCw, BarChart2, ShieldAlert, CheckCircle2, ChevronRight, X, Smartphone, Tablet, Mail, Key } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { useQuery } from '@tanstack/react-query';
import { sortData } from '../../../utils/sortData';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import styles from '../../Admin.module.scss';
import BaseModal from '../components/BaseModal';
import SectionHeader from '../components/SectionHeader';
import UsageBar from '../components/UsageBar';
import FormSelect from '../components/FormSelect';

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
    const [expandedLogId, setExpandedLogId] = useState(null);

    // Audit State
    const [selectedAuditLog, setSelectedAuditLog] = useState(null);
    const [searchUsers, setSearchUsers] = useState('');
    const [auditDateRange, setAuditDateRange] = useState('all');
    const [auditPage, setAuditPage] = useState(1);
    const [auditPerPage, setAuditPerPage] = useState(10);
    const [auditSort, setAuditSort] = useState({ field: 'timestamp', dir: 'desc' });



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
            setExpandedLogId(null);
        } catch (error) { console.error(`Error fetching ${type} details:`, error); showToast(`Failed to load activity logs: ${error.message}`, 'error'); }
        finally { setActivityLogsLoading(false); }
    }, [activityDateRange, currentDateKey, showToast]);

    // Fetch audit logs
    const { data: auditLogsList = [], isLoading: auditLogsLoading } = useQuery({
        queryKey: ['auditLogs', userRole],
        queryFn: async () => {
            if (userRole !== 'superadmin') return [];
            const data = await AuditLogService.fetchSecurityAuditTrail(userRole, trackRead);
            return data;
        },
        enabled: userRole === 'superadmin'
    });

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
            <SectionHeader
                title="Activity & Audit Logs"
                description="Track administrative actions, security events, and real-time database usage."
                icon={Activity}
                rightElement={
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.35rem 0.75rem' }}>
                            <Filter size={14} style={{ opacity: 0.6 }} />
                            <FormSelect
                                noWrapper
                                value={activityDateRange}
                                onChange={(e) => setActivityDateRange(e.target.value)}
                                options={[
                                    { value: 'today', label: 'Today' },
                                    { value: '7d', label: 'Last 7 Days' },
                                    { value: '30d', label: 'Last 30 Days' },
                                    { value: 'all', label: 'All Time' }
                                ]}
                                style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', width: 'auto' }}
                            />
                        </div>
                        <button onClick={async () => { setIsRefreshingActivity(true); try { await refreshActivity(); showToast('Activity data refreshed!', 'success'); } catch { showToast('Failed to refresh activity', 'error'); } finally { setIsRefreshingActivity(false); } }} className={styles.iconBtn} title="Refresh Stats" disabled={isRefreshingActivity} style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)', width: '36px', height: '36px', color: 'var(--text-primary)', padding: 0 }}>
                            <RefreshCw size={16} className={isRefreshingActivity ? styles.spin : ''} style={{ color: 'var(--primary-color)' }} />
                        </button>
                    </div>
                }
            />

            {/* ========== ESTIMATED ACTIVITY CARDS ========== */}
            <div style={{ marginBottom: '3rem' }}>
                <div className={styles.analyticsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {/* READS Card */}
                    <div className={`${styles.statCard} ${styles.activityDetailCard} ${aggregatedUsage.reads > 40000 ? styles.highUsage : ''}`} onClick={() => handleActivityDetail('reads')} style={{ borderTop: 'none', borderLeft: '3px solid #38bdf8', padding: '1.25rem' }}>
                        <UsageBar
                            label="READ OPERATIONS"
                            current={isAggregating ? 0 : ((aggregatedUsage.reads || 0) + (activityDateRange === 'today' ? pendingRef.current.reads : 0))}
                            total={SOFT_DOC_LIMIT}
                            hint="View Details →"
                            style={{ margin: 0 }}
                        />
                    </div>

                    {/* WRITES Card */}
                    <div className={`${styles.statCard} ${styles.activityDetailCard} ${aggregatedUsage.writes > 15000 ? styles.highUsage : ''}`} onClick={() => handleActivityDetail('writes')} style={{ borderTop: 'none', borderLeft: '3px solid #a78bfa', padding: '1.25rem' }}>
                        <UsageBar
                            label="WRITE OPERATIONS"
                            current={isAggregating ? 0 : ((aggregatedUsage.writes || 0) + (activityDateRange === 'today' ? pendingRef.current.writes : 0))}
                            total={20000}
                            hint="View Details →"
                            style={{ margin: 0 }}
                        />
                    </div>

                    {/* DELETES Card */}
                    <div className={`${styles.statCard} ${styles.activityDetailCard} ${aggregatedUsage.deletes > 15000 ? styles.highUsage : ''}`} onClick={() => handleActivityDetail('deletes')} style={{ borderTop: 'none', borderLeft: '3px solid #fb923c', padding: '1.25rem' }}>
                        <UsageBar
                            label="DELETE OPERATIONS"
                            current={isAggregating ? 0 : ((aggregatedUsage.deletes || 0) + (activityDateRange === 'today' ? pendingRef.current.deletes : 0))}
                            total={20000}
                            hint="View Details →"
                            style={{ margin: 0 }}
                        />
                    </div>
                </div>
            </div>

            {/* ========== LOGIN AUDIT TRAIL ========== */}
            <div style={{ marginTop: '3rem' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} /> Login Audit Trail
                </h4>

                {userRole !== 'superadmin' ? (
                    <div className={styles.emptyState}>Only Super Admins can view audit logs.</div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                            <div className={styles.searchBox} style={{ margin: 0, flex: 1 }}>
                                <Search size={16} className={styles.searchIcon} />
                                <input type="text" placeholder="Search by email or IP..." value={searchUsers} onChange={(e) => { setSearchUsers(e.target.value); setAuditPage(1); }} />
                                {searchUsers && <span className={styles.searchResultCount}>{filteredAuditLogs.length} of {auditLogsList.length}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.35rem 0.75rem' }}>
                                    <Filter size={14} style={{ opacity: 0.6 }} />
                                    <FormSelect
                                        noWrapper
                                        value={auditDateRange}
                                        onChange={(e) => { setAuditDateRange(e.target.value); setAuditPage(1); }}
                                        options={[
                                            { value: 'all', label: 'All Time' },
                                            { value: 'today', label: 'Today' },
                                            { value: '7d', label: 'Last 7 Days' },
                                            { value: '30d', label: 'Last 30 Days' }
                                        ]}
                                        style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', width: 'auto' }}
                                    />
                                </div>
                                <button onClick={() => {
                                    const csvContent = "data:text/csv;charset=utf-8,"
                                        + "Email,IP Address,Device,User Agent,Country,City,Timestamp\n"
                                        + filteredAuditLogs.map(log => {
                                            const tz = log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Unknown';
                                            return `"${log.email || ''}","${log.ipAddress || ''}","${log.deviceType || ''}","${log.userAgent || ''}","${log.country || ''}","${log.city || ''}","${tz}"`;
                                        }).join("\n");
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }} className={styles.iconBtn} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem' }} title="Export as CSV">
                                    <Download size={14} /> Export
                                </button>
                            </div>
                        </div>

                        {filteredAuditLogs.length === 0 ? (
                            <div className={styles.emptyState}>{searchUsers ? 'No matching logs found.' : 'No audit logs recorded yet.'}</div>
                        ) : (
                            <>
                                <div className={styles.auditHeader}>
                                    <SortableHeader label="User Email" field="email" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                    <SortableHeader label="IP Address" field="ipAddress" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                    <SortableHeader label="Device" field="deviceType" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                    <SortableHeader label="User Agent" field="userAgent" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                    <SortableHeader label="Timestamp" field="timestamp" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                </div>
                                {paginatedAuditLogs.map((log, index) => (
                                    <div key={log.id || `audit-${index}`} onClick={() => setSelectedAuditLog(log)} className={`${styles.auditGrid} ${styles.userGridRowHover}`}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--primary-color)', fontWeight: 500 }}>{log.email}</div>
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
            </div>

            {/* Audit Details Modal */}
            <BaseModal
                isOpen={!!selectedAuditLog}
                onClose={() => setSelectedAuditLog(null)}
                zIndex={1100}
                maxWidth="600px"
                contentStyle={{ padding: 0, animation: 'modalFadeIn 0.25s ease forwards' }}
                headerStyle={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 1.5rem', background: 'rgba(100, 255, 218, 0.03)' }}
                headerContent={
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color, #64ffda)', margin: 0 }}>
                        <Shield size={20} /> Audit Log Details
                    </h3>
                }
                bodyStyle={{ padding: '1.5rem' }}
                footerStyle={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'flex-end' }}
                footerContent={
                    <button onClick={() => setSelectedAuditLog(null)} className={styles.closeBtnFooter}>Close</button>
                }
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {[
                        { label: 'User Email', value: selectedAuditLog?.email, icon: <Mail size={14} />, color: '#38bdf8', span: false },
                        { label: 'IP Address', value: selectedAuditLog?.ipAddress, icon: <Globe size={14} />, color: '#a78bfa', span: false },
                        { label: 'Device', value: selectedAuditLog?.deviceType || 'Unknown', icon: <Monitor size={14} />, color: '#fb923c', span: false },
                        { label: 'Country', value: selectedAuditLog?.country || 'Unknown', icon: <Globe size={14} />, color: '#34d399', span: false },
                        { label: 'City', value: selectedAuditLog?.city || 'Unknown', icon: <MapPin size={14} />, color: '#f472b6', span: false },
                        { label: 'Session ID', value: selectedAuditLog?.sessionId || 'Unknown', icon: <Key size={14} />, color: '#fbbf24', span: false },
                        { label: 'Timestamp', value: selectedAuditLog?.timestamp?.seconds ? new Date(selectedAuditLog.timestamp.seconds * 1000).toLocaleString() : 'Unknown', icon: <Clock size={14} />, color: '#64ffda', span: true },
                        { label: 'User Agent', value: selectedAuditLog?.userAgent || 'Unknown', icon: <Monitor size={14} />, color: '#94a3b8', span: true },
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
            </BaseModal>

            {/* Activity Logs Detail Modal Overlay */}
            <BaseModal
                isOpen={!!activityDetailType}
                onClose={() => setActivityDetailType(null)}
                zIndex={1200}
                maxWidth="750px"
                maxHeight="85vh"
                contentStyle={{ borderRadius: '20px', display: 'flex', flexDirection: 'column', padding: 0 }}
                headerStyle={{ flexShrink: 0, padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                headerContent={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: activityDetailType === 'reads' ? '#38bdf8' : activityDetailType === 'writes' ? '#6366f1' : '#ef4444' }}>
                            {activityDetailType === 'reads' ? <Eye size={16} strokeWidth={2.5} /> : activityDetailType === 'writes' ? <Edit2 size={16} strokeWidth={2.5} /> : <Trash2 size={16} strokeWidth={2.5} />}
                            {activityDetailType ? activityDetailType.charAt(0).toUpperCase() + activityDetailType.slice(1) : ''} Audit History
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Activity reports for {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
                        </p>
                    </div>
                }
                bodyStyle={{ padding: '0', overflowY: 'auto', flex: 1, background: 'rgba(0,0,0,0.1)' }}
                footerStyle={{ flexShrink: 0, padding: '0.75rem 1.5rem', background: 'var(--bg-tertiary, rgba(255,255,255,0.03))', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                footerContent={
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-tertiary, rgba(255,255,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart2 size={14} /></div>
                            Total cumulative tracked:
                            <strong style={{ color: 'var(--primary-color)', marginLeft: '0.2rem', fontSize: '1.1rem' }}>
                                {activityLogs.reduce((acc, log) => acc + (log.count || 1), 0).toLocaleString()}
                            </strong>
                        </div>
                        <button onClick={() => setActivityDetailType(null)} className={styles.primaryBtn} style={{ padding: '0.6rem 2rem', margin: 0 }}>Dismiss</button>
                    </>
                }
            >
                {activityLogsLoading ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                        <RefreshCw size={32} className={styles.spin} style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
                        <p style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Synchronizing Logs...</p>
                    </div>
                ) : activityLogs.length === 0 ? (
                    <div className={styles.emptyState} style={{ padding: '5rem 2rem', textAlign: 'center', opacity: 0.6 }}>
                        <Activity size={48} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }} />
                        No {activityDetailType} records found for today's session.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.88rem', tableLayout: 'auto', minWidth: '600px' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary, rgba(30, 41, 59, 0.95))', backdropFilter: 'blur(8px)', zIndex: 10 }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 800, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>Operation & Target</th>
                                    <th style={{ textAlign: 'center', padding: '1.25rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 800, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>Count</th>
                                    <th style={{ textAlign: 'left', padding: '1.25rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 800, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>Originator</th>
                                    <th style={{ textAlign: 'right', padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 800, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityLogs.map((log, i) => {
                                    const isAnon = !log.user || log.user === 'Anonymous';
                                    const logId = log.id || i;
                                    const isExpanded = expandedLogId === logId;
                                    const hasDetails = log.details && Object.keys(log.details).length > 0;

                                    return (
                                        <React.Fragment key={`log-${logId}`}>
                                            <tr
                                                style={{
                                                    transition: 'all 0.2s ease',
                                                    cursor: hasDetails ? 'pointer' : 'default',
                                                    background: isExpanded ? 'var(--bg-tertiary, rgba(255,255,255,0.05))' : 'transparent'
                                                }}
                                                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--bg-hover, rgba(255,255,255,0.03))'; }}
                                                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                                                onClick={() => hasDetails && setExpandedLogId(isExpanded ? null : logId)}
                                            >
                                                <td style={{ width: '40%', padding: '1rem 1.5rem', color: 'var(--text-primary)', borderBottom: isExpanded ? 'none' : '1px solid var(--border-color, rgba(255,255,255,0.02))' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                                            {hasDetails && (
                                                                <ChevronRight size={14} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                                                            )}
                                                        </div>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: activityDetailType === 'reads' ? 'rgba(56, 189, 248, 0.1)' : activityDetailType === 'writes' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activityDetailType === 'reads' ? '#38bdf8' : activityDetailType === 'writes' ? '#6366f1' : '#ef4444', flexShrink: 0 }}>
                                                            {activityDetailType === 'reads' ? <Eye size={14} /> : activityDetailType === 'writes' ? <Edit2 size={14} /> : <Trash2 size={14} />}
                                                        </div>
                                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-word', minWidth: '120px' }}>{log.label || log.type || '-'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ width: '12%', padding: '1rem 0.5rem', textAlign: 'center', borderBottom: isExpanded ? 'none' : '1px solid var(--border-color, rgba(255,255,255,0.02))' }}>
                                                    <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary, rgba(255,255,255,0.04))', border: '1px solid var(--border-color, rgba(255,255,255,0.06))', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                                                        {log.count || 1}
                                                    </span>
                                                </td>
                                                <td style={{ width: '28%', padding: '1rem 0.5rem', color: 'var(--text-secondary)', borderBottom: isExpanded ? 'none' : '1px solid var(--border-color, rgba(255,255,255,0.02))', wordBreak: 'break-all' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAnon ? '#64748b' : '#10b981', flexShrink: 0 }}></div>
                                                        <span style={{ fontWeight: isAnon ? 500 : 700, color: isAnon ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '0.8rem', minWidth: '100px', display: 'inline-block' }}>{log.user || 'Anonymous'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ width: '20%', padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: isExpanded ? 'none' : '1px solid var(--border-color, rgba(255,255,255,0.02))', whiteSpace: 'nowrap' }}>
                                                    {log.time?.seconds ? new Date(log.time.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '-'}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="4" style={{ padding: '0 1.5rem 1.25rem 3.5rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.02))', background: 'var(--bg-tertiary, rgba(255,255,255,0.05))' }}>
                                                        <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.2))', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Event Payload</div>
                                                            <pre style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto' }}>
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </BaseModal>


        </div>
    );
};

export default AuditLogsTab;
