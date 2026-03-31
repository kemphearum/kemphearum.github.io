import React from 'react';
import { Search, Download, RotateCcw, Clock, Layers, MousePointer2 } from 'lucide-react';
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
  onExport,
  onReset,
  totalItems,
  isExportDisabled = false,
  searchHint = '',
  placeholder = '',
  isSearching = false
}) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const resolvedPlaceholder = placeholder || tr('Search by user, IP or entity...', 'ស្វែងរកតាមអ្នកប្រើ IP ឬធាតុ...');

  const hasFilters = Boolean(
    searchQuery
    || (dateRange && dateRange !== 'today')
    || (filters?.module && filters.module !== 'all')
    || (filters?.action && filters.action !== 'all')
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
              { value: 'today', label: tr('Today', 'ថ្ងៃនេះ') },
              { value: '7d', label: tr('Last 7 Days', '7 ថ្ងៃចុងក្រោយ') },
              { value: '30d', label: tr('Last 30 Days', '30 ថ្ងៃចុងក្រោយ') },
              { value: 'all', label: tr('All Time', 'គ្រប់ពេល') }
            ]}
          />
        </div>
        
        {filters && (
          <>
            <div className={styles.filterItem}>
              <Layers size={14} className={styles.filterIcon} />
              <FormSelect
                noWrapper
                value={filters.module}
                onChange={(e) => onFilterChange('module', e.target.value)}
                options={[
                  { value: 'all', label: tr('All Modules', 'គ្រប់ម៉ូឌុល') },
                  { value: 'blog', label: tr('Blog', 'ប្លុក') },
                  { value: 'projects', label: tr('Projects', 'គម្រោង') },
                  { value: 'experience', label: tr('Experience', 'បទពិសោធន៍') },
                  { value: 'users', label: tr('Users', 'អ្នកប្រើ') }
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
                  { value: 'all', label: tr('All Actions', 'គ្រប់សកម្មភាព') },
                  { value: 'created', label: tr('Created', 'បានបង្កើត') },
                  { value: 'updated', label: tr('Updated', 'បានកែប្រែ') },
                  { value: 'deleted', label: tr('Deleted', 'បានលុប') },
                  { value: 'disabled', label: tr('Disabled', 'បានបិទ') },
                  { value: 'enabled', label: tr('Enabled', 'បានបើក') }
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
            {tr('Reset', 'កំណត់ឡើងវិញ')}
          </button>
          <button 
            type="button"
            onClick={onExport}
            className="ui-button ui-button--primary ui-button--sm"
            disabled={isExportDisabled}
          >
            <Download size={14} />
            {tr('Export', 'នាំចេញ')}
          </button>
        </div>
      </div>
      
      <div className={styles.searchMeta}>
        <span>
          {tr('Showing', 'កំពុងបង្ហាញ')} <strong>{totalItems || 0}</strong>{' '}
          {totalItems === 1 ? tr('record', 'កំណត់ត្រា') : tr('records', 'កំណត់ត្រា')}
          {searchQuery ? ` ${tr('in this view', 'ក្នុងទិដ្ឋភាពនេះ')}` : ''}.
        </span>
        {searchHint && <span className={styles.searchHint}>{searchHint}</span>}
      </div>
    </div>
  );
};

export default AuditLogsToolbar;
