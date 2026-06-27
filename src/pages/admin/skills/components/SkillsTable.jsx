import React from 'react';
import { Sparkles, Plus, History } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';
import HighlightText from '@/shared/components/ui/HighlightText';

const SkillsTable = ({
  skills,
  onEdit,
  onDelete,
  onViewHistory,
  onToggleVisibility,
  onToggleFeatured,
  onCreate,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canFeature,
  canToggleVisibility,
  canViewHistory = true,
  loading = false,
  page = 1,
  pageSize = 5,
  totalItems,
  hasMore = false,
  isFirstPage = true,
  onNext,
  onPrevious,
  onPageChange,
  paginationVariant = 'cursor',
  selection = null,
  searchQuery = ''
}) => {
  const { language, t } = useTranslation();

  const columns = [
    {
      key: 'name',
      header: t('admin.skills.table.columns.name'),
      sortable: true,
      className: 'ui-table-cell--title',
      render: (row) => (
        <div className="ui-blog-tableTitle">
          <div className="ui-blog-tableTitle__main">
            <HighlightText
              text={getLocalizedField(row.name, language) || t('admin.skills.table.untitled')}
              query={searchQuery}
            />
          </div>
          <div className="ui-blog-tableTitle__meta">
            {row.category && <span><HighlightText text={row.category} query={searchQuery} /></span>}
            <span>{t(`admin.skills.levels.${row.level || 'intermediate'}`)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'visible',
      header: t('admin.skills.table.columns.status'),
      sortable: true,
      render: (row) => (
        <div className="ui-blog-statusCell">
          <div className="ui-blog-statusCell__badges">
            <Badge variant={row.visible !== false ? 'success' : 'warning'}>
              {row.visible !== false ? t('admin.skills.table.status.visible') : t('admin.skills.table.status.hidden')}
            </Badge>
            {row.featured && <Badge variant="primary">{t('admin.skills.table.status.featured')}</Badge>}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: t('admin.skills.table.columns.actions'),
      className: 'ui-table-cell--actions',
      render: (row) => renderAdminActions({
        row,
        onEdit,
        onDelete,
        onToggleVisibility,
        onToggleFeatured,
        canEdit,
        canDelete,
        canFeature,
        canToggleVisibility,
        extraActions: (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewHistory(row)}
            title={t('admin.skills.table.viewHistory')}
            disabled={!canViewHistory}
          >
            <History size={16} />
          </Button>
        )
      })
    }
  ];

  return (
    <DataTable
      data={skills}
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
      exportFileName="skills_export.csv"
      selection={selection}
      emptyState={{
        icon: Sparkles,
        title: t('admin.skills.table.empty.title'),
        description: t('admin.skills.table.empty.description'),
        action: canCreate ? {
          label: t('admin.skills.table.empty.action'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(SkillsTable);
