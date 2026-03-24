import React, { useState } from 'react';
import { tabLabels } from '../../components/constants';
import { Button } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const RolePermissionsPanel = ({ rolePermissions, onSave }) => {
  const { t } = useTranslation();
  const [showRolePerms, setShowRolePerms] = useState(false);
  const [editingRolePerms, setEditingRolePerms] = useState({});

  const managedRoles = ['pending', 'editor', 'admin'];
  const allTabs = Object.keys(tabLabels).filter((tab) => tab !== 'profile' && tab !== 'users');

  const getLocalizedLabel = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const getRoleLabel = (role) => getLocalizedLabel(`admin.roles.${role}`, role);
  const getTabLabel = (tab) => getLocalizedLabel(`admin.tabs.${tab}`, tabLabels[tab]);

  const handleToggleEditor = () => {
    if (!showRolePerms) {
      const initial = {};
      managedRoles.forEach((role) => {
        initial[role] = [...(rolePermissions[role] || [])];
      });
      setEditingRolePerms(initial);
    }
    setShowRolePerms(!showRolePerms);
  };

  const handleTabToggle = (role, tab) => {
    const current = [...(editingRolePerms[role] || [])];
    const updated = current.includes(tab)
      ? current.filter((item) => item !== tab)
      : [...current, tab];

    setEditingRolePerms((prev) => ({ ...prev, [role]: updated }));
  };

  return (
    <div className="ui-role-panel-container">
      <div className="ui-role-panel-header">
        <div>
          <h3 className="ui-role-panel-title">{t('admin.rolePermissions.title')}</h3>
          <p className="ui-role-panel-desc">{t('admin.rolePermissions.description')}</p>
        </div>
        <Button onClick={handleToggleEditor}>
          {showRolePerms ? t('admin.rolePermissions.closeEditor') : t('admin.rolePermissions.configure')}
        </Button>
      </div>

      {showRolePerms && (
        <div className="ui-permissions-grid">
          {managedRoles.map((role) => (
            <div key={role} className="ui-role-block">
              <h4 className="ui-role-title">
                {getRoleLabel(role)} {t('admin.rolePermissions.roleSuffix')}
              </h4>
              <div className="ui-tabs-list">
                {allTabs.map((tab) => {
                  const checked = (editingRolePerms[role] || []).includes(tab);

                  return (
                    <label
                      key={tab}
                      className={`ui-tab-label ${checked ? 'ui-active' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleTabToggle(role, tab)}
                        style={{ display: 'none' }}
                      />
                      {getTabLabel(tab)}
                    </label>
                  );
                })}
              </div>
              <Button
                onClick={() => onSave(role, editingRolePerms[role] || [])}
                variant="ghost"
                size="sm"
                className="ui-role-save-btn"
              >
                {t('admin.rolePermissions.saveForRole', { role: getRoleLabel(role) })}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RolePermissionsPanel;
