import React from 'react';
import { Calendar, Download, RefreshCw } from 'lucide-react';
import Button from '../../../../shared/components/ui/button/Button';

/**
 * AnalyticsFilterBar Component
 * A reusable filter bar for analytics with presets and custom date range.
 * 
 * @param {Object} props
 * @param {Object} props.range - { start, end, preset }
 * @param {Function} props.onRangeChange - Callback when range changes
 * @param {Function} props.onRefresh - Callback for refresh action
 * @param {Function} props.onExport - Callback for export action
 * @param {boolean} props.isLoading - Loading state for refresh button
 * @param {Date|number} props.lastUpdated - Last update timestamp
 */
const AnalyticsFilterBar = ({ 
    range, 
    onRangeChange, 
    onRefresh, 
    onExport, 
    isLoading,
    lastUpdated 
}) => {
    const handlePresetClick = (preset) => {
        const end = new Date();
        const start = new Date();
        
        switch (preset) {
            case 'today': break;
            case '7d': start.setDate(end.getDate() - 7); break;
            case '30d': start.setDate(end.getDate() - 30); break;
            case '90d': start.setDate(end.getDate() - 90); break;
            case 'all': start.setFullYear(2020); break;
            default: start.setDate(end.getDate() - 30);
        }

        onRangeChange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            preset
        });
    };

    const handleDateChange = (type, value) => {
        onRangeChange({
            ...range,
            [type]: value,
            preset: ''
        });
    };

    return (
        <div className="admin-analytics-filters">
            <div className="admin-preset-group">
                {[
                    { label: 'Today', value: 'today' },
                    { label: '7D', value: '7d' },
                    { label: '30D', value: '30d' },
                    { label: '90D', value: '90d' },
                    { label: 'All', value: 'all' }
                ].map(p => (
                    <button
                        key={p.value}
                        className={`admin-preset-btn ${range.preset === p.value ? 'active' : ''}`}
                        onClick={() => handlePresetClick(p.value)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="admin-date-range-picker">
                <Calendar size={14} className="ui-input-icon" />
                <input
                    type="date"
                    value={range.start}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                />
                <span className="admin-date-separator">to</span>
                <input
                    type="date"
                    value={range.end}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                />
            </div>

            <div className="admin-filter-actions">
                <Button 
                    variant="secondary"
                    size="sm"
                    onClick={onExport}
                    disabled={isLoading}
                    className="ui-button--with-icon"
                >
                    <Download size={14} />
                    Export
                </Button>
                
                <Button
                    variant="primary"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="ui-button--with-icon"
                >
                    <RefreshCw size={14} className={isLoading ? 'ui-spin' : ''} />
                    {isLoading ? 'Wait...' : 'Refresh'}
                </Button>

                {lastUpdated && (
                    <div className="admin-last-updated-container">
                        <span className="admin-last-updated-label">Updated:</span>
                        <span className="admin-last-updated-time">
                            {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsFilterBar;
