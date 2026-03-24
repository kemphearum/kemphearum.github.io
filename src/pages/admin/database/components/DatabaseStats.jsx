import React, { useMemo } from 'react';
import { Activity, BarChart2, Code, FileText, KeyRound, Mail, Settings, Shield, Users } from 'lucide-react';
import UsageBar from '../../components/UsageBar';
import StatCard from '../../components/StatCard';
import DatabaseService from '../../../../services/DatabaseService';
import { useTranslation } from '../../../../hooks/useTranslation';

const COLLECTION_META = [
  {
    key: 'posts',
    label: { en: 'Posts', km: 'ប្លុក' },
    icon: FileText,
    color: '#38bdf8',
    description: { en: 'View & Edit Content', km: 'មើល និងកែសម្រួលមាតិកា' },
    tab: 'blog'
  },
  {
    key: 'projects',
    label: { en: 'Projects', km: 'គម្រោង' },
    icon: Code,
    color: '#a78bfa',
    description: { en: 'Project Portfolio', km: 'ផតហ្វូលីយ៉ូគម្រោង' },
    tab: 'projects'
  },
  {
    key: 'experience',
    label: { en: 'Experience', km: 'បទពិសោធន៍' },
    icon: FileText,
    color: '#f472b6',
    description: { en: 'Professional History', km: 'ប្រវត្តិការងារ' },
    tab: 'experience'
  },
  {
    key: 'content',
    label: { en: 'Content', km: 'មាតិកា' },
    icon: FileText,
    color: '#2dd4bf',
    description: { en: 'General Site Info', km: 'ព័ត៌មានទូទៅគេហទំព័រ' },
    tab: 'general'
  },
  {
    key: 'messages',
    label: { en: 'Messages', km: 'សារ' },
    icon: Mail,
    color: '#34d399',
    description: { en: 'User Inquiries', km: 'សំណួរពីអ្នកប្រើ' },
    tab: 'messages'
  },
  {
    key: 'users',
    label: { en: 'Users', km: 'អ្នកប្រើ' },
    icon: Users,
    color: '#fb923c',
    description: { en: 'Admin Access', km: 'សិទ្ធិអ្នកគ្រប់គ្រង' },
    tab: 'users'
  },
  {
    key: 'auditLogs',
    label: { en: 'Audit Logs', km: 'កំណត់ហេតុសវនកម្ម' },
    icon: Shield,
    color: '#f97316',
    description: { en: 'Security event trail', km: 'កំណត់ត្រាព្រឹត្តិការណ៍សុវត្ថិភាព' },
    tab: 'audit'
  },
  {
    key: 'visits',
    label: { en: 'Visits', km: 'ការចូលមើល' },
    icon: Activity,
    color: '#22c55e',
    description: { en: 'Traffic logs', km: 'កំណត់ត្រាចរាចរណ៍' },
    tab: 'analytics'
  },
  {
    key: 'dailyUsage',
    label: { en: 'Daily Usage', km: 'ការប្រើប្រាស់ប្រចាំថ្ងៃ' },
    icon: BarChart2,
    color: '#06b6d4',
    description: { en: 'Daily metric snapshots', km: 'សង្ខេបម៉ែត្រប្រចាំថ្ងៃ' },
    tab: 'analytics'
  },
  {
    key: 'rolePermissions',
    label: { en: 'Role Rules', km: 'ច្បាប់តួនាទី' },
    icon: KeyRound,
    color: '#f59e0b',
    description: { en: 'Permission matrix', km: 'ម៉ាទ្រីសសិទ្ធិ' },
    tab: 'users'
  },
  {
    key: 'settings',
    label: { en: 'Settings', km: 'ការកំណត់' },
    icon: Settings,
    color: '#94a3b8',
    description: { en: 'Global system config', km: 'ការកំណត់ប្រព័ន្ធទូទៅ' },
    tab: 'settings'
  }
];

const DatabaseStats = ({ dbHealth, healthFailures = {}, loading, isFetching = false, totalDocs, setActiveTab }) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const locale = language === 'km' ? 'km-KH' : 'en-US';
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const localizedCollections = useMemo(
    () =>
      COLLECTION_META.map((item) => ({
        ...item,
        label: language === 'km' ? item.label.km : item.label.en,
        description: language === 'km' ? item.description.km : item.description.en
      })),
    [language]
  );
  const failureKeys = useMemo(() => Object.keys(healthFailures), [healthFailures]);
  const failedCount = failureKeys.length;
  const healthyCount = localizedCollections.length - failedCount;

  const getDisplayValue = (key) => {
    if (loading) return '...';
    if (healthFailures[key]) return 'N/A';
    return numberFormatter.format(Number(dbHealth[key]) || 0);
  };

  const usagePercent = Math.round((totalDocs / DatabaseService.SOFT_DOC_LIMIT) * 100);
  const usageHint = usagePercent >= 90
    ? tr('Warning: nearing free-tier capacity.', 'ព្រមាន៖ កំពុងជិតដល់កម្រិត free-tier។')
    : tr('Current usage is within free-tier allowance.', 'ការប្រើប្រាស់បច្ចុប្បន្ននៅក្នុងកម្រិត free-tier។');

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
        <BarChart2 size={18} /> {tr('Storage Health', 'សុខភាពការផ្ទុកទិន្នន័យ')}
        <span className={"ui-last-updated"}>
          {isFetching
            ? tr('Refreshing counts...', 'កំពុងធ្វើបច្ចុប្បន្នភាពចំនួន...')
            : (dbHealth.lastUpdated
              ? `${tr('Last checked:', 'ពិនិត្យចុងក្រោយ៖')} ${dbHealth.lastUpdated.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}`
              : tr('Counting...', 'កំពុងរាប់...'))}
        </span>
      </h4>

      <div className="ui-db-overview">
        <span className="ui-db-overview-pill ui-db-overview-pill--ok">
          {healthyCount} {tr('healthy', 'ស្ថានភាពល្អ')}
        </span>
        {failedCount > 0 && (
          <span className="ui-db-overview-pill ui-db-overview-pill--warn">
            {failedCount} {tr('unavailable', 'មិនអាចប្រើបាន')}
          </span>
        )}
        <span className="ui-db-overview-text">
          {tr('Collection coverage:', 'គ្របដណ្តប់បណ្ដុំទិន្នន័យ:')} {localizedCollections.length} {tr('tracked groups', 'ក្រុមដែលតាមដាន')}
        </span>
      </div>

      <UsageBar
        label={tr('Free Tier Document Usage (50k Limit Estimate)', 'ការប្រើប្រាស់ឯកសារកម្រិតឥតគិតថ្លៃ (ប៉ាន់ស្មានកម្រិត 50k)')}
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
              description={isFailed ? tr('Unable to load right now', 'មិនអាចផ្ទុកបានឥឡូវនេះ') : collection.description}
              className={`ui-db-stat-card ${isFailed ? 'ui-db-stat-card--error' : ''}`}
              style={{ '--stat-color': collection.color }}
              title={isFailed ? `${tr('Failed to count', 'រាប់មិនបាន')} ${collection.label}` : collection.label}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DatabaseStats;
