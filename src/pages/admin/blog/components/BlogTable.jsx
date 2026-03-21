import React from 'react';
import { Edit2, Trash2, FileText } from 'lucide-react';
import { Button, Badge } from '../../../../shared/components/ui';
import DataTable from '../../../../shared/components/ui/data-table/DataTable';

const BlogTable = ({ 
  posts, 
  onEdit, 
  onDelete, 
  canEdit = true,
  canDelete = true,
  loading = false,
  pageSize = 10,
  page = 1,
  onPageChange
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
        <Badge variant={row.visible ? 'success' : 'warning'}>
          {row.visible ? 'Published' : 'Draft'}
        </Badge>
      )
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
      data={posts} 
      columns={columns} 
      keyField="id" 
      loading={loading}
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      emptyState={{
        icon: FileText,
        title: "No Blog Posts",
        description: "You haven't written any articles yet."
      }}
    />
  );
};

export default BlogTable;
