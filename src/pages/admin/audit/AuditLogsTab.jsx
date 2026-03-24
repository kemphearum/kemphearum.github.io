import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Shield, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/shared/components/ui';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import { useActivity } from '../../../hooks/useActivity';
import { useDebounce } from '../../../hooks/useDebounce';
import BaseService from '../../../services/BaseService';
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
  const normalizedActivitySearch = debouncedActivitySearch.trim().toLowerCase();
  const normalizedSecuritySearch = debouncedSecuritySearch.trim().toLowerCase();

  // Reusable Pagination Hook for Activity Logs
  const activityPagination = useCursorPagination(5, [debouncedActivitySearch, activityDateRange, activityFilters]);
  
  // Reusable Pagination Hook for Security Logs
  const securityPagination = useCursorPagination(5, [debouncedSecuritySearch, securityDateRange]);

  // UI State for Dialogs
  const [selectedLog, setSelectedLog] = useState(null);
  const [activityDetailType, setActivityDetailType] = useState(null); // 'read', 'write', or 'delete'

  // 1. Fetch Aggregated Stats
  const { data: stats = {}, refetch: refetchStats } = useQuery({
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
  const { data: securityLogsResult = { data: [], lastDoc: null, hasMore: false }, isLoading: securityLoading, isFetching: securityFetching, refetch: refetchSecurity } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['auditLogs', 'security', userRole, securityDateRange, securityPagination.cursor, securityPagination.limit],
    queryFn: async () => {
      const requestCursor = securityPagination.cursor;
      if (userRole !== 'superadmin') return { data: [], lastDoc: null, hasMore: false };
      const result = await BaseService.safe(() => AuditLogService.fetchSecurityAuditTrail({
        userRole,
        trackRead,
        dateRange: securityDateRange,
        lastDoc: requestCursor,
        limit: securityPagination.limit
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false };
      }

      securityPagination.updateAfterFetch(requestCursor, result.data.lastDoc, result.data.hasMore);
      return result.data;
    },
    enabled: userRole === 'superadmin'
  });

  const securityLogs = securityLogsResult.data;

  // 3. Fetch Detailed Activity Logs (Writes & Deletes for main table)
  const { data: activityLogsResult = { data: [], lastDoc: null, hasMore: false }, isLoading: activityLoading, isFetching: activityFetching, refetch: refetchActivity } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['auditLogs', 'activity', activityDateRange, activityPagination.cursor, activityPagination.limit, activityFilters],
    queryFn: async () => {
      const requestCursor = activityPagination.cursor;
      const result = await BaseService.safe(() => AuditLogService.fetchActivityDetails({
        activityDateRange,
        operationType: 'all',
        currentDateKey,
        lastDoc: requestCursor,
        limit: activityPagination.limit,
        filters: activityFilters
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false };
      }

      activityPagination.updateAfterFetch(requestCursor, result.data.lastDoc, result.data.hasMore);
      return result.data;
    }
  });

  const activityLogs = activityLogsResult.data;

  // 4. Fetch Activity Logs for specific type (Dialog)
  const { data: detailLogsResult = { data: [], lastDoc: null, hasMore: false }, isLoading: detailLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['auditLogs', 'activity', activityDateRange, activityDetailType, currentDateKey],
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

  const matchesSearch = (value, searchTerm) =>
    String(value || '').toLowerCase().includes(searchTerm);

  const filteredActivityLogs = useMemo(() => {
    if (!normalizedActivitySearch) return activityLogs;

    return activityLogs.filter((log) => (
      matchesSearch(log.label, normalizedActivitySearch)
      || matchesSearch(log.user, normalizedActivitySearch)
      || matchesSearch(log.details?.entityName, normalizedActivitySearch)
      || matchesSearch(log.details?.path, normalizedActivitySearch)
      || matchesSearch(log.details?.module, normalizedActivitySearch)
      || matchesSearch(log.details?.action, normalizedActivitySearch)
    ));
  }, [activityLogs, normalizedActivitySearch]);

  const filteredSecurityLogs = useMemo(() => {
    if (!normalizedSecuritySearch) return securityLogs;

    return securityLogs.filter((log) => (
      matchesSearch(log.user, normalizedSecuritySearch)
      || matchesSearch(log.email, normalizedSecuritySearch)
      || matchesSearch(log.ipAddress, normalizedSecuritySearch)
      || matchesSearch(log.device, normalizedSecuritySearch)
      || matchesSearch(log.userAgent, normalizedSecuritySearch)
      || matchesSearch(log.country, normalizedSecuritySearch)
      || matchesSearch(log.city, normalizedSecuritySearch)
    ));
  }, [securityLogs, normalizedSecuritySearch]);

  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const handleExport = (type) => {
    const targetLogs = type === 'security' ? filteredSecurityLogs : filteredActivityLogs;
    if (!targetLogs.length) {
      showToast('No logs to export for this view.', 'error');
      return;
    }

    const header = type === 'security'
      ? ['Status', 'Email', 'IP Address', 'Device', 'Location', 'Timestamp', 'Reason']
      : ['Action', 'Module', 'Entity', 'User', 'Count', 'Timestamp'];
    const rows = targetLogs.map((log) => {
      const time = log.time?.seconds || log.timestamp?.seconds
        ? new Date((log.time?.seconds || log.timestamp?.seconds) * 1000).toLocaleString()
        : '-';
      if (type === 'security') {
        return [
          escapeCsv(log.status || 'success'),
          escapeCsv(log.user || log.email || 'System'),
          escapeCsv(log.ipAddress || '-'),
          escapeCsv(log.device || 'Desktop'),
          escapeCsv([log.city, log.country].filter(Boolean).join(', ') || 'Unknown'),
          escapeCsv(time),
          escapeCsv(log.reason || '')
        ].join(',');
      }
      return [
        escapeCsv(log.details?.action || log.type || 'read'),
        escapeCsv(log.details?.module || '-'),
        escapeCsv(log.details?.entityName || log.label || '-'),
        escapeCsv(log.user || 'System'),
        escapeCsv(Number.isFinite(log.count) ? log.count : 1),
        escapeCsv(time)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,"
      + `${header.join(',')}\n`
      + rows.join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit logs successfully.');
  };

  const resetActivityView = useCallback(() => {
    setActivitySearch('');
    setActivityDateRange('today');
    setActivityFilters({ module: 'all', action: 'all' });
    activityPagination.reset();
  }, [activityPagination]);

  const resetSecurityView = useCallback(() => {
    setSecuritySearch('');
    setSecurityDateRange('today');
    securityPagination.reset();
  }, [securityPagination]);

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
        description="Track admin activity, auth events, and operational risk signals in one place."
        icon={Activity}
        rightElement={
          <button 
            type="button"
            onClick={handleRefresh} 
            className="ui-button ui-button--ghost ui-btn-icon-only"
            title="Refresh All Data"
          >
            <RefreshCw size={18} className={(securityFetching || activityFetching) ? 'ui-spin' : ''} />
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
      <section className={styles.tableSection}>
        <div className={styles.tableHeaderSection}>
          <div className={styles.tableTitleGroup}>
            <Activity size={18} className={styles.accentIcon} />
            <h3 className={styles.tableTitle}>Activity History</h3>
          </div>
          <p className={styles.tableSubtitle}>Data mutations and admin-level changes.</p>
        </div>
      
        <AuditLogsToolbar
          searchQuery={activitySearch}
          onSearchChange={setActivitySearch}
          dateRange={activityDateRange}
          onDateRangeChange={setActivityDateRange}
          filters={activityFilters}
          onFilterChange={(k, v) => setActivityFilters(prev => ({ ...prev, [k]: v }))}
          onExport={() => handleExport('activity')}
          onReset={resetActivityView}
          totalItems={filteredActivityLogs.length}
          isExportDisabled={!filteredActivityLogs.length}
          searchHint={normalizedActivitySearch ? `Search: "${debouncedActivitySearch}"` : ''}
          placeholder="Search labels, users, module, action..."
        />

        <AuditLogsTable
          data={filteredActivityLogs}
          loading={activityLoading}
          view="activity"
          page={activityPagination.page}
          pageSize={activityPagination.limit}
          onRowClick={setSelectedLog}
          hasMore={activityLogsResult.hasMore}
          isFirstPage={activityPagination.isFirstPage}
          onNext={() => activityPagination.fetchNext(activityLogsResult.lastDoc)}
          onPrevious={activityPagination.fetchPrevious}
          totalItems={filteredActivityLogs.length}
          onPageChange={(page, size) => {
            if (size !== activityPagination.limit) {
              activityPagination.handlePageSizeChange(size);
            }
          }}
          paginationVariant="cursor"
        />
      </section>

      {/* Login & Security Audit Table (Added as persistent second table) */}
      <section className={styles.tableSection}>
        <div className={styles.tableHeaderSection}>
          <div className={styles.tableTitleGroup}>
            <Shield size={18} className={styles.securityIcon} />
            <h3 className={styles.tableTitle}>Login Audit Trail</h3>
          </div>
          <p className={styles.tableSubtitle}>Authentication attempts, origins, and device profile.</p>
        </div>

        <AuditLogsToolbar
          searchQuery={securitySearch}
          onSearchChange={setSecuritySearch}
          dateRange={securityDateRange}
          onDateRangeChange={setSecurityDateRange}
          onExport={() => handleExport('security')}
          onReset={resetSecurityView}
          totalItems={filteredSecurityLogs.length}
          isExportDisabled={!filteredSecurityLogs.length}
          searchHint={normalizedSecuritySearch ? `Search: "${debouncedSecuritySearch}"` : ''}
          placeholder="Search email, IP, device, country..."
        />

        <AuditLogsTable
          data={filteredSecurityLogs}
          loading={securityLoading}
          view="security"
          page={securityPagination.page}
          pageSize={securityPagination.limit}
          onRowClick={setSelectedLog}
          hasMore={securityLogsResult.hasMore}
          isFirstPage={securityPagination.isFirstPage}
          onNext={() => securityPagination.fetchNext(securityLogsResult.lastDoc)}
          onPrevious={securityPagination.fetchPrevious}
          totalItems={filteredSecurityLogs.length}
          onPageChange={(page, size) => {
            if (size !== securityPagination.limit) {
              securityPagination.handlePageSizeChange(size);
            }
          }}
          paginationVariant="cursor"
        />
      </section>

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
