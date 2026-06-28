import React from 'react';
import { BookOpen, Plus, History } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';
import HighlightText from '@/shared/components/ui/HighlightText';

const PublicationsTable = ({
  publications,
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
      key: 'title',
      header: t('admin.publications.table.columns.title', 'Title'),
      sortable: true,
      className: 'ui-table-cell--title',
      render: (row) => (
        <div className="ui-blog-tableTitle">
          <div className="ui-blog-tableTitle__main">
            <HighlightText
              text={getLocalizedField(row.title, language) || t('admin.publications.table.untitled', 'Untitled Publication')}
              query={searchQuery}
            />
          </div>
          <div className="ui-blog-tableTitle__meta">
            {row.publisher && <span><HighlightText text={getLocalizedField(row.publisher, language)} query={searchQuery} /></span>}
            {row.publishDate && <span>{row.publishDate}</span>}
          </div>
        </div>
      )
    },
    {
      key: 'visible',
      header: t('admin.common.table.status', 'Status'),
      sortable: true,
      render: (row) => (
        <div className="ui-blog-statusCell">
          <div className="ui-blog-statusCell__badges">
            <Badge variant={row.visible !== false ? 'success' : 'warning'}>
              {row.visible !== false ? t('admin.common.visible', 'Visible') : t('admin.common.hidden', 'Hidden')}
            </Badge>
            {row.featured && <Badge variant="primary">{t('admin.common.featured', 'Featured')}</Badge>}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: t('admin.common.table.actions', 'Actions'),
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
            title={t('admin.common.viewHistory', 'View History')}
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
      data={publications}
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
      exportFileName="publications_export.csv"
      selection={selection}
      emptyState={{
        icon: BookOpen,
        title: t('admin.publications.table.empty.title', 'No publications found'),
        description: t('admin.publications.table.empty.description', 'Get started by creating a new publication.'),
        action: canCreate ? {
          label: t('admin.publications.table.empty.action', 'Add Publication'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(PublicationsTable);
