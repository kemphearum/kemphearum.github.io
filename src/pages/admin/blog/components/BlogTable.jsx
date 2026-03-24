import React from 'react';
import { FileText, History } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderStatusBadge, renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';

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
  const columns = [
    {
      key: 'title',
      header: 'Title',
      className: 'ui-table-cell--title'
    },
    {
      key: 'visible',
      header: 'Status',
      render: (row) => renderStatusBadge(row)
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => (
        row.createdAt?.seconds 
          ? new Date(row.createdAt.seconds * 1000).toLocaleDateString()
          : '-'
      )
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
        description: "You haven't written any articles yet."
      }}
    />
  );
};

export default React.memo(BlogTable);
