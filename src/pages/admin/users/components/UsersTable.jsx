import React from 'react';
import { Edit, Key, Trash2, UserPlus, Users } from 'lucide-react';
import DataTable from '../../../../shared/components/ui/data-table/DataTable';
import { Button, Badge } from '../../../../shared/components/ui';

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  pending: 'Pending',
};


const UsersTable = ({ 
  data, 
  currentUser, 
  userRole, 
  onEdit, 
  onResetPassword, 
  onDelete,
  loading,
  searchQuery = '',
  onClearSearch,
  onCreate,
  page,
  pageSize = 10,
  hasMore,
  isFirstPage,
  onNext,
  onPrevious,
  onPageChange,
  paginationVariant = 'cursor'
}) => {
  const columns = [
    {
      key: 'email',
      header: 'User',
      sortable: true,
      render: (user) => {
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
          pending: 'linear-gradient(135deg, #ef4444, #dc2626)' 
        };

        const isUserDisabled = user.isActive === false || user.disabled === true;

        return (
          <div className="ui-user-identity">
            <div 
              className="ui-user-avatar" 
              style={{ background: avatarColors[user.role] || avatarColors.pending }}
            >
              {initials}
            </div>
            <div className="ui-user-identity-text">
              <span className="ui-user-email-text">
                {isUserDisabled ? <strike>{user.email}</strike> : user.email}
              </span>
              {user.displayName && <span className="ui-user-display-name">{user.displayName}</span>}
            </div>
          </div>
        );
      }
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => {
        const roleVariants = {
          superadmin: 'success',
          admin: 'primary',
          editor: 'warning',
          pending: 'error'
        };

        if (user.isActive === false || user.disabled === true) {
          return (
            <div className="ui-user-roleCell">
              <Badge variant="ghost">Disabled</Badge>
              <span className="ui-user-roleCell__note">Login blocked</span>
            </div>
          );
        }

        return (
          <div className="ui-user-roleCell">
            <Badge variant={roleVariants[user.role] || 'ghost'}>
              {ROLE_LABELS[user.role] || user.role}
            </Badge>
            <span className="ui-user-roleCell__note">Role assignment</span>
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      header: 'Registered',
      sortable: true,
      render: (user) => {
        const registeredAt = user.createdAt?.seconds
          ? new Date(user.createdAt.seconds * 1000)
          : null;

        return (
          <div className="ui-user-dateCell">
            <span className="ui-user-dateCell__day">
              {registeredAt ? registeredAt.toLocaleDateString() : 'Unknown'}
            </span>
            <span className="ui-user-dateCell__time">
              {registeredAt ? registeredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No timestamp'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'ui-table-actions',
      render: (user) => {
        if (user.email === currentUser?.email) {
          return <Badge variant="primary">You</Badge>;
        }

        return (
          <div className="ui-table-action-group ui-user-actions">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(event) => { event.stopPropagation(); onEdit(user); }}
              title="Edit Profile"
            >
              <Edit size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(event) => { event.stopPropagation(); onResetPassword(user); }}
              title="Send Password Reset"
            >
              <Key size={16} />
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={(event) => { event.stopPropagation(); onDelete(user); }}
              disabled={userRole !== 'superadmin' || user.role === 'superadmin'}
              title="Disable User"
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
        title: 'No matching users',
        description: `No accounts matched "${searchQuery}". Try another email or role filter.`,
        action: onClearSearch
          ? {
              label: 'Clear Search',
              onClick: onClearSearch,
              variant: 'ghost',
            }
          : null,
      }
    : {
        icon: Users,
        title: 'No users yet',
        description: 'Invite your first teammate to start assigning access and tracking account activity.',
        action: onCreate
          ? {
              label: 'Add User',
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
