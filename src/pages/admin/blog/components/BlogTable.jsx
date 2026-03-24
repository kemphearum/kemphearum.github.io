import React from 'react';
import { FileText, History, Plus } from 'lucide-react';
import { Button, Badge } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';

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
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
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
    if (!normalized) return tr('No excerpt added yet.', 'មិនទាន់មានសេចក្តីសង្ខេបនៅឡើយទេ។');
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
      header: tr('Title', 'ចំណងជើង'),
      sortable: true,
      className: 'ui-table-cell--title',
      render: (row) => {
        const tags = getTags(row.tags).slice(0, 3);

        return (
          <div className="ui-blog-tableTitle">
            <div className="ui-blog-tableTitle__main">{row.title || tr('Untitled post', 'អត្ថបទគ្មានចំណងជើង')}</div>
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
      header: tr('Status', 'ស្ថានភាព'),
      sortable: true,
      render: (row) => (
        <div className="ui-blog-statusCell">
          <div className="ui-blog-statusCell__badges">
            <Badge variant={row.visible !== false ? 'success' : 'warning'}>
              {row.visible !== false ? tr('Live', 'បង្ហាញ') : tr('Draft', 'ព្រាង')}
            </Badge>
            {row.featured && (
              <Badge variant="primary">{tr('Featured', 'ពិសេស')}</Badge>
            )}
          </div>
          <span className="ui-blog-statusCell__note">
            {row.featured
              ? tr('Homepage highlight enabled', 'បានដាក់បន្លិចលើទំព័រដើម')
              : tr('Standard listing', 'បញ្ជីធម្មតា')}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: tr('Date', 'កាលបរិច្ឆេទ'),
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
      header: tr('Actions', 'សកម្មភាព'),
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
            title={tr('View History', 'មើលប្រវត្តិ')}
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
        title: tr('No Blog Posts', 'មិនមានអត្ថបទប្លុក'),
        description: tr('Start with a draft, import an existing archive, or create your first published article.', 'ចាប់ផ្តើមដោយអត្ថបទព្រាង នាំចូលឯកសារចាស់ ឬបង្កើតអត្ថបទដំបូងរបស់អ្នក។'),
        action: canCreate ? {
          label: tr('Create first post', 'បង្កើតអត្ថបទដំបូង'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(BlogTable);
