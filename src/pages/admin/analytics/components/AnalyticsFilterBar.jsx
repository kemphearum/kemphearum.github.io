import React, { useMemo } from 'react';
import { Calendar, Download, RefreshCw, Clock3 } from 'lucide-react';
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
 * @param {number} props.totalRecords - Total rows in current range
 */
const AnalyticsFilterBar = ({ 
    range, 
    onRangeChange, 
    onRefresh, 
    onExport, 
    isLoading,
    lastUpdated,
    totalRecords
}) => {
    const isInvalidRange = Boolean(range.start && range.end && range.start > range.end);

    const rangeLabel = useMemo(() => {
        if (!range.start || !range.end) return 'Select a date range';

        const startDate = new Date(`${range.start}T00:00:00`);
        const endDate = new Date(`${range.end}T00:00:00`);
        const dayDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const compact = { month: 'short', day: 'numeric' };
        const withYear = { ...compact, year: 'numeric' };

        const sameYear = startDate.getFullYear() === endDate.getFullYear();
        const startText = startDate.toLocaleDateString('en-US', sameYear ? compact : withYear);
        const endText = endDate.toLocaleDateString('en-US', withYear);
        const daysText = Number.isFinite(dayDiff) && dayDiff > 0 ? `${dayDiff} day${dayDiff > 1 ? 's' : ''}` : 'Custom';

        return `${startText} to ${endText} (${daysText})`;
    }, [range.end, range.start]);

    const handlePresetClick = (preset) => {
        const end = new Date();
        const start = new Date();
        
        switch (preset) {
            case 'today': break;
            case '7d': start.setDate(end.getDate() - 6); break;
            case '30d': start.setDate(end.getDate() - 29); break;
            case '90d': start.setDate(end.getDate() - 89); break;
            case 'all': start.setFullYear(2020); break;
            default: start.setDate(end.getDate() - 29);
        }

        onRangeChange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            preset
        });
    };

    const handleDateChange = (type, value) => {
        const nextRange = {
            ...range,
            [type]: value,
            preset: ''
        };

        if (type === 'start' && nextRange.end && value > nextRange.end) {
            nextRange.end = value;
        }
        if (type === 'end' && nextRange.start && value < nextRange.start) {
            nextRange.start = value;
        }

        onRangeChange(nextRange);
    };

    return (
        <div className="admin-analytics-filters">
            <div className="admin-filter-meta" aria-live="polite">
                <span className="admin-range-summary">{rangeLabel}</span>
                {typeof totalRecords === 'number' && (
                    <span className="admin-range-records">{totalRecords.toLocaleString()} records</span>
                )}
                {isInvalidRange && <span className="admin-range-error">Start date must be before end date.</span>}
            </div>

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
                        type="button"
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
                    max={range.end || undefined}
                    aria-label="Start date"
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                />
                <span className="admin-date-separator">to</span>
                <input
                    type="date"
                    value={range.end}
                    min={range.start || undefined}
                    aria-label="End date"
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                />
            </div>

            <div className="admin-filter-actions">
                <Button 
                    variant="secondary"
                    size="sm"
                    onClick={onExport}
                    disabled={isLoading || isInvalidRange}
                    className="ui-button--with-icon"
                >
                    <Download size={14} />
                    Export
                </Button>
                
                <Button
                    variant="primary"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading || isInvalidRange}
                    className="ui-button--with-icon"
                >
                    <RefreshCw size={14} className={isLoading ? 'ui-spin' : ''} />
                    {isLoading ? 'Wait...' : 'Refresh'}
                </Button>

                {lastUpdated && (
                    <div className="admin-last-updated-container">
                        <span className="admin-last-updated-label">Updated:</span>
                        <span className="admin-last-updated-time">
                            <Clock3 size={12} />
                            {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsFilterBar;
