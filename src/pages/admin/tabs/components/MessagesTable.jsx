import React from 'react';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { Button, Badge, DataTable } from '../../../../shared/components/ui';

const MessagesTable = ({ 
  messages, 
  onView, 
  onToggleRead, 
  onDelete, 
  loading = false,
  pageSize = 10,
  page = 1,
  selection,
  totalItems,
  onPrevious,
  onPageChange,
  paginationVariant = 'cursor'
}) => {
  const columns = [
    {
      key: 'name',
      header: 'Sender',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            fontWeight: !row.isRead ? 700 : 500,
            color: !row.isRead ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}>
            {row.name}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary, #64748b)' }}>
            {row.email}
          </span>
        </div>
      )
    },
    {
      key: 'message',
      header: 'Message Preview',
      render: (row) => (
        <div style={{ 
          maxWidth: '300px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          color: !row.isRead ? 'var(--text-primary)' : 'var(--text-secondary)',
          opacity: !row.isRead ? 1 : 0.7
        }}>
          {row.message}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Received',
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {row.createdAt?.seconds 
            ? new Date(row.createdAt.seconds * 1000).toLocaleString([], { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              }) 
            : 'Recently'}
        </span>
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
            onClick={(e) => { e.stopPropagation(); onToggleRead(row.id, row.isRead); }} 
            title={row.isRead ? "Mark Unread" : "Mark Read"}
            style={{ color: !row.isRead ? 'var(--primary-color)' : 'inherit' }}
          >
            {row.isRead ? <MailOpen size={16} /> : <Mail size={16} />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onDelete(row.id); }} 
            title="Delete"
            style={{ color: 'var(--danger-color, #ef4444)' }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DataTable 
      data={messages} 
      columns={columns} 
      keyField="id" 
      loading={loading}
      pageSize={pageSize}
      page={page}
      onRowClick={onView}
      selection={selection}
      totalItems={totalItems}
      manualPagination={true}
      paginationVariant={paginationVariant}
      onPageChange={onPageChange}
      hasMore={hasMore}
      isFirstPage={isFirstPage}
      onNext={onNext}
      onPrevious={onPrevious}
      rowClassName={(row) => !row.isRead ? 'ui-table-row--unread' : ''}
      emptyState={{
        icon: Mail,
        title: "No messages yet",
        description: "Incoming inquiries from your portfolio contact form will appear here."
      }}
    />
  );
};

export default MessagesTable;
