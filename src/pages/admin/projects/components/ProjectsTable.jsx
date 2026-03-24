import React from 'react';
import { Layout } from 'lucide-react';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderStatusBadge, renderTags, renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';

/**
 * ProjectsTable Component
 * Refactored to use standardized DataTableHelpers for common column rendering.
 */
const ProjectsTable = ({ 
  projects, 
  onEdit, 
  onDelete,
  onToggleVisibility,
  onToggleFeatured,
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
      sortable: true,
      className: 'ui-table-cell--title'
    },
    {
      key: 'visible',
      header: 'Status',
      sortable: true,
      render: (row) => renderStatusBadge(row)
    },
    {
      key: 'techStack',
      header: 'Tech Stack',
      sortable: true,
      render: (row) => renderTags(row, 'techStack')
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
        viewUrlPrefix: '/projects/',
        canEdit,
        canDelete
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
        title: "No Projects Yet",
        description: "You haven't added any projects to your portfolio. Click 'Add Project' to showcase your work."
      }}
    />
  );
};

export default React.memo(ProjectsTable);
