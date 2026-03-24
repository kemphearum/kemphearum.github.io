import React, { useState, useCallback, useMemo } from 'react';
import { 
    Eye as EyeIcon, 
    Users, 
    Globe, 
    TrendingUp, 
    Monitor, 
    MapPin, 
    Share2, 
    FileText, 
    Activity, 
    Clock
} from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { jsonToCsv } from '../../../utils/csvUtils';
import { useActivity } from '../../../hooks/useActivity';
import BaseService from '../../../services/BaseService';
import AnalyticsService from '../../../services/AnalyticsService';

// UI Components
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import AnalyticsDetailModal from './components/AnalyticsDetailModal';
import AnalyticsFilterBar from './components/AnalyticsFilterBar';
import AnalyticsChart from './components/AnalyticsChart';
import LoadingOverlay from '../../../shared/components/ui/loading-overlay/LoadingOverlay';
import EmptyState from '../../../shared/components/ui/empty-state/EmptyState';
import { useTranslation } from '../../../hooks/useTranslation';

const toDateKey = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value?.seconds) return new Date(value.seconds * 1000).toISOString().split('T')[0];
    return null;
};

const formatShortDate = (value) => {
    if (!value) return 'Unknown';
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatLastUpdated = (value) => {
    if (!value) return 'Not synced yet';
    const updated = new Date(value);
    const now = new Date();
    const deltaSeconds = Math.max(0, Math.floor((now.getTime() - updated.getTime()) / 1000));

    if (deltaSeconds < 60) return 'Updated just now';
    if (deltaSeconds < 3600) return `Updated ${Math.floor(deltaSeconds / 60)}m ago`;

    return `Updated ${updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const AnalyticsTab = ({ userRole, showToast }) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const { trackRead } = useActivity();
    const formatLastUpdatedLocalized = useCallback((value) => {
        if (!value) return tr('Not synced yet', 'មិនទាន់បានធ្វើសមកាលកម្ម');
        const updated = new Date(value);
        const now = new Date();
        const deltaSeconds = Math.max(0, Math.floor((now.getTime() - updated.getTime()) / 1000));

        if (deltaSeconds < 60) return tr('Updated just now', 'ទើបធ្វើបច្ចុប្បន្នភាព');
        if (deltaSeconds < 3600) return tr(`Updated ${Math.floor(deltaSeconds / 60)}m ago`, `បានធ្វើបច្ចុប្បន្នភាព ${Math.floor(deltaSeconds / 60)} នាទីមុន`);

        return tr(
            `Updated ${updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            `បានធ្វើបច្ចុប្បន្នភាព ${updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ម៉ោង ${updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        );
    }, [tr]);
    
    // 1. FILTER STATE
    const [analyticsRange, setAnalyticsRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        // Default to last 7 days for better initial view
        start.setDate(end.getDate() - 6);
        return { 
            start: start.toISOString().split('T')[0], 
            end: end.toISOString().split('T')[0], 
            preset: '7d' 
        };
    });

    const [analyticsDetail, setAnalyticsDetail] = useState(null);
    const [detailPage, setDetailPage] = useState(1);
    const detailLimit = 5;
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const shouldFetchDetailLogs = analyticsDetail === 'visits';

    // 2. DATA FETCHING (STANDARD REACT QUERY)
    const {
        data: analyticsData = { current: [], previous: [] },
        isLoading: analyticsLoading,
        isFetching: analyticsFetching,
        refetch: refetchAnalytics,
        dataUpdatedAt
    } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
        queryKey: ['analytics', { range: analyticsRange }],
        queryFn: async () => {
            setQuotaExceeded(false);
            
            const result = await BaseService.safe(async () => {
                // Fetch current range
                const current = await AnalyticsService.fetchAnalytics(userRole, analyticsRange, trackRead);
                
                // Fetch previous range for trends (only if a preset is selected and not 'all')
                let previous = [];
                if (analyticsRange.preset && analyticsRange.preset !== 'all' && analyticsRange.preset !== 'today') {
                    const prevRange = calculatePreviousRange(analyticsRange);
                    previous = await AnalyticsService.fetchAnalytics(userRole, prevRange, false);
                } else if (analyticsRange.preset === 'today') {
                    // For today, compare with yesterday
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yStr = yesterday.toISOString().split('T')[0];
                    previous = await AnalyticsService.fetchAnalytics(userRole, { start: yStr, end: yStr }, false);
                }
                return { current, previous };
            });

            if (result.error) {
                if (result.error === 'QUOTA_EXCEEDED') {
                    setQuotaExceeded(true);
                    return { current: [], previous: [] };
                }
                showToast(result.error, 'error');
                return { current: [], previous: [] };
            }

            return result.data;
        },
        enabled: (userRole === 'superadmin' || userRole === 'admin'),
        retry: (failureCount, error) => error.message !== 'QUOTA_EXCEEDED' && failureCount < 2
    });

    const visits = analyticsData.current;
    const prevVisits = analyticsData.previous;

    // 2b. FETCH PAGINATED DETAILS
    const { 
        data: detailsResult = { data: [], meta: { total: 0 } }, 
        isLoading: detailsLoading,
        isFetching: detailsFetching
    } = useQuery({
        placeholderData: keepPreviousData,
        queryKey: ['analytics', 'details', analyticsDetail, analyticsRange, detailPage],
        queryFn: async () => {
            const result = await BaseService.safe(() => AnalyticsService.fetchAnalyticsDetails(
                userRole, 
                analyticsRange, 
                analyticsDetail, 
                { page: detailPage, limit: detailLimit },
                trackRead
            ));

            if (result.error) {
                showToast(result.error, 'error');
                return { data: [], meta: { total: 0 } };
            }
            return result.data;
        },
        enabled: shouldFetchDetailLogs && !!analyticsDetail && (userRole === 'superadmin' || userRole === 'admin'),
        staleTime: 60000
    });

    const analyticsLogs = shouldFetchDetailLogs ? detailsResult.data : visits;
    const analyticsLogsTotal = shouldFetchDetailLogs
        ? (detailsResult.meta?.total || detailsResult.data?.length || 0)
        : visits.length;
    const analyticsLogsLoading = shouldFetchDetailLogs ? (detailsLoading || detailsFetching) : analyticsFetching;

    // Helper: Calculate previous date range
    function calculatePreviousRange(currentRange) {
        const start = new Date(currentRange.start);
        const end = new Date(currentRange.end);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - diffDays + 1);

        return {
            start: prevStart.toISOString().split('T')[0],
            end: prevEnd.toISOString().split('T')[0]
        };
    }

    // 3. ACTIONS
    const handleAnalyticsDetail = useCallback((type) => {
        setAnalyticsDetail(type);
        setDetailPage(1);
    }, []);

    const handleRefreshAll = useCallback(() => {
        refetchAnalytics();
        showToast(tr('Analytics data refreshed!', 'បានធ្វើបច្ចុប្បន្នភាពទិន្នន័យវិភាគ!'), 'success');
    }, [refetchAnalytics, showToast, tr]);

    const handleExportCsv = useCallback(() => {
        if (!visits || !visits.length) {
            showToast(tr('No data to export', 'មិនមានទិន្នន័យសម្រាប់នាំចេញ'), 'error');
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
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(tr('Analytics exported to CSV', 'បាននាំចេញទិន្នន័យវិភាគជា CSV'), 'success');
    }, [visits, analyticsRange, showToast, tr]);

    // 4. DERIVED DATA & TRENDS
    const dailyVisits = useMemo(() => {
        const map = {};
        visits.forEach(v => {
            const date = toDateKey(v.timestamp) || v.date;
            if (!date) return;
            if (!map[date]) map[date] = { date, visits: 0, unique: 0, _ips: new Set() };
            map[date].visits++;
            if (v.ip && !map[date]._ips.has(v.ip)) { map[date]._ips.add(v.ip); map[date].unique++; }
        });
        return Object.values(map)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((entry) => ({ date: entry.date, visits: entry.visits, unique: entry.unique }));
    }, [visits]);

    const countryData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const c = v.country || tr('Unknown', 'មិនស្គាល់'); map[c] = (map[c] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));
    }, [visits, tr]);

    const deviceData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const d = v.device || 'desktop'; const label = d.charAt(0).toUpperCase() + d.slice(1); map[label] = (map[label] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
    }, [visits]);

    const cityData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const c = v.city || tr('Unknown', 'មិនស្គាល់'); map[c] = (map[c] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));
    }, [visits, tr]);

    const referrerData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const r = v.referrer || tr('Direct', 'ផ្ទាល់'); map[r] = (map[r] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));
    }, [visits, tr]);

    const browserData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const b = v.browser || tr('Unknown', 'មិនស្គាល់'); map[b] = (map[b] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
    }, [visits, tr]);

    const osData = useMemo(() => {
        const map = {};
        visits.forEach(v => { const o = v.os || tr('Unknown', 'មិនស្គាល់'); map[o] = (map[o] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
    }, [visits, tr]);

    const retentionData = useMemo(() => {
        let n = 0, r = 0;
        visits.forEach(v => { if (v.isReturning) r++; else n++; });
        return [{ name: tr('New', 'ថ្មី'), value: n }, { name: tr('Returning', 'ត្រឡប់មកវិញ'), value: r }];
    }, [visits, tr]);

    const topPages = useMemo(() => {
        const map = {};
        visits.forEach(v => { const p = v.path || '/'; map[p] = (map[p] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([path, count]) => ({ path, count }));
    }, [visits]);

    const workspaceSummary = useMemo(() => {
        const start = analyticsRange.start;
        const end = analyticsRange.end;
        const startDate = start ? new Date(`${start}T00:00:00`) : null;
        const endDate = end ? new Date(`${end}T00:00:00`) : null;
        const rangeDays = (startDate && endDate)
            ? Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1)
            : 0;

        const topCountryItem = countryData[0];
        const topSourceItem = referrerData[0];
        const topPageItem = topPages[0];
        const returningCount = retentionData.find((entry) => entry.name === tr('Returning', 'ត្រឡប់មកវិញ'))?.value || 0;
        const returningRate = visits.length ? Math.round((returningCount / visits.length) * 100) : 0;

        return {
            rangeText: start && end ? `${formatShortDate(start)} ${tr('to', 'ដល់')} ${formatShortDate(end)}` : tr('Custom range', 'រយៈពេលផ្ទាល់ខ្លួន'),
            rangeDays,
            topCountry: topCountryItem ? `${topCountryItem.name} (${topCountryItem.value})` : tr('No country data yet', 'មិនទាន់មានទិន្នន័យប្រទេស'),
            topSource: topSourceItem ? `${topSourceItem.name} (${topSourceItem.value})` : tr('No source data yet', 'មិនទាន់មានទិន្នន័យប្រភព'),
            topPage: topPageItem ? `${topPageItem.path} (${topPageItem.count})` : tr('No page data yet', 'មិនទាន់មានទិន្នន័យទំព័រ'),
            returningRate,
            freshnessLabel: formatLastUpdatedLocalized(dataUpdatedAt)
        };
    }, [analyticsRange.end, analyticsRange.start, countryData, dataUpdatedAt, formatLastUpdatedLocalized, referrerData, retentionData, topPages, visits.length, tr]);

    const summaryStats = useMemo(() => {
        const calculateStats = (data) => {
            const uniqueIPs = new Set(data.map(v => v.ip).filter(Boolean));
            const totalDuration = data.reduce((acc, v) => acc + (v.duration || 0), 0);
            const avgDuration = data.length ? Math.round(totalDuration / data.length) : 0;
            const bounces = data.filter(v => (v.duration || 0) < 10).length;
            const bounceRate = data.length ? Math.round((bounces / data.length) * 100) : 0;
            
            return {
                total: data.length,
                unique: uniqueIPs.size,
                avgDuration,
                bounceRate
            };
        };

        const current = calculateStats(visits);
        const previous = calculateStats(prevVisits);

        const calculateTrend = (curr, prev) => {
            if (!prev) return { type: 'neutral', value: '0%' };
            const diff = curr - prev;
            const percent = prev === 0 ? (curr > 0 ? 100 : 0) : Math.round((diff / prev) * 100);
            return {
                type: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral',
                value: `${Math.abs(percent)}%`
            };
        };

        // For bounce rate, "down" is positive
        const bounceTrend = calculateTrend(current.bounceRate, previous.bounceRate);
        if (bounceTrend.type === 'up') bounceTrend.type = 'down'; // Visually red if bounce rate increases
        else if (bounceTrend.type === 'down') bounceTrend.type = 'up'; // visually green if bounce rate decreases

        return {
            total: {
                value: current.total.toLocaleString(),
                trend: calculateTrend(current.total, previous.total),
                subtitle: tr(`vs prev. ${analyticsRange.preset || 'period'}`, `ធៀបនឹងមុន ${analyticsRange.preset || 'រយៈពេល'}`)
            },
            unique: {
                value: current.unique.toLocaleString(),
                trend: calculateTrend(current.unique, previous.unique),
                subtitle: tr(`vs prev. ${analyticsRange.preset || 'period'}`, `ធៀបនឹងមុន ${analyticsRange.preset || 'រយៈពេល'}`)
            },
            duration: {
                value: `${Math.floor(current.avgDuration / 60)}m ${current.avgDuration % 60}s`,
                trend: calculateTrend(current.avgDuration, previous.avgDuration),
                subtitle: tr(`vs prev. ${analyticsRange.preset || 'period'}`, `ធៀបនឹងមុន ${analyticsRange.preset || 'រយៈពេល'}`)
            },
            bounce: {
                value: `${current.bounceRate}%`,
                trend: bounceTrend,
                subtitle: tr(`vs prev. ${analyticsRange.preset || 'period'}`, `ធៀបនឹងមុន ${analyticsRange.preset || 'រយៈពេល'}`)
            }
        };
    }, [visits, prevVisits, analyticsRange.preset, tr]);

    // 5. RENDER
    return (
        <div className="admin-analytics-container">
            <LoadingOverlay 
                active={analyticsLoading && !visits.length} 
                message={tr('Loading analytics...', 'កំពុងផ្ទុកទិន្នន័យវិភាគ...')} 
            />
            
            <SectionHeader
                title={tr('Analytics Dashboard', 'ផ្ទាំងវិភាគ')}
                description={tr('Track traffic quality, audience behavior, and acquisition signals for your portfolio.', 'តាមដានគុណភាពចរាចរណ៍ ឥរិយាបថអ្នកទស្សនា និងប្រភពចូលមើលសម្រាប់ Portfolio របស់អ្នក។')}
                icon={TrendingUp}
                rightElement={
                    <AnalyticsFilterBar 
                        range={analyticsRange}
                        onRangeChange={setAnalyticsRange}
                        onRefresh={handleRefreshAll}
                        onExport={handleExportCsv}
                        isLoading={analyticsFetching}
                        lastUpdated={dataUpdatedAt}
                        totalRecords={visits.length}
                    />
                }
            />

            {quotaExceeded && (
                <div className="admin-alert admin-alert-warning" style={{ marginBottom: '2rem' }}>
                    <Activity size={20} />
                    <div>
                        <strong>{tr('Firestore Quota Exceeded', 'Firestore Quota លើសកំណត់')}</strong>
                        <p>{tr('The daily free tier limit has been reached. Some data may be missing.', 'បានដល់កំណត់ឥតគិតថ្លៃប្រចាំថ្ងៃ។ ទិន្នន័យខ្លះអាចបាត់។')}</p>
                    </div>
                </div>
            )}

            {!analyticsLoading && visits.length === 0 && !quotaExceeded && (
                <EmptyState 
                    icon={TrendingUp}
                    title={tr('No Analytics Data', 'មិនមានទិន្នន័យវិភាគ')}
                    description={tr('No data available for the selected range. Try a different date range.', 'មិនមានទិន្នន័យសម្រាប់រយៈពេលដែលបានជ្រើស។ សូមសាកល្បងរយៈពេលផ្សេង។')}
                />
            )}

            {(visits.length > 0 || analyticsFetching) && (
                <>
                    <section className="ui-analytics-workspace" aria-live="polite">
                        <div className="ui-analytics-workspace__overview">
                            <span className="ui-analytics-workspace__eyebrow">{tr('Traffic Overview', 'ទិដ្ឋភាពទូទៅចរាចរណ៍')}</span>
                            <h3>{tr('Performance for', 'លទ្ធផលសម្រាប់')} {workspaceSummary.rangeText}</h3>
                            <p>
                                {tr('Monitoring', 'កំពុងតាមដាន')} {visits.length.toLocaleString()} {tr('tracked sessions over', 'សម័យក្នុងរយៈពេល')} {workspaceSummary.rangeDays} {tr(`day${workspaceSummary.rangeDays === 1 ? '' : 's'}`, workspaceSummary.rangeDays === 1 ? 'ថ្ងៃ' : 'ថ្ងៃ')}.
                                {' '}{analyticsFetching ? tr('Refreshing now...', 'កំពុងធ្វើបច្ចុប្បន្នភាព...') : workspaceSummary.freshnessLabel}.
                            </p>
                        </div>
                        <div className="ui-analytics-workspace__meta">
                            <article className="ui-analytics-workspace__metaItem">
                                <span className="ui-analytics-workspace__metaLabel">{tr('Top Country', 'ប្រទេសកំពូល')}</span>
                                <strong>{workspaceSummary.topCountry}</strong>
                            </article>
                            <article className="ui-analytics-workspace__metaItem">
                                <span className="ui-analytics-workspace__metaLabel">{tr('Top Source', 'ប្រភពកំពូល')}</span>
                                <strong>{workspaceSummary.topSource}</strong>
                            </article>
                            <article className="ui-analytics-workspace__metaItem">
                                <span className="ui-analytics-workspace__metaLabel">{tr('Top Page', 'ទំព័រកំពូល')}</span>
                                <strong>{workspaceSummary.topPage}</strong>
                            </article>
                            <article className="ui-analytics-workspace__metaItem">
                                <span className="ui-analytics-workspace__metaLabel">{tr('Returning Share', 'ភាគរយត្រឡប់មកវិញ')}</span>
                                <strong>{workspaceSummary.returningRate}%</strong>
                            </article>
                        </div>
                    </section>

                    <div className="admin-analytics-grid">
                        <StatCard
                            icon={EyeIcon}
                            value={summaryStats.total.value}
                            label={tr('Page Views', 'ចំនួនមើលទំព័រ')}
                            color="#64ffda"
                            trend={summaryStats.total.trend.type}
                            trendValue={summaryStats.total.trend.value}
                            description={summaryStats.total.subtitle}
                            onClick={() => handleAnalyticsDetail('visits')}
                        />
                        <StatCard
                            icon={Users}
                            value={summaryStats.unique.value}
                            label={tr('Unique Visitors', 'អ្នកទស្សនាមិនស្ទួន')}
                            color="#7c4dff"
                            trend={summaryStats.unique.trend.type}
                            trendValue={summaryStats.unique.trend.value}
                            description={summaryStats.unique.subtitle}
                            onClick={() => handleAnalyticsDetail('retention')}
                        />
                        <StatCard
                            icon={Clock}
                            value={summaryStats.duration.value}
                            label={tr('Avg. Session', 'មធ្យមក្នុងមួយសម័យ')}
                            color="#ff6090"
                            trend={summaryStats.duration.trend.type}
                            trendValue={summaryStats.duration.trend.value}
                            description={summaryStats.duration.subtitle}
                            onClick={() => handleAnalyticsDetail('visits')}
                        />
                        <StatCard
                            icon={Activity}
                            value={summaryStats.bounce.value}
                            label={tr('Bounce Rate', 'អត្រាចាកចេញ')}
                            color="#ffab40"
                            trend={summaryStats.bounce.trend.type}
                            trendValue={summaryStats.bounce.trend.value}
                            description={summaryStats.bounce.subtitle}
                            onClick={() => handleAnalyticsDetail('pages')}
                        />
                    </div>

                    <AnalyticsChart
                        title={tr('Visits Over Time', 'ចំនួនចូលមើលតាមពេលវេលា')}
                        icon={TrendingUp}
                        type="line"
                        data={dailyVisits}
                        xKey="date"
                        yKey={['visits', 'unique']}
                        colors={['#64ffda', '#7c4dff']}
                        height={320}
                        onViewDetails={() => handleAnalyticsDetail('visits')}
                        isLoading={analyticsFetching}
                    />

                    <div className="admin-analytics-row admin-grid-2">
                        <AnalyticsChart
                            title={tr('Visitors by Country', 'អ្នកទស្សនាតាមប្រទេស')}
                            icon={Globe}
                            type="pie"
                            data={countryData}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('countries')}
                        />
                        <AnalyticsChart
                            title={tr('Device Breakdown', 'បែងចែកតាមឧបករណ៍')}
                            icon={Monitor}
                            type="pie"
                            data={deviceData}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('devices')}
                        />
                    </div>

                    <div className="admin-analytics-row admin-grid-2">
                        <AnalyticsChart
                            title={tr('Top Cities', 'ទីក្រុងកំពូល')}
                            icon={MapPin}
                            type="bar"
                            data={cityData.slice(0, 6)}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('cities')}
                        />
                        <AnalyticsChart
                            title={tr('Traffic Sources', 'ប្រភពចរាចរណ៍')}
                            icon={Share2}
                            type="pie"
                            data={referrerData}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('referrers')}
                        />
                    </div>

                    <div className="admin-analytics-row admin-grid-auto">
                        <AnalyticsChart
                            title={tr('Top Browsers', 'Browser កំពូល')}
                            icon={FileText}
                            type="pie"
                            data={browserData}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('browsers')}
                        />
                        <AnalyticsChart
                            title={tr('Operating Systems', 'ប្រព័ន្ធប្រតិបត្តិការ')}
                            icon={Monitor}
                            type="pie"
                            data={osData}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('os')}
                        />
                         <AnalyticsChart
                            title={tr('Visitor Retention', 'ការត្រឡប់មកវិញរបស់អ្នកទស្សនា')}
                            icon={Users}
                            type="pie"
                            data={retentionData}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('retention')}
                            colors={['#64ffda', '#7c4dff']}
                        />
                    </div>

                    <div className="admin-analytics-row">
                        <AnalyticsChart
                            title={tr('Top Visited Pages', 'ទំព័រដែលចូលមើលច្រើនបំផុត')}
                            icon={FileText}
                            type="bar"
                            data={topPages}
                            xKey="path"
                            yKey="count"
                            height={Math.max(200, topPages.length * 40)}
                            onViewDetails={() => handleAnalyticsDetail('pages')}
                        />
                    </div>
                </>
            )}

            <AnalyticsDetailModal
                analyticsDetail={analyticsDetail}
                setAnalyticsDetail={setAnalyticsDetail}
                analyticsLogsLoading={analyticsLogsLoading}
                analyticsLogs={analyticsLogs}
                analyticsLogsTotal={analyticsLogsTotal}
                quotaExceeded={quotaExceeded}
                page={detailPage}
                onPageChange={setDetailPage}
                pageSize={detailLimit}
                enablePagination={shouldFetchDetailLogs}
            />
        </div>
    );
};

export default AnalyticsTab;
