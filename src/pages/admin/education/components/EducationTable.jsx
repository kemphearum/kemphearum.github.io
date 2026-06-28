import React from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';

/**
 * EducationTable Component
 * Refactored to use standardized DataTableHelpers for common column rendering.
 */
const EducationTable = ({ 
  educations, 
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
  
  const getPeriodSummary = (row) => {
    const isCurrent = row.current === true;
    const start = row.startYear || '';
    const end = isCurrent ? t('admin.education.table.present') : (row.endYear || '');

    if (start && end && start !== end) return `${start} - ${end}`;
    return start || end || t('admin.education.table.noTimeline');
  };

  const getDescription = (text = '') => {
    const normalized = String(getLocalizedField(text, language) || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return t('admin.education.table.noDescription');
    return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
  };

  const columns = [
    { 
      key: 'degree', 
      header: t('admin.education.table.columns.degree'),
      sortable: true, 
      className: 'ui-table-cell--title',
      render: (row) => (
        <div className="ui-blog-tableTitle">
          <div className="ui-blog-tableTitle__main">{getLocalizedField(row.degree, language) || t('admin.education.table.degreeMeta.untitled')}</div>
          <div className="ui-blog-tableTitle__meta">
            <span>{getLocalizedField(row.school, language) || t('admin.education.table.degreeMeta.noschool')}</span>
            <span>{getDescription(row.description)}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'period', 
      header: t('admin.education.table.columns.timeline'),
      render: (row) => {
        const isCurrent = row.current === true;
        return (
          <div className="ui-blog-dateCell">
            <span className="ui-blog-dateCell__day">{getPeriodSummary(row)}</span>
            <span className="ui-blog-dateCell__time">
              {isCurrent ? t('admin.education.table.status.current') : t('admin.education.table.status.completed')}
            </span>
          </div>
        );
      }
    },
    {
      key: 'visible',
      header: t('admin.education.table.columns.status'),
      sortable: true,
      render: (row) => {
        const isCurrent = row.current === true;
        return (
          <div className="ui-blog-statusCell">
            <div className="ui-blog-statusCell__badges">
              <Badge variant={row.visible !== false ? 'success' : 'warning'}>
                {row.visible !== false ? t('admin.education.table.status.visible') : t('admin.education.table.status.hidden')}
              </Badge>
              {isCurrent && <Badge variant="primary">{t('admin.education.table.status.isCurrent')}</Badge>}
            </div>
            <span className="ui-blog-statusCell__note">
              {row.visible !== false
                ? t('admin.education.table.status.visibleDesc')
                : t('admin.education.table.status.hiddenDesc')}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: t('admin.education.table.columns.actions'),
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
      data={educations} 
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
      exportFileName="education_export.csv"
      emptyState={{
        icon: GraduationCap,
        title: t('admin.education.table.empty.title'),
        description: t('admin.education.table.empty.description'),
        action: canCreate ? {
          label: t('admin.education.table.empty.action'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(EducationTable);
