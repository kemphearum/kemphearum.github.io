
import { Edit, Key, Trash2, UserPlus, Users } from 'lucide-react';
import DataTable from '../../../../shared/components/ui/data-table/DataTable';
import { Button, Badge } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';
import { formatRoleDisplayName, isSuperAdminRole, normalizeRole } from '../../../../utils/permissions';
import HighlightText from '../../../../shared/components/ui/HighlightText';


const UsersTable = ({ 
  data, 
  currentUser, 
  canEditUsers = true,
  canDisableUsers = true,
  onEdit, 
  onResetPassword, 
  onDelete,
  loading,
  searchQuery = '',
  onClearSearch,
  onCreate,
  page,
  pageSize = 5,
  totalItems,
  hasMore,
  isFirstPage,
  onNext,
  onPrevious,
  onPageChange,
  paginationVariant = 'cursor'
}) => {
  const { t } = useTranslation();
  const roleLabels = {
    superadmin: t('ui.superAdmin'),
    admin: t('ui.admin'),
    editor: t('ui.editor'),
    pending: t('ui.pending'),
  };

  const columns = [
    {
      key: 'email',
      header: t('ui.user'),
      sortable: true,
      render: (user) => {
        const normalizedRole = normalizeRole(user.role);
        const initials = (user.displayName || user.email || '??')
          .split(/[@.\s]/)
          .filter(Boolean)
          .slice(0, 2)
          .map(s => s[0])
          .join('')
          .toUpperCase();
          
        const avatarColors = { 
          superadmin: 'linear-gradient(135deg, #10b981, #059669)', 
          admin: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
          editor: 'linear-gradient(135deg, #f59e0b, #d97706)', 
          pending: 'linear-gradient(135deg, #ef4444, #dc2626)',
          default: 'linear-gradient(135deg, #94a3b8, #64748b)' 
        };

        const isUserDisabled = user.isActive === false || user.disabled === true;

        return (
          <div className="ui-user-identity">
            <div 
              className="ui-user-avatar" 
              style={{ background: avatarColors[normalizedRole] || avatarColors.default }}
            >
              {initials}
            </div>
            <div className="ui-user-identity-text">
              <span className="ui-user-email-text">
                {isUserDisabled ? <strike>{user.email}</strike> : <HighlightText text={user.email} query={searchQuery} />}
              </span>
              {user.displayName && (
                <span className="ui-user-display-name">
                  <HighlightText text={user.displayName} query={searchQuery} />
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'role',
      header: t('admin.rolePermissions.roleSuffix'),
      sortable: true,
      render: (user) => {
        const normalizedRole = normalizeRole(user.role);
        const roleVariants = {
          superadmin: 'success',
          admin: 'primary',
          editor: 'warning',
          pending: 'error'
        };

        if (user.isActive === false || user.disabled === true) {
          return (
            <div className="ui-user-roleCell">
              <Badge variant="ghost">{t('ui.disabled')}</Badge>
              <span className="ui-user-roleCell__note">{t('ui.loginBlocked')}</span>
            </div>
          );
        }

        return (
          <div className="ui-user-roleCell">
            <Badge variant={roleVariants[normalizedRole] || 'default'}>
              {roleLabels[normalizedRole] || formatRoleDisplayName(user.role)}
            </Badge>
            <span className="ui-user-roleCell__note">{t('ui.roleAssignment')}</span>
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      header: t('ui.registered'),
      sortable: true,
      render: (user) => {
        const registeredAt = user.createdAt?.seconds
          ? new Date(user.createdAt.seconds * 1000)
          : null;

        return (
          <div className="ui-user-dateCell">
            <span className="ui-user-dateCell__day">
              {registeredAt ? registeredAt.toLocaleDateString() : t('ui.unknown')}
            </span>
            <span className="ui-user-dateCell__time">
              {registeredAt ? registeredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('ui.noTimestamp')}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: t('ui.actions'),
      className: 'ui-table-actions',
      render: (user) => {
        const isSelf = String(user.email || '').toLowerCase() === String(currentUser?.email || '').toLowerCase();
        if (isSelf) {
          return <Badge variant="primary">{t('ui.you')}</Badge>;
        }

        return (
          <div className="ui-table-action-group ui-user-actions">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(event) => { event.stopPropagation(); onEdit(user); }}
              disabled={!canEditUsers}
              title={t('ui.editProfile')}
            >
              <Edit size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(event) => { event.stopPropagation(); onResetPassword(user); }}
              disabled={!canEditUsers}
              title={t('ui.sendPasswordReset')}
            >
              <Key size={16} />
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={(event) => { event.stopPropagation(); onDelete(user); }}
              disabled={!canDisableUsers || isSuperAdminRole(user.role)}
              title={t('ui.disableUser')}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        );
      }
    }
  ];

  const emptyState = searchQuery
    ? {
        icon: Users,
        title: t('ui.noMatchingUsers'),
        description: `${t('ui.noAccountsMatched')} "${searchQuery}". ${t('ui.tryAnotherEmailOrRoleFilt')}`,
        action: onClearSearch
          ? {
              label: t('ui.clearSearch'),
              onClick: onClearSearch,
              variant: 'ghost',
            }
          : null,
      }
    : {
        icon: Users,
        title: t('ui.noUsersYet'),
        description: t('ui.inviteYourFirstTeammateTo'),
        action: onCreate
          ? {
              label: t('ui.addUser'),
              onClick: onCreate,
              icon: UserPlus,
            }
          : null,
      };

  return (
    <DataTable 
      data={data} 
      columns={columns} 
      loading={loading}
      keyField="id"
      onRowClick={onEdit}
      manualPagination={true}
      paginationVariant={paginationVariant}
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      hasMore={hasMore}
      isFirstPage={isFirstPage}
      onNext={onNext}
      onPrevious={onPrevious}
      onPageChange={onPageChange}
      emptyState={emptyState}
    />
  );
};

export default UsersTable;
