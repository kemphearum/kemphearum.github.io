import React from 'react';
import { Search, Filter, Download, X, Clock, Layers, MousePointer2 } from 'lucide-react';
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
  totalItems,
  placeholder = "Search by user, IP or entity..."
}) => {
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

        <button 
          onClick={onExport}
          className="ui-button ui-primary ui-sm"
          style={{ 
            marginLeft: 'auto', 
            gap: '0.5rem', 
            borderRadius: '10px',
            padding: '0.5rem 1.25rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}
        >
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>
      
      {searchQuery && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Found {totalItems} matching audit records
        </div>
      )}
    </div>
  );
};

export default AuditLogsToolbar;
