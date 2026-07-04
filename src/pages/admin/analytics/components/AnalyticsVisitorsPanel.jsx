import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, Monitor, Smartphone, MapPin } from 'lucide-react';
import AnalyticsService from '../../../../services/AnalyticsService';
import BaseService from '../../../../services/BaseService';
import { Spinner } from '@/shared/components/ui';
import AnalyticsChart from './AnalyticsChart';

const increment = (map, key, fallback) => {
    const normalized = key || fallback;
    map[normalized] = (map[normalized] || 0) + 1;
};

const toSortedData = (map, limit) => Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit || 999)
    .map(([name, value]) => ({ name, value }));

const toDateKey = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value?.seconds) return new Date(value.seconds * 1000).toISOString().split('T')[0];
    return null;
};

const AnalyticsVisitorsPanel = ({ userRole, analyticsRange }) => {

    const {
        data: visits = [],
        isLoading
    } = useQuery({
        queryKey: ['analyticsVisitors', analyticsRange],
        queryFn: async () => {
            const res = await BaseService.safe(() => AnalyticsService.fetchAnalytics(userRole, analyticsRange));
            return res.data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    const summary = useMemo(() => {
        const dailyMap = {};
        const countryMap = {};
        const deviceMap = {};
        const browserMap = {};
        const osMap = {};
        const referrerMap = {};
        let newVisitors = 0;
        let returningVisitors = 0;

        visits.forEach((v) => {
            const date = toDateKey(v.timestamp) || v.date;
            if (date) {
                if (!dailyMap[date]) dailyMap[date] = { date, visits: 0, unique: 0, _ips: new Set() };
                dailyMap[date].visits++;
                if (v.ip && !dailyMap[date]._ips.has(v.ip)) {
                    dailyMap[date]._ips.add(v.ip);
                    dailyMap[date].unique++;
                }
            }

            increment(countryMap, v.country, 'Unknown');
            const device = v.device || 'desktop';
            increment(deviceMap, device.charAt(0).toUpperCase() + device.slice(1), 'Desktop');
            increment(browserMap, v.browser, 'Unknown');
            increment(osMap, v.os, 'Unknown');
            increment(referrerMap, v.referrer, 'Direct');

            if (v.isReturning) returningVisitors++;
            else newVisitors++;
        });

        return {
            dailyVisits: Object.values(dailyMap)
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((entry) => ({ date: entry.date, visits: entry.visits, unique: entry.unique })),
            countryData: toSortedData(countryMap, 8),
            deviceData: toSortedData(deviceMap),
            browserData: toSortedData(browserMap, 6),
            osData: toSortedData(osMap, 6),
            referrerData: toSortedData(referrerMap, 6),
            retentionData: [
                { name: 'New', value: newVisitors },
                { name: 'Returning', value: returningVisitors }
            ]
        };
    }, [visits]);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Visitor Analytics</h3>

            <div className="admin-grid" style={{ marginBottom: '2rem' }}>
                <AnalyticsChart
                    type="line"
                    title="Traffic Overview"
                    data={summary.dailyVisits}
                    xKey="date"
                    yKey="visits"
                    icon={Globe}
                    height={350}
                    style={{ gridColumn: '1 / -1' }}
                />
            </div>

            <div className="admin-grid">
                <AnalyticsChart
                    type="pie"
                    title="Device Distribution"
                    data={summary.deviceData}
                    xKey="name"
                    yKey="value"
                    icon={Monitor}
                />
                <AnalyticsChart
                    type="bar"
                    title="Browser Usage"
                    data={summary.browserData}
                    xKey="name"
                    yKey="value"
                    icon={Globe}
                />
                <AnalyticsChart
                    type="pie"
                    title="Operating Systems"
                    data={summary.osData}
                    xKey="name"
                    yKey="value"
                    icon={Smartphone}
                />
                <AnalyticsChart
                    type="bar"
                    title="Top Countries"
                    data={summary.countryData}
                    xKey="name"
                    yKey="value"
                    icon={MapPin}
                />
            </div>
            
            <div className="admin-grid" style={{ marginTop: '2rem' }}>
                <AnalyticsChart
                    type="pie"
                    title="Visitor Retention"
                    data={summary.retentionData}
                    xKey="name"
                    yKey="value"
                    icon={Globe}
                />
                <AnalyticsChart
                    type="bar"
                    title="Top Referrers"
                    data={summary.referrerData}
                    xKey="name"
                    yKey="value"
                    icon={Globe}
                />
            </div>
        </div>
    );
};

export default AnalyticsVisitorsPanel;
