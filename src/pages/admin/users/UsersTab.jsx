import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button, Dialog, EmptyState, Tabs } from '@/shared/components/ui';
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
  const pagination = useCursorPagination(10, [searchQuery]);

  // Queries
  const { data: usersResult = { data: [], lastDoc: null, hasMore: false }, isLoading: usersLoading, isFetching: usersFetching } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['users', searchQuery, pagination.cursor, pagination.limit],
    queryFn: async () => {
      const result = await BaseService.safe(() => UserService.fetchUsers({
        userRole,
        trackRead,
        lastDoc: pagination.cursor,
        limit: pagination.limit,
        search: searchQuery
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false };
      }

      pagination.updateAfterFetch(result.data.lastDoc, result.data.hasMore);
      return result.data;
    },
    enabled: userRole === 'superadmin'
  });

  const usersList = usersResult.data;

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

    const newStatus = !deletingUser.disabled;
    const action = newStatus ? 'disabled' : 'enabled';
    
    await executeDisable(async () => {
      await UserService.updateUserField(deletingUser.id, { disabled: newStatus });
      
      trackWrite(1, `User ${action}`, {
        action,
        module: 'users',
        entityId: deletingUser.id,
        entityName: deletingUser.email
      });

      setDeletingUser(null);
      setEditingUser(null);
    }, {
      successMessage: `User ${deletingUser.email} ${newStatus ? 'disabled' : 'enabled'} successfully.`
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
      />

      <UsersTable 
        data={usersList}
        currentUser={user}
        userRole={userRole}
        onEdit={setEditingUser}
        onResetPassword={handleResetPassword}
        onDelete={setDeletingUser}
        loading={usersLoading || usersFetching}
        page={pagination.page}
        pageSize={pagination.limit}
        hasMore={pagination.hasMore}
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
        userRole={userRole}
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
        title={deletingUser?.disabled ? "Re-enable User" : "Disable User"}
        message={deletingUser?.disabled 
          ? `Are you sure you want to re-enable access for ${deletingUser?.email}?`
          : `Are you sure you want to disable ${deletingUser?.email}? They will no longer be able to log in.`
        }
      />
    </div>
  );
};

export default UsersTab;
