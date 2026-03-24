import React from 'react';
import { Search, Download, RotateCcw, Clock, Layers, MousePointer2 } from 'lucide-react';
import { Input } from '../../../../shared/components/ui';
import FormSelect from '../../components/FormSelect';
import styles from '../AuditLogsTab.module.scss';

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
  placeholder = "Search by user, IP or entity..."
}) => {
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
          <Input
            icon={Search}
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.filterItem}>
          <Clock size={14} className={styles.filterIcon} />
          <FormSelect
            noWrapper
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            options={[
              { value: 'today', label: 'Today' },
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: 'all', label: 'All Time' }
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
                  { value: 'all', label: 'All Modules' },
                  { value: 'blog', label: 'Blog' },
                  { value: 'projects', label: 'Projects' },
                  { value: 'experience', label: 'Experience' },
                  { value: 'users', label: 'Users' }
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
                  { value: 'all', label: 'All Actions' },
                  { value: 'created', label: 'Created' },
                  { value: 'updated', label: 'Updated' },
                  { value: 'deleted', label: 'Deleted' },
                  { value: 'disabled', label: 'Disabled' },
                  { value: 'enabled', label: 'Enabled' }
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
            Reset
          </button>
          <button 
            type="button"
            onClick={onExport}
            className="ui-button ui-button--primary ui-button--sm"
            disabled={isExportDisabled}
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>
      
      <div className={styles.searchMeta}>
        <span>
          Showing <strong>{totalItems || 0}</strong> record{totalItems === 1 ? '' : 's'}
          {searchQuery ? ' in this view' : ''}.
        </span>
        {searchHint && <span className={styles.searchHint}>{searchHint}</span>}
      </div>
    </div>
  );
};

export default AuditLogsToolbar;
