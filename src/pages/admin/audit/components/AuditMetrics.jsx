import React from 'react';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import UsageBar from '../../components/UsageBar';
import styles from '../AuditLogsTab.module.scss';

const AuditMetrics = ({ stats, onViewReads, onViewWrites, onViewDeletes }) => {
  const { reads = 0, writes = 0, deletes = 0 } = stats || {};

  const metrics = [
    {
      label: 'Read Operations',
      current: reads,
      total: 50000,
      icon: Eye,
      color: '#38bdf8',
      onDetails: onViewReads
    },
    {
      label: 'Write Operations',
      current: writes,
      total: 20000,
      icon: Edit3,
      color: '#a78bfa',
      onDetails: onViewWrites
    },
    {
      label: 'Delete Operations',
      current: deletes,
      total: 20000,
      icon: Trash2,
      color: '#fb923c',
      onDetails: onViewDeletes
    }
  ];

  return (
    <div className={styles.metricsGrid}>
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.label} className="ui-card">
            <div className={styles.metricHeader}>
              <div
                className={styles.metricIcon}
                style={{ backgroundColor: `${metric.color}15`, color: metric.color }}
              >
                <Icon size={18} />
              </div>
              <button
                type="button"
                onClick={metric.onDetails}
                className={styles.viewDetailsBtn}
              >
                View Details
              </button>
            </div>

            <UsageBar
              label={metric.label.toUpperCase()}
              current={metric.current}
              total={metric.total}
              color={metric.color}
              style={{ marginTop: '1rem', marginBottom: 0 }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default AuditMetrics;
