import React from 'react';
import { Edit, Key, Trash2, Users } from 'lucide-react';
import DataTable from '../../../../shared/components/ui/data-table/DataTable';
import { Button, Badge } from '../../../../shared/components/ui';


const UsersTable = ({ 
  data, 
  currentUser, 
  userRole, 
  onEdit, 
  onResetPassword, 
  onDelete,
  loading,
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

        const isUserDisabled = user.disabled === true;

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
        const roleLabels = { 
          superadmin: '⭐ Super Admin', 
          admin: '🛡️ Admin', 
          editor: '✍️ Editor', 
          pending: '⏳ Pending' 
        };
        
        const roleVariants = {
          superadmin: 'success',
          admin: 'primary',
          editor: 'warning',
          pending: 'error'
        };

        if (user.disabled === true) {
          return <Badge variant="ghost">🚫 Disabled</Badge>;
        }

        return (
          <Badge variant={roleVariants[user.role] || 'ghost'}>
            {roleLabels[user.role] || user.role}
          </Badge>
        );
      }
    },
    {
      key: 'createdAt',
      header: 'Registered',
      sortable: true,
      render: (user) => (
        <span className="ui-user-meta">
          {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'ui-table-actions',
      render: (user) => {
        if (user.email === currentUser?.email) {
          return <Badge variant="primary">✓ You</Badge>;
        }

        return (
          <div className="ui-table-action-group">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(user)}
              title="Edit Profile"
            >
              <Edit size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onResetPassword(user)}
              title="Send Password Reset"
            >
              <Key size={16} />
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => onDelete(user)}
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
      emptyState={{
        icon: Users,
        title: "No Users Found",
        description: "You haven't added any team members yet."
      }}
    />
  );
};

export default UsersTable;
