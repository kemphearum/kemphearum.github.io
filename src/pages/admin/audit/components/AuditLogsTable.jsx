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
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

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
      read: tr('Read', 'អាន'),
      write: tr('Write', 'សរសេរ'),
      created: tr('Created', 'បានបង្កើត'),
      create: tr('Created', 'បានបង្កើត'),
      updated: tr('Updated', 'បានកែប្រែ'),
      update: tr('Updated', 'បានកែប្រែ'),
      deleted: tr('Deleted', 'បានលុប'),
      delete: tr('Deleted', 'បានលុប'),
      enabled: tr('Enabled', 'បានបើក'),
      disabled: tr('Disabled', 'បានបិទ'),
      success: tr('Success', 'ជោគជ័យ'),
      failure: tr('Failure', 'បរាជ័យ')
    };
    return map[key] || value || tr('Unknown', 'មិនស្គាល់');
  };

  const localizeModule = (value) => {
    const key = String(value || '').toLowerCase();
    const map = {
      blog: tr('Blog', 'ប្លុក'),
      projects: tr('Projects', 'គម្រោង'),
      experience: tr('Experience', 'បទពិសោធន៍'),
      users: tr('Users', 'អ្នកប្រើ')
    };
    return map[key] || value || '-';
  };

  const localizeDevice = (value) => {
    const key = String(value || '').toLowerCase();
    if (key.includes('phone') || key.includes('mobile')) return tr('Mobile', 'ទូរស័ព្ទ');
    if (key.includes('tablet') || key.includes('ipad')) return tr('Tablet', 'ថេប្លេត');
    if (!key) return tr('Desktop', 'កុំព្យូទ័រ');
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
      header: tr('Action', 'សកម្មភាព'),
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
      header: tr('Count', 'ចំនួន'),
      sortable: true,
      render: (row) => (
        <span className={styles.countBadge}>
          {Number.isFinite(row.count) ? row.count : 1}
        </span>
      )
    },
    {
      key: 'module',
      header: tr('Module', 'ម៉ូឌុល'),
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
      header: tr('Target Entity', 'ធាតុគោលដៅ'),
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
      header: tr('Performer', 'អ្នកអនុវត្ត'),
      sortable: true,
      render: (row) => (
        <div className={styles.userCell}>
          <User size={12} />
          {row.user || tr('System', 'ប្រព័ន្ធ')}
        </div>
      )
    },
    {
      key: 'timestamp',
      header: tr('Time', 'ពេលវេលា'),
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
      header: tr('Status', 'ស្ថានភាព'),
      render: (row) => (
        <span className={`${styles.badge} ${styles[`badge--${getBadgeVariant(row.status)}`]}`}>
          {localizeAction(row.status || 'success')}
        </span>
      )
    },
    {
      key: 'user',
      header: tr('User Email', 'អ៊ីមែលអ្នកប្រើ'),
      sortable: true,
      render: (row) => (
        <div className={styles.userCell}>
          {row.user || row.email || tr('System', 'ប្រព័ន្ធ')}
        </div>
      )
    },
    {
      key: 'ipAddress',
      header: tr('IP Address', 'អាសយដ្ឋាន IP'),
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
      header: tr('Device', 'ឧបករណ៍'),
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
      header: tr('User Agent', 'ព័ត៌មានកម្មវិធីរុករក'),
      render: (row) => (
        <div className={styles.userAgentCell} title={row.userAgent}>
          {row.userAgent || '-'}
        </div>
      )
    },
    {
      key: 'timestamp',
      header: tr('Timestamp', 'ពេលវេលា'),
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
          ? tr('No Security Logs Found', 'មិនមានកំណត់ហេតុសុវត្ថិភាព')
          : tr('No Activity Logs Found', 'មិនមានកំណត់ហេតុសកម្មភាព'),
        description: tr('There are currently no recorded events.', 'បច្ចុប្បន្នមិនមានព្រឹត្តិការណ៍ដែលបានកត់ត្រាទេ។')
      }}
    />
  );
};

export default React.memo(AuditLogsTable);
