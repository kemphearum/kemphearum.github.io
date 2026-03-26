import React from 'react';
import { FileText, History, Plus } from 'lucide-react';
import { Button, Badge } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';

/**
 * BlogTable Component
 * Refactored to use standardized DataTableHelpers for common column rendering.
 */
const BlogTable = ({ 
  posts, 
  onEdit, 
  onDelete, 
  onToggleVisibility,
  onToggleFeatured,
  onViewHistory,
  onCreate,
  canCreate = true,
  canEdit = true,
  canDelete = true,
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
  selection = null
}) => {
  const { t, language } = useTranslation();
  const formatPostDate = (value) => {
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

  const getExcerpt = (text = '') => {
    const normalized = String(getLocalizedField(text, language) || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return t('admin.blog.table.noExcerpt');
    return normalized.length > 92 ? `${normalized.slice(0, 92)}...` : normalized;
  };

  const getTags = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      return value.split(',').map((tag) => tag.trim()).filter(Boolean);
    }
    return [];
  };

  const columns = [
    {
      key: 'title',
      header: t('admin.blog.table.title'),
      sortable: true,
      className: 'ui-table-cell--title',
      render: (row) => {
        const tags = getTags(row.tags).slice(0, 3);

        return (
          <div className="ui-blog-tableTitle">
            <div className="ui-blog-tableTitle__main">{getLocalizedField(row.title, language) || t('admin.blog.table.untitled')}</div>
            <div className="ui-blog-tableTitle__meta">
              <span>/{row.slug || row.id}</span>
              <span>{getExcerpt(row.excerpt)}</span>
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
      header: t('admin.blog.table.status'),
      sortable: true,
      render: (row) => (
        <div className="ui-blog-statusCell">
          <div className="ui-blog-statusCell__badges">
            <Badge variant={row.visible !== false ? 'success' : 'warning'}>
              {row.visible !== false ? t('admin.blog.table.live') : t('admin.blog.table.draft')}
            </Badge>
            {row.featured && (
              <Badge variant="primary">{t('admin.blog.table.featured')}</Badge>
            )}
          </div>
          <span className="ui-blog-statusCell__note">
            {row.featured
              ? t('admin.blog.table.homepageHighlight')
              : t('admin.blog.table.standardListing')}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: t('admin.blog.table.date'),
      sortable: true,
      render: (row) => {
        const formatted = formatPostDate(row.createdAt);
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
      header: t('admin.blog.table.actions'),
      className: 'ui-table-cell--actions',
      render: (row) => renderAdminActions({
        row,
        onEdit,
        onDelete,
        onToggleVisibility,
        onToggleFeatured,
        viewUrlPrefix: '/blog/',
        canEdit,
        canDelete,
        extraActions: (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onViewHistory(row)} 
            title={t('admin.blog.table.viewHistory')}
          >
            <History size={16} />
          </Button>
        )
      })
    }
  ];

  return (
    <DataTable 
      data={posts} 
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
      exportFileName="blog_export.csv"
      selection={selection}
      emptyState={{
        icon: FileText,
        title: t('admin.blog.table.emptyTitle'),
        description: t('admin.blog.table.emptyDescription'),
        action: canCreate ? {
          label: t('admin.blog.table.createFirst'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(BlogTable);

