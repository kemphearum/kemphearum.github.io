import React, { useState, useCallback, useMemo } from 'react';
import { 
    Eye as EyeIcon, 
    Users, 
    Globe, 
    TrendingUp, 
    Monitor, 
    Smartphone, 
    Tablet, 
    MapPin, 
    Share2, 
    FileText, 
    Activity, 
    Clock,
    RefreshCw
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

const AnalyticsTab = ({ userRole, showToast }) => {
    const { trackRead } = useActivity();
    
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
        showToast('Analytics data refreshed!', 'success');
    }, [refetchAnalytics, showToast]);

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
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Analytics exported to CSV', 'success');
    }, [visits, analyticsRange, showToast]);

    // 4. DERIVED DATA & TRENDS
    const dailyVisits = useMemo(() => {
        const map = {};
        visits.forEach(v => {
            const date = v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toISOString().split('T')[0] : v.date;
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
                subtitle: `vs prev. ${analyticsRange.preset || 'period'}`
            },
            unique: {
                value: current.unique.toLocaleString(),
                trend: calculateTrend(current.unique, previous.unique),
                subtitle: `vs prev. ${analyticsRange.preset || 'period'}`
            },
            duration: {
                value: `${Math.floor(current.avgDuration / 60)}m ${current.avgDuration % 60}s`,
                trend: calculateTrend(current.avgDuration, previous.avgDuration),
                subtitle: `vs prev. ${analyticsRange.preset || 'period'}`
            },
            bounce: {
                value: `${current.bounceRate}%`,
                trend: bounceTrend,
                subtitle: `vs prev. ${analyticsRange.preset || 'period'}`
            }
        };
    }, [visits, prevVisits, analyticsRange.preset]);

    // 5. RENDER
    return (
        <div className="admin-analytics-container">
            <LoadingOverlay 
                active={analyticsLoading && !visits.length} 
                message="Loading analytics..." 
            />
            
            <SectionHeader
                title="Analytics Dashboard"
                description="Monitor visitor traffic, behavior, and geographical distribution."
                icon={TrendingUp}
                rightElement={
                    <AnalyticsFilterBar 
                        range={analyticsRange}
                        onRangeChange={setAnalyticsRange}
                        onRefresh={handleRefreshAll}
                        onExport={handleExportCsv}
                        isLoading={analyticsFetching}
                        lastUpdated={dataUpdatedAt}
                    />
                }
            />

            {quotaExceeded && (
                <div className="admin-alert admin-alert-warning" style={{ marginBottom: '2rem' }}>
                    <Activity size={20} />
                    <div>
                        <strong>Firestore Quota Exceeded</strong>
                        <p>The daily free tier limit has been reached. Some data may be missing.</p>
                    </div>
                </div>
            )}

            {!analyticsLoading && visits.length === 0 && !quotaExceeded && (
                <EmptyState 
                    icon={TrendingUp}
                    title="No Analytics Data"
                    description="No data available for the selected range. Try a different date range."
                />
            )}

            {(visits.length > 0 || analyticsFetching) && (
                <>
                    <div className="admin-analytics-grid">
                        <StatCard
                            icon={EyeIcon}
                            value={summaryStats.total.value}
                            label="Page Views"
                            color="#64ffda"
                            trend={summaryStats.total.trend.type}
                            trendValue={summaryStats.total.trend.value}
                            description={summaryStats.total.subtitle}
                        />
                        <StatCard
                            icon={Users}
                            value={summaryStats.unique.value}
                            label="Unique Visitors"
                            color="#7c4dff"
                            trend={summaryStats.unique.trend.type}
                            trendValue={summaryStats.unique.trend.value}
                            description={summaryStats.unique.subtitle}
                        />
                        <StatCard
                            icon={Clock}
                            value={summaryStats.duration.value}
                            label="Avg. Session"
                            color="#ff6090"
                            trend={summaryStats.duration.trend.type}
                            trendValue={summaryStats.duration.trend.value}
                            description={summaryStats.duration.subtitle}
                        />
                        <StatCard
                            icon={Activity}
                            value={summaryStats.bounce.value}
                            label="Bounce Rate"
                            color="#ffab40"
                            trend={summaryStats.bounce.trend.type}
                            trendValue={summaryStats.bounce.trend.value}
                            description={summaryStats.bounce.subtitle}
                        />
                    </div>

                    <AnalyticsChart
                        title="Visits Over Time"
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
                            title="Visitors by Country"
                            icon={Globe}
                            type="pie"
                            data={countryData}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('countries')}
                        />
                        <AnalyticsChart
                            title="Device Breakdown"
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
                            title="Top Cities"
                            icon={MapPin}
                            type="bar"
                            data={cityData.slice(0, 6)}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('cities')}
                        />
                        <AnalyticsChart
                            title="Traffic Sources"
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
                            title="Top Browsers"
                            icon={FileText}
                            type="pie"
                            data={browserData}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('browsers')}
                        />
                        <AnalyticsChart
                            title="Operating Systems"
                            icon={Monitor}
                            type="pie"
                            data={osData}
                            xKey="name"
                            yKey="value"
                            height={250}
                            onViewDetails={() => handleAnalyticsDetail('os')}
                        />
                         <AnalyticsChart
                            title="Visitor Retention"
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
                            title="Top Visited Pages"
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
