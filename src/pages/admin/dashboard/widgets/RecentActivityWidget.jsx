import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight } from 'lucide-react';
import { Card, Spinner, EmptyState } from '@/shared/components/ui';
import BaseService from '../../../../services/BaseService';
import AuditLogService from '../../../../services/AuditLogService';
import styles from '../DashboardTab.module.scss';

const formatDate = (value, language) => {
  const seconds = value?.seconds;
  if (!seconds) return '';
  return new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(seconds * 1000));
};

const RecentActivityWidget = ({ ctx }) => {
  const { t, language, go, currentDateKey } = ctx;

  const { data: recentActivity = [], isLoading } = useQuery({
    queryKey: ['dashboard', 'recentActivity', currentDateKey],
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await BaseService.safe(() => AuditLogService.fetchActivityDetails({ activityDateRange: 'all', operationType: 'all', currentDateKey, limit: 6 }));
      return error ? [] : (data.data || []);
    }
  });

  return (
    <Card className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.sectionTitle}><Activity size={16} /> {t('admin.dashboard.recentActivity')}</h2>
        <button type="button" className={styles.viewAll} onClick={() => go('audit')}>
          {t('admin.dashboard.viewAll')} <ArrowRight size={14} />
        </button>
      </div>
      {isLoading ? (
        <div className={styles.listLoading}><Spinner size="md" /></div>
      ) : !recentActivity.length ? (
        <EmptyState title={t('admin.dashboard.empty')} />
      ) : (
        <ul className={styles.activityList}>
          {recentActivity.map((log) => (
            <li key={log.id} className={styles.activityItem}>
              <span className={styles.activityAction}>{log.action || '-'}</span>
              <span className={styles.activityModule}>{log.module || ''}</span>
              <span className={styles.activityEntity}>{log.details?.entityName || log.label || ''}</span>
              <span className={styles.activityTime}>{formatDate(log.time || log.timestamp, language)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default RecentActivityWidget;
