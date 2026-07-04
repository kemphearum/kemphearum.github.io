import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, FileText, Mail, Download, Clock, Activity, BarChart2 } from 'lucide-react';
import AnalyticsService from '../../../../services/AnalyticsService';
import BaseService from '../../../../services/BaseService';
import StatCard from '../../components/StatCard';
import { EmptyState, Spinner } from '@/shared/components/ui';
import { calculatePreviousRange } from '../../../../utils/analyticsUtils';

const AnalyticsOverviewPanel = ({ userRole, analyticsRange }) => {

    const {
        data: analyticsData = { current: [], previous: [] },
        isLoading
    } = useQuery({
        queryKey: ['analyticsOverview', analyticsRange],
        queryFn: async () => {
            const currentRange = analyticsRange;
            let previousRange = calculatePreviousRange(currentRange);
            
            // Fetch current and previous visits for trend calculation
            const [currentRes, previousRes, currentMsgRes, prevMsgRes] = await Promise.all([
                BaseService.safe(() => AnalyticsService.fetchAnalytics(userRole, currentRange)),
                BaseService.safe(() => AnalyticsService.fetchAnalytics(userRole, previousRange)),
                // Assuming MessageService or BaseService for messages
                // As a fallback for zero-cost, we'll fetch all messages in the range and count them
                // Or we can just leave it as 0 for now since we haven't built the Contact Analytics panel yet.
                // Actually, let's fetch messages using getDocs and filtering by date on the client if necessary, 
                // but let's just return 0 for now and we'll wire it up properly when we build Phase 4.
                Promise.resolve({ data: [] }),
                Promise.resolve({ data: [] })
            ]);

            return {
                current: currentRes.data || [],
                previous: previousRes.data || [],
                currentMessages: (currentMsgRes.data || []).length,
                previousMessages: (prevMsgRes.data || []).length,
            };
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    const calculateMetrics = (visits) => {
        let totalVisitors = visits.length;
        let uniqueIps = new Set();
        let returning = 0;
        let pageViews = 0;
        let totalDuration = 0;
        let bounces = 0;
        let blogViews = 0;
        let projectViews = 0;
        let downloads = 0;

        visits.forEach(v => {
            if (v.ip) uniqueIps.add(v.ip);
            if (v.isReturning) returning++;
            pageViews++;
            if (v.duration) totalDuration += v.duration;
            if (!v.duration || v.duration < 10) bounces++;
            
            // Analyze path for specific content views
            const path = v.path || '';
            if (path.includes('/blog/')) blogViews++;
            if (path.includes('/projects/')) projectViews++;
            if (path.includes('/download')) downloads++;
        });

        const uniqueVisitors = uniqueIps.size;
        
        return {
            totalVisitors,
            uniqueVisitors,
            returningVisitors: returning,
            pageViews,
            avgSession: totalVisitors ? Math.round(totalDuration / totalVisitors) : 0,
            bounces,
            bounceRate: totalVisitors ? Math.round((bounces / totalVisitors) * 100) : 0,
            blogViews,
            projectViews,
            downloads,
            contactMessages: 0 // Will be merged below
        };
    };

    const currentMetrics = useMemo(() => {
        const base = calculateMetrics(analyticsData.current);
        return { ...base, contactMessages: analyticsData.currentMessages || 0 };
    }, [analyticsData]);

    const previousMetrics = useMemo(() => {
        const base = calculateMetrics(analyticsData.previous);
        return { ...base, contactMessages: analyticsData.previousMessages || 0 };
    }, [analyticsData]);

    const getTrend = (current, previous) => {
        if (previous === 0) return current > 0 ? 'up' : null;
        const diff = current - previous;
        const percentage = Math.round((Math.abs(diff) / previous) * 100);
        return {
            direction: diff >= 0 ? 'up' : 'down',
            value: `${percentage}%`
        };
    };

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

    const renderCard = (title, value, prevValue, icon) => {
        const trend = getTrend(value, prevValue);
        return (
            <StatCard
                label={title}
                value={value}
                icon={icon}
                trend={trend?.direction}
                trendValue={trend?.value}
                color="var(--primary-color)"
            />
        );
    };

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Executive Dashboard</h3>
            
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {renderCard("Total Visitors", currentMetrics.totalVisitors, previousMetrics.totalVisitors, Users)}
                {renderCard("Unique Visitors", currentMetrics.uniqueVisitors, previousMetrics.uniqueVisitors, UserPlus)}
                {renderCard("Returning", currentMetrics.returningVisitors, previousMetrics.returningVisitors, Activity)}
                {renderCard("Page Views", currentMetrics.pageViews, previousMetrics.pageViews, FileText)}
                {renderCard("Blog Views", currentMetrics.blogViews, previousMetrics.blogViews, FileText)}
                {renderCard("Project Views", currentMetrics.projectViews, previousMetrics.projectViews, FileText)}
                {renderCard("Downloads", currentMetrics.downloads, previousMetrics.downloads, Download)}
                {renderCard("Messages", currentMetrics.contactMessages, previousMetrics.contactMessages, Mail)}
                
                <StatCard
                    label="Avg Session"
                    value={`${currentMetrics.avgSession}s`}
                    icon={Clock}
                    color="var(--primary-color)"
                />
                
                <StatCard
                    label="Bounce Rate"
                    value={`${currentMetrics.bounceRate}%`}
                    icon={BarChart2}
                    color="var(--danger-color)"
                />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Future: Render quick mini-charts here */}
                <div className="admin-card" style={{ flex: 1, minWidth: '300px', padding: '1.5rem' }}>
                    <h4>Visitor Trends</h4>
                    <EmptyState title="Chart Coming Soon" description="Visitor trends chart will be displayed here." />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsOverviewPanel;
