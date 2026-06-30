import React from 'react';
import { Clock, User, Globe, Hash, Layout, FileText, Briefcase, Users, Monitor, Smartphone, Tablet, Shield, Activity } from 'lucide-react';
import DataTable from '../../../../shared/components/ui/data-table/DataTable';
import styles from '../AuditLogsTab.module.scss';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';

const AuditLogsTable = ({ 
  data, 
  loading, 
  page, 
  pageSize = 5,
  onRowClick, 
  view = 'activity', 
  totalItems,
  // Cursor pagination props
  hasMore = false,
  isFirstPage = true,
  onNext,
  onPrevious,
  paginationVariant = 'cursor',
  onPageChange
}) => {
  const { language, t } = useTranslation();

  const getDeviceIcon = (device) => {
    const d = device?.toLowerCase() || '';
    if (d.includes('phone') || d.includes('mobile')) return <Smartphone size={14} />;
    if (d.includes('tablet') || d.includes('ipad')) return <Tablet size={14} />;
    return <Monitor size={14} />;
  };

  const getModuleIcon = (module) => {
    switch (module?.toLowerCase()) {
      case 'blog': return <FileText size={14} />;
      case 'projects': return <Layout size={14} />;
      case 'experience': return <Briefcase size={14} />;
      case 'users': return <Users size={14} />;
      default: return <Hash size={14} />;
    }
  };

  const getBadgeVariant = (value) => {
    const key = String(value || '').toLowerCase();
    if (['created', 'create', 'success', 'enabled'].includes(key)) return 'create';
    if (['updated', 'update', 'write', 'edited'].includes(key)) return 'update';
    if (['deleted', 'delete', 'failure', 'disabled'].includes(key)) return 'delete';
    if (['read'].includes(key)) return 'read';
    return 'neutral';
  };

  const localizeAction = (value) => {
    const key = String(value || '').toLowerCase();
    const map = {
      read: t('ui.read'),
      write: t('ui.write'),
      created: t('ui.created'),
      create: t('ui.created'),
      updated: t('ui.updated1'),
      update: t('ui.updated1'),
      deleted: t('ui.deleted'),
      delete: t('ui.deleted'),
      enabled: t('ui.enabled'),
      disabled: t('ui.disabled'),
      success: t('ui.success'),
      failure: t('ui.failure')
    };
    return map[key] || value || t('ui.unknown');
  };

  const localizeModule = (value) => {
    const key = String(value || '').toLowerCase();
    const map = {
      blog: t('ui.blog'),
      projects: t('ui.projects'),
      experience: t('ui.experience'),
      users: t('ui.users')
    };
    return map[key] || value || '-';
  };

  const localizeDevice = (value) => {
    const key = String(value || '').toLowerCase();
    if (key.includes('phone') || key.includes('mobile')) return t('ui.mobile');
    if (key.includes('tablet') || key.includes('ipad')) return t('ui.tablet');
    if (!key) return t('ui.desktop');
    return value;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString(language === 'km' ? 'km-KH' : 'en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const activityColumns = [
    {
      key: 'action',
      header: t('ui.action'),
      sortable: true,
      render: (row) => {
        const action = getLocalizedField(row.details?.action || row.type || 'read', language);
        return (
          <span className={`${styles.badge} ${styles[`badge--${getBadgeVariant(action)}`]}`}>
            {localizeAction(action)}
          </span>
        );
      }
    },
    {
      key: 'count',
      header: t('ui.count'),
      sortable: true,
      render: (row) => (
        <span className={styles.countBadge}>
          {Number.isFinite(row.count) ? row.count : 1}
        </span>
      )
    },
    {
      key: 'module',
      header: t('ui.module'),
      sortable: true,
      render: (row) => {
        const module = getLocalizedField(row.details?.module, language);
        return (
          <div className={styles.moduleCell}>
            <div className={styles.moduleIcon}>{getModuleIcon(module)}</div>
            {localizeModule(module)}
          </div>
        );
      }
    },
    {
      key: 'entity',
      header: t('ui.targetEntity'),
      render: (row) => {
        const entityName = getLocalizedField(row.details?.entityName || row.label, language);
        return (
          <div className={styles.entityCell} title={entityName}>
            {entityName || '-'}
          </div>
        );
      }
    },
    {
      key: 'user',
      header: t('ui.performer'),
      sortable: true,
      render: (row) => (
        <div className={styles.userCell}>
          <User size={12} />
          {row.user || t('ui.system')}
        </div>
      )
    },
    {
      key: 'timestamp',
      header: t('ui.time'),
      sortable: true,
      render: (row) => (
        <div className={styles.timeCell}>
          <Clock size={12} />
          {formatTimestamp(row.time || row.timestamp)}
        </div>
      )
    }
  ];

  const securityColumns = [
    {
      key: 'status',
      header: t('ui.status'),
      render: (row) => (
        <span className={`${styles.badge} ${styles[`badge--${getBadgeVariant(row.status)}`]}`}>
          {localizeAction(row.status || 'success')}
        </span>
      )
    },
    {
      key: 'user',
      header: t('ui.userEmail'),
      sortable: true,
      render: (row) => (
        <div className={styles.userCell}>
          {row.user || row.email || t('ui.system')}
        </div>
      )
    },
    {
      key: 'ipAddress',
      header: t('ui.iPAddress'),
      sortable: true,
      render: (row) => (
        <div className={styles.ipCell}>
          <Globe size={12} />
          {row.ipAddress || '-'}
        </div>
      )
    },
    {
      key: 'device',
      header: t('ui.device'),
      sortable: true,
      render: (row) => (
        <div className={styles.deviceCell}>
          <div className={styles.deviceCellIcon}>
            {getDeviceIcon(row.device)}
          </div>
          <span>{localizeDevice(row.device)}</span>
        </div>
      )
    },
    {
      key: 'userAgent',
      header: t('ui.userAgent'),
      render: (row) => (
        <div className={styles.userAgentCell} title={row.userAgent}>
          {row.userAgent || '-'}
        </div>
      )
    },
    {
      key: 'timestamp',
      header: t('ui.timestamp'),
      sortable: true,
      render: (row) => (
        <div className={styles.timeStrongCell}>
          {formatTimestamp(row.timestamp || row.time)}
        </div>
      )
    }
  ];

  const columns = view === 'security' ? securityColumns : activityColumns;

  return (
    <DataTable
      data={data}
      columns={columns}
      pageSize={pageSize}
      page={page}
      loading={loading}
      onRowClick={onRowClick}
      totalItems={totalItems}
      manualPagination={true}
      paginationVariant={paginationVariant}
      onPageChange={onPageChange}
      hasMore={hasMore}
      isFirstPage={isFirstPage}
      onNext={onNext}
      onPrevious={onPrevious}
      emptyState={{
        icon: view === 'security' ? Shield : Activity,
        title: view === 'security'
          ? t('ui.noSecurityLogsFound')
          : t('ui.noActivityLogsFound'),
        description: t('ui.thereAreCurrentlyNoRecord')
      }}
    />
  );
};

export default React.memo(AuditLogsTable);
