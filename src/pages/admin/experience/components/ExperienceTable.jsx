import React from 'react';
import { Briefcase } from 'lucide-react';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderStatusBadge, renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';

/**
 * ExperienceTable Component
 * Refactored to use standardized DataTableHelpers for common column rendering.
 */
const ExperienceTable = ({ 
  experiences, 
  onEdit, 
  onDelete,
  onToggleVisibility,
  canEdit = true,
  canDelete = true,
  loading = false,
  page = 1,
  hasMore = false,
  isFirstPage = true,
  onNext,
  onPrevious,
  onPageChange,
  paginationVariant = 'cursor'
}) => {
  const columns = [
    { 
      key: 'role', 
      header: 'Role', 
      sortable: true, 
      className: 'ui-table-cell--title' 
    },
    { 
      key: 'company', 
      header: 'Company', 
      sortable: true 
    },
    { 
      key: 'period', 
      header: 'Period',
      render: (row) => (
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {row.period}
        </span>
      )
    },
    {
      key: 'visible',
      header: 'Status',
      sortable: true,
      render: (row) => renderStatusBadge(row)
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
        canEdit,
        canDelete
      })
    }
  ];

  return (
    <DataTable 
      data={experiences} 
      columns={columns}
      keyField="id"
      loading={loading}
      manualPagination={true}
      paginationVariant={paginationVariant}
      page={page}
      hasMore={hasMore}
      isFirstPage={isFirstPage}
      onNext={onNext}
      onPrevious={onPrevious}
      onPageChange={onPageChange}
      showExport={true}
      exportFileName="experience_export.csv"
      emptyState={{
        icon: Briefcase,
        title: "No Experience Entries",
        description: "You haven't added any professional experience yet. Click Add Experience to get started."
      }}
    />
  );
};

export default React.memo(ExperienceTable);
