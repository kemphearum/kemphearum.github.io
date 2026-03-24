import React from 'react';
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
            className={`ui-statCard ${onClick ? 'ui-clickableStat' : ''} ${className}`}
            onClick={onClick}
            style={style}
            {...props}
        >
            <div className="ui-statIcon" style={{ background: `${color}15`, color: color }}>
                {Icon && <Icon size={20} />}
            </div>
            <div className="ui-statInfo">
                <div className="ui-statValue">{value}</div>
                <div className="ui-statLabel">{label}</div>
                {description && <div className="ui-statDescription">{description}</div>}
            </div>
            {trend && (
                <div className={`ui-statTrend ${isPositive ? 'ui-trendUp' : 'ui-trendDown'}`}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{trendValue}</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
