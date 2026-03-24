import React, { useMemo } from 'react';
import { Activity, BarChart2, Code, FileText, KeyRound, Mail, Settings, Shield, Users } from 'lucide-react';
import UsageBar from '../../components/UsageBar';
import StatCard from '../../components/StatCard';
import DatabaseService from '../../../../services/DatabaseService';

const COLLECTION_META = [
  { key: 'posts', label: 'Posts', icon: FileText, color: '#38bdf8', description: 'View & Edit Content', tab: 'blog' },
  { key: 'projects', label: 'Projects', icon: Code, color: '#a78bfa', description: 'Project Portfolio', tab: 'projects' },
  { key: 'experience', label: 'Experience', icon: FileText, color: '#f472b6', description: 'Professional History', tab: 'experience' },
  { key: 'content', label: 'Content', icon: FileText, color: '#2dd4bf', description: 'General Site Info', tab: 'general' },
  { key: 'messages', label: 'Messages', icon: Mail, color: '#34d399', description: 'User Inquiries', tab: 'messages' },
  { key: 'users', label: 'Users', icon: Users, color: '#fb923c', description: 'Admin Access', tab: 'users' },
  { key: 'auditLogs', label: 'Audit Logs', icon: Shield, color: '#f97316', description: 'Security event trail', tab: 'audit' },
  { key: 'visits', label: 'Visits', icon: Activity, color: '#22c55e', description: 'Traffic logs', tab: 'analytics' },
  { key: 'dailyUsage', label: 'Daily Usage', icon: BarChart2, color: '#06b6d4', description: 'Daily metric snapshots', tab: 'analytics' },
  { key: 'rolePermissions', label: 'Role Rules', icon: KeyRound, color: '#f59e0b', description: 'Permission matrix', tab: 'users' },
  { key: 'settings', label: 'Settings', icon: Settings, color: '#94a3b8', description: 'Global system config', tab: 'settings' }
];

const numberFormatter = new Intl.NumberFormat();

const DatabaseStats = ({ dbHealth, healthFailures = {}, loading, isFetching = false, totalDocs, setActiveTab }) => {
  const failureKeys = useMemo(() => Object.keys(healthFailures), [healthFailures]);
  const failedCount = failureKeys.length;
  const healthyCount = COLLECTION_META.length - failedCount;

  const getDisplayValue = (key) => {
    if (loading) return '...';
    if (healthFailures[key]) return 'N/A';
    return numberFormatter.format(Number(dbHealth[key]) || 0);
  };

  const usagePercent = Math.round((totalDocs / DatabaseService.SOFT_DOC_LIMIT) * 100);
  const usageHint = usagePercent >= 90
    ? 'Warning: nearing free-tier capacity.'
    : 'Current usage is within free-tier allowance.';

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
        <BarChart2 size={18} /> Storage Health
        <span className={"ui-last-updated"}>
          {isFetching
            ? 'Refreshing counts...'
            : (dbHealth.lastUpdated ? `Last checked: ${dbHealth.lastUpdated.toLocaleTimeString()}` : 'Counting...')}
        </span>
      </h4>

      <div className="ui-db-overview">
        <span className="ui-db-overview-pill ui-db-overview-pill--ok">{healthyCount} healthy</span>
        {failedCount > 0 && <span className="ui-db-overview-pill ui-db-overview-pill--warn">{failedCount} unavailable</span>}
        <span className="ui-db-overview-text">
          Collection coverage: {COLLECTION_META.length} tracked groups
        </span>
      </div>

      <UsageBar
        label="Free Tier Document Usage (50k Limit Estimate)"
        current={totalDocs}
        total={DatabaseService.SOFT_DOC_LIMIT}
        className="ui-database-usage"
        hint={usageHint}
      />

      <div className={"ui-stats-grid"}>
        {COLLECTION_META.map((collection) => {
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
              description={isFailed ? 'Unable to load right now' : collection.description}
              className={`ui-db-stat-card ${isFailed ? 'ui-db-stat-card--error' : ''}`}
              style={{ '--stat-color': collection.color }}
              title={isFailed ? `Failed to count ${collection.label}` : collection.label}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DatabaseStats;
