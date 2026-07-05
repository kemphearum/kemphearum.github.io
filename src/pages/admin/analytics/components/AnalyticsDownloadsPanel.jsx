import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart2 } from 'lucide-react';
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

const AnalyticsDownloadsPanel = ({ userRole, analyticsRange }) => {

    const {
        data: visits = [],
        isLoading
    } = useQuery({
        queryKey: ['analyticsDownloads', analyticsRange],
        queryFn: async () => {
            const res = await BaseService.safe(() => AnalyticsService.fetchAnalytics(userRole, analyticsRange));
            return res.data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    const summary = useMemo(() => {
        const dailyMap = {};
        const assetMap = {};
        let totalDownloads = 0;
        let resumeDownloads = 0;

        visits.forEach((v) => {
            const path = (v.path || '').toLowerCase();
            
            // Check if this visit is actually a download event
            // Note: Your frontend tracking should log downloads as path='/download/resume.pdf' etc.
            if (path.includes('/download')) {
                totalDownloads++;
                
                const date = toDateKey(v.timestamp) || v.date;
                if (date) {
                    if (!dailyMap[date]) dailyMap[date] = { date, count: 0 };
                    dailyMap[date].count++;
                }

                // Parse the asset name
                const parts = path.split('/');
                const assetName = parts[parts.length - 1] || 'Unknown';
                
                if (assetName.includes('resume') || assetName.includes('cv')) {
                    resumeDownloads++;
                }
                
                increment(assetMap, assetName, 'Unknown');
            }
        });

        return {
            totalDownloads,
            resumeDownloads,
            dailyData: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
            assetData: toSortedData(assetMap, 10)
        };
    }, [visits]);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Download Analytics</h3>

            <div className="admin-analytics-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="admin-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(100, 255, 218, 0.1)', borderRadius: '12px', color: 'var(--primary-color)' }}>
                        <Download size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Downloads</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.totalDownloads}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Within selected range</div>
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(124, 77, 255, 0.1)', borderRadius: '12px', color: '#7c4dff' }}>
                        <FileText size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Resume/CV Downloads</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.resumeDownloads}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>High-intent actions</div>
                    </div>
                </div>
            </div>

            <div className="admin-analytics-grid" style={{ marginBottom: '2rem' }}>
                <AnalyticsChart
                    type="line"
                    title="Download Volume"
                    data={summary.dailyData}
                    xKey="date"
                    yKey="count"
                    icon={BarChart2}
                    height={350}
                    style={{ gridColumn: '1 / -1' }}
                />
            </div>

            <div className="admin-analytics-grid">
                <AnalyticsChart
                    type="bar"
                    title="Most Downloaded Assets"
                    data={summary.assetData}
                    xKey="name"
                    yKey="value"
                    icon={Download}
                    style={{ gridColumn: '1 / -1' }}
                />
            </div>
            
            {summary.totalDownloads === 0 && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', fontSize: '0.875rem' }}>
                    <strong>Note:</strong> Download tracking relies on the frontend sending visit events with paths starting with <code>/download</code> (e.g., <code>/download/resume.pdf</code>).
                </div>
            )}
        </div>
    );
};

export default AnalyticsDownloadsPanel;
