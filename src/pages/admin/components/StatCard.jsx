import React from 'react';
import styles from '../../Admin.module.scss';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({
    icon: Icon,
    value,
    label,
    color = 'var(--primary-color)',
    trend,
    trendValue,
    onClick,
    description,
    className = '',
    style = {},
    ...props
}) => {
    const isPositive = trend === 'up';

    return (
        <div
            className={`${styles.statCard} ${onClick ? styles.clickableStat : ''} ${className}`}
            onClick={onClick}
            style={style}
            {...props}
        >
            <div className={styles.statIcon} style={{ background: `${color}15`, color: color }}>
                {Icon && <Icon size={20} />}
            </div>
            <div className={styles.statInfo}>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
                {description && <div className={styles.statDescription}>{description}</div>}
            </div>
            {trend && (
                <div className={`${styles.statTrend} ${isPositive ? styles.trendUp : styles.trendDown}`}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{trendValue}</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
