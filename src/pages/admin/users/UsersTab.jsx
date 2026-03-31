import { useState } from 'react';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/shared/components/ui';
import BaseService from '../../../services/BaseService';
import UserService from '../../../services/UserService';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useDebounce } from '../../../hooks/useDebounce';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import UsersToolbar from './components/UsersToolbar';
import UsersTable from './components/UsersTable';
import UsersFormDialog from './components/UsersFormDialog';
import UserDetailDialog from './components/UserDetailDialog';
import RolePermissionsPanel from './components/RolePermissionsPanel';
import { useTranslation } from '../../../hooks/useTranslation';
import { ACTIONS, MODULES, formatRoleDisplayName, isSuperAdminRole, normalizeRole } from '../../../utils/permissions';

import { useCursorPagination } from '../../../hooks/useCursorPagination';

const UsersTab = ({ user, userRole, showToast, isActionAllowed }) => {
  const { t } = useTranslation();
  const tm = (key, params = {}) => t(`admin.users.${key}`, params);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const { loading: createLoading, execute: executeCreate } = useAsyncAction({
    showToast,
    successMessage: tm('toasts.userCreated'),
    errorMessage: tm('toasts.createFailed'),
    invalidateKeys: [['users']],
    onSuccess: () => setIsFormOpen(false)
  });

  const { loading: _roleLoading, execute: executeRoleChange } = useAsyncAction({
    showToast,
    errorMessage: tm('toasts.updateRoleFailed'),
    invalidateKeys: [['users']]
  });

  const { loading: _resetLoading, execute: executeResetPassword } = useAsyncAction({
    showToast,
    errorMessage: tm('toasts.sendResetEmailFailed')
  });

  const { loading: disableLoading, execute: executeDisable } = useAsyncAction({
    showToast,
    errorMessage: tm('toasts.updateStatusFailed'),
    invalidateKeys: [['users']]
  });

  const { loading: _permissionsLoading, execute: executePermissions } = useAsyncAction({
    showToast,
    errorMessage: tm('toasts.savePermissionsFailed'),
    invalidateKeys: [['rolePermissions'], ['users']]
  });

  const { trackRead, trackWrite } = useActivity();
  const normalizedUserRole = normalizeRole(userRole);

  // cursor pagination hook
  const pagination = useCursorPagination(5, [debouncedSearch]);

  // Queries
  const { data: usersResult = { data: [], lastDoc: null, hasMore: false, totalCount: null }, isLoading: usersLoading, isFetching: usersFetching } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['users', debouncedSearch, pagination.cursor, pagination.limit],
    queryFn: async () => {
      const requestCursor = pagination.cursor;
      const result = await BaseService.safe(() => UserService.fetchUsers({
        userRole,
        trackRead,
        lastDoc: requestCursor,
        limit: pagination.limit,
        search: debouncedSearch,
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

  const { data: userStatsResult = { total: 0, active: 0, elevated: 0, disabled: 0 } } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['users', 'stats', normalizedUserRole],
    queryFn: async () => {
      const result = await BaseService.safe(() => UserService.fetchStats(normalizedUserRole));
      if (result.error) {
        showToast(result.error, 'error');
        return { total: 0, active: 0, elevated: 0, disabled: 0 };
      }
      return result.data;
    },
    enabled: isSuperAdminRole(normalizedUserRole)
  });

  const usersList = usersResult.data;
  const isSearching = searchQuery !== debouncedSearch || usersFetching;
  const userStatsCards = [
    {
      label: tm('stats.totalUsers.label'),
      value: userStatsResult.total,
      meta: tm('stats.totalUsers.meta'),
    },
    {
      label: tm('stats.activeAccess.label'),
      value: userStatsResult.active,
      meta: tm('stats.activeAccess.meta'),
    },
    {
      label: tm('stats.elevatedRoles.label'),
      value: userStatsResult.elevated,
      meta: tm('stats.elevatedRoles.meta'),
    },
    {
      label: tm('stats.disabled.label'),
      value: userStatsResult.disabled,
      meta: userStatsResult.disabled > 0 ? tm('stats.disabled.metaBlocked') : tm('stats.disabled.metaNone'),
    },
  ];

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

  const availableRoles = Array.from(new Set([
    'pending',
    'editor',
    'admin',
    ...usersList.map((entry) => normalizeRole(entry.role)).filter(Boolean),
    ...Object.keys(rolePermissions || {}).map((role) => normalizeRole(role)).filter(Boolean)
  ]));

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
    if (!isActionAllowed(ACTIONS.CREATE, MODULES.USERS)) {
      return showToast(tm('toasts.noPermission'), "error");
    }

    const normalizedEmail = (data.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return showToast(tm('toasts.emailRequired'), "error");
    }
    
    await executeCreate(async () => {
      await UserService.createUser(userRole, normalizedEmail, data.password, data.role, trackRead, rolePermissions);
      pagination.reset();
    });
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS)) {
      return showToast(tm('toasts.noPermission'), "error");
    }

    await executeRoleChange(async () => {
      await UserService.updateRole(userRole, userId, newRole, (count, label) => 
        trackWrite(count, label, {
          action: 'updated',
          module: 'users',
          entityId: userId,
          entityName: `Role change for ${editingUser?.email || userId} to ${newRole}`
        }),
      rolePermissions);
      if (editingUser?.id === userId) {
        setEditingUser(prev => ({ ...prev, role: newRole }));
      }
    }, {
      successMessage: `${tm('toasts.roleUpdatedTo')} ${formatRoleDisplayName(newRole)}`
    });
  };

  const handleResetPassword = async (targetUser) => {
    if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS)) {
      return showToast(tm('toasts.noPermission'), "error");
    }

    await executeResetPassword(async () => {
      await UserService.sendPasswordReset(userRole, targetUser.email, rolePermissions);
    }, {
      successMessage: `${tm('toasts.passwordResetSentTo')} ${targetUser.email}`
    });
  };

  const handleDisableUser = async () => {
    if (!deletingUser) return;
    if (!isActionAllowed(ACTIONS.DISABLE, MODULES.USERS)) {
      return showToast(tm('toasts.noPermission'), "error");
    }

    const isCurrentlyDisabled = deletingUser.isActive === false || deletingUser.disabled === true;
    const shouldDisable = !isCurrentlyDisabled;
    const action = shouldDisable ? tm('common.disabled') : tm('common.enabled');
    
    await executeDisable(async () => {
      await UserService.setUserDisabled(userRole, deletingUser.id, shouldDisable, undefined, rolePermissions);
      
      trackWrite(1, `User ${action}`, {
        action,
        module: 'users',
        entityId: deletingUser.id,
        entityName: deletingUser.email
      });

      setDeletingUser(null);
      setEditingUser(null);
    }, {
      successMessage: `${tm('common.user')} ${deletingUser.email} ${shouldDisable ? tm('common.disabled') : tm('common.enabled')} ${tm('common.successfully')}`
    });
  };

  const handleSavePermissions = async (role, allowedTabs, baseRole, allowedActions = {}) => {
    if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS)) {
      return showToast(tm('toasts.noPermission'), "error");
    }

    await executePermissions(async () => {
      await UserService.saveRolePermissions(role, allowedTabs, trackWrite, baseRole, allowedActions);
    }, {
      successMessage: `${tm('toasts.permissionsFor')} '${formatRoleDisplayName(role)}' ${tm('toasts.saved')}`
    });
  };

  const handleRemoveRole = async (role) => {
    if (!isActionAllowed(ACTIONS.EDIT, MODULES.USERS)) {
      return showToast(tm('toasts.noPermission'), "error");
    }

    await executePermissions(async () => {
      await UserService.deleteRoleAndReassignUsers(role, 'pending', trackWrite);
    }, {
      successMessage: `Role '${formatRoleDisplayName(role)}' removed. Users were reassigned to pending.`
    });
  };

  const canCreateUsers = isActionAllowed(ACTIONS.CREATE, MODULES.USERS);
  const canEditUsers = isActionAllowed(ACTIONS.EDIT, MODULES.USERS);
  const canDisableUsers = isActionAllowed(ACTIONS.DISABLE, MODULES.USERS);

  if (!isSuperAdminRole(normalizedUserRole)) {
    return (
      <EmptyState 
        title={tm('restricted.title')}
        description={tm('restricted.description')}
        icon={Users}
      />
    );
  }

  return (
    <div className="admin-tab-container">
      <UsersToolbar 
        search={searchQuery}
        onSearch={setSearchQuery}
        isSearching={isSearching}
        onCreate={() => setIsFormOpen(true)}
        canCreate={canCreateUsers}
        searchResultCount={usersList.length}
        totalCount={usersResult.totalCount ?? usersList.length}
        stats={userStatsCards}
      />

      <UsersTable 
        data={usersList}
        currentUser={user}
        canEditUsers={canEditUsers}
        canDisableUsers={canDisableUsers}
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
        onRemoveRole={handleRemoveRole}
        availableRoles={availableRoles}
      />

      {/* Dialogs */}
      <UsersFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateUser}
        loading={createLoading}
        availableRoles={availableRoles}
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
        canEditUsers={canEditUsers}
        canDisableUsers={canDisableUsers}
        availableRoles={availableRoles}
      />

      <DeleteConfirmDialog 
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        onConfirm={handleDisableUser}
        loading={disableLoading}
        title={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? tm('dialogs.reEnableUser') : tm('dialogs.disableUser')}
        message={(deletingUser?.isActive === false || deletingUser?.disabled === true)
          ? `${tm('dialogs.confirmReEnableFor')} ${deletingUser?.email}?`
          : `${tm('dialogs.confirmDisable')} ${deletingUser?.email}? ${tm('dialogs.noLongerAbleToLogin')}`
        }
        confirmLabel={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? tm('dialogs.reEnableUser') : tm('dialogs.disableUser')}
        loadingLabel={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? tm('dialogs.reEnabling') : tm('dialogs.disabling')}
        confirmVariant={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? 'primary' : 'danger'}
        tone={(deletingUser?.isActive === false || deletingUser?.disabled === true) ? 'primary' : 'danger'}
        note={(deletingUser?.isActive === false || deletingUser?.disabled === true)
          ? tm('dialogs.noteReEnable')
          : tm('dialogs.noteDisable')
        }
      />
    </div>
  );
};

export default UsersTab;
