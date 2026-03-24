import React from 'react';
import { Eye, Mail, MailOpen, Trash2 } from 'lucide-react';
import { Button, Badge, DataTable } from '../../../../shared/components/ui';

const getDateFromTimestamp = (timestamp) => {
  if (!timestamp?.seconds) return null;
  return new Date(timestamp.seconds * 1000);
};

const formatAbsoluteDate = (timestamp) => {
  const date = getDateFromTimestamp(timestamp);
  return date
    ? new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date)
    : 'Recently';
};

const formatRelativeDate = (timestamp) => {
  const date = getDateFromTimestamp(timestamp);
  if (!date) return 'Just arrived';

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.abs(diffMs) / 60000;
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (diffMinutes < 60) {
    return formatter.format(Math.round(diffMs / 60000), 'minute');
  }

  const diffHours = diffMinutes / 60;
  if (diffHours < 24) {
    return formatter.format(Math.round(diffMs / 3600000), 'hour');
  }

  const diffDays = diffHours / 24;
  if (diffDays < 7) {
    return formatter.format(Math.round(diffMs / 86400000), 'day');
  }

  return formatter.format(Math.round(diffMs / 604800000), 'week');
};

const getInitials = (name = '') => {
  const cleaned = name.trim();
  if (!cleaned) return '?';
  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const buildPreview = (message = '') => {
  const normalized = message.replace(/\s+/g, ' ').trim();
  return normalized || 'No message preview available.';
};

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
  hasMore,
  isFirstPage,
  onNext,
  onPrevious,
  onPageChange,
  paginationVariant = 'cursor'
}) => {
  const columns = [
    {
      key: 'name',
      header: 'Sender',
      sortable: true,
      width: '34%',
      render: (row) => (
        <div className="ui-message-rowSender">
          <div className="ui-message-rowSender__avatar">
            {getInitials(row.name)}
          </div>
          <div className="ui-message-rowSender__meta">
            <div className="ui-message-rowSender__top">
              <span className="ui-message-rowSender__name">
                {row.name || 'Unknown sender'}
              </span>
              {!row.isRead && <span className="ui-message-rowSender__dot" aria-hidden="true" />}
            </div>
            <span className="ui-message-rowSender__email">
              {row.email || 'No email provided'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'message',
      header: 'Preview',
      width: '36%',
      render: (row) => (
        <div className="ui-message-rowPreview">
          <p className="ui-message-rowPreview__text">
            {buildPreview(row.message)}
          </p>
          <div className="ui-message-rowPreview__meta">
            <Badge variant={!row.isRead ? 'primary' : 'default'}>
              {!row.isRead ? 'Unread' : 'Read'}
            </Badge>
            <span>{!row.isRead ? 'Needs a reply check' : 'Open to review details'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Received',
      sortable: true,
      width: '18%',
      render: (row) => (
        <div className="ui-message-rowDate">
          <span className="ui-message-rowDate__primary">
            {formatAbsoluteDate(row.createdAt)}
          </span>
          <span className="ui-message-rowDate__secondary">
            {formatRelativeDate(row.createdAt)}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'ui-table-cell--actions',
      width: '12%',
      render: (row) => (
        <div className="ui-message-rowActions">
          <Button
            variant="ghost"
            size="sm"
            className="ui-btn-icon-only"
            onClick={(event) => {
              event.stopPropagation();
              onView(row);
            }}
            title="Open message"
            aria-label="Open message"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ui-btn-icon-only"
            onClick={(event) => {
              event.stopPropagation();
              onToggleRead(row.id, row.isRead);
            }}
            title={row.isRead ? 'Mark unread' : 'Mark read'}
            aria-label={row.isRead ? 'Mark unread' : 'Mark read'}
          >
            {row.isRead ? <MailOpen size={16} /> : <Mail size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ui-btn-icon-only ui-message-rowActions__delete"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row.id);
            }}
            title="Delete message"
            aria-label="Delete message"
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
      rowClassName={(row) => (!row.isRead ? 'ui-table-row--unread ui-message-row--unread' : 'ui-message-row')}
      emptyState={{
        icon: Mail,
        title: 'No messages yet',
        description: 'Incoming inquiries from your portfolio contact form will appear here.'
      }}
    />
  );
};

export default MessagesTable;
