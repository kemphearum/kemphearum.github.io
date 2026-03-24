import React from 'react';
import { FileText, History, Plus } from 'lucide-react';
import { Button, Badge } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';

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
  pageSize = 10,
  hasMore = false,
  isFirstPage = true,
  onNext,
  onPrevious,
  onPageChange,
  paginationVariant = 'cursor',
  selection = null
}) => {
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
    const normalized = String(text).replace(/\s+/g, ' ').trim();
    if (!normalized) return 'No excerpt added yet.';
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
      header: 'Title',
      sortable: true,
      className: 'ui-table-cell--title',
      render: (row) => {
        const tags = getTags(row.tags).slice(0, 3);

        return (
          <div className="ui-blog-tableTitle">
            <div className="ui-blog-tableTitle__main">{row.title || 'Untitled post'}</div>
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
      header: 'Status',
      sortable: true,
      render: (row) => (
        <div className="ui-blog-statusCell">
          <div className="ui-blog-statusCell__badges">
            <Badge variant={row.visible !== false ? 'success' : 'warning'}>
              {row.visible !== false ? 'Live' : 'Draft'}
            </Badge>
            {row.featured && (
              <Badge variant="primary">Featured</Badge>
            )}
          </div>
          <span className="ui-blog-statusCell__note">
            {row.featured ? 'Homepage highlight enabled' : 'Standard listing'}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Date',
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
      header: 'Actions',
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
            title="View History"
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
        title: "No Blog Posts",
        description: "Start with a draft, import an existing archive, or create your first published article.",
        action: canCreate ? {
          label: 'Create first post',
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(BlogTable);
