import React, { useMemo, useState, useEffect } from 'react';
import { Activity, BarChart2, Code, FileText, KeyRound, Mail, Settings, Shield, Users } from 'lucide-react';
import UsageBar from '../../components/UsageBar';
import StatCard from '../../components/StatCard';
import DatabaseService from '../../../../services/DatabaseService';
import { useTranslation } from '../../../../hooks/useTranslation';

const COLLECTION_META = [
  {
    key: 'posts',
    labelKey: 'admin.database.stats.posts.label',
    fallbackLabel: 'Posts',
    icon: FileText,
    color: '#38bdf8',
    descriptionKey: 'admin.database.stats.posts.desc',
    fallbackDesc: 'View & Edit Content',
    tab: 'blog'
  },
  {
    key: 'projects',
    labelKey: 'admin.database.stats.projects.label',
    fallbackLabel: 'Projects',
    icon: Code,
    color: '#a78bfa',
    descriptionKey: 'admin.database.stats.projects.desc',
    fallbackDesc: 'Project Portfolio',
    tab: 'projects'
  },
  {
    key: 'experience',
    labelKey: 'admin.database.stats.experience.label',
    fallbackLabel: 'Experience',
    icon: FileText,
    color: '#f472b6',
    descriptionKey: 'admin.database.stats.experience.desc',
    fallbackDesc: 'Professional History',
    tab: 'experience'
  },
  {
    key: 'content',
    labelKey: 'admin.database.stats.content.label',
    fallbackLabel: 'Content',
    icon: FileText,
    color: '#2dd4bf',
    descriptionKey: 'admin.database.stats.content.desc',
    fallbackDesc: 'General Site Info',
    tab: 'general'
  },
  {
    key: 'messages',
    labelKey: 'admin.database.stats.messages.label',
    fallbackLabel: 'Messages',
    icon: Mail,
    color: '#34d399',
    descriptionKey: 'admin.database.stats.messages.desc',
    fallbackDesc: 'User Inquiries',
    tab: 'messages'
  },
  {
    key: 'users',
    labelKey: 'admin.database.stats.users.label',
    fallbackLabel: 'Users',
    icon: Users,
    color: '#fb923c',
    descriptionKey: 'admin.database.stats.users.desc',
    fallbackDesc: 'Admin Access',
    tab: 'users'
  },
  {
    key: 'auditLogs',
    labelKey: 'admin.database.stats.auditLogs.label',
    fallbackLabel: 'Audit Logs',
    icon: Shield,
    color: '#f97316',
    descriptionKey: 'admin.database.stats.auditLogs.desc',
    fallbackDesc: 'Security event trail',
    tab: 'audit'
  },
  {
    key: 'visits',
    labelKey: 'admin.database.stats.visits.label',
    fallbackLabel: 'Visits',
    icon: Activity,
    color: '#22c55e',
    descriptionKey: 'admin.database.stats.visits.desc',
    fallbackDesc: 'Traffic logs',
    tab: 'analytics'
  },
  {
    key: 'dailyUsage',
    labelKey: 'admin.database.stats.dailyUsage.label',
    fallbackLabel: 'Daily Usage',
    icon: BarChart2,
    color: '#06b6d4',
    descriptionKey: 'admin.database.stats.dailyUsage.desc',
    fallbackDesc: 'Daily metric snapshots',
    tab: 'analytics'
  },
  {
    key: 'rolePermissions',
    labelKey: 'admin.database.stats.rolePermissions.label',
    fallbackLabel: 'Role Rules',
    icon: KeyRound,
    color: '#f59e0b',
    descriptionKey: 'admin.database.stats.rolePermissions.desc',
    fallbackDesc: 'Permission matrix',
    tab: 'users'
  },
  {
    key: 'settings',
    labelKey: 'admin.database.stats.settings.label',
    fallbackLabel: 'Settings',
    icon: Settings,
    color: '#94a3b8',
    descriptionKey: 'admin.database.stats.settings.desc',
    fallbackDesc: 'Global system config',
    tab: 'settings'
  }
];

const DatabaseStats = ({ dbHealth, healthFailures = {}, loading, isFetching = false, totalDocs, setActiveTab, onExplore }) => {
  const { language, t } = useTranslation();
  const tm = (key, params = {}) => t(`admin.database.${key}`, params);
  const locale = language === 'km' ? 'km-KH' : 'en-US';
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const localizedCollections = useMemo(
    () =>
      COLLECTION_META.map((item) => ({
        ...item,
        label: t(item.labelKey, item.fallbackLabel),
        description: t(item.descriptionKey, item.fallbackDesc)
      })),
    [t]
  );
  const failureKeys = useMemo(() => Object.keys(healthFailures), [healthFailures]);
  const failedCount = failureKeys.length;
  const healthyCount = localizedCollections.length - failedCount;

  const getDisplayValue = (key) => {
    if (loading) return '...';
    if (healthFailures[key]) return 'N/A';
    return numberFormatter.format(Number(dbHealth[key]) || 0);
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const [dbMetadata, setDbMetadata] = useState(() => DatabaseService.getDatabaseMetadata());

  useEffect(() => {
      const handleOnline = () => setDbMetadata(prev => ({ ...prev, connectionStatus: 'Online' }));
      const handleOffline = () => setDbMetadata(prev => ({ ...prev, connectionStatus: 'Offline' }));
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  const usagePercent = Math.round((totalDocs / DatabaseService.SOFT_DOC_LIMIT) * 100);
  const usageHint = usagePercent >= 90
    ? t('ui.warningNearingFreeTierCap')
    : t('ui.currentUsageIsWithinFreeT');

  const handleCardNavigate = (tab) => {
    if (tab) setActiveTab(tab);
  };

  const handleCardKeyDown = (event, tab) => {
    if (!tab) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardNavigate(tab);
    }
  };

  return (
    <div className={"ui-stats-section"}>
      <h4 className={"ui-header"}>
        <BarChart2 size={18} /> {t('ui.storageHealth')}
        <span className={"ui-last-updated"}>
          {isFetching
            ? t('ui.refreshingCounts')
            : (dbHealth.lastUpdated
              ? `${t('ui.lastChecked')} ${dbHealth.lastUpdated.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}`
              : t('ui.counting'))}
        </span>
      </h4>

      <div className="ui-grid ui-mb-large" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
         <div className="ui-card ui-p-medium ui-bg-subtle-light">
             <div className="ui-text-extra-small ui-text-muted ui-uppercase ui-font-bold ui-mb-extra-small">{tm('ui.provider')}</div>
             <div className="ui-font-bold">{dbMetadata.provider}</div>
         </div>
         <div className="ui-card ui-p-medium ui-bg-subtle-light">
             <div className="ui-text-extra-small ui-text-muted ui-uppercase ui-font-bold ui-mb-extra-small">{tm('ui.projectId')}</div>
             <div className="ui-font-bold">{dbMetadata.projectId}</div>
         </div>
         <div className="ui-card ui-p-medium ui-bg-subtle-light">
             <div className="ui-text-extra-small ui-text-muted ui-uppercase ui-font-bold ui-mb-extra-small">{tm('ui.environment')}</div>
             <div className="ui-font-bold" style={{ textTransform: 'capitalize' }}>{dbMetadata.environment}</div>
         </div>
         <div className="ui-card ui-p-medium ui-bg-subtle-light">
             <div className="ui-text-extra-small ui-text-muted ui-uppercase ui-font-bold ui-mb-extra-small">{tm('ui.region')}</div>
             <div className="ui-font-bold">{dbMetadata.region}</div>
         </div>
         <div className="ui-card ui-p-medium ui-bg-subtle-light">
             <div className="ui-text-extra-small ui-text-muted ui-uppercase ui-font-bold ui-mb-extra-small">{tm('ui.connection')}</div>
             <div className="ui-font-bold ui-flex-center-gap-small">
                 <span style={{ width: 8, height: 8, borderRadius: '50%', background: dbMetadata.connectionStatus === 'Online' ? 'var(--color-success)' : 'var(--color-danger)' }} />
                 {dbMetadata.connectionStatus}
             </div>
         </div>
         <div className="ui-card ui-p-medium ui-bg-subtle-light">
             <div className="ui-text-extra-small ui-text-muted ui-uppercase ui-font-bold ui-mb-extra-small">{tm('ui.pendingWrites')}</div>
             <div className="ui-font-bold">{dbMetadata.pendingWrites}</div>
         </div>
      </div>

      <div className="ui-db-overview">
        <span className="ui-db-overview-pill ui-db-overview-pill--ok">
          {healthyCount} {t('ui.healthy')}
        </span>
        {failedCount > 0 && (
          <span className="ui-db-overview-pill ui-db-overview-pill--warn">
            {failedCount} {t('ui.unavailable')}
          </span>
        )}
        <span className="ui-db-overview-text">
          {t('ui.collectionCoverage')} {localizedCollections.length} {t('ui.trackedGroups')}
        </span>
      </div>

      <UsageBar
        label={t('ui.freeTierDocumentUsage50kL')}
        current={totalDocs}
        total={DatabaseService.SOFT_DOC_LIMIT}
        className="ui-database-usage"
        hint={usageHint}
      />

      <div className={"ui-stats-grid"}>
        {localizedCollections.map((collection) => {
          const isFailed = Boolean(healthFailures[collection.key]);
          const isClickable = Boolean(collection.tab);
          const value = getDisplayValue(collection.key);

          return (
            <StatCard
              key={collection.key}
              icon={collection.icon}
              value={value}
              label={collection.label}
              color={collection.color}
              onClick={isClickable ? () => handleCardNavigate(collection.tab) : undefined}
              onKeyDown={(event) => handleCardKeyDown(event, collection.tab)}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              description={isFailed ? t('ui.unableToLoadRightNow') : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{formatBytes(dbHealth[`${collection.key}_size`] || 0)} • {collection.description}</span>
                      <button 
                          className="ui-btn ui-btn-ghost ui-btn-small" 
                          style={{ padding: '2px 6px', height: 'auto', fontSize: '0.75rem' }}
                          onClick={(e) => { e.stopPropagation(); onExplore(collection.key); }}
                          title="Explore Data"
                      >
                          Explore
                      </button>
                  </div>
              )}
              className={`ui-db-stat-card ${isFailed ? 'ui-db-stat-card--error' : ''}`}
              style={{ '--stat-color': collection.color }}
              title={isFailed ? `${t('ui.failedToCount')} ${collection.label}` : collection.label}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DatabaseStats;
