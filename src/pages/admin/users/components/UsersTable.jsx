import React from 'react';
import { Edit, Key, Trash2, UserPlus, Users } from 'lucide-react';
import DataTable from '../../../../shared/components/ui/data-table/DataTable';
import { Button, Badge } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';


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
  pageSize = 5,
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
  const roleLabels = {
    superadmin: tr('Super Admin', 'អ្នកគ្រប់គ្រងកំពូល'),
    admin: tr('Admin', 'អ្នកគ្រប់គ្រង'),
    editor: tr('Editor', 'អ្នកកែសម្រួល'),
    pending: tr('Pending', 'រង់ចាំ'),
  };

  const columns = [
    {
      key: 'email',
      header: tr('User', 'អ្នកប្រើ'),
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
              <Badge variant="ghost">{tr('Disabled', 'បានបិទ')}</Badge>
              <span className="ui-user-roleCell__note">{tr('Login blocked', 'បានទប់ស្កាត់ការចូល')}</span>
            </div>
          );
        }

        return (
          <div className="ui-user-roleCell">
            <Badge variant={roleVariants[user.role] || 'ghost'}>
              {roleLabels[user.role] || user.role}
            </Badge>
            <span className="ui-user-roleCell__note">{tr('Role assignment', 'ការកំណត់តួនាទី')}</span>
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      header: tr('Registered', 'បានចុះឈ្មោះ'),
      sortable: true,
      render: (user) => {
        const registeredAt = user.createdAt?.seconds
          ? new Date(user.createdAt.seconds * 1000)
          : null;

        return (
          <div className="ui-user-dateCell">
            <span className="ui-user-dateCell__day">
              {registeredAt ? registeredAt.toLocaleDateString() : tr('Unknown', 'មិនស្គាល់')}
            </span>
            <span className="ui-user-dateCell__time">
              {registeredAt ? registeredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : tr('No timestamp', 'គ្មានពេលវេលា')}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: tr('Actions', 'សកម្មភាព'),
      className: 'ui-table-actions',
      render: (user) => {
        if (user.email === currentUser?.email) {
          return <Badge variant="primary">{tr('You', 'អ្នក')}</Badge>;
        }

        return (
          <div className="ui-table-action-group ui-user-actions">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(event) => { event.stopPropagation(); onEdit(user); }}
              title={tr('Edit Profile', 'កែសម្រួលប្រវត្តិរូប')}
            >
              <Edit size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(event) => { event.stopPropagation(); onResetPassword(user); }}
              title={tr('Send Password Reset', 'ផ្ញើការកំណត់ពាក្យសម្ងាត់ឡើងវិញ')}
            >
              <Key size={16} />
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={(event) => { event.stopPropagation(); onDelete(user); }}
              disabled={userRole !== 'superadmin' || user.role === 'superadmin'}
              title={tr('Disable User', 'បិទអ្នកប្រើ')}
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
        title: tr('No matching users', 'មិនមានអ្នកប្រើត្រូវគ្នា'),
        description: `${tr('No accounts matched', 'មិនមានគណនីត្រូវគ្នា')} "${searchQuery}". ${tr('Try another email or role filter.', 'សូមសាកល្បងអ៊ីមែល ឬតម្រងតួនាទីផ្សេងទៀត។')}`,
        action: onClearSearch
          ? {
              label: tr('Clear Search', 'សម្អាតការស្វែងរក'),
              onClick: onClearSearch,
              variant: 'ghost',
            }
          : null,
      }
    : {
        icon: Users,
        title: tr('No users yet', 'មិនទាន់មានអ្នកប្រើ'),
        description: tr('Invite your first teammate to start assigning access and tracking account activity.', 'អញ្ជើញមិត្តរួមការងារដំបូង ដើម្បីចាប់ផ្តើមកំណត់សិទ្ធិ និងតាមដានសកម្មភាពគណនី។'),
        action: onCreate
          ? {
              label: tr('Add User', 'បន្ថែមអ្នកប្រើ'),
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
