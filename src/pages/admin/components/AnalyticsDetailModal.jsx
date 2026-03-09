import React from 'react';
import { TrendingUp, Globe, Monitor, FileText, MapPin, Share2, RefreshCw } from 'lucide-react';
import styles from '../../Admin.module.scss';
import BaseModal from './BaseModal';

const parseBrowser = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    return 'Other';
};

const AnalyticsDetailModal = ({
    analyticsDetail,
    setAnalyticsDetail,
    analyticsLogsLoading,
    analyticsLogs = [],
    analyticsLogsTotal,
}) => {
    if (!analyticsDetail) return null;

    const onClose = () => setAnalyticsDetail(null);

    return (
        <BaseModal
            isOpen={!!analyticsDetail}
            onClose={onClose}
            zIndex={1400}
            maxWidth="850px"
            bodyStyle={{ padding: 0 }}
            headerStyle={{
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}
            headerContent={
                <>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-color)' }}>
                        {analyticsDetail === 'visits' && <><TrendingUp size={24} /> Comprehensive Visit Activity History</>}
                        {analyticsDetail === 'countries' && <><Globe size={24} /> Audience Geographic Distribution</>}
                        {analyticsDetail === 'devices' && <><Monitor size={24} /> Technical Device Infrastructure</>}
                        {analyticsDetail === 'pages' && <><FileText size={24} /> Content Performance Metrics</>}
                        {analyticsDetail === 'cities' && <><MapPin size={24} /> Regional Engagement Breakdown</>}
                        {analyticsDetail === 'referrers' && <><Share2 size={24} /> Acquisition & Traffic Sources</>}
                    </h3>
                    <p>
                        Detailed insights based on {analyticsLogsTotal || analyticsLogs.length} tracked interactions
                    </p>
                </>
            }
            footerContent={
                <button onClick={onClose} className={styles.primaryBtn} style={{ padding: '0.6rem 1.5rem', margin: 0, fontSize: '0.85rem' }}>Close</button>
            }
        >
            <div style={{ position: 'relative' }}>
                {analyticsLogsLoading ? (
                    <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 1.5rem' }}>
                            <RefreshCw size={60} className={styles.spin} style={{ opacity: 0.1 }} />
                            <RefreshCw size={30} className={styles.spin} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--primary-color)' }} />
                        </div>
                        <p className={styles.hint} style={{ letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>Aggregating Analytics Data...</p>
                    </div>
                ) : analyticsDetail === 'visits' ? (
                    <div style={{ padding: '1.5rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                Retrieved {analyticsLogs.length} recent sessions
                            </span>
                        </div>
                        <div className={styles.tableWrapper} style={{ borderRadius: '16px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '700px' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <tr>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>#</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Page Path</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Region</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Platform</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>IP Address</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsLogs.length > 0 ? analyticsLogs.map((v, i) => (
                                        <tr key={`visitor-${v.id || i}`} style={{ transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', color: 'var(--text-secondary)' }}>{i + 1}</td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: 600 }}>{v.path || '/'}</td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                {v.countryCode ? <span title={v.country} style={{ fontWeight: 500 }}>{v.countryCode} {v.city ? <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>• {v.city}</span> : ''}</span> : (v.country || 'Unknown')}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{v.device || 'Desktop'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{parseBrowser(v.userAgent)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem', fontFamily: 'monospace', opacity: 0.7 }}>{v.ip || '-'}</td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                {v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : v.date || '-'}
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No visit data for this range.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {analyticsLogsTotal > analyticsLogs.length && (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    Showing the most recent {analyticsLogs.length} of {analyticsLogsTotal} sessions.
                                </p>
                            </div>
                        )}
                    </div>
                ) : ['countries', 'devices', 'pages', 'cities', 'referrers'].includes(analyticsDetail) ? (
                    <div style={{ padding: '1.5rem 1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.015)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>
                                    Metrics Distribution Report
                                </h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                    Analysis of {analyticsLogs.length} snapshots
                                </span>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
                                        <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '50%' }}>
                                            {analyticsDetail === 'countries' ? 'Country Grouping' : analyticsDetail === 'devices' ? 'Device Profile' : analyticsDetail === 'pages' ? 'Content Identifier (URL)' : analyticsDetail === 'cities' ? 'Geographic Location' : 'Visitor Origin Header'}
                                        </th>
                                        <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', opacity: 0.8, width: '20%' }}>Events</th>
                                        <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', opacity: 0.8, width: '30%' }}>Volume Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const groupMap = {};
                                        analyticsLogs.forEach(v => {
                                            let key;
                                            if (analyticsDetail === 'countries') key = v.country || 'Unknown';
                                            else if (analyticsDetail === 'devices') { const d = v.device || 'unknown'; key = d.charAt(0).toUpperCase() + d.slice(1); }
                                            else if (analyticsDetail === 'pages') key = v.path || '/';
                                            else if (analyticsDetail === 'cities') { const city = v.city || 'Unknown'; const country = v.country || ''; key = `${city}, ${country}`.replace(/, $/, ''); }
                                            else key = v.referrer || 'Direct';
                                            groupMap[key] = (groupMap[key] || 0) + 1;
                                        });
                                        const total = analyticsLogs.length || 1;
                                        return Object.entries(groupMap)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([name, count]) => (
                                                <tr key={name} style={{ transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                        {analyticsDetail === 'referrers' && name === 'Direct' ? 'Direct Navigation / Bookmarked' : name}
                                                    </td>
                                                    <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                                                        <span style={{ display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', fontWeight: 700, fontSize: '0.85rem' }}>{count.toLocaleString()}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                            <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{((count / total) * 100).toFixed(1)}%</span>
                                                            <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${(count / total) * 100}%`, height: '100%', background: 'var(--primary-color)', boxShadow: '0 0 10px var(--primary-color)' }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>
        </BaseModal>
    );
};

export default AnalyticsDetailModal;
