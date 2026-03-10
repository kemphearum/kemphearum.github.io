import React from 'react';
import styles from '../../Admin.module.scss';
import { RefreshCw } from 'lucide-react';

const ChartCard = ({
    title,
    icon: Icon,
    onRefresh,
    onViewDetails,
    isLoading,
    children,
    headerRight
}) => {
    return (
        <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
                <div className={styles.chartTitle}>
                    {Icon && <Icon size={18} style={{ color: 'var(--primary-color)' }} />}
                    <span>{title}</span>
                </div>
                <div className={styles.chartActions}>
                    {headerRight}
                    {onViewDetails && (
                        <button className={styles.detailBtn} onClick={onViewDetails}>
                            View Details
                        </button>
                    )}
                    {onRefresh && (
                        <button
                            className={styles.refreshBtn}
                            onClick={onRefresh}
                            disabled={isLoading}
                        >
                            <RefreshCw size={14} className={isLoading ? styles.spin : ''} />
                            Refresh
                        </button>
                    )}
                </div>
            </div>
            <div className={`${styles.chartBody} ${isLoading ? styles.chartLoading : ''}`}>
                {children}
            </div>
        </div>
    );
};

export default ChartCard;
