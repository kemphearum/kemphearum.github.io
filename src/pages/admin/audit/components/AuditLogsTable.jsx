import React from 'react';
import { Clock, User, Globe, Hash, Layout, FileText, Briefcase, Users, Monitor, Smartphone, Tablet, Shield, Activity } from 'lucide-react';
import DataTable from '../../../../shared/components/ui/data-table/DataTable';
import styles from '../AuditLogsTab.module.scss';

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

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString('en-US', {
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
      header: 'Action',
      sortable: true,
      render: (row) => {
        const action = row.details?.action || row.type || 'read';
        return (
          <span className={`${styles.badge} ${styles[`badge--${getBadgeVariant(action)}`]}`}>
            {action}
          </span>
        );
      }
    },
    {
      key: 'count',
      header: 'Count',
      sortable: true,
      render: (row) => (
        <span className={styles.countBadge}>
          {Number.isFinite(row.count) ? row.count : 1}
        </span>
      )
    },
    {
      key: 'module',
      header: 'Module',
      sortable: true,
      render: (row) => (
        <div className={styles.moduleCell}>
          <div className={styles.moduleIcon}>{getModuleIcon(row.details?.module)}</div>
          {row.details?.module || '-'}
        </div>
      )
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (row) => (
        <div className={styles.entityCell} title={row.details?.entityName || row.label}>
          {row.details?.entityName || row.label || '-'}
        </div>
      )
    },
    {
      key: 'user',
      header: 'Performer',
      sortable: true,
      render: (row) => (
        <div className={styles.userCell}>
          <User size={12} />
          {row.user || 'System'}
        </div>
      )
    },
    {
      key: 'timestamp',
      header: 'Time',
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
      header: 'Status',
      render: (row) => (
        <span className={`${styles.badge} ${styles[`badge--${getBadgeVariant(row.status)}`]}`}>
          {row.status || 'success'}
        </span>
      )
    },
    {
      key: 'user',
      header: 'User Email',
      sortable: true,
      render: (row) => (
        <div className={styles.userCell}>
          {row.user || row.email || 'System'}
        </div>
      )
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
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
      header: 'Device',
      sortable: true,
      render: (row) => (
        <div className={styles.deviceCell}>
          <div className={styles.deviceCellIcon}>
            {getDeviceIcon(row.device)}
          </div>
          <span>{row.device || 'Desktop'}</span>
        </div>
      )
    },
    {
      key: 'userAgent',
      header: 'User Agent',
      render: (row) => (
        <div className={styles.userAgentCell} title={row.userAgent}>
          {row.userAgent || '-'}
        </div>
      )
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
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
        title: `No ${view === 'security' ? 'Security' : 'Activity'} Logs Found`,
        description: "There are currently no recorded events."
      }}
    />
  );
};

export default React.memo(AuditLogsTable);
