import React from 'react';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import UsageBar from '../../components/UsageBar';
import styles from '../AuditLogsTab.module.scss';
import { useTranslation } from '../../../../hooks/useTranslation';

const AuditMetrics = ({ stats, onViewReads, onViewWrites, onViewDeletes }) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const { reads = 0, writes = 0, deletes = 0 } = stats || {};

  const metrics = [
    {
      key: 'reads',
      label: tr('Read Operations', 'សកម្មភាពអាន'),
      current: reads,
      total: 50000,
      icon: Eye,
      color: '#38bdf8',
      onDetails: onViewReads
    },
    {
      key: 'writes',
      label: tr('Write Operations', 'សកម្មភាពសរសេរ'),
      current: writes,
      total: 20000,
      icon: Edit3,
      color: '#a78bfa',
      onDetails: onViewWrites
    },
    {
      key: 'deletes',
      label: tr('Delete Operations', 'សកម្មភាពលុប'),
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
          <div key={metric.key} className="ui-card">
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
                {tr('View Details', 'មើលលម្អិត')}
              </button>
            </div>

            <UsageBar
              label={language === 'km' ? metric.label : metric.label.toUpperCase()}
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
