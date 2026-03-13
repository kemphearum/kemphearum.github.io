import React from 'react';
import { TrendingUp, Globe, Monitor, FileText, MapPin, Share2, RefreshCw, Users, UserCheck, Calendar } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import styles from '../../Admin.module.scss';
import BaseModal from './BaseModal';

const parseBrowser = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    return 'Other';
};

const AnalyticsDetailModal = ({
    analyticsDetail,
    setAnalyticsDetail,
    analyticsLogsLoading,
    analyticsLogs = [],
    analyticsLogsTotal,
    quotaExceeded = false
}) => {
    if (!analyticsDetail) return null;

    const onClose = () => setAnalyticsDetail(null);

    return (
        <BaseModal
            isOpen={!!analyticsDetail}
            onClose={onClose}
            zIndex={1400}
            maxWidth="850px"
            bodyStyle={{ padding: 0 }}
            headerStyle={{
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}
            headerContent={
                <>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-color)' }}>
                        {analyticsDetail === 'visits' && <><TrendingUp size={24} /> Comprehensive Visit Activity History</>}
                        {analyticsDetail === 'countries' && <><Globe size={24} /> Audience Geographic Distribution</>}
                        {analyticsDetail === 'devices' && <><Monitor size={24} /> Technical Device Infrastructure</>}
                        {analyticsDetail === 'pages' && <><FileText size={24} /> Content Performance Metrics</>}
                        {analyticsDetail === 'cities' && <><MapPin size={24} /> Regional Engagement Breakdown</>}
                        {analyticsDetail === 'referrers' && <><Share2 size={24} /> Acquisition & Traffic Sources</>}
                        {analyticsDetail === 'retention' && <><Users size={24} /> Audience Loyalty & Retention Analysis</>}
                    </h3>
                    <p>
                        Detailed insights based on {analyticsLogsTotal || analyticsLogs.length} tracked interactions
                    </p>
                    {quotaExceeded && (
                        <div style={{ marginTop: '0.5rem', color: '#ffab40', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Activity size={14} /> 
                            <span>Firestore quota reached. Showing partial or local data.</span>
                        </div>
                    )}
                </>
            }
            footerContent={
                <button onClick={onClose} className={styles.primaryBtn} style={{ padding: '0.6rem 1.5rem', margin: 0, fontSize: '0.85rem' }}>Close</button>
            }
        >
            <div style={{ position: 'relative' }}>
                {analyticsLogsLoading ? (
                    <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 1.5rem' }}>
                            <RefreshCw size={60} className={styles.spin} style={{ opacity: 0.1 }} />
                            <RefreshCw size={30} className={styles.spin} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--primary-color)' }} />
                        </div>
                        <p className={styles.hint} style={{ letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>Aggregating Analytics Data...</p>
                    </div>
                ) : analyticsDetail === 'visits' ? (
                    <div style={{ padding: '1.5rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                Retrieved {analyticsLogs.length} recent sessions
                            </span>
                        </div>
                        <div className={styles.tableWrapper} style={{ borderRadius: '16px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '700px' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <tr>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>#</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Page Path</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Region</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Platform</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>IP Address</th>
                                        <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsLogs.length > 0 ? analyticsLogs.map((v, i) => (
                                        <tr key={`visitor-${v.id || i}`} style={{ transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', color: 'var(--text-secondary)' }}>{i + 1}</td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: 600 }}>{v.path || '/'}</td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                {v.countryCode ? <span title={v.country} style={{ fontWeight: 500 }}>{v.countryCode} {v.city ? <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>• {v.city}</span> : ''}</span> : (v.country || 'Unknown')}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{v.device || 'Desktop'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{parseBrowser(v.userAgent)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem', fontFamily: 'monospace', opacity: 0.7 }}>{v.ip || '-'}</td>
                                            <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                {v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : v.date || '-'}
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No visit data for this range.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {analyticsLogsTotal > analyticsLogs.length && (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    Showing the most recent {analyticsLogs.length} of {analyticsLogsTotal} sessions.
                                </p>
                            </div>
                        )}
                    </div>
                ) : analyticsDetail === 'retention' ? (
                    <div style={{ padding: '1.5rem' }}>
                        {(() => {
                            // Calculate Daily Trends
                            const dailyRetention = {};
                            const ipFrequency = {};
                            analyticsLogs.forEach(v => {
                                const date = v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toISOString().split('T')[0] : v.date;
                                if (date) {
                                    if (!dailyRetention[date]) dailyRetention[date] = { date, new: 0, returning: 0 };
                                    if (v.isReturning) dailyRetention[date].returning++;
                                    else dailyRetention[date].new++;
                                }
                                if (v.ip) {
                                    if (!ipFrequency[v.ip]) ipFrequency[v.ip] = { ip: v.ip, count: 0, first: v.timestamp, last: v.timestamp, country: v.country, city: v.city };
                                    ipFrequency[v.ip].count++;
                                    if (v.timestamp?.seconds && (!ipFrequency[v.ip].last?.seconds || v.timestamp.seconds > ipFrequency[v.ip].last.seconds)) ipFrequency[v.ip].last = v.timestamp;
                                    if (v.timestamp?.seconds && (!ipFrequency[v.ip].first?.seconds || v.timestamp.seconds < ipFrequency[v.ip].first.seconds)) ipFrequency[v.ip].first = v.timestamp;
                                }
                            });
                            const trends = Object.values(dailyRetention).sort((a, b) => a.date.localeCompare(b.date));
                            const frequentVisitors = Object.values(ipFrequency).filter(v => v.count > 1).sort((a, b) => b.count - a.count);
                            const totalReturning = analyticsLogs.filter(v => v.isReturning).length;
                            const uniqueReturning = Object.values(ipFrequency).filter(v => v.count > 1).length;
                            const avgVisits = uniqueReturning ? (totalReturning / uniqueReturning).toFixed(1) : 0;

                            return (
                                <>
                                    <div className={styles.analyticsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}><UserCheck size={14} /> Total Returning</div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#7c4dff' }}>{totalReturning}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}><Users size={14} /> Unique Returnees</div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary-color)' }}>{uniqueReturning}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}><TrendingUp size={14} /> Avg. Visits / User</div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ff6090' }}>{avgVisits}</div>
                                        </div>
                                    </div>

                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}><Calendar size={18} /> Daily Retention Trends</h4>
                                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2.5rem' }}>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={trends}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} />
                                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                                                <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} />
                                                <Legend />
                                                <Line type="monotone" dataKey="new" stroke="#64ffda" strokeWidth={3} name="New Visitors" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                <Line type="monotone" dataKey="returning" stroke="#7c4dff" strokeWidth={3} name="Returning Visitors" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}><UserCheck size={18} /> Returning Visitor Frequency</h4>
                                    <div className={styles.tableWrapper} style={{ borderRadius: '16px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                            <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <tr>
                                                    <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Visitor IP</th>
                                                    <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Location</th>
                                                    <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>Total Visits</th>
                                                    <th style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>Latest Activity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {frequentVisitors.length > 0 ? frequentVisitors.slice(0, 50).map((pv, idx) => (
                                                    <tr key={pv.ip} style={{ transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                        <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{pv.ip}</td>
                                                        <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
                                                            {pv.city && pv.country ? `${pv.city}, ${pv.country}` : pv.country || 'Unknown'}
                                                        </td>
                                                        <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                                                            <span style={{ background: 'rgba(100, 255, 218, 0.1)', color: 'var(--primary-color)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 'bold' }}>{pv.count}</span>
                                                        </td>
                                                        <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {pv.last?.seconds ? new Date(pv.last.seconds * 1000).toLocaleString() : 'Recent'}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No frequent visitors identified in this range.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                ) : (
                    <div style={{ padding: '2rem' }}>
                        {(() => {
                            const CHART_COLORS = ['#64ffda', '#7c4dff', '#ff6090', '#ffab40', '#69f0ae', '#40c4ff', '#ea80fc', '#ffd740', '#b388ff', '#84ffff'];
                            
                            // Generic Aggregation
                            const dataMap = {};
                            const total = analyticsLogs.length;
                            
                            analyticsLogs.forEach(v => {
                                let key = 'Unknown';
                                if (analyticsDetail === 'countries') key = v.country || 'Unknown';
                                else if (analyticsDetail === 'cities') key = v.city ? `${v.city}, ${v.country || ''}` : v.country || 'Unknown';
                                else if (analyticsDetail === 'devices') key = (v.device || 'desktop').charAt(0).toUpperCase() + (v.device || 'desktop').slice(1);
                                else if (analyticsDetail === 'pages') key = v.path || '/';
                                else if (analyticsDetail === 'referrers') key = v.referrer || 'Direct';
                                else if (analyticsDetail === 'browsers') key = parseBrowser(v.userAgent);
                                else if (analyticsDetail === 'os') key = v.os || 'Unknown';
                                
                                dataMap[key] = (dataMap[key] || 0) + 1;
                            });
                            
                            const aggregatedData = Object.entries(dataMap)
                                .map(([name, value]) => ({ 
                                    name, 
                                    value, 
                                    percentage: total ? (value / total) * 100 : 0 
                                }))
                                .sort((a, b) => b.value - a.value);

                            const chartType = ['cities', 'pages'].includes(analyticsDetail) ? 'bar' : 'pie';

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem' }}>
                                        <ResponsiveContainer width="100%" height={320}>
                                            {chartType === 'bar' ? (
                                                <BarChart data={aggregatedData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                                    <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                                    <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={120} />
                                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px' }} />
                                                    <Bar dataKey="value" name="Visits" radius={[0, 4, 4, 0]}>
                                                        {aggregatedData.slice(0, 10).map((entry, i) => <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                                    </Bar>
                                                </BarChart>
                                            ) : (
                                                <PieChart>
                                                    <Pie data={aggregatedData.slice(0, 8)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="name" label={({name, percent}) => `${name} (${(percent*100).toFixed(1)}%)`}>
                                                        {aggregatedData.slice(0, 8).map((entry, i) => <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px' }} />
                                                    <Legend verticalAlign="bottom" height={36}/>
                                                </PieChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>

                                    <div className={styles.tableWrapper} style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                            <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <tr>
                                                    <th style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                                                        {analyticsDetail === 'countries' ? 'Country' : 
                                                         analyticsDetail === 'cities' ? 'City' : 
                                                         analyticsDetail === 'devices' ? 'Device' : 
                                                         analyticsDetail === 'pages' ? 'Page Path' : 
                                                         analyticsDetail === 'referrers' ? 'Source' : 
                                                         analyticsDetail === 'browsers' ? 'Browser' : 'Operating System'}
                                                    </th>
                                                    <th style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', width: '100px' }}>Visits</th>
                                                    <th style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'right', width: '120px' }}>Percentage</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {aggregatedData.map((d, i) => (
                                                    <tr key={d.name} style={{ transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: 600 }}>{d.name}</td>
                                                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>{d.value.toLocaleString()}</td>
                                                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d.percentage.toFixed(1)}%</span>
                                                                <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${d.percentage}%`, height: '100%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

export default AnalyticsDetailModal;
