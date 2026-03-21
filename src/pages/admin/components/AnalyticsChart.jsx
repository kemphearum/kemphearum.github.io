import React, { useMemo } from 'react';
import { 
    ResponsiveContainer, 
    LineChart, 
    Line, 
    BarChart, 
    Bar, 
    PieChart, 
    Pie, 
    Cell, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend 
} from 'recharts';
import ChartCard from './ChartCard';
import EmptyState from '../../../shared/components/ui/empty-state/EmptyState';
import { BarChart2 } from 'lucide-react';

/**
 * AnalyticsChart Component
 * A reusable wrapper for Recharts with consistent styling and empty states.
 * 
 * @param {Object} props
 * @param {string} props.type - 'line', 'bar', or 'pie'
 * @param {Array} props.data - Chart data
 * @param {string} props.xKey - Data key for X axis
 * @param {string} props.yKey - Data key for Y axis (or value key for pie)
 * @param {string} props.title - Chart title
 * @param {React.ReactNode} props.icon - Lucide icon
 * @param {Array} props.colors - Array of colors for chart elements
 * @param {number} props.height - Chart height
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onViewDetails - Callback for "View Details" action
 * @param {string} props.emptyMessage - Message for empty state
 */
const AnalyticsChart = ({ 
    type = 'line', 
    data = [], 
    xKey, 
    yKey, 
    title, 
    icon: Icon = BarChart2,
    colors = ['#64ffda', '#7c4dff', '#ff6090', '#ffab40', '#69f0ae', '#40c4ff', '#ea80fc', '#ffd740', '#b388ff', '#84ffff'],
    height = 300,
    isLoading = false,
    onViewDetails,
    emptyMessage = "No data available for selected range"
}) => {
    const hasData = data && data.length > 0;

    const tooltipStyle = {
        background: 'var(--card-bg, #1a1a2e)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
        borderRadius: '12px',
        color: 'var(--text-primary)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)'
    };

    const renderChart = () => {
        if (!hasData) {
            return (
                <EmptyState 
                    icon={Icon}
                    title="No Data"
                    description={emptyMessage}
                    className="ui-chart-empty"
                />
            );
        }

        switch (type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis 
                                dataKey={xKey} 
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} 
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip 
                                contentStyle={tooltipStyle}
                                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                            />
                            <Bar 
                                dataKey={yKey} 
                                radius={[6, 6, 0, 0]}
                                animationDuration={1000}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={height * 0.25}
                                outerRadius={height * 0.4}
                                paddingAngle={5}
                                dataKey={yKey}
                                nameKey={xKey}
                                animationDuration={1000}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend 
                                verticalAlign="bottom" 
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '0.75rem', paddingTop: '1rem' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'line':
            default:
                // For multi-line, yKey can be an array
                const yKeys = Array.isArray(yKey) ? yKey : [yKey];
                
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis 
                                dataKey={xKey} 
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                tickFormatter={(v) => {
                                    if (typeof v === 'string' && v.includes('-')) {
                                        const d = new Date(v + 'T00:00:00');
                                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    }
                                    return v;
                                }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip 
                                contentStyle={tooltipStyle}
                                labelFormatter={(v) => {
                                    if (typeof v === 'string' && v.includes('-')) {
                                        return new Date(v + 'T00:00:00').toLocaleDateString('en-US', { 
                                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                                        });
                                    }
                                    return v;
                                }}
                            />
                            {yKeys.map((key, index) => (
                                <Line 
                                    key={key}
                                    type="monotone" 
                                    dataKey={key} 
                                    stroke={colors[index % colors.length]} 
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: 'var(--card-bg)' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                    animationDuration={1500}
                                />
                            ))}
                            <Legend 
                                verticalAlign="top" 
                                align="right" 
                                iconType="circle"
                                wrapperStyle={{ fontSize: '0.75rem', top: -10 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <ChartCard 
            title={title} 
            icon={Icon} 
            onViewDetails={onViewDetails}
            isLoading={isLoading}
        >
            <div className="ui-analytics-chart-container">
                {renderChart()}
            </div>
        </ChartCard>
    );
};

export default React.memo(AnalyticsChart);
