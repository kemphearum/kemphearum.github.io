import React from 'react';
import { Layout, Plus, History } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';
import HighlightText from '@/shared/components/ui/HighlightText';

/**
 * ProjectsTable Component
 * Refactored to use standardized DataTableHelpers for common column rendering.
 */
const ProjectsTable = ({ 
  projects, 
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
  
  const formatProjectDate = (value) => {
    if (!value?.seconds) return { day: '-', time: '' };

    const date = new Date(value.seconds * 1000);
    return {
      day: new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date),
      time: new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      }).format(date)
    };
  };

  const getDescription = (text = '') => {
    const normalized = String(getLocalizedField(text, language) || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return t('admin.projects.table.noDescription');
    return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
  };

  const getTechStack = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  };

  const columns = [
    {
      key: 'title',
      header: t('admin.projects.table.columns.title'),
      sortable: true,
      className: 'ui-table-cell--title',
      render: (row) => {
        const tags = getTechStack(row.techStack).slice(0, 4);

        return (
          <div className="ui-blog-tableTitle">
            <div className="ui-blog-tableTitle__main">
              <HighlightText 
                text={getLocalizedField(row.title, language) || t('admin.projects.table.roleMeta.untitled')} 
                query={searchQuery} 
              />
            </div>
            <div className="ui-blog-tableTitle__meta">
              <span>/<HighlightText text={row.slug || row.id} query={searchQuery} /></span>
              <span>{getDescription(row.description)}</span>
            </div>
            {tags.length > 0 && (
              <div className="ui-blog-tableTitle__tags">
                {tags.map((tag) => (
                  <Badge key={`${row.id}-${tag}`} variant="default">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'visible',
      header: t('admin.projects.table.columns.status'),
      sortable: true,
      render: (row) => (
        <div className="ui-blog-statusCell">
          <div className="ui-blog-statusCell__badges">
            <Badge variant={row.visible !== false ? 'success' : 'warning'}>
              {row.visible !== false ? t('admin.projects.table.status.live') : t('admin.projects.table.status.hidden')}
            </Badge>
            {row.featured && <Badge variant="primary">{t('admin.projects.table.status.featured')}</Badge>}
          </div>
          <span className="ui-blog-statusCell__note">
            {row.liveUrl
              ? t('admin.projects.table.status.demoLinked')
              : row.githubUrl
                ? t('admin.projects.table.status.repoLinked')
                : t('admin.projects.table.status.noLinks')}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: t('admin.projects.table.columns.date'),
      sortable: true,
      render: (row) => {
        const formatted = formatProjectDate(row.createdAt);
        return (
          <div className="ui-blog-dateCell">
            <span className="ui-blog-dateCell__day">{formatted.day}</span>
            {formatted.time && <span className="ui-blog-dateCell__time">{formatted.time}</span>}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: t('admin.projects.table.columns.actions'),
      className: 'ui-table-cell--actions',
      render: (row) => renderAdminActions({
        row,
        onEdit,
        onDelete,
        onToggleVisibility,
        onToggleFeatured,
        viewUrlPrefix: '/projects/',
        canEdit,
        canDelete,
        canFeature,
        canToggleVisibility,
        extraActions: (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewHistory(row)}
            title={t('admin.projects.table.viewHistory')}
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
      data={projects} 
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
      exportFileName="projects_export.csv"
      selection={selection}
      emptyState={{
        icon: Layout,
        title: t('admin.projects.table.empty.title'),
        description: t('admin.projects.table.empty.description'),
        action: canCreate ? {
          label: t('admin.projects.table.empty.action'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(ProjectsTable);

