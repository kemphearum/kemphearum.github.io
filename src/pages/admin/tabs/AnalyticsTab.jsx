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
                    <input type="date" value={analyticsRange.start} onChange={(e) => setAnalyticsRange(prev => ({ ...prev, start: e.target.value, preset: '' }))} className={styles.dateInput} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>to</span>
                    <input type="date" value={analyticsRange.end} onChange={(e) => setAnalyticsRange(prev => ({ ...prev, end: e.target.value, preset: '' }))} className={styles.dateInput} />
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
                <div className={styles.modalBackdrop} onClick={() => setAnalyticsDetail(null)}>
                    <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.detailModalHeader}>
                            <h3>
                                {analyticsDetail === 'visits' && <><TrendingUp size={20} /> All Visits Log ({analyticsLogsTotal || analyticsLogs.length})</>}
                                {analyticsDetail === 'countries' && <><Globe size={20} /> Visitors by Country</>}
                                {analyticsDetail === 'devices' && <><Monitor size={20} /> Device Breakdown</>}
                                {analyticsDetail === 'pages' && <><FileText size={20} /> All Visited Pages</>}
                                {analyticsDetail === 'cities' && <><MapPin size={20} /> Visitors by City</>}
                                {analyticsDetail === 'referrers' && <><Share2 size={20} /> Traffic Sources</>}
                            </h3>
                            <button onClick={() => setAnalyticsDetail(null)} className={styles.closeBtn} style={{ position: 'absolute', top: '50%', right: '1.5rem', transform: 'translateY(-50%)' }}><X size={20} /></button>
                        </div>
                        <div className={styles.detailModalBody}>
                            {analyticsLogsLoading ? (
                                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <RefreshCw size={32} className={styles.spin} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>Loading detailed analytics from Firestore...</p>
                                </div>
                            ) : analyticsDetail === 'visits' && (
                                <>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Showing top {analyticsLogs.length} results from Firestore fetch.</p>
                                    <table className={styles.detailTable}>
                                        <thead><tr><th>#</th><th>Page</th><th>Country</th><th>City</th><th>Device</th><th>Browser</th><th>IP</th><th>Referrer</th><th>Session</th><th>Date & Time</th></tr></thead>
                                        <tbody>
                                            {analyticsLogs.length > 0 ? analyticsLogs.map((v, i) => (
                                                <tr key={`visitor-${v.id || i}`}>
                                                    <td>{i + 1}</td>
                                                    <td>{v.path || '/'}</td>
                                                    <td>{v.countryCode ? <span title={v.country}>{v.countryCode}</span> : (v.country || 'Unknown')}</td>
                                                    <td>{v.city || '-'}</td>
                                                    <td style={{ textTransform: 'capitalize' }}>{v.device || '-'}</td>
                                                    <td>{parseBrowser(v.userAgent)}</td>
                                                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{v.ip || '-'}</td>
                                                    <td style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.referrer}>{v.referrer || '-'}</td>
                                                    <td style={{ fontSize: '0.7rem', fontFamily: 'monospace', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.sessionId}>{v.sessionId ? v.sessionId.slice(0, 8) + '…' : '-'}</td>
                                                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toLocaleString() : v.date || '-'}</td>
                                                </tr>
                                            )) : <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No visit data for this range.</td></tr>}
                                        </tbody>
                                    </table>
                                    {analyticsLogsTotal > analyticsLogs.length && (
                                        <div style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--divider)' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Showing {analyticsLogs.length} of {analyticsLogsTotal} total visits.</p>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.6, fontStyle: 'italic' }}>For full export, please use a dedicated analytics tool.</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {/* Breakdown detail tables */}
                            {['countries', 'devices', 'pages', 'cities', 'referrers'].includes(analyticsDetail) && !analyticsLogsLoading && (
                                <div className={styles.detailCardGrid}>
                                    <div className={styles.detailCardFull}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1.25rem 1.75rem 0' }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                                                {analyticsDetail === 'countries' ? 'Country' : analyticsDetail === 'devices' ? 'Device' : analyticsDetail === 'pages' ? 'Page Popularity' : analyticsDetail === 'cities' ? 'Top Cities' : 'Traffic Sources'} Breakdown
                                            </h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Based on last {analyticsLogs.length} records</span>
                                        </div>
                                        <table className={styles.detailTable}>
                                            <thead>
                                                <tr>
                                                    <th>{analyticsDetail === 'countries' ? 'Country' : analyticsDetail === 'devices' ? 'Device Type' : analyticsDetail === 'pages' ? 'Page Path' : analyticsDetail === 'cities' ? 'City & Country' : 'Source Referrer'}</th>
                                                    <th>Visits</th>
                                                    <th>Percentage</th>
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
                                                            <tr key={name}>
                                                                <td style={{ fontWeight: '600' }}>{analyticsDetail === 'referrers' && name === 'Direct' ? 'Direct / Bookmark' : name}</td>
                                                                <td>{count}</td>
                                                                <td>{((count / total) * 100).toFixed(1)}%</td>
                                                            </tr>
                                                        ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AnalyticsTab;
