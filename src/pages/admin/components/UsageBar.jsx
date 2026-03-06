import React from 'react';
import styles from '../../Admin.module.scss';

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
        <div className={styles.usageContainer} style={style}>
            <div className={styles.usageHeader}>
                <span className={styles.usageLabel}>{label}</span>
                <span className={styles.usageStats} style={{ color: displayColor }}>
                    {displayPercentage.toFixed(displayPercentage < 10 ? 2 : 1)}%
                    ({current?.toLocaleString()} / {total?.toLocaleString()})
                </span>
            </div>
            <div className={styles.usageTrack}>
                <div
                    className={styles.usageFill}
                    style={{
                        width: `${Math.min(displayPercentage, 100)}%`,
                        background: displayColor
                    }}
                ></div>
            </div>
            {hint && <div className={styles.usageHint}>{hint}</div>}
        </div>
    );
};

export default UsageBar;
