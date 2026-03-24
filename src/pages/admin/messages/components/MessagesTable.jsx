import React from 'react';
import { Eye, Mail, MailOpen, Trash2 } from 'lucide-react';
import { Button, Badge, DataTable } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const getDateFromTimestamp = (timestamp) => {
  if (!timestamp?.seconds) return null;
  return new Date(timestamp.seconds * 1000);
};

const formatAbsoluteDate = (timestamp, tr, locale) => {
  const date = getDateFromTimestamp(timestamp);
  return date
    ? new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date)
    : tr('Recently', 'ថ្មីៗនេះ');
};

const formatRelativeDate = (timestamp, tr, locale) => {
  const date = getDateFromTimestamp(timestamp);
  if (!date) return tr('Just arrived', 'ទើបមកដល់');

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.abs(diffMs) / 60000;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

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

const buildPreview = (message = '', tr) => {
  const normalized = message.replace(/\s+/g, ' ').trim();
  return normalized || tr('No message preview available.', 'មិនមានការមើលសារជាមុនទេ។');
};

const MessagesTable = ({
  messages,
  onView,
  onToggleRead,
  onDelete,
  loading = false,
  pageSize = 5,
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
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const locale = language === 'km' ? 'km-KH' : undefined;
  const columns = [
    {
      key: 'name',
      header: tr('Sender', 'អ្នកផ្ញើ'),
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
                {row.name || tr('Unknown sender', 'មិនស្គាល់អ្នកផ្ញើ')}
              </span>
              {!row.isRead && <span className="ui-message-rowSender__dot" aria-hidden="true" />}
            </div>
            <span className="ui-message-rowSender__email">
              {row.email || tr('No email provided', 'មិនមានអ៊ីមែល')}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'message',
      header: tr('Preview', 'មើលជាមុន'),
      width: '36%',
      render: (row) => (
        <div className="ui-message-rowPreview">
          <p className="ui-message-rowPreview__text">
            {buildPreview(row.message, tr)}
          </p>
          <div className="ui-message-rowPreview__meta">
            <Badge variant={!row.isRead ? 'primary' : 'default'}>
              {!row.isRead ? tr('Unread', 'មិនទាន់អាន') : tr('Read', 'បានអាន')}
            </Badge>
            <span>{!row.isRead ? tr('Needs a reply check', 'ត្រូវពិនិត្យឆ្លើយតប') : tr('Open to review details', 'បើកមើលលម្អិត')}</span>
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: tr('Received', 'ទទួលបាន'),
      sortable: true,
      width: '18%',
      render: (row) => (
        <div className="ui-message-rowDate">
          <span className="ui-message-rowDate__primary">
            {formatAbsoluteDate(row.createdAt, tr, locale)}
          </span>
          <span className="ui-message-rowDate__secondary">
            {formatRelativeDate(row.createdAt, tr, locale)}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: tr('Actions', 'សកម្មភាព'),
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
            title={tr('Open message', 'បើកសារ')}
            aria-label={tr('Open message', 'បើកសារ')}
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
            title={row.isRead ? tr('Mark unread', 'ដាក់ថាមិនទាន់អាន') : tr('Mark read', 'ដាក់ថាបានអាន')}
            aria-label={row.isRead ? tr('Mark unread', 'ដាក់ថាមិនទាន់អាន') : tr('Mark read', 'ដាក់ថាបានអាន')}
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
            title={tr('Delete message', 'លុបសារ')}
            aria-label={tr('Delete message', 'លុបសារ')}
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
        title: tr('No messages yet', 'មិនទាន់មានសារ'),
        description: tr('Incoming inquiries from your portfolio contact form will appear here.', 'សារសួរព័ត៌មានពីទម្រង់ទំនាក់ទំនងរបស់អ្នកនឹងបង្ហាញនៅទីនេះ។')
      }}
    />
  );
};

export default MessagesTable;
