import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Briefcase, Activity } from 'lucide-react';
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

const extractContentId = (path) => {
    if (!path) return null;
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
        // e.g. /projects/my-project -> my-project
        return parts[1];
    }
    return null;
};

const AnalyticsContentPanel = ({ userRole, analyticsRange }) => {

    const {
        data: visits = [],
        isLoading
    } = useQuery({
        queryKey: ['analyticsContent', analyticsRange],
        queryFn: async () => {
            const res = await BaseService.safe(() => AnalyticsService.fetchAnalytics(userRole, analyticsRange));
            return res.data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    const summary = useMemo(() => {
        const blogMap = {};
        const projectMap = {};
        const pathMap = {};

        visits.forEach((v) => {
            const path = v.path || '';
            increment(pathMap, path, '/');

            if (path.startsWith('/blog/')) {
                const id = extractContentId(path);
                if (id) increment(blogMap, id, 'unknown');
            } else if (path.startsWith('/projects/')) {
                const id = extractContentId(path);
                if (id) increment(projectMap, id, 'unknown');
            }
        });

        return {
            topPages: toSortedData(pathMap, 10),
            topBlogs: toSortedData(blogMap, 10),
            topProjects: toSortedData(projectMap, 10)
        };
    }, [visits]);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Content Analytics</h3>

            <div className="admin-grid" style={{ marginBottom: '2rem' }}>
                <AnalyticsChart
                    type="bar"
                    title="Most Viewed Pages (Overall)"
                    data={summary.topPages}
                    xKey="name"
                    yKey="value"
                    icon={Activity}
                    height={350}
                    style={{ gridColumn: '1 / -1' }}
                />
            </div>

            <div className="admin-grid">
                <AnalyticsChart
                    type="bar"
                    title="Top Blog Posts"
                    data={summary.topBlogs}
                    xKey="name"
                    yKey="value"
                    icon={FileText}
                />
                <AnalyticsChart
                    type="bar"
                    title="Top Projects"
                    data={summary.topProjects}
                    xKey="name"
                    yKey="value"
                    icon={Briefcase}
                />
            </div>
        </div>
    );
};

export default AnalyticsContentPanel;
