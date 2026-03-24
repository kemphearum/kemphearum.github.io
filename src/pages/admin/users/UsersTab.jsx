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

import { useCursorPagination } from '../../../hooks/useCursorPagination';

const UsersTab = ({ user, userRole, showToast, isActionAllowed }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const { loading: createLoading, execute: executeCreate } = useAsyncAction({
    showToast,
    successMessage: 'User created successfully.',
    errorMessage: 'Failed to create user.',
    invalidateKeys: [['users']],
    onSuccess: () => setIsFormOpen(false)
  });

  const { loading: _roleLoading, execute: executeRoleChange } = useAsyncAction({
    showToast,
    errorMessage: 'Failed to update role.',
    invalidateKeys: [['users']]
  });

  const { loading: _resetLoading, execute: executeResetPassword } = useAsyncAction({
    showToast,
    errorMessage: 'Failed to send reset email.'
  });

  const { loading: disableLoading, execute: executeDisable } = useAsyncAction({
    showToast,
    errorMessage: 'Failed to update user status.',
    invalidateKeys: [['users']]
  });

  const { loading: _permissionsLoading, execute: executePermissions } = useAsyncAction({
    showToast,
    errorMessage: 'Failed to save permissions.',
    invalidateKeys: [['rolePermissions']]
  });

  const { trackRead, trackWrite } = useActivity();

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
    enabled: userRole === 'superadmin'
  });

  const usersList = usersResult.data;
  const userStats = useMemo(() => {
    const activeCount = usersList.filter((entry) => entry.isActive !== false && entry.disabled !== true).length;
    const disabledCount = usersList.length - activeCount;
    const elevatedCount = usersList.filter((entry) => ['admin', 'superadmin'].includes(entry.role)).length;

    return [
      {
        label: searchQuery ? 'Visible results' : 'Users on page',
        value: usersList.length,
        meta: searchQuery ? `Filtered by "${searchQuery}"` : 'Current pagination view',
      },
      {
        label: 'Active access',
        value: activeCount,
        meta: 'Can sign in today',
      },
      {
        label: 'Elevated roles',
        value: elevatedCount,
        meta: 'Admin or super admin',
      },
      {
        label: 'Disabled',
        value: disabledCount,
        meta: disabledCount > 0 ? 'Blocked from login' : 'No blocked accounts',
      },
    ];
  }, [searchQuery, usersList]);

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
    enabled: userRole === 'superadmin'
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
      return showToast("You do not have permission to perform this action.", "error");
    }

    const normalizedEmail = (data.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return showToast("Email is required.", "error");
    }
    
    await executeCreate(async () => {
      await UserService.createUser(userRole, normalizedEmail, data.password, data.role, trackRead);
      pagination.reset();
    });
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!isActionAllowed('edit', 'users')) {
      return showToast("You do not have permission to perform this action.", "error");
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
      successMessage: `Role updated to ${newRole}`
    });
  };

  const handleResetPassword = async (targetUser) => {
    if (!isActionAllowed('edit', 'users')) {
      return showToast("You do not have permission to perform this action.", "error");
    }

    await executeResetPassword(async () => {
      await UserService.sendPasswordReset(userRole, targetUser.email);
    }, {
      successMessage: `Password reset email sent to ${targetUser.email}`
    });
  };

  const handleDisableUser = async () => {
    if (!deletingUser) return;
    if (!isActionAllowed('edit', 'users')) {
      return showToast("You do not have permission to perform this action.", "error");
    }

    const isCurrentlyDisabled = deletingUser.isActive === false || deletingUser.disabled === true;
    const shouldDisable = !isCurrentlyDisabled;
    const action = shouldDisable ? 'disabled' : 'enabled';
    
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
      successMessage: `User ${deletingUser.email} ${shouldDisable ? 'disabled' : 'enabled'} successfully.`
    });
  };

  const handleSavePermissions = async (role, allowedTabs) => {
    if (!isActionAllowed('edit', 'users')) {
      return showToast("You do not have permission to perform this action.", "error");
    }

    await executePermissions(async () => {
      await UserService.saveRolePermissions(role, allowedTabs, trackWrite);
    }, {
      successMessage: `Permissions for '${role}' saved!`
    });
  };

  if (userRole !== 'superadmin') {
    return (
      <EmptyState 
        title="Access Restricted"
        description="Only Super Admins can manage users and roles. Please contact the system administrator if you believe this is an error."
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
        userRole={userRole}
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
        title={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? "Re-enable User" : "Disable User"}
        message={(deletingUser?.isActive === false || deletingUser?.disabled === true)
          ? `Are you sure you want to re-enable access for ${deletingUser?.email}?`
          : `Are you sure you want to disable ${deletingUser?.email}? They will no longer be able to log in.`
        }
        confirmLabel={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? 'Re-enable User' : 'Disable User'}
        loadingLabel={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? 'Re-enabling...' : 'Disabling...'}
        confirmVariant={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? 'primary' : 'danger'}
        tone={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? 'primary' : 'danger'}
        note={(deletingUser?.isActive === false || deletingUser?.disabled === true)
          ? 'The account can sign in again immediately after this change.'
          : 'The account remains in the system and can be re-enabled later from User Management.'
        }
      />
    </div>
  );
};

export default UsersTab;
