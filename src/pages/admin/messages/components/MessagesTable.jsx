import React from 'react';
import { Eye, Mail, MailOpen, Trash2 } from 'lucide-react';
import { Button, Badge, DataTable } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const getDateFromTimestamp = (timestamp) => {
    if (!timestamp?.seconds) return null;
    return new Date(timestamp.seconds * 1000);
};

const formatAbsoluteDate = (timestamp, locale, fallbackText) => {
    const date = getDateFromTimestamp(timestamp);
    return date
        ? new Intl.DateTimeFormat(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date)
        : fallbackText;
};

const formatRelativeDate = (timestamp, locale, fallbackText) => {
    const date = getDateFromTimestamp(timestamp);
    if (!date) return fallbackText;

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

const buildPreview = (message = '', fallbackText) => {
    const normalized = message.replace(/\s+/g, ' ').trim();
    return normalized || fallbackText;
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
    const { language, t } = useTranslation();
    const locale = language === 'km' ? 'km-KH' : undefined;
    const tm = (key, params = {}) => t(`admin.messages.${key}`, params);

    const columns = [
        {
            key: 'name',
            header: tm('table.sender'),
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
                                {row.name || tm('general.unknownSender')}
                            </span>
                            {!row.isRead && <span className="ui-message-rowSender__dot" aria-hidden="true" />}
                        </div>
                        <span className="ui-message-rowSender__email">
                            {row.email || tm('general.noEmail')}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'message',
            header: tm('table.preview'),
            width: '36%',
            render: (row) => (
                <div className="ui-message-rowPreview">
                    <p className="ui-message-rowPreview__text">
                        {buildPreview(row.message, tm('general.noPreview'))}
                    </p>
                    <div className="ui-message-rowPreview__meta">
                        <Badge variant={!row.isRead ? 'primary' : 'default'}>
                            {!row.isRead ? tm('status.unread') : tm('status.read')}
                        </Badge>
                        <span>{!row.isRead ? tm('table.needsReplyCheck') : tm('table.openToReview')}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'createdAt',
            header: tm('detail.received'),
            sortable: true,
            width: '18%',
            render: (row) => (
                <div className="ui-message-rowDate">
                    <span className="ui-message-rowDate__primary">
                        {formatAbsoluteDate(row.createdAt, locale, tm('general.recently'))}
                    </span>
                    <span className="ui-message-rowDate__secondary">
                        {formatRelativeDate(row.createdAt, locale, tm('general.justArrived'))}
                    </span>
                </div>
            )
        },
        {
            key: 'actions',
            header: tm('table.actions'),
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
                        title={tm('table.openMessage')}
                        aria-label={tm('table.openMessage')}
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
                        title={row.isRead ? tm('table.markUnread') : tm('table.markRead')}
                        aria-label={row.isRead ? tm('table.markUnread') : tm('table.markRead')}
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
                        title={tm('table.deleteMessage')}
                        aria-label={tm('table.deleteMessage')}
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
                title: tm('table.emptyTitle'),
                description: tm('table.emptyDescription')
            }}
        />
    );
};

export default MessagesTable;
