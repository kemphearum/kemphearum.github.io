import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Search, AlertCircle, TrendingUp, Hash } from 'lucide-react';
import { db } from '../../../../firebase';
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

const AnalyticsSearchPanel = ({ analyticsRange }) => {

    const {
        data: searches = [],
        isLoading
    } = useQuery({
        queryKey: ['analyticsSearches', analyticsRange],
        queryFn: async () => {
            const startDate = new Date(analyticsRange.start);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(analyticsRange.end);
            endDate.setHours(23, 59, 59, 999);

            const q = query(
                collection(db, 'searchLogs'),
                where('timestamp', '>=', startDate),
                where('timestamp', '<=', endDate),
                orderBy('timestamp', 'desc')
            );
            
            const res = await BaseService.safe(() => getDocs(q));
            if (res.error) {
                // If missing index or collection doesn't exist yet, fallback
                const allQ = query(collection(db, 'searchLogs'), orderBy('timestamp', 'desc'));
                const allRes = await BaseService.safe(() => getDocs(allQ));
                if (allRes.data) {
                    return allRes.data.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter(d => {
                            if (!d.timestamp?.seconds) return true;
                            const dTime = d.timestamp.seconds * 1000;
                            return dTime >= startDate.getTime() && dTime <= endDate.getTime();
                        });
                }
                return [];
            }
            return res.data.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    const summary = useMemo(() => {
        const keywordMap = {};
        const noResultMap = {};
        let totalSearches = searches.length;
        let zeroResultCount = 0;

        searches.forEach((s) => {
            const term = s.query?.toLowerCase() || 'unknown';
            increment(keywordMap, term);

            if (s.resultsCount === 0) {
                zeroResultCount++;
                increment(noResultMap, term);
            }
        });

        return {
            totalSearches,
            zeroResultCount,
            topKeywords: toSortedData(keywordMap, 10),
            topNoResultKeywords: toSortedData(noResultMap, 10)
        };
    }, [searches]);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Search Analytics</h3>

            <div className="admin-analytics-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="admin-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(100, 255, 218, 0.1)', borderRadius: '12px', color: 'var(--primary-color)' }}>
                        <Search size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Searches Recorded</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.totalSearches}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Within selected range</div>
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255, 82, 82, 0.1)', borderRadius: '12px', color: 'var(--danger-color)' }}>
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Searches with No Results</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.zeroResultCount}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Missed opportunities</div>
                    </div>
                </div>
            </div>

            <div className="admin-analytics-grid">
                <AnalyticsChart
                    type="bar"
                    title="Most Popular Keywords"
                    data={summary.topKeywords}
                    xKey="name"
                    yKey="value"
                    icon={TrendingUp}
                />
                <AnalyticsChart
                    type="bar"
                    title="Top 'No Result' Searches"
                    data={summary.topNoResultKeywords}
                    xKey="name"
                    yKey="value"
                    icon={Hash}
                    colors={['#ff5252']}
                />
            </div>
            
            {searches.length === 0 && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', fontSize: '0.875rem' }}>
                    <strong>Note:</strong> Search tracking is prepared for architecture integration. Once the frontend starts logging to the <code>searchLogs</code> collection, data will appear here.
                </div>
            )}
        </div>
    );
};

export default AnalyticsSearchPanel;
