import React from 'react';
import { ChevronRight, Clock, User, Globe, Hash, Layout, FileText, Briefcase, Users, Monitor, Smartphone, Tablet, Info, Shield, Activity } from 'lucide-react';
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
      render: (row) => (
        <span className={`${styles.badge} ${styles[`badge--${row.details?.action || 'read'}`] || ''}`}>
          {row.details?.action || row.type || 'read'}
        </span>
      )
    },
    {
      key: 'module',
      header: 'Module',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'capitalize' }}>
          <div className={styles.moduleIcon}>{getModuleIcon(row.details?.module)}</div>
          {row.details?.module || '-'}
        </div>
      )
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (row) => (
        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.details?.entityName || row.label}>
          {row.details?.entityName || row.label || '-'}
        </div>
      )
    },
    {
      key: 'user',
      header: 'Performer',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: 600 }}>
          <User size={12} style={{ opacity: 0.6 }} />
          {row.user || 'System'}
        </div>
      )
    },
    {
      key: 'timestamp',
      header: 'Time',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          <Clock size={12} style={{ opacity: 0.6 }} />
          {formatTimestamp(row.time || row.timestamp)}
        </div>
      )
    }
  ];

  const securityColumns = [
    {
      key: 'status',
      header: 'STATUS',
      render: (row) => (
        <span className={`${styles.badge} ${row.status === 'failure' ? styles['badge--delete'] : styles['badge--create']}`}>
          {row.status || 'success'}
        </span>
      )
    },
    {
      key: 'user',
      header: 'USER EMAIL',
      sortable: true,
      render: (row) => (
        <div style={{ color: '#4361ee', fontWeight: 600, fontSize: '0.9rem' }}>
          {row.user || row.email || 'System'}
        </div>
      )
    },
    {
      key: 'ipAddress',
      header: 'IP ADDRESS',
      sortable: true,
      render: (row) => (
        <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
          {row.ipAddress || '-'}
        </div>
      )
    },
    {
      key: 'device',
      header: 'DEVICE',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ color: 'var(--primary-color)', opacity: 0.8 }}>
            {getDeviceIcon(row.device)}
          </div>
          <span style={{ fontSize: '0.9rem' }}>{row.device || 'Desktop'}</span>
        </div>
      )
    },
    {
      key: 'userAgent',
      header: 'USER AGENT',
      render: (row) => (
        <div 
          style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.85rem' }} 
          title={row.userAgent}
        >
          {row.userAgent || '-'}
        </div>
      )
    },
    {
      key: 'timestamp',
      header: 'TIMESTAMP',
      sortable: true,
      render: (row) => (
        <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
          {formatTimestamp(row.timestamp || row.time || row.time)}
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
