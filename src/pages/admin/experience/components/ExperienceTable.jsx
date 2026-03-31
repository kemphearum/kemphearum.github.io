import React from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';

/**
 * ExperienceTable Component
 * Refactored to use standardized DataTableHelpers for common column rendering.
 */
const ExperienceTable = ({ 
  experiences, 
  onEdit, 
  onDelete,
  onToggleVisibility,
  onCreate,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canToggleVisibility,
  loading = false,
  page = 1,
  pageSize = 5,
  totalItems,
  hasMore = false,
  isFirstPage = true,
  onNext,
  onPrevious,
  onPageChange,
  paginationVariant = 'cursor'
}) => {
  const { language, t } = useTranslation();
  
  const normalizeMonthValue = (value) => {
    if (!value) return '';

    if (typeof value === 'object') {
      if (value.seconds) {
        const date = new Date(value.seconds * 1000);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (typeof value.toDate === 'function') {
        const date = value.toDate();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    const text = String(value).trim();
    const monthMatch = text.match(/^(\d{4})-(\d{2})/);
    if (monthMatch) return monthMatch[0];

    const nativeDate = new Date(text);
    if (!Number.isNaN(nativeDate.getTime())) {
      return `${nativeDate.getFullYear()}-${String(nativeDate.getMonth() + 1).padStart(2, '0')}`;
    }

    return '';
  };

  const formatMonth = (value) => {
    const normalized = normalizeMonthValue(value);
    if (!normalized) return '';
    const [year, month] = normalized.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getPeriodSummary = (row) => {
    const isCurrent = row.current === true || `${row.endMonthYear || row.endDate || row.period || ''}`.toLowerCase().includes('present');
    const startRaw = row.startMonthYear || row.startDate || row.period;
    const endRaw = row.endMonthYear || row.endDate || row.period;
    const start = formatMonth(startRaw);
    const end = isCurrent ? t('admin.experience.table.present') : formatMonth(endRaw);

    if (start && end) return `${start} - ${end}`;
    return row.period || start || end || t('admin.experience.table.noTimeline');
  };

  const getDescription = (text = '') => {
    const normalized = String(getLocalizedField(text, language) || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return t('admin.experience.table.noDescription');
    return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
  };

  const columns = [
    { 
      key: 'role', 
      header: t('admin.experience.table.columns.role'),
      sortable: true, 
      className: 'ui-table-cell--title',
      render: (row) => (
        <div className="ui-blog-tableTitle">
          <div className="ui-blog-tableTitle__main">{getLocalizedField(row.role, language) || t('admin.experience.table.roleMeta.untitled')}</div>
          <div className="ui-blog-tableTitle__meta">
            <span>{getLocalizedField(row.company, language) || t('admin.experience.table.roleMeta.noCompany')}</span>
            <span>{getDescription(row.description)}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'period', 
      header: t('admin.experience.table.columns.timeline'),
      render: (row) => {
        const isCurrent = row.current === true || `${row.endMonthYear || row.endDate || row.period || ''}`.toLowerCase().includes('present');
        return (
          <div className="ui-blog-dateCell">
            <span className="ui-blog-dateCell__day">{getPeriodSummary(row)}</span>
            <span className="ui-blog-dateCell__time">
              {isCurrent ? t('admin.experience.table.status.current') : t('admin.experience.table.status.completed')}
            </span>
          </div>
        );
      }
    },
    {
      key: 'visible',
      header: t('admin.experience.table.columns.status'),
      sortable: true,
      render: (row) => {
        const isCurrent = row.current === true || `${row.endMonthYear || row.endDate || row.period || ''}`.toLowerCase().includes('present');
        return (
          <div className="ui-blog-statusCell">
            <div className="ui-blog-statusCell__badges">
              <Badge variant={row.visible !== false ? 'success' : 'warning'}>
                {row.visible !== false ? t('admin.experience.table.status.visible') : t('admin.experience.table.status.hidden')}
              </Badge>
              {isCurrent && <Badge variant="primary">{t('admin.experience.table.status.isCurrent')}</Badge>}
            </div>
            <span className="ui-blog-statusCell__note">
              {row.visible !== false
                ? t('admin.experience.table.status.visibleDesc')
                : t('admin.experience.table.status.hiddenDesc')}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: t('admin.experience.table.columns.actions'),
      className: 'ui-table-cell--actions',
      render: (row) => renderAdminActions({
        row,
        onEdit,
        onDelete,
        onToggleVisibility,
        canEdit,
        canDelete,
        canToggleVisibility
      })
    }
  ];

  return (
    <DataTable 
      data={experiences} 
      columns={columns}
      keyField="id"
      loading={loading}
      manualPagination={true}
      paginationVariant={paginationVariant}
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      hasMore={hasMore}
      isFirstPage={isFirstPage}
      onNext={onNext}
      onPrevious={onPrevious}
      onPageChange={onPageChange}
      showExport={true}
      exportFileName="experience_export.csv"
      emptyState={{
        icon: Briefcase,
        title: t('admin.experience.table.empty.title'),
        description: t('admin.experience.table.empty.description'),
        action: canCreate ? {
          label: t('admin.experience.table.empty.action'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(ExperienceTable);

