import React from 'react';

const UsageBar = ({
    label,
    current,
    total,
    percentage,
    color,
    hint,
    style
}) => {
    const displayPercentage = percentage !== undefined ? percentage : (total > 0 ? (current / total) * 100 : 0);
    const displayColor = color || (displayPercentage > 90 ? '#ef4444' : displayPercentage > 75 ? '#f59e0b' : '#10b981');

    return (
        <div className="admin-usage-container" style={style}>
            <div className="admin-usage-header">
                <span className="admin-usage-label">{label}</span>
                <span className="admin-usage-stats" style={{ color: displayColor }}>
                    {displayPercentage.toFixed(displayPercentage < 10 ? 2 : 1)}%
                    ({current?.toLocaleString()} / {total?.toLocaleString()})
                </span>
            </div>
            <div className="admin-usage-track">
                <div
                    className="admin-usage-fill"
                    style={{
                        width: `${Math.min(displayPercentage, 100)}%`,
                        background: displayColor
                    }}
                ></div>
            </div>
            {hint && <div className="admin-usage-hint">{hint}</div>}
        </div>
    );
};

export default UsageBar;
