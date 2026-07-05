import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Mail, CheckCircle, ShieldAlert, BarChart2 } from 'lucide-react';
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

const toDateKey = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value?.seconds) return new Date(value.seconds * 1000).toISOString().split('T')[0];
    return null;
};

const AnalyticsContactPanel = ({ analyticsRange }) => {

    const {
        data: messages = [],
        isLoading
    } = useQuery({
        queryKey: ['analyticsContacts', analyticsRange],
        queryFn: async () => {
            const startDate = new Date(analyticsRange.start);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(analyticsRange.end);
            endDate.setHours(23, 59, 59, 999);

            const q = query(
                collection(db, 'messages'),
                where('createdAt', '>=', startDate),
                where('createdAt', '<=', endDate),
                orderBy('createdAt', 'desc')
            );
            
            const res = await BaseService.safe(() => getDocs(q));
            if (res.error) {
                // If index is missing, we fallback to fetch all and filter locally for zero-cost
                const allQ = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
                const allRes = await BaseService.safe(() => getDocs(allQ));
                if (allRes.data) {
                    return allRes.data.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter(d => {
                            if (!d.createdAt?.seconds) return true;
                            const dTime = d.createdAt.seconds * 1000;
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
        const dailyMap = {};
        let unread = 0;
        let read = 0;
        let spam = 0;
        let total = messages.length;
        const categoryMap = {};

        messages.forEach((m) => {
            const date = toDateKey(m.createdAt);
            if (date) {
                if (!dailyMap[date]) dailyMap[date] = { date, count: 0 };
                dailyMap[date].count++;
            }

            if (m.isRead) read++;
            else unread++;

            if (m.isSpam) spam++;
            
            increment(categoryMap, m.subject || m.category, 'General Inquiry');
        });

        return {
            dailyData: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
            statusData: [
                { name: 'Read/Replied', value: read },
                { name: 'Unread', value: unread }
            ],
            categoryData: toSortedData(categoryMap, 5),
            total,
            unread,
            spam
        };
    }, [messages]);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Contact Analytics</h3>

            <div className="admin-analytics-grid" style={{ marginBottom: '2rem' }}>
                <div className="admin-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(100, 255, 218, 0.1)', borderRadius: '8px', color: 'var(--primary-color)' }}>
                            <Mail size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Messages</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.total}</div>
                        </div>
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255, 171, 64, 0.1)', borderRadius: '8px', color: '#ffab40' }}>
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Unread Actions Pending</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.unread}</div>
                        </div>
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255, 82, 82, 0.1)', borderRadius: '8px', color: 'var(--danger-color)' }}>
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Spam Detected</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.spam}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-analytics-grid" style={{ marginBottom: '2rem' }}>
                <AnalyticsChart
                    type="line"
                    title="Message Volume"
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
                    type="pie"
                    title="Response Status"
                    data={summary.statusData}
                    xKey="name"
                    yKey="value"
                    icon={Mail}
                />
                <AnalyticsChart
                    type="bar"
                    title="Top Inquiry Subjects"
                    data={summary.categoryData}
                    xKey="name"
                    yKey="value"
                    icon={Mail}
                />
            </div>
        </div>
    );
};

export default AnalyticsContactPanel;
