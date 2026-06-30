import React from 'react';
import { Search, Download, RotateCcw, Clock, Layers, MousePointer2, Shield } from 'lucide-react';
import { Input } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';
import styles from '../AuditLogsTab.module.scss';
import { useTranslation } from '../../../../hooks/useTranslation';

const AuditLogsToolbar = ({ 
  searchQuery, 
  onSearchChange, 
  dateRange,
  onDateRangeChange,
  filters, 
  onFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  onExport,
  onReset,
  totalItems,
  isExportDisabled = false,
  searchHint = '',
  placeholder = '',
  isSearching = false
}) => {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder || t('ui.searchByUserIPOrEntity');

  const hasFilters = Boolean(
    searchQuery
    || (dateRange && dateRange !== 'today')
    || (filters?.module && filters.module !== 'all')
    || (filters?.action && filters.action !== 'all')
    || (statusFilter && statusFilter !== 'all')
  );

  return (
    <div className={styles.toolbar}>
      <div className={styles.filters}>
        <div className={styles.search}>
          <div className="admin-search-wrapper">
            {isSearching ? <div className="admin-search-spinner" /> : <Search size={16} />}
            <Input
              placeholder={resolvedPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.filterItem}>
          <Clock size={14} className={styles.filterIcon} />
          <FormSelect
            noWrapper
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            options={[
              { value: 'today', label: t('ui.today') },
              { value: '7d', label: t('ui.last7Days') },
              { value: '30d', label: t('ui.last30Days') },
              { value: 'all', label: t('ui.allTime') }
            ]}
          />
        </div>

        {typeof onStatusFilterChange === 'function' && (
          <div className={styles.filterItem}>
            <Shield size={14} className={styles.filterIcon} />
            <FormSelect
              noWrapper
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              options={[
                { value: 'all', label: t('ui.allSecurityEvents') },
                { value: 'failed-logins', label: t('ui.failedLogins') },
                { value: 'success-logins', label: t('ui.successfulLogins') }
              ]}
            />
          </div>
        )}

        {filters && (
          <>
            <div className={styles.filterItem}>
              <Layers size={14} className={styles.filterIcon} />
              <FormSelect
                noWrapper
                value={filters.module}
                onChange={(e) => onFilterChange('module', e.target.value)}
                options={[
                  { value: 'all', label: t('ui.allModules') },
                  { value: 'blog', label: t('ui.blog') },
                  { value: 'projects', label: t('ui.projects') },
                  { value: 'experience', label: t('ui.experience') },
                  { value: 'users', label: t('ui.users') }
                ]}
              />
            </div>

            <div className={styles.filterItem}>
              <MousePointer2 size={14} className={styles.filterIcon} />
              <FormSelect
                noWrapper
                value={filters.action}
                onChange={(e) => onFilterChange('action', e.target.value)}
                options={[
                  { value: 'all', label: t('ui.allActions') },
                  { value: 'created', label: t('ui.created') },
                  { value: 'updated', label: t('ui.updated1') },
                  { value: 'deleted', label: t('ui.deleted') },
                  { value: 'disabled', label: t('ui.disabled') },
                  { value: 'enabled', label: t('ui.enabled') }
                ]}
              />
            </div>
          </>
        )}

        <div className={styles.toolbarActions}>
          <button
            type="button"
            onClick={onReset}
            className="ui-button ui-button--ghost ui-button--sm"
            disabled={!hasFilters}
          >
            <RotateCcw size={14} />
            {t('ui.reset')}
          </button>
          <button 
            type="button"
            onClick={onExport}
            className="ui-button ui-button--primary ui-button--sm"
            disabled={isExportDisabled}
          >
            <Download size={14} />
            {t('ui.export')}
          </button>
        </div>
      </div>
      
      <div className={styles.searchMeta}>
        <span>
          {t('ui.showing')} <strong>{totalItems || 0}</strong>{' '}
          {totalItems === 1 ? t('ui.record') : t('ui.records')}
          {searchQuery ? ` ${t('ui.inThisView')}` : ''}.
        </span>
        {searchHint && <span className={styles.searchHint}>{searchHint}</span>}
      </div>
    </div>
  );
};

export default AuditLogsToolbar;
