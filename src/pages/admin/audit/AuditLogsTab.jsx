import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Shield, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/shared/components/ui';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import { useActivity } from '../../../hooks/useActivity';
import { useDebounce } from '../../../hooks/useDebounce';
import AuditLogService from '../../../services/AuditLogService';
import SectionHeader from '../components/SectionHeader';
import AuditMetrics from './components/AuditMetrics';
import AuditLogsToolbar from './components/AuditLogsToolbar';
import AuditLogsTable from './components/AuditLogsTable';
import AuditLogDetailsDialog from './components/AuditLogDetailsDialog';
import ActivityAuditDialog from './components/ActivityAuditDialog';
import QuotaResilienceBanner from '../components/QuotaResilienceBanner';
import styles from './AuditLogsTab.module.scss';

const AuditLogsTab = ({ userRole, showToast }) => {
  const { trackRead, currentDateKey, dailyUsage } = useActivity();
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const debouncedActivitySearch = useDebounce(activitySearch, 500);
  const [securitySearch, setSecuritySearch] = useState('');
  const debouncedSecuritySearch = useDebounce(securitySearch, 500);
  const [activityDateRange, setActivityDateRange] = useState('today');
  const [securityDateRange, setSecurityDateRange] = useState('today');
  const [activityFilters, setActivityFilters] = useState({
    module: 'all',
    action: 'all'
  });

  // Reusable Pagination Hook for Activity Logs
  const activityPagination = useCursorPagination(15, [debouncedActivitySearch, activityDateRange, activityFilters]);
  
  // Reusable Pagination Hook for Security Logs
  const securityPagination = useCursorPagination(15, [debouncedSecuritySearch, securityDateRange]);

  // UI State for Dialogs
  const [selectedLog, setSelectedLog] = useState(null);
  const [activityDetailType, setActivityDetailType] = useState(null); // 'read', 'write', or 'delete'

  // 1. Fetch Aggregated Stats
  const { data: stats = {}, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['auditLogs', 'stats', activityDateRange],
    queryFn: async () => {
      setQuotaExceeded(false);
      let limitVal = 0;
      if (activityDateRange === 'today') return dailyUsage;
      limitVal = activityDateRange === '7d' ? 7 : (activityDateRange === '30d' ? 30 : 365);
      
      const result = await BaseService.safe(() => AuditLogService.fetchAggregatedHistory(limitVal));
      if (result.error) {
        if (result.error === 'QUOTA_EXCEEDED') {
          setQuotaExceeded(true);
          return dailyUsage || {};
        }
        showToast(result.error, 'error');
        return dailyUsage || {};
      }
      return result.data;
    }
  });

  // 2. Fetch Security Audit Logs
  const { data: securityLogsResult = { data: [], lastDoc: null, hasMore: false }, isLoading: securityLoading, refetch: refetchSecurity } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['auditLogs', 'security', userRole, debouncedSecuritySearch, securityDateRange, securityPagination.cursor],
    queryFn: async () => {
      if (userRole !== 'superadmin') return { data: [], lastDoc: null, hasMore: false };
      const result = await BaseService.safe(() => AuditLogService.fetchSecurityAuditTrail({
        userRole,
        trackRead,
        search: debouncedSecuritySearch,
        dateRange: securityDateRange,
        lastDoc: securityPagination.cursor,
        limit: 15
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false };
      }

      securityPagination.updateAfterFetch(result.data.lastDoc, result.data.hasMore);
      return result.data;
    },
    enabled: userRole === 'superadmin'
  });

  const securityLogs = securityLogsResult.data;

  // 3. Fetch Detailed Activity Logs (Writes & Deletes for main table)
  const { data: activityLogsResult = { data: [], lastDoc: null, hasMore: false }, isLoading: activityLoading, refetch: refetchActivity } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['auditLogs', 'activity', activityDateRange, activityPagination.cursor, debouncedActivitySearch, activityFilters],
    queryFn: async () => {
      const result = await BaseService.safe(() => AuditLogService.fetchActivityDetails({
        activityDateRange,
        operationType: 'all',
        currentDateKey,
        lastDoc: activityPagination.cursor,
        limit: 15,
        search: debouncedActivitySearch,
        filters: activityFilters
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false };
      }

      activityPagination.updateAfterFetch(result.data.lastDoc, result.data.hasMore);
      return result.data;
    }
  });

  const activityLogs = activityLogsResult.data;

  // 4. Fetch Activity Logs for specific type (Dialog)
  const { data: detailLogsResult = { data: [], lastDoc: null, hasMore: false }, isLoading: detailLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['auditLogs', 'activity', activityDateRange, activityDetailType],
    queryFn: async () => {
      const result = await BaseService.safe(() => AuditLogService.fetchActivityDetails({
        activityDateRange,
        operationType: activityDetailType,
        currentDateKey,
        limit: 100 // Larger limit for dialog
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false };
      }
      return result.data;
    },
    enabled: !!activityDetailType
  });

  const detailLogs = detailLogsResult.data;

  const [activeTab, setActiveTab] = useState('activity'); // 'activity' or 'security'

  // Since we're doing server-side pagination/filtering, 
  // we use the logs directly from the query.
  const filteredActivityLogs = activityLogs;
  const filteredSecurityLogs = securityLogs;

  const handleExport = (type) => {
    const targetLogs = type === 'security' ? filteredSecurityLogs : filteredActivityLogs;
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Email,IP Address,Device,User Agent,Timestamp\n"
      + targetLogs.map(log => {
          const time = log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : '-';
          return `"${log.user || log.email || 'System'}","${log.ipAddress || ''}","${log.device || ''}","${log.userAgent || ''}","${time}"`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit logs successfully');
  };

  const handleRefresh = useCallback(() => {
    activityPagination.reset();
    securityPagination.reset();
    refetchStats();
    refetchSecurity();
    refetchActivity();
    showToast('Logs refreshed');
  }, [refetchStats, refetchSecurity, refetchActivity, showToast, activityPagination, securityPagination]);

  if (userRole !== 'superadmin') {
    return (
      <EmptyState 
        title="Access Restricted"
        description="You do not have permission to view system audit logs. Only Super Admins can access this area."
        icon={Shield}
      />
    );
  }

  return (
    <div className={styles.container}>
      <SectionHeader
        title="Audit Intelligence Dashboard"
        description="Comprehensive history of administrative actions, authentication events, and system security."
        icon={Activity}
        rightElement={
          <button 
            onClick={handleRefresh} 
            className="ui-button ui-ghost ui-square"
            title="Refresh All Data"
          >
            <RefreshCw size={18} className={(securityLoading || activityLoading) ? 'ui-spin' : ''} />
          </button>
        }
      />

      {quotaExceeded && (
        <QuotaResilienceBanner onRefresh={handleRefresh} />
      )}

      <AuditMetrics 
        stats={stats} 
        onViewReads={() => setActivityDetailType('read')} 
        onViewWrites={() => setActivityDetailType('write')} 
        onViewDeletes={() => setActivityDetailType('delete')} 
      />

      {/* Activity Logs Section */}
      <div className={styles.tableHeaderSection}>
        <div className={styles.tableTitleGroup}>
          <Activity size={18} className={styles.accentIcon} />
          <h3 className={styles.tableTitle}>Activity History</h3>
        </div>
        <p className={styles.tableSubtitle}>Tracking data mutations and administrative changes.</p>
      </div>
      
      <AuditLogsToolbar
        searchQuery={activitySearch}
        onSearchChange={setActivitySearch}
        dateRange={activityDateRange}
        onDateRangeChange={setActivityDateRange}
        filters={activityFilters}
        onFilterChange={(k, v) => setActivityFilters(prev => ({ ...prev, [k]: v }))}
        onExport={() => handleExport('activity')}
        placeholder="Search actions or users..."
      />

      <AuditLogsTable
        data={filteredActivityLogs}
        loading={activityLoading}
        view="activity"
        page={activityPagination.page}
        onRowClick={setSelectedLog}
        hasMore={activityPagination.hasMore}
        isFirstPage={activityPagination.isFirstPage}
        onNext={() => activityPagination.fetchNext(activityLogsResult.lastDoc)}
        onPrevious={activityPagination.fetchPrevious}
        paginationVariant="cursor"
      />

      {/* Login & Security Audit Table (Added as persistent second table) */}
      <div className={styles.tableHeaderSection} style={{ marginTop: '1rem' }}>
        <div className={styles.tableTitleGroup}>
          <Shield size={18} style={{ color: '#38bdf8' }} />
          <h3 className={styles.tableTitle}>Login Audit Trail</h3>
        </div>
        <p className={styles.tableSubtitle}>Monitoring system access, IP origins, and device authentication.</p>
      </div>

      <AuditLogsToolbar
        searchQuery={securitySearch}
        onSearchChange={setSecuritySearch}
        dateRange={securityDateRange}
        onDateRangeChange={setSecurityDateRange}
        onExport={() => handleExport('security')}
        placeholder="Search email or IP address..."
      />

      <AuditLogsTable
        data={filteredSecurityLogs}
        loading={securityLoading}
        view="security"
        page={securityPagination.page}
        onRowClick={setSelectedLog}
        hasMore={securityPagination.hasMore}
        isFirstPage={securityPagination.isFirstPage}
        onNext={() => securityPagination.fetchNext(securityLogsResult.lastDoc)}
        onPrevious={securityPagination.fetchPrevious}
        paginationVariant="cursor"
      />

      {/* Dialogs */}
      <AuditLogDetailsDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />

      <ActivityAuditDialog
        type={activityDetailType}
        logs={detailLogs}
        loading={detailLoading}
        open={!!activityDetailType}
        onOpenChange={(open) => !open && setActivityDetailType(null)}
      />
    </div>
  );
};

export default AuditLogsTab;
