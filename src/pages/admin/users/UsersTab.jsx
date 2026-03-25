import React, { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/shared/components/ui';
import BaseService from '../../../services/BaseService';
import UserService from '../../../services/UserService';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import UsersToolbar from './components/UsersToolbar';
import UsersTable from './components/UsersTable';
import UsersFormDialog from './components/UsersFormDialog';
import UserDetailDialog from './components/UserDetailDialog';
import RolePermissionsPanel from './components/RolePermissionsPanel';
import { useTranslation } from '../../../hooks/useTranslation';
import { isSuperAdminRole, normalizeRole } from '../../../utils/permissions';

import { useCursorPagination } from '../../../hooks/useCursorPagination';

const UsersTab = ({ user, userRole, showToast, isActionAllowed }) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const { loading: createLoading, execute: executeCreate } = useAsyncAction({
    showToast,
    successMessage: tr('User created successfully.', 'បានបង្កើតអ្នកប្រើដោយជោគជ័យ។'),
    errorMessage: tr('Failed to create user.', 'បង្កើតអ្នកប្រើបរាជ័យ។'),
    invalidateKeys: [['users']],
    onSuccess: () => setIsFormOpen(false)
  });

  const { loading: _roleLoading, execute: executeRoleChange } = useAsyncAction({
    showToast,
    errorMessage: tr('Failed to update role.', 'កែប្រែតួនាទីបរាជ័យ។'),
    invalidateKeys: [['users']]
  });

  const { loading: _resetLoading, execute: executeResetPassword } = useAsyncAction({
    showToast,
    errorMessage: tr('Failed to send reset email.', 'ផ្ញើអ៊ីមែលកំណត់ពាក្យសម្ងាត់ឡើងវិញបរាជ័យ។')
  });

  const { loading: disableLoading, execute: executeDisable } = useAsyncAction({
    showToast,
    errorMessage: tr('Failed to update user status.', 'ធ្វើបច្ចុប្បន្នភាពស្ថានភាពអ្នកប្រើបរាជ័យ។'),
    invalidateKeys: [['users']]
  });

  const { loading: _permissionsLoading, execute: executePermissions } = useAsyncAction({
    showToast,
    errorMessage: tr('Failed to save permissions.', 'រក្សាទុកសិទ្ធិបរាជ័យ។'),
    invalidateKeys: [['rolePermissions']]
  });

  const { trackRead, trackWrite } = useActivity();
  const normalizedUserRole = normalizeRole(userRole);

  // cursor pagination hook
  const pagination = useCursorPagination(5, [searchQuery]);

  // Queries
  const { data: usersResult = { data: [], lastDoc: null, hasMore: false, totalCount: null }, isLoading: usersLoading, isFetching: usersFetching } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['users', searchQuery, pagination.cursor, pagination.limit],
    queryFn: async () => {
      const requestCursor = pagination.cursor;
      const result = await BaseService.safe(() => UserService.fetchUsers({
        userRole,
        trackRead,
        lastDoc: requestCursor,
        limit: pagination.limit,
        search: searchQuery,
        includeTotal: true
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false, totalCount: null };
      }

      pagination.updateAfterFetch(requestCursor, result.data.lastDoc, result.data.hasMore);
      return result.data;
    },
    enabled: isSuperAdminRole(normalizedUserRole)
  });

  const usersList = usersResult.data;
  const userStats = useMemo(() => {
    const activeCount = usersList.filter((entry) => entry.isActive !== false && entry.disabled !== true).length;
    const disabledCount = usersList.length - activeCount;
    const elevatedCount = usersList.filter((entry) => ['admin', 'superadmin'].includes(normalizeRole(entry.role))).length;

    return [
      {
        label: searchQuery ? tr('Visible results', 'លទ្ធផលដែលបង្ហាញ') : tr('Users on page', 'អ្នកប្រើលើទំព័រ'),
        value: usersList.length,
        meta: searchQuery ? `${tr('Filtered by', 'តម្រងតាម')} "${searchQuery}"` : tr('Current pagination view', 'ទិដ្ឋភាពបែងចែកទំព័របច្ចុប្បន្ន'),
      },
      {
        label: tr('Active access', 'សិទ្ធិសកម្ម'),
        value: activeCount,
        meta: tr('Can sign in today', 'អាចចូលប្រើបានថ្ងៃនេះ'),
      },
      {
        label: tr('Elevated roles', 'តួនាទីកម្រិតខ្ពស់'),
        value: elevatedCount,
        meta: tr('Admin or super admin', 'Admin ឬ Super Admin'),
      },
      {
        label: tr('Disabled', 'បានបិទ'),
        value: disabledCount,
        meta: disabledCount > 0 ? tr('Blocked from login', 'បានទប់ស្កាត់ការចូល') : tr('No blocked accounts', 'គ្មានគណនីត្រូវបានទប់ស្កាត់'),
      },
    ];
  }, [searchQuery, usersList, tr]);

  const { data: rolePermissions = {} } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['rolePermissions'],
    queryFn: async () => {
      const result = await BaseService.safe(() => UserService.fetchRolePermissions(trackRead));
      if (result.error) {
        showToast(result.error, 'error');
        return {};
      }
      return result.data;
    },
    enabled: isSuperAdminRole(normalizedUserRole)
  });

  const { data: userHistory = [], isLoading: historyLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['userHistory', editingUser?.id],
    queryFn: () => UserService.getHistory(editingUser.id),
    enabled: !!editingUser?.id
  });

  // Handlers
  const handleCreateUser = async (data) => {
    if (!isActionAllowed('create', 'users')) {
      return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិអនុវត្តសកម្មភាពនេះទេ។'), "error");
    }

    const normalizedEmail = (data.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return showToast(tr('Email is required.', 'ត្រូវការអ៊ីមែល។'), "error");
    }
    
    await executeCreate(async () => {
      await UserService.createUser(userRole, normalizedEmail, data.password, data.role, trackRead);
      pagination.reset();
    });
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!isActionAllowed('edit', 'users')) {
      return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិអនុវត្តសកម្មភាពនេះទេ។'), "error");
    }

    await executeRoleChange(async () => {
      await UserService.updateRole(userRole, userId, newRole, (count, label) => 
        trackWrite(count, label, {
          action: 'updated',
          module: 'users',
          entityId: userId,
          entityName: `Role change for ${editingUser?.email || userId} to ${newRole}`
        })
      );
      if (editingUser?.id === userId) {
        setEditingUser(prev => ({ ...prev, role: newRole }));
      }
    }, {
      successMessage: `${tr('Role updated to', 'បានកែប្រែតួនាទីទៅជា')} ${newRole}`
    });
  };

  const handleResetPassword = async (targetUser) => {
    if (!isActionAllowed('edit', 'users')) {
      return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិអនុវត្តសកម្មភាពនេះទេ។'), "error");
    }

    await executeResetPassword(async () => {
      await UserService.sendPasswordReset(userRole, targetUser.email);
    }, {
      successMessage: `${tr('Password reset email sent to', 'បានផ្ញើអ៊ីមែលកំណត់ពាក្យសម្ងាត់ឡើងវិញទៅកាន់')} ${targetUser.email}`
    });
  };

  const handleDisableUser = async () => {
    if (!deletingUser) return;
    if (!isActionAllowed('edit', 'users')) {
      return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិអនុវត្តសកម្មភាពនេះទេ។'), "error");
    }

    const isCurrentlyDisabled = deletingUser.isActive === false || deletingUser.disabled === true;
    const shouldDisable = !isCurrentlyDisabled;
    const action = shouldDisable ? tr('disabled', 'បានបិទ') : tr('enabled', 'បានបើក');
    
    await executeDisable(async () => {
      await UserService.updateUserField(deletingUser.id, {
        isActive: !shouldDisable,
        disabled: shouldDisable
      });
      
      trackWrite(1, `User ${action}`, {
        action,
        module: 'users',
        entityId: deletingUser.id,
        entityName: deletingUser.email
      });

      setDeletingUser(null);
      setEditingUser(null);
    }, {
      successMessage: `${tr('User', 'អ្នកប្រើ')} ${deletingUser.email} ${shouldDisable ? tr('disabled', 'បានបិទ') : tr('enabled', 'បានបើក')} ${tr('successfully.', 'ដោយជោគជ័យ។')}`
    });
  };

  const handleSavePermissions = async (role, allowedTabs) => {
    if (!isActionAllowed('edit', 'users')) {
      return showToast(tr('You do not have permission to perform this action.', 'អ្នកមិនមានសិទ្ធិអនុវត្តសកម្មភាពនេះទេ។'), "error");
    }

    await executePermissions(async () => {
      await UserService.saveRolePermissions(role, allowedTabs, trackWrite);
    }, {
      successMessage: `${tr('Permissions for', 'សិទ្ធិសម្រាប់')} '${role}' ${tr('saved!', 'បានរក្សាទុក!')}`
    });
  };

  if (!isSuperAdminRole(normalizedUserRole)) {
    return (
      <EmptyState 
        title={tr('Access Restricted', 'ការចូលប្រើត្រូវបានកំណត់')}
        description={tr('Only Super Admins can manage users and roles. Please contact the system administrator if you believe this is an error.', 'មានតែ Super Admin ប៉ុណ្ណោះដែលអាចគ្រប់គ្រងអ្នកប្រើ និងតួនាទី។ សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ ប្រសិនបើអ្នកគិតថានេះជាកំហុស។')}
        icon={Users}
      />
    );
  }

  return (
    <div className="admin-tab-container">
      <UsersToolbar 
        search={searchQuery}
        onSearch={setSearchQuery}
        onCreate={() => setIsFormOpen(true)}
        searchResultCount={usersList.length}
        totalCount={usersList.length}
        stats={userStats}
      />

      <UsersTable 
        data={usersList}
        currentUser={user}
        userRole={normalizedUserRole}
        onEdit={setEditingUser}
        onResetPassword={handleResetPassword}
        onDelete={setDeletingUser}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
        onCreate={() => setIsFormOpen(true)}
        loading={usersLoading || usersFetching}
        page={pagination.page}
        pageSize={pagination.limit}
        totalItems={usersResult.totalCount}
        hasMore={usersResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(usersResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        paginationVariant="cursor"
      />

      <RolePermissionsPanel 
        rolePermissions={rolePermissions}
        onSave={handleSavePermissions}
      />

      {/* Dialogs */}
      <UsersFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateUser}
        loading={createLoading}
      />

      <UserDetailDialog 
        user={editingUser}
        currentUser={user}
        history={userHistory}
        historyLoading={historyLoading}
        onClose={() => setEditingUser(null)}
        onRoleChange={handleRoleChange}
        onResetPassword={handleResetPassword}
        onDisable={setDeletingUser}
      />

      <DeleteConfirmDialog 
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        onConfirm={handleDisableUser}
        loading={disableLoading}
        title={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? tr('Re-enable User', 'បើកអ្នកប្រើឡើងវិញ') : tr('Disable User', 'បិទអ្នកប្រើ')}
        message={(deletingUser?.isActive === false || deletingUser?.disabled === true)
          ? `${tr('Are you sure you want to re-enable access for', 'តើអ្នកប្រាកដទេថាចង់បើកសិទ្ធិឡើងវិញសម្រាប់')} ${deletingUser?.email}?`
          : `${tr('Are you sure you want to disable', 'តើអ្នកប្រាកដទេថាចង់បិទ')} ${deletingUser?.email}? ${tr('They will no longer be able to log in.', 'ពួកគេនឹងមិនអាចចូលបានទៀតទេ។')}`
        }
        confirmLabel={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? tr('Re-enable User', 'បើកអ្នកប្រើឡើងវិញ') : tr('Disable User', 'បិទអ្នកប្រើ')}
        loadingLabel={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? tr('Re-enabling...', 'កំពុងបើកឡើងវិញ...') : tr('Disabling...', 'កំពុងបិទ...')}
        confirmVariant={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? 'primary' : 'danger'}
        tone={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? 'primary' : 'danger'}
        note={(deletingUser?.isActive === false || deletingUser?.disabled === true)
          ? tr('The account can sign in again immediately after this change.', 'គណនីអាចចូលប្រើបានវិញភ្លាមៗបន្ទាប់ពីការផ្លាស់ប្តូរនេះ។')
          : tr('The account remains in the system and can be re-enabled later from User Management.', 'គណនីនៅតែមានក្នុងប្រព័ន្ធ ហើយអាចបើកឡើងវិញពេលក្រោយពី User Management។')
        }
      />
    </div>
  );
};

export default UsersTab;
