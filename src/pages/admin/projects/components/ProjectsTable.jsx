import React from 'react';
import { Edit2, Trash2, ExternalLink, Layout } from 'lucide-react';
import { Button, Badge } from '../../../../shared/components/ui';
import DataTable from '../../../../shared/components/ui/data-table/DataTable';

const ProjectsTable = ({ 
  projects, 
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
      key: 'title',
      header: 'Title',
      className: 'ui-table-cell--title'
    },
    {
      key: 'visible',
      header: 'Status',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Badge variant={row.visible !== false ? 'success' : 'warning'}>
            {row.visible !== false ? 'Visible' : 'Hidden'}
          </Badge>
          {row.featured && (
            <Badge variant="primary">Featured</Badge>
          )}
        </div>
      )
    },
    {
      key: 'techStack',
      header: 'Tech Stack',
      render: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(Array.isArray(row.techStack) ? row.techStack : []).slice(0, 3).map((tech, i) => (
            <Badge key={i} variant="default" size="sm" style={{ fontSize: '10px' }}>
              {tech}
            </Badge>
          ))}
          {row.techStack?.length > 3 && (
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
              +{row.techStack.length - 3}
            </span>
          )}
        </div>
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
            onClick={() => row.slug && window.open(`/projects/${row.slug}`, '_blank')} 
            title="View Live"
          >
            <ExternalLink size={16} />
          </Button>
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
      data={projects} 
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
        icon: Layout,
        title: "No Projects Yet",
        description: "You haven't added any projects to your portfolio. Click 'Add Project' to showcase your work."
      }}
    />
  );
};

export default ProjectsTable;
