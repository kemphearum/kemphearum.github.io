import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Spinner, Skeleton } from '@/shared/components/ui';
import BaseService from '../../../../services/BaseService';
import BlogService from '../../../../services/BlogService';
import ProjectService from '../../../../services/ProjectService';
import { getLocalizedField, formatLocalizedPeriod } from '../../../../utils/localization';
import { MODULES } from '../../../../utils/permissions';
import { STATUS, STATUS_VALUES, computeEffectiveStatus } from '../../../../domain/shared/contentStatus';
import styles from '../DashboardTab.module.scss';

const QUERY_OPTS = { staleTime: 60000, gcTime: 300000, refetchOnWindowFocus: false };

const STATUS_COLOR = {
  [STATUS.PUBLISHED]: '#10b981',
  [STATUS.SCHEDULED]: '#2f6df6',
  [STATUS.DRAFT]: '#f59e0b',
  [STATUS.ARCHIVED]: '#94a3b8'
};

const monthKey = (item) => {
  const seconds = item.createdAt?.seconds;
  if (!seconds) return null;
  const d = new Date(seconds * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const InsightsWidget = ({ ctx }) => {
  const { can, t, language } = ctx;

  const { data: posts = [], isLoading: pl } = useQuery({
    queryKey: ['dashboard', 'insights', 'posts'], enabled: can(MODULES.BLOG), ...QUERY_OPTS,
    queryFn: async () => { const { data, error } = await BaseService.safe(() => BlogService.fetchPaginated({ limit: 50, sortBy: 'createdAt', sortDirection: 'desc', includeTotal: false })); return error ? [] : (data.data || []); }
  });
  const { data: projects = [], isLoading: prl } = useQuery({
    queryKey: ['dashboard', 'insights', 'projects'], enabled: can(MODULES.PROJECTS), ...QUERY_OPTS,
    queryFn: async () => { const { data, error } = await BaseService.safe(() => ProjectService.fetchPaginated({ limit: 50, sortBy: 'createdAt', sortDirection: 'desc', includeTotal: false })); return error ? [] : (data.data || []); }
  });

  const loading = pl || prl;
  const items = [...posts, ...projects];

  const statusCounts = STATUS_VALUES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
  items.forEach((item) => { statusCounts[computeEffectiveStatus(item)] += 1; });

  const missingCover = items.filter((i) => !(i.coverImage || i.imageUrl)).length;
  const missingSlug = items.filter((i) => !i.slug).length;
  const missingExcerpt = posts.filter((p) => !getLocalizedField(p.excerpt, 'en')).length;

  const storageBytes = items.reduce((sum, i) => sum + (i.coverImage || '').length + (i.imageUrl || '').length, 0);
  const storageKb = Math.round((storageBytes / 1024) * 10) / 10;

  // Monthly trend — last 4 months
  const now = new Date();
  const months = Array.from({ length: 4 }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (3 - idx), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const trend = months.map((key) => ({ key, count: items.filter((i) => monthKey(i) === key).length }));
  const trendMax = Math.max(1, ...trend.map((m) => m.count));

  const health = [
    { label: t('admin.dashboard.insights.missingCover'), value: missingCover },
    { label: t('admin.dashboard.insights.missingSlug'), value: missingSlug },
    { label: t('admin.dashboard.insights.missingExcerpt'), value: missingExcerpt },
    { label: t('admin.dashboard.insights.storage'), value: `${storageKb} KB` }
  ];

  return (
    <Card className={styles.panel}>
      <h2 className={styles.sectionTitle}>{t('admin.dashboard.insights.title')}</h2>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Skeleton width="100px" height="28px" borderRadius="50px" />
            <Skeleton width="80px" height="28px" borderRadius="50px" />
            <Skeleton width="120px" height="28px" borderRadius="50px" />
          </div>
          <Skeleton width="100%" height="92px" />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
            <Skeleton width="100%" height="60px" />
            <Skeleton width="100%" height="60px" />
            <Skeleton width="100%" height="60px" />
            <Skeleton width="100%" height="60px" />
          </div>
        </div>
      ) : (
        <div className={styles.insights}>
          <div className={styles.insightsBlock}>
            <span className={styles.insightsLabel}>{t('admin.dashboard.insights.statusBreakdown')}</span>
            <div className={styles.statusPills}>
              {STATUS_VALUES.map((s) => (
                <span key={s} className={styles.statusPill}>
                  <span className={styles.statusDot} style={{ background: STATUS_COLOR[s] }} />
                  {t(`admin.common.status.${s}`)}: <strong>{statusCounts[s]}</strong>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.insightsBlock}>
            <span className={styles.insightsLabel}>{t('admin.dashboard.insights.trend')}</span>
            <div className={styles.trend}>
              {trend.map((m) => (
                <div key={m.key} className={styles.trendCol}>
                  <div className={styles.trendBarTrack} title={`${m.count} items in ${m.key}`}>
                    <div className={styles.trendBar} style={{ height: `${Math.round((m.count / trendMax) * 100)}%` }} />
                  </div>
                  <span className={styles.trendCount}>{m.count}</span>
                  <span className={styles.trendLabel}>
                    {language === 'km' ? formatLocalizedPeriod(new Intl.DateTimeFormat('km-KH', { month: 'short' }).format(new Date(`${m.key}-01T00:00:00`)), 'km') : new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${m.key}-01T00:00:00`))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.insightsBlock}>
            <span className={styles.insightsLabel}>{t('admin.dashboard.insights.health')}</span>
            <div className={styles.healthGrid}>
              {health.map((metric) => (
                <div key={metric.label} className={styles.healthMetric}>
                  <span className={styles.healthValue}>{metric.value}</span>
                  <span className={styles.healthLabel}>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default InsightsWidget;
