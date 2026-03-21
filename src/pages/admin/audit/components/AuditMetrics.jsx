import React from 'react';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import UsageBar from '../../components/UsageBar';
import styles from '../AuditLogsTab.module.scss';

const AuditMetrics = ({ stats, onViewReads, onViewWrites, onViewDeletes }) => {
  const { reads = 0, writes = 0, deletes = 0 } = stats || {};

  const metrics = [
    {
      label: 'READ OPERATIONS',
      current: reads,
      total: 50000,
      icon: Eye,
      color: '#38bdf8',
      showDetails: true,
      onDetails: onViewReads
    },
    {
      label: 'WRITE OPERATIONS',
      current: writes,
      total: 20000,
      icon: Edit3,
      color: '#a78bfa',
      showDetails: true,
      onDetails: onViewWrites
    },
    {
      label: 'DELETE OPERATIONS',
      current: deletes,
      total: 20000,
      icon: Trash2,
      color: '#fb923c',
      showDetails: true,
      onDetails: onViewDeletes
    }
  ];

  return (
    <div className={styles.metricsGrid}>
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <div key={idx} className="ui-card">
            <div className={styles.metricHeader}>
              <div 
                className={styles.metricIcon} 
                style={{ backgroundColor: `${metric.color}15`, color: metric.color }}
              >
                <Icon size={18} />
              </div>
              {metric.showDetails && (
                <button 
                  onClick={metric.onDetails}
                  className={styles.viewDetailsBtn}
                >
                  View Details →
                </button>
              )}
            </div>
            
            <UsageBar
              label={metric.label}
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
