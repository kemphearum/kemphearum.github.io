import React, { useState, useCallback, useMemo } from 'react';
import { Eye as EyeIcon, Users, Globe, TrendingUp, Monitor, Smartphone, Tablet, MapPin, Share2, FileText, Calendar, RefreshCw, X } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useActivity } from '../../../hooks/useActivity';
import { useQuery } from '@tanstack/react-query';
import styles from '../../Admin.module.scss';
import AnalyticsService from '../../../services/AnalyticsService';

const CHART_COLORS = ['#64ffda', '#7c4dff', '#ff6090', '#ffab40', '#69f0ae', '#40c4ff', '#ea80fc', '#ffd740', '#b388ff', '#84ffff'];

const parseBrowser = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    return 'Other';
};

const AnalyticsTab = ({ userRole, showToast }) => {
    const { trackRead } = useActivity();
    const [analyticsRange, setAnalyticsRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], preset: '30d' };
    });
    const [analyticsDetail, setAnalyticsDetail] = useState(null);
    const [analyticsLogs, setAnalyticsLogs] = useState([]);
    const [analyticsLogsLoading, setAnalyticsLogsLoading] = useState(false);
    const [analyticsLogsTotal, setAnalyticsLogsTotal] = useState(0);

    const { data: visits = [], isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
        queryKey: ['analytics', analyticsRange.start, analyticsRange.end],
        queryFn: async () => {
            return await AnalyticsService.fetchAnalytics(userRole, analyticsRange, trackRead);
        },
        enabled: (userRole === 'superadmin' || userRole === 'admin')
    });

    const handleAnalyticsDetail = useCallback(async (type) => {
        setAnalyticsDetail(type);
        setAnalyticsLogsLoading(true);
        setAnalyticsLogs([]);
        setAnalyticsLogsTotal(0);
        try {
            const result = await AnalyticsService.fetchAnalyticsDetails(userRole, analyticsRange, type, 200, trackRead);
            setAnalyticsLogsTotal(result.total);
            setAnalyticsLogs(result.logs);
        } catch (error) { console.error("Error fetching analytics details:", error); showToast("Failed to load details.", "error"); }
        finally { setAnalyticsLogsLoading(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, analyticsRange, showToast]);

    const handleAnalyticsPreset = useCallback((preset) => {
        const end = new Date();
        const start = new Date();
        switch (preset) {
            case '7d': start.setDate(end.getDate() - 7); break;
            case '30d': start.setDate(end.getDate() - 30); break;
            case '90d': start.setDate(end.getDate() - 90); break;
            case 'all': start.setFullYear(2020); break;
            default: start.setDate(end.getDate() - 30);
        }
        setAnalyticsRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], preset });
    }, []);

    // Derived data
    const dailyVisits = useMemo(() => {
        const map = {};
        visits.forEach(v => {
            const date = v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toISOString().split('T')[0] : v.date;
            if (!date) return;
            if (!map[date]) map[date] = { date, visits: 0, unique: 0, _ips: new Set() };
            map[date].visits++;
            if (v.ip && !map[date]._ips.has(v.ip)) { map[date]._ips.add(v.ip); map[date].unique++; }
        });
        return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map(({ _ips, ...rest }) => rest);
    }, [visits]);

    const countryData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const c = v.country || 'Unknown'; map[c] = (map[c] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));
    }, [visits]);

    const deviceData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const d = v.device || 'desktop'; const label = d.charAt(0).toUpperCase() + d.slice(1); map[label] = (map[label] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
    }, [visits]);

    const cityData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const c = v.city || 'Unknown'; map[c] = (map[c] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));
    }, [visits]);

    const referrerData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const r = v.referrer || 'Direct'; map[r] = (map[r] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));
    }, [visits]);

    const topPages = useMemo(() => {
        const map = {};
        visits.forEach(v => { const p = v.path || '/'; map[p] = (map[p] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([path, count]) => ({ path, count }));
    }, [visits]);

    const summaryStats = useMemo(() => {
        const uniqueIPs = new Set(visits.map(v => v.ip).filter(Boolean));
        const topCountry = countryData[0]?.name || '-';
        const topPage = topPages[0]?.path || '-';
        return { total: visits.length, unique: uniqueIPs.size, topCountry, topPage };
    }, [visits, countryData, topPages]);

    if (analyticsLoading) {
        return (
            <div className={styles.analyticsLoading}>
                <div className={styles.analyticsSpinner} />
                <span>Loading analytics data…</span>
            </div>
        );
    }

    return (
        <>
            {/* Date Range Filter */}
            <div className={styles.dateFilterBar}>
                <div className={styles.datePresets}>
                    {[{ label: '7D', value: '7d' }, { label: '30D', value: '30d' }, { label: '90D', value: '90d' }, { label: 'All', value: 'all' }].map(p => (
                        <button key={p.value} className={`${styles.presetBtn} ${analyticsRange.preset === p.value ? styles.presetActive : ''}`} onClick={() => handleAnalyticsPreset(p.value)}>{p.label}</button>
                    ))}
                </div>
                <div className={styles.dateInputs}>
                    <Calendar size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                    <input type="date" value={analyticsRange.start} onChange={(e) => setAnalyticsRange(prev => ({ ...prev, start: e.target.value, preset: '' }))} className={styles.dateInput} onClick={(e) => e.target.showPicker?.()} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>to</span>
                    <input type="date" value={analyticsRange.end} onChange={(e) => setAnalyticsRange(prev => ({ ...prev, end: e.target.value, preset: '' }))} className={styles.dateInput} onClick={(e) => e.target.showPicker?.()} />
                </div>
            </div>

            {/* Stat Summary Cards */}
            <div className={styles.analyticsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><EyeIcon size={20} /></div>
                    <div className={styles.statValue}>{summaryStats.total.toLocaleString()}</div>
                    <div className={styles.statLabel}>Total Page Views</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><Users size={20} /></div>
                    <div className={styles.statValue}>{summaryStats.unique.toLocaleString()}</div>
                    <div className={styles.statLabel}>Unique Visitors</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><Globe size={20} /></div>
                    <div className={styles.statValue} style={{ fontSize: '1.3rem' }}>{summaryStats.topCountry}</div>
                    <div className={styles.statLabel}>Top Country</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><TrendingUp size={20} /></div>
                    <div className={styles.statValue} style={{ fontSize: '1.3rem' }}>{summaryStats.topPage}</div>
                    <div className={styles.statLabel}>Most Visited Page</div>
                </div>
            </div>

            {/* Visits Over Time */}
            <div className={styles.chartCard}>
                <div className={styles.chartTitle}>
                    <TrendingUp size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                    Visits Over Time {analyticsRange.preset === '7d' ? '(Last 7 Days)' : analyticsRange.preset === '30d' ? '(Last 30 Days)' : analyticsRange.preset === '90d' ? '(Last 90 Days)' : analyticsRange.preset === 'all' ? '(All Time)' : `(${analyticsRange.start} — ${analyticsRange.end})`}
                    <button className={styles.detailBtn} onClick={() => handleAnalyticsDetail('visits')} style={{ marginLeft: 'auto' }}>View Details</button>
                    <button className={styles.analyticsRefreshBtn} onClick={() => refetchAnalytics()} disabled={analyticsLoading}><RefreshCw size={14} /> Refresh</button>
                </div>
                {dailyVisits.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={dailyVisits} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} />
                            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} />
                            <Line type="monotone" dataKey="visits" stroke="#64ffda" strokeWidth={2} dot={false} name="Page Views" />
                            <Line type="monotone" dataKey="unique" stroke="#7c4dff" strokeWidth={2} dot={false} name="Unique Visitors" />
                            <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className={styles.emptyState}><p>No visit data available yet.</p></div>
                )}
            </div>

            {/* Country Breakdown + Device Breakdown */}
            <div className={styles.chartRow}>
                <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>
                        <Globe size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                        Visitors by Country
                        <button className={styles.detailBtn} onClick={() => handleAnalyticsDetail('countries')} style={{ marginLeft: 'auto' }}>View Details</button>
                    </div>
                    {countryData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={countryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                                        {countryData.map((entry, i) => <Cell key={`country-${entry.name || i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className={styles.legendList}>
                                {countryData.map((entry, i) => (<li key={entry.name} className={styles.legendItem}><span className={styles.legendDot} style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{entry.name} ({entry.value})</li>))}
                            </ul>
                        </>
                    ) : (<div className={styles.emptyState}><p>No country data.</p></div>)}
                </div>

                <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>
                        <Monitor size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                        Device Breakdown
                        <button className={styles.detailBtn} onClick={() => handleAnalyticsDetail('devices')} style={{ marginLeft: 'auto' }}>View Details</button>
                    </div>
                    {deviceData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                                        {deviceData.map((entry, i) => <Cell key={`device-${entry.name || i}`} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className={styles.legendList}>
                                {deviceData.map((entry, i) => (<li key={entry.name} className={styles.legendItem}><span className={styles.legendDot} style={{ background: CHART_COLORS[(i + 3) % CHART_COLORS.length] }} />{entry.name === 'Desktop' ? <><Monitor size={12} /> </> : entry.name === 'Mobile' ? <><Smartphone size={12} /> </> : entry.name === 'Tablet' ? <><Tablet size={12} /> </> : null}{entry.name} ({entry.value})</li>))}
                            </ul>
                        </>
                    ) : (<div className={styles.emptyState}><p>No device data.</p></div>)}
                </div>
            </div>

            {/* City Breakdown + Traffic Sources */}
            <div className={styles.chartRow}>
                <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>
                        <MapPin size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                        Top Cities
                        <button className={styles.detailBtn} onClick={() => handleAnalyticsDetail('cities')} style={{ marginLeft: 'auto' }}>View Details</button>
                    </div>
                    {cityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={cityData.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={140} />
                                <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                <Bar dataKey="value" name="Visits" radius={[0, 6, 6, 0]}>
                                    {cityData.slice(0, 6).map((entry, i) => <Cell key={`city-${entry.name || i}`} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (<div className={styles.emptyState}><p>No city data.</p></div>)}
                </div>

                <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>
                        <Share2 size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                        Traffic Sources
                        <button className={styles.detailBtn} onClick={() => handleAnalyticsDetail('referrers')} style={{ marginLeft: 'auto' }}>View Details</button>
                    </div>
                    {referrerData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={referrerData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                                        {referrerData.map((entry, i) => <Cell key={`ref-${entry.name || i}`} fill={CHART_COLORS[(i + 5) % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className={styles.legendList}>
                                {referrerData.map((entry, i) => (<li key={entry.name} className={styles.legendItem}><span className={styles.legendDot} style={{ background: CHART_COLORS[(i + 5) % CHART_COLORS.length] }} />{entry.name} ({entry.value})</li>))}
                            </ul>
                        </>
                    ) : (<div className={styles.emptyState}><p>No referrer data.</p></div>)}
                </div>
            </div>

            {/* Top Pages */}
            <div className={styles.chartCard}>
                <div className={styles.chartTitle}>
                    <FileText size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                    Top Visited Pages
                    <button className={styles.detailBtn} onClick={() => handleAnalyticsDetail('pages')} style={{ marginLeft: 'auto' }}>View Details</button>
                </div>
                {topPages.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(200, topPages.length * 40)}>
                        <BarChart data={topPages} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                            <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                            <YAxis dataKey="path" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={120} />
                            <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                            <Bar dataKey="count" name="Page Views" radius={[0, 6, 6, 0]}>
                                {topPages.map((entry, i) => <Cell key={`page-${entry.name || i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (<div className={styles.emptyState}><p>No page data.</p></div>)}
            </div>

            {/* Analytics Detail Modal */}
            {analyticsDetail && (
                <div className={styles.modalOverlay} onClick={() => setAnalyticsDetail(null)} style={{ zIndex: 1400 }}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1100px', maxHeight: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                        <div className={styles.modalHeader} style={{ flexShrink: 0, padding: '1.5rem 2.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.4rem', color: 'var(--primary-color)' }}>
                                    {analyticsDetail === 'visits' && <><TrendingUp size={24} /> Comprehensive Visit Activity History</>}
                                    {analyticsDetail === 'countries' && <><Globe size={24} /> Audience Geographic Distribution</>}
                                    {analyticsDetail === 'devices' && <><Monitor size={24} /> Technical Device Infrastructure</>}
                                    {analyticsDetail === 'pages' && <><FileText size={24} /> Content Performance Metrics</>}
                                    {analyticsDetail === 'cities' && <><MapPin size={24} /> Regional Engagement Breakdown</>}
                                    {analyticsDetail === 'referrers' && <><Share2 size={24} /> Acquisition & Traffic Sources</>}
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Detailed insights based on {analyticsLogsTotal || analyticsLogs.length} tracked interactions
                                </p>
                            </div>
                            <button onClick={() => setAnalyticsDetail(null)} className={styles.closeBtn} style={{ position: 'absolute', top: '50%', right: '2rem', transform: 'translateY(-50%)' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '0', overflowY: 'auto', flex: 1, position: 'relative' }}>
                            {analyticsLogsLoading ? (
                                <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 1.5rem' }}>
                                        <RefreshCw size={60} className={styles.spin} style={{ opacity: 0.1 }} />
                                        <RefreshCw size={30} className={styles.spin} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--primary-color)' }} />
                                    </div>
                                    <p style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Aggregating Analytics Data...</p>
                                </div>
                            ) : analyticsDetail === 'visits' && (
                                <div style={{ padding: '1.5rem 2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            Retrieved {analyticsLogs.length} recent sessions
                                        </span>
                                    </div>
                                    <div className={styles.tableWrapper} style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.85rem' }}>
                                            <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <tr>
                                                    <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>#</th>
                                                    <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Page Path</th>
                                                    <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Region</th>
                                                    <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Platform</th>
                                                    <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>IP Address</th>
                                                    <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>Date & Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analyticsLogs.length > 0 ? analyticsLogs.map((v, i) => (
                                                    <tr key={`visitor-${v.id || i}`} style={{ transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', color: 'var(--text-secondary)' }}>{i + 1}</td>
                                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: 600 }}>{v.path || '/'}</td>
                                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                            {v.countryCode ? <span title={v.country} style={{ fontWeight: 500 }}>{v.countryCode} {v.city ? <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>• {v.city}</span> : ''}</span> : (v.country || 'Unknown')}
                                                        </td>
                                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{v.device || 'Desktop'}</span>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{parseBrowser(v.userAgent)}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem', fontFamily: 'monospace', opacity: 0.7 }}>{v.ip || '-'}</td>
                                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
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
                            )}
                            {/* Breakdown detail tables */}
                            {['countries', 'devices', 'pages', 'cities', 'referrers'].includes(analyticsDetail) && !analyticsLogsLoading && (
                                <div style={{ padding: '2.5rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.015)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                                                Metrics Distribution Report
                                            </h4>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                                Analysis of {analyticsLogs.length} snapshots
                                            </span>
                                        </div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
                                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        {analyticsDetail === 'countries' ? 'Country Grouping' : analyticsDetail === 'devices' ? 'Device Profile' : analyticsDetail === 'pages' ? 'Content Identifier (URL)' : analyticsDetail === 'cities' ? 'Geographic Location' : 'Visitor Origin Header'}
                                                    </th>
                                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>Events</th>
                                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>Volume Share</th>
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
                                                                <td style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                                                                    {analyticsDetail === 'referrers' && name === 'Direct' ? 'Direct Navigation / Bookmarked' : name}
                                                                </td>
                                                                <td style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                                                                    <span style={{ display: 'inline-block', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontWeight: 800 }}>{count.toLocaleString()}</span>
                                                                </td>
                                                                <td style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'right' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                                                        <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{((count / total) * 100).toFixed(1)}%</span>
                                                                        <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
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
                            )}
                        </div>
                        <div className={styles.modalFooter} style={{ flexShrink: 0, padding: '1.5rem 2.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setAnalyticsDetail(null)} className={styles.primaryBtn} style={{ padding: '0.75rem 2.5rem', margin: 0, fontSize: '0.95rem' }}>Close Analytics Report</button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default AnalyticsTab;
