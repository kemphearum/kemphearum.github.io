import React from 'react';
import { Layout, Plus } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';

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
    const normalized = String(text).replace(/\s+/g, ' ').trim();
    if (!normalized) return 'No short description added yet.';
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
      header: 'Title',
      sortable: true,
      className: 'ui-table-cell--title',
      render: (row) => {
        const tags = getTechStack(row.techStack).slice(0, 4);

        return (
          <div className="ui-blog-tableTitle">
            <div className="ui-blog-tableTitle__main">{row.title || 'Untitled project'}</div>
            <div className="ui-blog-tableTitle__meta">
              <span>/{row.slug || row.id}</span>
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
      header: 'Status',
      sortable: true,
      render: (row) => (
        <div className="ui-blog-statusCell">
          <div className="ui-blog-statusCell__badges">
            <Badge variant={row.visible !== false ? 'success' : 'warning'}>
              {row.visible !== false ? 'Live' : 'Hidden'}
            </Badge>
            {row.featured && <Badge variant="primary">Featured</Badge>}
          </div>
          <span className="ui-blog-statusCell__note">
            {row.liveUrl ? 'Demo linked' : row.githubUrl ? 'Repository linked' : 'No public links yet'}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Date',
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
        description: "Start with a featured case study, import an existing portfolio export, or add the next project you want to showcase.",
        action: canCreate ? {
          label: 'Create first project',
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(ProjectsTable);
