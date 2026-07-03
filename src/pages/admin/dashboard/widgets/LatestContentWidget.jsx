import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Card, Spinner, EmptyState, Skeleton } from '@/shared/components/ui';
import BaseService from '../../../../services/BaseService';
import BlogService from '../../../../services/BlogService';
import ProjectService from '../../../../services/ProjectService';
import { getLocalizedField, formatLocalizedPeriod } from '../../../../utils/localization';
import { MODULES } from '../../../../utils/permissions';
import styles from '../DashboardTab.module.scss';

const QUERY_OPTS = { staleTime: 60000, gcTime: 300000, refetchOnWindowFocus: false };

const formatDate = (value, language) => {
  const seconds = value?.seconds;
  if (!seconds) return '';
  const rawDate = new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(seconds * 1000));
  return language === 'km' ? formatLocalizedPeriod(rawDate, language) : rawDate;
};

const LatestPanel = ({ titleKey, items, loading, type, ctx }) => {
  const { t, language, go } = ctx;
  return (
    <Card className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.sectionTitle}>{t(titleKey)}</h2>
        <button type="button" className={styles.viewAll} onClick={() => go(type)}>
          {t('admin.dashboard.viewAll')} <ArrowRight size={14} />
        </button>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} width="100%" height="32px" borderRadius="8px" />)}
        </div>
      ) : !items.length ? (
        <EmptyState title={t('admin.dashboard.empty')} />
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className={styles.listItem} onClick={() => go(type)}>
                <span className={styles.listItemTitle}>{getLocalizedField(item.title, language) || t('admin.dashboard.untitled')}</span>
                <span className={styles.listItemDate}>{formatDate(item.createdAt, language)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const LatestContentWidget = ({ ctx }) => {
  const { can, trackRead } = ctx;

  const { data: latestPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['dashboard', 'latestPosts'], enabled: can(MODULES.BLOG), ...QUERY_OPTS,
    queryFn: async () => { const { data, error } = await BaseService.safe(() => BlogService.fetchPaginated({ limit: 5, sortBy: 'createdAt', sortDirection: 'desc', includeTotal: false, trackRead })); return error ? [] : (data.data || []); }
  });
  const { data: latestProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['dashboard', 'latestProjects'], enabled: can(MODULES.PROJECTS), ...QUERY_OPTS,
    queryFn: async () => { const { data, error } = await BaseService.safe(() => ProjectService.fetchPaginated({ limit: 5, sortBy: 'createdAt', sortDirection: 'desc', includeTotal: false, trackRead })); return error ? [] : (data.data || []); }
  });

  return (
    <div className={styles.columns}>
      {can(MODULES.BLOG) && <LatestPanel titleKey="admin.dashboard.latestPosts" items={latestPosts} loading={postsLoading} type="blog" ctx={ctx} />}
      {can(MODULES.PROJECTS) && <LatestPanel titleKey="admin.dashboard.latestProjects" items={latestProjects} loading={projectsLoading} type="projects" ctx={ctx} />}
    </div>
  );
};

export default LatestContentWidget;
