import React, { useState, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { db } from '../../../../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const Sparkline = ({ data, color, max }) => {
    if (!data || data.length === 0) return null;
    const height = 40;
    const width = 120;
    const padding = 2;
    const usableHeight = height - padding * 2;
    const maxValue = max || Math.max(...data, 1);
    
    const points = data.map((val, idx) => {
        const x = (idx / (data.length - 1 || 1)) * width;
        const y = height - padding - (val / maxValue) * usableHeight;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
            {data.map((val, idx) => {
                const x = (idx / (data.length - 1 || 1)) * width;
                const y = height - padding - (val / maxValue) * usableHeight;
                return <circle key={idx} cx={x} cy={y} r="2" fill={color} />;
            })}
        </svg>
    );
};

const DatabaseMonitoringPanel = () => {
    const [usageData, setUsageData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch last 7 days of usage
                const q = query(collection(db, 'dailyUsage'), orderBy('__name__', 'desc'), limit(7));
                const snap = await getDocs(q);
                const fetched = [];
                snap.forEach(doc => {
                    fetched.push({ id: doc.id, ...doc.data() });
                });
                // Reverse to have oldest first (left to right in charts)
                setUsageData(fetched.reverse());
            } catch (err) {
                console.error('Failed to fetch daily usage', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const extractSeries = (key) => usageData.map(d => d[key] || 0);

    const reads = extractSeries('reads');
    const writes = extractSeries('writes');
    const deletes = extractSeries('deletes');

    const sum = (arr) => arr.reduce((a, b) => a + b, 0);

    return (
        <div className="ui-actions-section">
            <div className="ui-flex-between ui-mb-medium">
                <h4 className="ui-flex-center-gap-small ui-m-0">
                    <BarChart2 size={18} className="ui-text-accent" /> Database Monitoring (7 Days)
                </h4>
            </div>
            
            <div className="ui-card ui-p-medium">
                {loading ? (
                    <div className="ui-text-center ui-text-muted">Loading metrics...</div>
                ) : usageData.length === 0 ? (
                    <div className="ui-text-center ui-text-muted">No usage data available yet.</div>
                ) : (
                    <div className="ui-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="ui-bg-subtle ui-p-medium ui-rounded" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="ui-text-muted ui-text-small ui-uppercase ui-font-bold">Total Reads</div>
                            <div className="ui-font-bold" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>{sum(reads)}</div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <Sparkline data={reads} color="var(--color-primary)" />
                            </div>
                        </div>

                        <div className="ui-bg-subtle ui-p-medium ui-rounded" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="ui-text-muted ui-text-small ui-uppercase ui-font-bold">Total Writes</div>
                            <div className="ui-font-bold" style={{ fontSize: '1.5rem', color: 'var(--color-success)' }}>{sum(writes)}</div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <Sparkline data={writes} color="var(--color-success)" />
                            </div>
                        </div>

                        <div className="ui-bg-subtle ui-p-medium ui-rounded" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="ui-text-muted ui-text-small ui-uppercase ui-font-bold">Total Deletes</div>
                            <div className="ui-font-bold" style={{ fontSize: '1.5rem', color: 'var(--color-danger)' }}>{sum(deletes)}</div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <Sparkline data={deletes} color="var(--color-danger)" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseMonitoringPanel;
