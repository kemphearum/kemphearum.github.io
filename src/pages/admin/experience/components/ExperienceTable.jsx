import React from 'react';
import { Edit2, Trash2, Briefcase } from 'lucide-react';
import { Button, Badge } from '../../../../shared/components/ui';
import DataTable from '../../../../shared/components/ui/data-table/DataTable';

const ExperienceTable = ({ 
  experiences, 
  onEdit, 
  onDelete,
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
      render: (row) => (
        <Badge variant={row.visible !== false ? 'success' : 'warning'}>
          {row.visible !== false ? 'Visible' : 'Hidden'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'ui-table-cell--actions',
      render: (row) => (
        <div className="ui-table-actions">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(row)}
            disabled={!canEdit}
            title={canEdit ? "Edit" : "Not authorized"}
          >
            <Edit2 size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(row)}
            disabled={!canDelete}
            title={canDelete ? "Delete" : "Not authorized"}
            style={{ color: canDelete ? 'var(--danger-color, #ef4444)' : 'inherit' }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
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
      emptyState={{
        icon: Briefcase,
        title: "No Experience Entries",
        description: "You haven't added any professional experience yet. Click Add Experience to get started."
      }}
    />
  );
};

export default ExperienceTable;
