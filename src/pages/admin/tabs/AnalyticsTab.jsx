import React, { useState, useCallback, useMemo } from 'react';
import { Eye as EyeIcon, Users, Globe, TrendingUp, Monitor, Smartphone, Tablet, MapPin, Share2, FileText, Calendar, RefreshCw, X, Download, Layout, Activity, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { jsonToCsv } from '../../../utils/csvUtils';
import { useActivity } from '../../../hooks/useActivity';
import { useQuery } from '@tanstack/react-query';
import styles from '../../Admin.module.scss';
import AnalyticsService from '../../../services/AnalyticsService';
import AnalyticsDetailModal from '../components/AnalyticsDetailModal';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';

const CHART_COLORS = ['#64ffda', '#7c4dff', '#ff6090', '#ffab40', '#69f0ae', '#40c4ff', '#ea80fc', '#ffd740', '#b388ff', '#84ffff'];

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

    const {
        data: visits = [],
        isLoading: analyticsLoading,
        isFetching: analyticsFetching,
        refetch: refetchAnalytics,
        dataUpdatedAt
    } = useQuery({
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

    const handleRefreshAll = useCallback(async () => {
        try {
            await refetchAnalytics();
            if (analyticsDetail) {
                await handleAnalyticsDetail(analyticsDetail);
            }
            showToast('Analytics data refreshed!', 'success');
        } catch (error) {
            console.error("Refresh Error:", error);
            showToast('Failed to refresh analytics.', 'error');
        }
    }, [refetchAnalytics, analyticsDetail, handleAnalyticsDetail, showToast]);

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

    const handleExportCsv = useCallback(() => {
        if (!visits || !visits.length) {
            showToast('No data to export', 'error');
            return;
        }

        const exportData = visits.map(v => ({
            Date: v.date || (v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toISOString().split('T')[0] : 'Unknown'),
            Path: v.path,
            IP: v.ip,
            Country: v.country,
            City: v.city,
            Device: v.device,
            Browser: v.browser || 'Unknown',
            OS: v.os || 'Unknown',
            Type: v.isReturning ? 'Returning' : 'New',
            Duration: v.duration ? `${v.duration}s` : '0s',
            Referrer: v.referrer
        }));

        const csv = jsonToCsv(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `portfolio_analytics_${analyticsRange.start}_to_${analyticsRange.end}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Analytics exported to CSV', 'success');
    }, [visits, analyticsRange, showToast]);

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

    const browserData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const b = v.browser || 'Unknown'; map[b] = (map[b] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
    }, [visits]);

    const osData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const o = v.os || 'Unknown'; map[o] = (map[o] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
    }, [visits]);

    const retentionData = useMemo(() => {
        let n = 0, r = 0;
        visits.forEach(v => { if (v.isReturning) r++; else n++; });
        return [{ name: 'New', value: n }, { name: 'Returning', value: r }];
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
        
        // Engagement Calculations
        const totalDuration = visits.reduce((acc, v) => acc + (v.duration || 0), 0);
        const avgDuration = visits.length ? Math.round(totalDuration / visits.length) : 0;
        
        // Bounce Rate (one-page sessions with < 10s duration) - Approximation
        const bounces = visits.filter(v => (v.duration || 0) < 10).length;
        const bounceRate = visits.length ? Math.round((bounces / visits.length) * 100) : 0;

        return { 
            total: visits.length, 
            unique: uniqueIPs.size, 
            topCountry, 
            topPage,
            avgDuration: `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`,
            bounceRate: `${bounceRate}%`
        };
    }, [visits, countryData, topPages]);

    if (analyticsLoading) {
        return (
            <div className={styles.analyticsLoading}>
                <div className={styles.analyticsSpinner} />
                <span>Loading analytics data…</span>
            </div>
        );
    }

    const dateFilter = (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                    {dataUpdatedAt && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', opacity: 0.6, whiteSpace: 'nowrap' }}>
                            Updated: {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button
                        className={styles.refreshBtn}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.4rem' }}
                        onClick={handleRefreshAll}
                        disabled={analyticsFetching}
                    >
                        <RefreshCw size={14} className={analyticsFetching ? styles.spin : ''} />
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.section}>
            <SectionHeader
                title="Analytics Dashboard"
                description="Monitor visitor traffic, behavior, and geographical distribution."
                icon={TrendingUp}
                rightElement={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            className={styles.refreshBtn} 
                            style={{ background: 'rgba(100, 255, 218, 0.1)', color: '#64ffda', border: '1px solid rgba(100, 255, 218, 0.2)' }}
                            onClick={handleExportCsv}
                        >
                            <Download size={14} />
                            Export CSV
                        </button>
                        {dateFilter}
                    </div>
                }
            />

            {/* Stat Summary Grid */}
            <div className={styles.analyticsGrid} style={{ marginBottom: '2.5rem' }}>
                <StatCard
                    icon={EyeIcon}
                    value={summaryStats.total.toLocaleString()}
                    label="Page Views"
                    color="#64ffda"
                />
                <StatCard
                    icon={Users}
                    value={summaryStats.unique.toLocaleString()}
                    label="Unique Visitors"
                    color="#7c4dff"
                />
                <StatCard
                    icon={Clock}
                    value={summaryStats.avgDuration}
                    label="Avg. Session"
                    color="#ff6090"
                />
                <StatCard
                    icon={Activity}
                    value={summaryStats.bounceRate}
                    label="Bounce Rate"
                    color="#ffab40"
                />
            </div>

            {/* Visits Over Time */}
            <ChartCard
                title={`Visits Over Time ${analyticsRange.preset === '7d' ? '(Last 7 Days)' : analyticsRange.preset === '30d' ? '(Last 30 Days)' : analyticsRange.preset === '90d' ? '(Last 90 Days)' : analyticsRange.preset === 'all' ? '(All Time)' : `(${analyticsRange.start} — ${analyticsRange.end})`}`}
                icon={TrendingUp}
                onViewDetails={() => handleAnalyticsDetail('visits')}
                isLoading={analyticsLoading || analyticsFetching}
            >
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
            </ChartCard>

            {/* Geographical and Device Distribution */}
            <div className={styles.chartRow}>
                <ChartCard
                    title="Visitors by Country"
                    icon={Globe}
                    onViewDetails={() => handleAnalyticsDetail('countries')}
                >
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
                </ChartCard>

                <ChartCard
                    title="Device Breakdown"
                    icon={Monitor}
                    onViewDetails={() => handleAnalyticsDetail('devices')}
                >
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
                </ChartCard>
            </div>

            {/* City and Traffic Sources */}
            <div className={styles.chartRow}>
                <ChartCard
                    title="Top Cities"
                    icon={MapPin}
                    onViewDetails={() => handleAnalyticsDetail('cities')}
                >
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
                </ChartCard>

                <ChartCard
                    title="Traffic Sources"
                    icon={Share2}
                    onViewDetails={() => handleAnalyticsDetail('referrers')}
                >
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
                </ChartCard>
            </div>

            {/* Browsers, OS & Retention Row */}
            <div className={styles.chartRow}>
                <ChartCard
                    title="Top Browsers"
                    icon={Layout}
                    onViewDetails={() => handleAnalyticsDetail('browsers')}
                >
                    {browserData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={browserData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                                        {browserData.map((entry, i) => <Cell key={`br-${entry.name || i}`} fill={CHART_COLORS[(i + 6) % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className={styles.legendList}>
                                {browserData.map((entry, i) => (<li key={entry.name} className={styles.legendItem}><span className={styles.legendDot} style={{ background: CHART_COLORS[(i + 6) % CHART_COLORS.length] }} />{entry.name} ({entry.value})</li>))}
                            </ul>
                        </>
                    ) : (<div className={styles.emptyState}><p>No browser data.</p></div>)}
                </ChartCard>

                <ChartCard
                    title="Operating Systems"
                    icon={Monitor}
                    onViewDetails={() => handleAnalyticsDetail('os')}
                >
                    {osData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={osData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                                        {osData.map((entry, i) => <Cell key={`os-${entry.name || i}`} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className={styles.legendList}>
                                {osData.map((entry, i) => (<li key={entry.name} className={styles.legendItem}><span className={styles.legendDot} style={{ background: CHART_COLORS[(i + 2) % CHART_COLORS.length] }} />{entry.name} ({entry.value})</li>))}
                            </ul>
                        </>
                    ) : (<div className={styles.emptyState}><p>No OS data.</p></div>)}
                </ChartCard>

                <ChartCard
                    title="Visitor Retention"
                    icon={Users}
                >
                    {retentionData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={retentionData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                                        <Cell fill="#64ffda" />
                                        <Cell fill="#7c4dff" />
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className={styles.legendList}>
                                {retentionData.map((entry, i) => (<li key={entry.name} className={styles.legendItem}><span className={styles.legendDot} style={{ background: i === 0 ? "#64ffda" : "#7c4dff" }} />{entry.name} ({entry.value})</li>))}
                            </ul>
                        </>
                    ) : (<div className={styles.emptyState}><p>No retention data.</p></div>)}
                </ChartCard>
            </div>

            {/* Top Pages */}
            <ChartCard
                title="Top Visited Pages"
                icon={FileText}
                onViewDetails={() => handleAnalyticsDetail('pages')}
            >
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
            </ChartCard>

            <AnalyticsDetailModal
                analyticsDetail={analyticsDetail}
                setAnalyticsDetail={setAnalyticsDetail}
                analyticsLogsLoading={analyticsLogsLoading}
                analyticsLogs={analyticsLogs}
                analyticsLogsTotal={analyticsLogsTotal}
            />
        </div>
    );
};

export default AnalyticsTab;
