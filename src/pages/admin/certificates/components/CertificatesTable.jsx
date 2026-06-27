import React from 'react';
import { Award, Plus, History } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';
import HighlightText from '@/shared/components/ui/HighlightText';

const CertificatesTable = ({
  certificates,
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
      header: t('admin.certificates.table.columns.name'),
      sortable: true,
      className: 'ui-table-cell--title',
      render: (row) => (
        <div className="ui-blog-tableTitle">
          <div className="ui-blog-tableTitle__main">
            <HighlightText
              text={getLocalizedField(row.name, language) || t('admin.certificates.table.untitled')}
              query={searchQuery}
            />
          </div>
          <div className="ui-blog-tableTitle__meta">
            {row.organization && <span><HighlightText text={row.organization} query={searchQuery} /></span>}
            {row.issueDate && <span>{row.issueDate}{row.expiryDate ? ` → ${row.expiryDate}` : ''}</span>}
          </div>
        </div>
      )
    },
    {
      key: 'visible',
      header: t('admin.certificates.table.columns.status'),
      sortable: true,
      render: (row) => (
        <div className="ui-blog-statusCell">
          <div className="ui-blog-statusCell__badges">
            <Badge variant={row.visible !== false ? 'success' : 'warning'}>
              {row.visible !== false ? t('admin.certificates.table.status.visible') : t('admin.certificates.table.status.hidden')}
            </Badge>
            {row.featured && <Badge variant="primary">{t('admin.certificates.table.status.featured')}</Badge>}
          </div>
          <span className="ui-blog-statusCell__note">
            {row.credentialId
              ? t('admin.certificates.table.status.hasCredential')
              : t('admin.certificates.table.status.noCredential')}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: t('admin.certificates.table.columns.actions'),
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
            title={t('admin.certificates.table.viewHistory')}
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
      data={certificates}
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
      exportFileName="certificates_export.csv"
      selection={selection}
      emptyState={{
        icon: Award,
        title: t('admin.certificates.table.empty.title'),
        description: t('admin.certificates.table.empty.description'),
        action: canCreate ? {
          label: t('admin.certificates.table.empty.action'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(CertificatesTable);
