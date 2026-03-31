import { useEffect, useMemo, useState } from 'react';
import { tabLabels } from '../../components/constants';
import { Button } from '../../../../shared/components/ui';
import DeleteConfirmDialog from '../../../../shared/components/dialog/DeleteConfirmDialog';
import { useTranslation } from '../../../../hooks/useTranslation';
import { formatRoleDisplayName, normalizeRole, normalizeRolePermissionEntry, ACTIONS } from '../../../../utils/permissions';

const NON_CONFIGURABLE_TABS = ['profile', 'audit'];
const RESERVED_ROLES = ['superadmin'];
const BASE_ROLE_OPTIONS = ['pending', 'editor', 'admin'];
const MANAGED_DEFAULT_ROLES = ['admin', 'editor'];
const NON_REMOVABLE_ROLES = ['superadmin', 'admin', 'editor', 'pending'];

const RolePermissionsPanel = ({ rolePermissions, onSave, onRemoveRole, availableRoles = [] }) => {
  const { t } = useTranslation();
  
  const getTabsForBaseRole = (baseRole) => {
    const normalizedBase = normalizeRole(baseRole) || 'pending';
    const allConfigurableTabs = Object.keys(tabLabels).filter((tab) => !NON_CONFIGURABLE_TABS.includes(tab));

    if (normalizedBase === 'admin') {
      return allConfigurableTabs;
    }
    if (normalizedBase === 'editor') {
      return allConfigurableTabs;
    }
    return allConfigurableTabs;
  };

  const getLocalizedLabel = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const getRoleLabel = (role) => getLocalizedLabel(`admin.roles.${role}`, formatRoleDisplayName(role));
  const getTabLabel = (tab) => getLocalizedLabel(`admin.tabs.${tab}`, tabLabels[tab]);
  const newRolePreviewLabel = (roleValue) => {
    const translated = t('admin.rolePermissions.newRolePreview', { role: roleValue });
    return translated === 'admin.rolePermissions.newRolePreview'
      ? `Role id: ${roleValue}`
      : translated;
  };
  const removeRoleConfirmLabel = (roleValue) => {
    const translated = t('admin.rolePermissions.removeRoleConfirm', { role: roleValue });
    return translated === 'admin.rolePermissions.removeRoleConfirm'
      ? `Remove role '${roleValue}'? Users with this role will be reassigned to pending.`
      : translated;
  };

  const managedRoles = useMemo(() => {
    const normalizedAvailable = availableRoles
      .map((role) => normalizeRole(role))
      .filter((role) => role && !RESERVED_ROLES.includes(role));
    const normalizedFromPermissions = Object.keys(rolePermissions || {})
      .map((role) => normalizeRole(role))
      .filter((role) => role && !RESERVED_ROLES.includes(role));

    return Array.from(new Set([...MANAGED_DEFAULT_ROLES, ...normalizedAvailable, ...normalizedFromPermissions]));
  }, [availableRoles, rolePermissions]);

  const roleEntryMap = useMemo(() => (
    managedRoles.reduce((acc, role) => {
      acc[role] = normalizeRolePermissionEntry(rolePermissions?.[role], role);
      return acc;
    }, {})
  ), [managedRoles, rolePermissions]);

  const defaultTabsByBaseRole = useMemo(() => (
    BASE_ROLE_OPTIONS.reduce((acc, baseRole) => {
      const existingRoleEntry = roleEntryMap[baseRole];
      if (existingRoleEntry?.allowedTabs?.length) {
        const allowedSet = new Set(getTabsForBaseRole(baseRole));
        acc[baseRole] = existingRoleEntry.allowedTabs.filter((tab) => allowedSet.has(tab));
      } else if (baseRole === 'editor') {
        acc[baseRole] = ['projects', 'blog'];
      } else if (baseRole === 'pending') {
        acc[baseRole] = [];
      } else {
        acc[baseRole] = getTabsForBaseRole(baseRole);
      }
      return acc;
    }, {})
  ), [roleEntryMap]);

  const [selectedByRole, setSelectedByRole] = useState({});
  const [actionsByRole, setActionsByRole] = useState({});
  const [baseByRole, setBaseByRole] = useState({});
  const [dirtyByRole, setDirtyByRole] = useState({});
  const [savingRole, setSavingRole] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleBase, setNewRoleBase] = useState('editor');
  const [newRoleError, setNewRoleError] = useState('');
  const [createRoleAttempted, setCreateRoleAttempted] = useState(false);
  const [rolePendingRemoval, setRolePendingRemoval] = useState(null);

  const normalizedNewRole = useMemo(() => (
    normalizeRole(newRoleName)
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
  ), [newRoleName]);

  const createRoleError = useMemo(() => {
    if (!newRoleName.trim()) return '';
    if (!normalizedNewRole) {
      return getLocalizedLabel('admin.rolePermissions.roleNameInvalid', 'Use letters, numbers, underscore, or dash.');
    }
    if (RESERVED_ROLES.includes(normalizedNewRole)) {
      return getLocalizedLabel('admin.rolePermissions.roleReserved', 'This role name is reserved.');
    }
    if (managedRoles.includes(normalizedNewRole)) {
      return getLocalizedLabel('admin.rolePermissions.roleExists', 'This role already exists.');
    }
    return '';
  }, [getLocalizedLabel, managedRoles, newRoleName, normalizedNewRole]);

  const requiredRoleNameError = getLocalizedLabel('admin.rolePermissions.roleNameRequired', 'Role name is required.');

  const activeCreateError = useMemo(() => {
    if (newRoleError) return newRoleError;
    const shouldValidateRequired = createRoleAttempted || Boolean(newRoleName.trim());
    if (!shouldValidateRequired) return '';
    if (!newRoleName.trim()) return requiredRoleNameError;
    return createRoleError;
  }, [createRoleAttempted, createRoleError, newRoleError, newRoleName, requiredRoleNameError]);

  useEffect(() => {
    const normalizedBaseMap = managedRoles.reduce((acc, role) => {
      acc[role] = roleEntryMap[role]?.baseRole || role;
      return acc;
    }, {});

    const normalizedSelection = managedRoles.reduce((acc, role) => {
      const savedBaseRole = normalizedBaseMap[role];
      const allowedSet = new Set(getTabsForBaseRole(savedBaseRole));
      const selected = (roleEntryMap[role]?.allowedTabs || []).filter((tab) => allowedSet.has(tab));
      acc[role] = selected;
      return acc;
    }, {});

    const normalizedActions = managedRoles.reduce((acc, role) => {
      acc[role] = roleEntryMap[role]?.allowedActions || {};
      return acc;
    }, {});

    setBaseByRole(normalizedBaseMap);
    setSelectedByRole(normalizedSelection);
    setActionsByRole(normalizedActions);
    setDirtyByRole(managedRoles.reduce((acc, role) => {
      acc[role] = false;
      return acc;
    }, {}));
  }, [managedRoles, roleEntryMap]);

  const roleTabsMap = useMemo(() => (
    managedRoles.reduce((acc, role) => {
      const selectedBaseRole = baseByRole[role] || roleEntryMap[role]?.baseRole || role;
      acc[role] = getTabsForBaseRole(selectedBaseRole);
      return acc;
    }, {})
  ), [baseByRole, managedRoles, roleEntryMap]);

  const toggleTab = (role, tab) => {
    setSelectedByRole((prev) => {
      const current = new Set(prev[role] || []);
      const isRemoving = current.has(tab);
      if (isRemoving) {
        current.delete(tab);
      } else {
        current.add(tab);
      }
      return { ...prev, [role]: Array.from(current) };
    });

    // If removing a tab, also clear its actions
    setActionsByRole((prev) => {
      const currentRoleActions = { ...(prev[role] || {}) };
      const isCurrentlySelected = (selectedByRole[role] || []).includes(tab);
      if (isCurrentlySelected) {
        delete currentRoleActions[tab];
      }
      return { ...prev, [role]: currentRoleActions };
    });

    setDirtyByRole((prev) => ({ ...prev, [role]: true }));
  };

  const toggleAction = (role, tab, action) => {
    setActionsByRole((prev) => {
      const currentRoleActions = { ...(prev[role] || {}) };
      const currentTabActions = new Set(currentRoleActions[tab] || []);
      
      if (currentTabActions.has(action)) {
        currentTabActions.delete(action);
      } else {
        currentTabActions.add(action);
      }

      currentRoleActions[tab] = Array.from(currentTabActions);
      return { ...prev, [role]: currentRoleActions };
    });
    setDirtyByRole((prev) => ({ ...prev, [role]: true }));
  };

  const toggleAllTabs = (role, shouldSelectAll) => {
    setSelectedByRole((prev) => ({
      ...prev,
      [role]: shouldSelectAll ? [...roleTabsMap[role]] : []
    }));

    if (!shouldSelectAll) {
      setActionsByRole((prev) => ({ ...prev, [role]: {} }));
    }

    setDirtyByRole((prev) => ({ ...prev, [role]: true }));
  };

  const handleBaseRoleChange = (role, nextBaseRole) => {
    const normalizedNextBase = normalizeRole(nextBaseRole);
    if (!BASE_ROLE_OPTIONS.includes(normalizedNextBase)) return;

    const allowedSet = new Set(getTabsForBaseRole(normalizedNextBase));
    setBaseByRole((prev) => ({ ...prev, [role]: normalizedNextBase }));
    setSelectedByRole((prev) => ({
      ...prev,
      [role]: (prev[role] || []).filter((tab) => allowedSet.has(tab))
    }));
    setDirtyByRole((prev) => ({ ...prev, [role]: true }));
  };

  const handleSave = async (role) => {
    try {
      setSavingRole(role);
      await onSave(
        role,
        selectedByRole[role] || [],
        baseByRole[role] || roleEntryMap[role]?.baseRole || role,
        actionsByRole[role] || {}
      );
      setDirtyByRole((prev) => ({ ...prev, [role]: false }));
    } finally {
      setSavingRole(null);
    }
  };

  const handleCreateRole = async () => {
    setCreateRoleAttempted(true);
    const blockingError = !newRoleName.trim() ? requiredRoleNameError : createRoleError;
    if (blockingError) {
      setNewRoleError(blockingError);
      return;
    }

    setNewRoleError('');
    try {
      setSavingRole(normalizedNewRole);
      await onSave(
        normalizedNewRole,
        defaultTabsByBaseRole[newRoleBase] || [],
        newRoleBase,
        {} // New roles start with empty explicit actions
      );
      setNewRoleName('');
      setNewRoleBase('editor');
      setCreateRoleAttempted(false);
    } finally {
      setSavingRole(null);
    }
  };

  const resetRoleDraft = (role) => {
    const savedBaseRole = roleEntryMap[role]?.baseRole || role;
    const allowedSet = new Set(getTabsForBaseRole(savedBaseRole));
    const savedTabs = (roleEntryMap[role]?.allowedTabs || []).filter((tab) => allowedSet.has(tab));
    const savedActions = roleEntryMap[role]?.allowedActions || {};

    setBaseByRole((prev) => ({ ...prev, [role]: savedBaseRole }));
    setSelectedByRole((prev) => ({ ...prev, [role]: savedTabs }));
    setActionsByRole((prev) => ({ ...prev, [role]: savedActions }));
    setDirtyByRole((prev) => ({ ...prev, [role]: false }));
  };

  const openRemoveRoleDialog = (role) => {
    if (typeof onRemoveRole !== 'function') return;
    setRolePendingRemoval(role);
  };

  const handleRemoveRole = async () => {
    if (typeof onRemoveRole !== 'function' || !rolePendingRemoval) return;
    try {
      setSavingRole(rolePendingRemoval);
      await onRemoveRole(rolePendingRemoval);
      setRolePendingRemoval(null);
    } finally {
      setSavingRole(null);
    }
  };

  return (
    <div className="ui-role-panel-container">
      <div className="ui-role-panel-header">
        <div>
          <h3 className="ui-role-panel-title">{t('admin.rolePermissions.title')}</h3>
          <p className="ui-role-panel-desc">{t('admin.rolePermissions.description')}</p>
        </div>
        <div className="ui-role-create-card">
          <div className="ui-role-create-card__head">
            <label className="ui-role-create__label" htmlFor="new-role-name">
              {getLocalizedLabel('admin.rolePermissions.newRoleLabel', 'New role')}
            </label>
            <span className="ui-role-create-card__meta">
              {getLocalizedLabel('admin.rolePermissions.baseRoleLabel', 'Base role')}
            </span>
          </div>
          <div className="ui-role-create">
            <input
              id="new-role-name"
              type="text"
              className="ui-input ui-role-create__input"
              value={newRoleName}
              onChange={(event) => {
                setNewRoleName(event.target.value);
                if (newRoleError) setNewRoleError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !createRoleError && savingRole === null) {
                  event.preventDefault();
                  handleCreateRole();
                }
              }}
              placeholder={getLocalizedLabel('admin.rolePermissions.newRolePlaceholder', 'new_role')}
            />
            <select
              className="ui-select ui-role-create__select"
              value={newRoleBase}
              onChange={(event) => setNewRoleBase(event.target.value)}
            >
              {BASE_ROLE_OPTIONS.map((baseRole) => (
                <option key={baseRole} value={baseRole}>
                  {getLocalizedLabel(`admin.roles.${baseRole}`, baseRole)} {getLocalizedLabel('admin.rolePermissions.baseSuffix', 'base')}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || Boolean(createRoleError) || savingRole !== null}
            >
              {getLocalizedLabel('admin.rolePermissions.addRole', 'Add role')}
            </Button>
          </div>
          <div className="ui-role-create-card__footer">
            <p className={`ui-role-create__hint ${activeCreateError ? 'is-error' : ''}`}>
              {activeCreateError
                ? activeCreateError
                : (normalizedNewRole
                  ? newRolePreviewLabel(normalizedNewRole)
                  : getLocalizedLabel('admin.rolePermissions.newRoleHint', 'Enter role name to create a normalized role id.'))}
            </p>
            {normalizedNewRole && !activeCreateError && (
              <span className="ui-role-create__previewBadge">
                {normalizedNewRole}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="ui-permissions-grid">
        {managedRoles.map((role) => (
          <section key={role} className="ui-role-block">
            <div className="ui-role-titleRow">
              <h4 className="ui-role-title">
                <span className={`ui-role-badge ui-role-badge--${role}`}>
                  {getRoleLabel(role)}
                </span>
                <span className="ui-role-titleSuffix">{t('admin.rolePermissions.roleSuffix')}</span>
              </h4>
              <span className="ui-role-count">
                {(selectedByRole[role] || []).length} / {roleTabsMap[role].length}
              </span>
            </div>

            <div className="ui-role-progressTrack" aria-hidden="true">
              <span
                className="ui-role-progressFill"
                style={{ width: `${Math.round((((selectedByRole[role] || []).length) / Math.max(roleTabsMap[role].length, 1)) * 100)}%` }}
              />
            </div>

            <p className="ui-role-panel-desc ui-role-panel-desc--compact">
              {getLocalizedLabel('admin.rolePermissions.baseRoleLabel', 'Base role')}:
              {' '}
              <select
                className="ui-select ui-role-create__select"
                value={baseByRole[role] || roleEntryMap[role]?.baseRole || role}
                onChange={(event) => handleBaseRoleChange(role, event.target.value)}
                disabled={savingRole === role}
              >
                {BASE_ROLE_OPTIONS.map((baseRole) => (
                  <option key={`${role}-${baseRole}`} value={baseRole}>
                    {getLocalizedLabel(`admin.roles.${baseRole}`, baseRole)}
                  </option>
                ))}
              </select>
            </p>

            <div className="ui-role-quickActions">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => toggleAllTabs(role, true)}
                disabled={(selectedByRole[role] || []).length === roleTabsMap[role].length}
              >
                {getLocalizedLabel('admin.rolePermissions.selectAll', 'Select all')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => toggleAllTabs(role, false)}
                disabled={(selectedByRole[role] || []).length === 0}
              >
                {getLocalizedLabel('admin.rolePermissions.clearAll', 'Clear all')}
              </Button>
            </div>

            <div className="ui-tabs-list">
              {roleTabsMap[role].length === 0 && (
                <p className="ui-role-empty-tabs">
                  {getLocalizedLabel('admin.rolePermissions.noTabsForRole', 'This role has no configurable sidebar tabs.')}
                </p>
              )}
              {roleTabsMap[role].map((tab) => {
                const checked = (selectedByRole[role] || []).includes(tab);

                const actionsList = [ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE];

                return (
                  <div key={tab} className="ui-tab-permission-group">
                    <label
                      className={`ui-tab-label ${checked ? 'ui-active' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTab(role, tab)}
                      />
                      <span>{getTabLabel(tab)}</span>
                    </label>
                    {checked && (
                      <div className="ui-tab-actions-row">
                        {actionsList.map((action) => {
                          const isActionChecked = (actionsByRole[role]?.[tab] || []).includes(action);
                          return (
                            <label key={action} className={`ui-action-checkbox ${isActionChecked ? 'is-checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isActionChecked}
                                onChange={() => toggleAction(role, tab, action)}
                              />
                              <span>{t(`admin.rolePermissions.actionLabels.${action}`)}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Button
              type="button"
              size="sm"
              className="ui-role-save-btn"
              disabled={!dirtyByRole[role] || savingRole === role}
              onClick={() => handleSave(role)}
            >
              {t('admin.rolePermissions.saveForRole', { role: getRoleLabel(role) })}
            </Button>
            <div className="ui-role-rowActions">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="ui-role-rowActionBtn"
                disabled={!dirtyByRole[role] || savingRole === role}
                onClick={() => resetRoleDraft(role)}
              >
                {getLocalizedLabel('admin.rolePermissions.resetChanges', 'Reset changes')}
              </Button>
              {!NON_REMOVABLE_ROLES.includes(role) && (
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="ui-role-rowActionBtn"
                  disabled={savingRole === role}
                  onClick={() => openRemoveRoleDialog(role)}
                >
                  {getLocalizedLabel('admin.rolePermissions.removeRole', 'Remove role')}
                </Button>
              )}
            </div>
          </section>
        ))}
      </div>
      <DeleteConfirmDialog
        open={Boolean(rolePendingRemoval)}
        onOpenChange={(open) => {
          if (!open) setRolePendingRemoval(null);
        }}
        onConfirm={handleRemoveRole}
        loading={Boolean(rolePendingRemoval && savingRole === rolePendingRemoval)}
        title={getLocalizedLabel('admin.rolePermissions.removeRoleTitle', 'Remove role')}
        message={removeRoleConfirmLabel(rolePendingRemoval || '')}
        note={getLocalizedLabel(
          'admin.rolePermissions.removeRoleNote',
          'System roles cannot be removed. This action only applies to custom roles.'
        )}
        confirmLabel={getLocalizedLabel('admin.rolePermissions.removeRole', 'Remove role')}
        loadingLabel={getLocalizedLabel('admin.rolePermissions.removingRole', 'Removing role...')}
        confirmVariant="danger"
        tone="danger"
      />
    </div>
  );
};

export default RolePermissionsPanel;
